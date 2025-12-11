import { useState } from 'react';
import { useQuery, getUserAssets, requestRefund, retryGeneration } from 'wasp/client/operations';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Download, Loader2, User, Image, Video as VideoIcon, ChevronLeft, ChevronRight, AlertCircle, RefreshCw, DollarSign } from 'lucide-react';
import type { VideoGeneration } from 'wasp/entities';
import { useToast } from '../../hooks/use-toast';

type AssetFilter = 'ALL' | 'PERSON' | 'COMPOSITE' | 'VIDEO';

// Loading skeleton component
const AssetSkeleton = () => (
  <Card className="overflow-hidden">
    <div className="aspect-[3/4] bg-gray-200 animate-pulse" />
    <CardContent className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
    </CardContent>
  </Card>
);

export default function LibraryTab() {
  const [activeFilter, setActiveFilter] = useState<AssetFilter>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [processingRefund, setProcessingRefund] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const pageSize = 12; // Show 12 assets per page
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery(getUserAssets, {
    assetType: activeFilter,
    page: currentPage,
    pageSize,
  });

  const assets = data?.assets || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 0;
  const hasMore = data?.hasMore || false;

  // Reset to page 1 when filter changes
  const handleFilterChange = (filter: AssetFilter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const getAssetUrl = (asset: VideoGeneration): string | null => {
    switch (asset.assetType) {
      case 'PERSON':
        return asset.generatedPersonUrl;
      case 'COMPOSITE':
        return asset.compositeImageUrl;
      case 'VIDEO':
      case 'FULL_PIPELINE':
        return asset.finalVideoUrl;
      default:
        return null;
    }
  };

  const getAssetTypeIcon = (assetType: string) => {
    switch (assetType) {
      case 'PERSON':
        return <User className="w-4 h-4" />;
      case 'COMPOSITE':
        return <Image className="w-4 h-4" />;
      case 'VIDEO':
      case 'FULL_PIPELINE':
        return <VideoIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getAssetTypeLabel = (assetType: string): string => {
    switch (assetType) {
      case 'PERSON':
        return 'Person';
      case 'COMPOSITE':
        return 'Composite';
      case 'VIDEO':
        return 'Video';
      case 'FULL_PIPELINE':
        return 'Full Pipeline Video';
      default:
        return 'Unknown';
    }
  };

  const handleDownload = async (asset: VideoGeneration) => {
    const url = getAssetUrl(asset);
    if (!url) return;

    try {
      // Fetch as blob
      const response = await fetch(url);
      const blob = await response.blob();

      // Create blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // Determine file extension
      const isVideo = asset.assetType === 'VIDEO' || asset.assetType === 'FULL_PIPELINE';
      const ext = isVideo ? 'mp4' : 'jpg';
      const filename = `${asset.assetType.toLowerCase()}-${asset.id.slice(0, 8)}.${ext}`;

      // Trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading asset:', error);
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRefundRequest = async (generationId: string) => {
    setProcessingRefund(generationId);
    try {
      const result = await requestRefund({ generationId });
      toast({
        title: 'Refund Successful',
        description: result.message,
      });
      refetch(); // Refresh the list
    } catch (error: any) {
      toast({
        title: 'Refund Failed',
        description: error.message || 'Failed to process refund. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingRefund(null);
    }
  };

  const handleRetry = async (generationId: string) => {
    setRetrying(generationId);
    try {
      await retryGeneration({ generationId });
      toast({
        title: 'Generation Retrying',
        description: 'Your generation has been restarted. Check back in a few minutes.',
      });
      refetch(); // Refresh the list
    } catch (error: any) {
      toast({
        title: 'Retry Failed',
        description: error.message || 'Failed to retry generation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRetrying(null);
    }
  };

  const filters: { id: AssetFilter; label: string; icon: any }[] = [
    { id: 'ALL', label: 'All', icon: null },
    { id: 'PERSON', label: 'Persons', icon: User },
    { id: 'COMPOSITE', label: 'Composites', icon: Image },
    { id: 'VIDEO', label: 'Videos', icon: VideoIcon },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Asset Library</h2>
        <p className="text-muted-foreground mt-1">
          View and download all your generated assets
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex gap-2">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;
            return (
              <Button
                key={filter.id}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange(filter.id)}
                className="gap-2"
              >
                {Icon && <Icon className="w-4 h-4" />}
                {filter.label}
              </Button>
            );
          })}
        </div>
        {totalCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? 'asset' : 'assets'} total
          </p>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <AssetSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-500">Error loading assets. Please try again.</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && assets?.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            {activeFilter === 'PERSON' && <User className="w-8 h-8 text-gray-400" />}
            {activeFilter === 'COMPOSITE' && <Image className="w-8 h-8 text-gray-400" />}
            {activeFilter === 'VIDEO' && <VideoIcon className="w-8 h-8 text-gray-400" />}
            {activeFilter === 'ALL' && <Image className="w-8 h-8 text-gray-400" />}
          </div>
          <h3 className="text-lg font-semibold mb-2">No assets found</h3>
          <p className="text-muted-foreground">
            {activeFilter === 'ALL'
              ? 'Generate your first asset to see it here'
              : `No ${activeFilter.toLowerCase()} assets yet. Generate one in the ${activeFilter.toLowerCase()} tab.`}
          </p>
        </div>
      )}

      {/* Assets Grid */}
      {!isLoading && !error && assets && assets.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => {
              const url = getAssetUrl(asset);
              const isVideo = asset.assetType === 'VIDEO' || asset.assetType === 'FULL_PIPELINE';

              // Failed generation card
              if (asset.status === 'FAILED') {
                return (
                  <Card key={asset.id} className="overflow-hidden border-red-200 bg-red-50/30">
                    <div className="aspect-[3/4] bg-red-100/50 relative flex items-center justify-center">
                      <div className="text-center p-6">
                        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-red-700">Generation Failed</p>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="destructive" className="gap-1">
                          {getAssetTypeIcon(asset.assetType)}
                          {getAssetTypeLabel(asset.assetType)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(asset.createdAt)}
                        </span>
                      </div>

                      {/* Error Message */}
                      {asset.errorMessage && (
                        <div className="bg-red-50 border border-red-200 rounded p-2">
                          <p className="text-xs text-red-700">{asset.errorMessage}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        {asset.isRefundable && !asset.creditsRefunded && (
                          <Button
                            onClick={() => handleRefundRequest(asset.id)}
                            variant="outline"
                            size="sm"
                            className="w-full border-green-300 text-green-700 hover:bg-green-50"
                            disabled={processingRefund === asset.id}
                          >
                            {processingRefund === asset.id ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <DollarSign className="w-3 h-3 mr-1" />
                                Request Refund
                              </>
                            )}
                          </Button>
                        )}
                        {asset.creditsRefunded && (
                          <div className="text-center">
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Credits Refunded
                            </Badge>
                          </div>
                        )}
                        {asset.canRetry && (
                          <Button
                            onClick={() => handleRetry(asset.id)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                            disabled={retrying === asset.id}
                          >
                            {retrying === asset.id ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Retrying...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Retry
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              // Completed generation card
              return (
                <Card key={asset.id} className="overflow-hidden">
                  <div className="aspect-[3/4] bg-gray-100 relative">
                    {url && !isVideo && (
                      <img
                        src={url}
                        alt={getAssetTypeLabel(asset.assetType)}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    {url && isVideo && (
                      <video
                        src={url}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                      />
                    )}
                    {!url && (
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="text-gray-400">No preview available</p>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="gap-1">
                        {getAssetTypeIcon(asset.assetType)}
                        {getAssetTypeLabel(asset.assetType)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(asset.createdAt)}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="text-xs text-muted-foreground space-y-1">
                      {asset.assetType === 'PERSON' && asset.stage1Mode && (
                        <p>Mode: {asset.stage1Mode}</p>
                      )}
                      {asset.assetType === 'VIDEO' && asset.veo3Mode && (
                        <p>Quality: {asset.veo3Mode}</p>
                      )}
                    </div>

                    <Button
                      onClick={() => handleDownload(asset)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount})
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!hasMore}
                className="gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
