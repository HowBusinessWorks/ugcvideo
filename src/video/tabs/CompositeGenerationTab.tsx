import { useState, useEffect, useRef } from 'react';
import { useAuth } from 'wasp/client/auth';
import { createCompositeGeneration, getVideoById, uploadImageForVideo, getPendingGeneration, requestRefund, retryGeneration, getUserAssets } from 'wasp/client/operations';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Input } from '../../components/ui/input';
import { Image, Download, Loader2, Upload, AlertCircle, RefreshCw, DollarSign } from 'lucide-react';
import { LoadingProgress } from '../../components/ui/loading-progress';
import { ImageDropzone } from '../../components/ui/image-dropzone';

export default function CompositeGenerationTab() {
  const { data: user } = useAuth();

  // State
  const [personImageUrl, setPersonImageUrl] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [compositePrompt, setCompositePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedComposite, setGeneratedComposite] = useState<{ url: string; id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);
  const [failedGeneration, setFailedGeneration] = useState<any | null>(null);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  const [isUploadingPerson, setIsUploadingPerson] = useState(false);
  const [isUploadingProduct, setIsUploadingProduct] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Check for existing pending generation on mount
  useEffect(() => {
    const checkPendingGeneration = async () => {
      if (!user?.id) return;

      try {
        // Query for user's most recent PENDING composite generation
        const pendingGeneration = await getPendingGeneration({
          assetType: 'COMPOSITE',
        });

        if (pendingGeneration) {
          console.log('Restored pending composite generation:', pendingGeneration.id);
          setCurrentGenerationId(pendingGeneration.id);
          setIsGenerating(true);
          setGenerationStartTime(new Date(pendingGeneration.createdAt).getTime());
        }
      } catch (error) {
        console.error('Error checking for pending generation:', error);
      }
    };

    checkPendingGeneration();
  }, [user?.id]);

  // Poll for generation status
  useEffect(() => {
    if (!currentGenerationId || !isGenerating) return;

    const pollStatus = async () => {
      try {
        const data = await getVideoById({ id: currentGenerationId });

        if (data && data.status === 'COMPLETED' && data.compositeImageUrl) {
          setGeneratedComposite({ url: data.compositeImageUrl, id: currentGenerationId });
          setIsGenerating(false);
          setCurrentGenerationId(null);
          setFailedGeneration(null);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
        } else if (data && data.status === 'FAILED') {
          setFailedGeneration(data);
          setIsGenerating(false);
          setCurrentGenerationId(null);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    };

    // Start polling every 2 seconds
    pollingIntervalRef.current = setInterval(pollStatus, 2000);

    // Cleanup after 2 minutes
    const timeout = setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      setError('Generation timed out. Please try again.');
      setIsGenerating(false);
      setCurrentGenerationId(null);
    }, 120000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      clearTimeout(timeout);
    };
  }, [currentGenerationId, isGenerating]);

  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);
    setGeneratedComposite(null);
    setFailedGeneration(null);
    setGenerationStartTime(Date.now());

    try {
      const result = await createCompositeGeneration({
        personImageUrl,
        productImageUrl,
        compositePrompt: compositePrompt || undefined,
      });

      console.log('Composite generation started:', result.id);
      setCurrentGenerationId(result.id);

    } catch (err: any) {
      // Check if a failed generation was created in the database
      try {
        const result = await getUserAssets({
          assetType: 'COMPOSITE',
          page: 1,
          pageSize: 1,
        });

        const recentGen = result?.assets?.[0];
        if (recentGen && recentGen.status === 'FAILED' && recentGen.errorMessage) {
          setFailedGeneration(recentGen);
          setIsGenerating(false);
          return;
        }
      } catch (checkError) {
        console.error('Error checking for failed generation:', checkError);
      }

      setError(err.message || 'Failed to generate composite');
      setIsGenerating(false);
    }
  };

  const handleUploadPersonImage = async (file: File) => {
    setIsUploadingPerson(true);
    setError(null);

    try {
      // Get presigned URL
      const { s3UploadUrl, s3UploadFields, publicImageUrl } = await uploadImageForVideo({
        fileName: file.name,
        fileType: file.type as 'image/jpeg' | 'image/png',
      });

      // Upload to S3
      const formData = new FormData();
      Object.entries(s3UploadFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('file', file);

      const uploadResponse = await fetch(s3UploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      // Set the public URL
      setPersonImageUrl(publicImageUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setIsUploadingPerson(false);
    }
  };

  const handleUploadProductImage = async (file: File) => {
    setIsUploadingProduct(true);
    setError(null);

    try {
      // Get presigned URL
      const { s3UploadUrl, s3UploadFields, publicImageUrl } = await uploadImageForVideo({
        fileName: file.name,
        fileType: file.type as 'image/jpeg' | 'image/png',
      });

      // Upload to S3
      const formData = new FormData();
      Object.entries(s3UploadFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('file', file);

      const uploadResponse = await fetch(s3UploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      // Set the public URL
      setProductImageUrl(publicImageUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setIsUploadingProduct(false);
    }
  };

  const validateForm = (): string | null => {
    if (!personImageUrl.trim()) {
      return 'Please provide a person image URL';
    }
    if (!productImageUrl.trim()) {
      return 'Please provide a product image URL';
    }
    try {
      new URL(personImageUrl);
    } catch {
      return 'Person image URL is invalid';
    }
    try {
      new URL(productImageUrl);
    } catch {
      return 'Product image URL is invalid';
    }
    return null;
  };

  const handleDownload = async () => {
    if (!generatedComposite) return;

    try {
      // Fetch the image as a blob
      const response = await fetch(generatedComposite.url);
      const blob = await response.blob();

      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `composite-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
      setError('Failed to download image. Please try again.');
    }
  };

  const handleRefundRequest = async () => {
    if (!failedGeneration) return;

    setProcessingRefund(true);
    try {
      const result = await requestRefund({ generationId: failedGeneration.id });
      toast({
        title: 'Refund Successful',
        description: result.message,
      });
      setFailedGeneration({ ...failedGeneration, creditsRefunded: true });
    } catch (error: any) {
      toast({
        title: 'Refund Failed',
        description: error.message || 'Failed to process refund. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingRefund(false);
    }
  };

  const handleRetry = async () => {
    if (!failedGeneration) return;

    setRetrying(true);
    try {
      const result = await retryGeneration({ generationId: failedGeneration.id });
      toast({
        title: 'Generation Retrying',
        description: 'Your generation has been restarted. Check back in a few minutes.',
      });
      setCurrentGenerationId(result.id);
      setIsGenerating(true);
      setFailedGeneration(null);
      setGenerationStartTime(Date.now());
    } catch (error: any) {
      toast({
        title: 'Retry Failed',
        description: error.message || 'Failed to retry generation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Generate Product Composite</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Combine a person image with a product to create a UGC-style composite
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {/* Left: Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Composite Settings
            </CardTitle>
            {user && (
              <div className="text-sm text-muted-foreground">
                Credits: <strong>{user.videoCredits || 0}</strong> (Cost: 1 credit)
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Person Image URL */}
            <div className="space-y-2">
              <Label>Person Image</Label>
              <ImageDropzone
                onImageSelect={handleUploadPersonImage}
                currentImageUrl={personImageUrl}
                onClearImage={() => setPersonImageUrl('')}
                disabled={isUploadingPerson}
                label="Drop person image here or click to browse"
                aspectRatio="3/4"
              />
              <p className="text-xs text-muted-foreground">
                Use a generated person or upload your own
              </p>
            </div>

            {/* Product Image URL */}
            <div className="space-y-2">
              <Label>Product Image</Label>
              <ImageDropzone
                onImageSelect={handleUploadProductImage}
                currentImageUrl={productImageUrl}
                onClearImage={() => setProductImageUrl('')}
                disabled={isUploadingProduct}
                label="Drop product image here or click to browse"
                aspectRatio="4/3"
              />
              <p className="text-xs text-muted-foreground">
                Product image to composite with the person
              </p>
            </div>

            {/* Optional Composite Prompt */}
            <div className="space-y-2">
              <Label>Composite Prompt (Optional)</Label>
              <Textarea
                placeholder="Describe how the person should interact with the product (optional)..."
                value={compositePrompt}
                onChange={(e) => setCompositePrompt(e.target.value)}
                rows={3}
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground">
                {compositePrompt.length}/300 characters (optional)
              </p>
            </div>

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !!validateForm()}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Image className="w-4 h-4 mr-2" />
                  Generate Composite
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right: Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {isGenerating && generationStartTime && (
              <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center p-8">
                <div className="w-full max-w-sm">
                  <LoadingProgress
                    assetType="composite"
                    startTime={generationStartTime}
                  />
                </div>
              </div>
            )}

            {failedGeneration && !isGenerating && (
              <div className="space-y-4">
                <div className="aspect-[3/4] bg-red-50 rounded-lg flex items-center justify-center border-2 border-red-200">
                  <div className="text-center p-6 space-y-3">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
                    <p className="text-sm font-medium text-red-700">Generation Failed</p>
                  </div>
                </div>

                {failedGeneration.errorMessage && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                      {failedGeneration.errorMessage}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  {failedGeneration.isRefundable && !failedGeneration.creditsRefunded && (
                    <Button
                      onClick={handleRefundRequest}
                      variant="outline"
                      className="w-full border-green-300 text-green-700 hover:bg-green-50"
                      disabled={processingRefund}
                    >
                      {processingRefund ? (
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

                  {failedGeneration.creditsRefunded && (
                    <Alert className="bg-green-50 border-green-200">
                      <AlertDescription className="text-green-700 text-center">
                        ✓ Credits Refunded
                      </AlertDescription>
                    </Alert>
                  )}

                  {failedGeneration.canRetry && (
                    <Button
                      onClick={handleRetry}
                      variant="outline"
                      className="w-full"
                      disabled={retrying}
                    >
                      {retrying ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Retry Generation
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {generatedComposite && !isGenerating && !failedGeneration && (
              <div className="space-y-4">
                <img
                  src={generatedComposite.url}
                  alt="Generated composite"
                  className="w-full rounded-lg"
                />
                <Button onClick={handleDownload} className="w-full" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Composite Image
                </Button>
              </div>
            )}

            {!isGenerating && !generatedComposite && !failedGeneration && (
              <div className="aspect-[3/4] bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Image className="w-8 h-8 mx-auto text-gray-300" />
                  <p className="text-sm text-gray-500">Your generated composite will appear here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
