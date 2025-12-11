import { useState, useEffect, useRef } from 'react';
import { useAuth } from 'wasp/client/auth';
import { createVideoOnlyGeneration, getVideoById, uploadImageForVideo, getPendingGeneration, requestRefund, retryGeneration, getUserAssets } from 'wasp/client/operations';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Video, Download, Loader2, Upload, Sparkles, AlertCircle, RefreshCw, DollarSign } from 'lucide-react';
import { CREDIT_COSTS, CREDIT_PRICE } from '../../payment/plans';
import { LoadingProgress } from '../../components/ui/loading-progress';
import { ImageDropzone } from '../../components/ui/image-dropzone';

export default function VideoGenerationTab() {
  const { data: user } = useAuth();

  // State
  const [compositeImageUrl, setCompositeImageUrl] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [veo3Mode, setVeo3Mode] = useState<'FAST' | 'STANDARD'>('STANDARD');
  const [duration, setDuration] = useState<number>(8);
  const [aspectRatio, setAspectRatio] = useState<string>('9:16');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<{ url: string; id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);
  const [failedGeneration, setFailedGeneration] = useState<any | null>(null);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [isUploadingComposite, setIsUploadingComposite] = useState(false);
  const [isUploadingProduct, setIsUploadingProduct] = useState(false);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Check for existing pending generation on mount
  useEffect(() => {
    const checkPendingGeneration = async () => {
      if (!user?.id) return;

      try {
        // Query for user's most recent PENDING video generation
        const pendingGeneration = await getPendingGeneration({
          assetType: 'VIDEO',
        });

        if (pendingGeneration) {
          console.log('Restored pending video generation:', pendingGeneration.id);
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

        if (data && data.status === 'COMPLETED' && data.finalVideoUrl) {
          setGeneratedVideo({ url: data.finalVideoUrl, id: currentGenerationId });
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

    // Start polling every 3 seconds (video takes longer)
    pollingIntervalRef.current = setInterval(pollStatus, 3000);

    // Cleanup after 5 minutes (video generation can take longer)
    const timeout = setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      setError('Generation timed out. Please try again.');
      setIsGenerating(false);
      setCurrentGenerationId(null);
    }, 300000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      clearTimeout(timeout);
    };
  }, [currentGenerationId, isGenerating]);

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

  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);
    setGeneratedVideo(null);
    setFailedGeneration(null);
    setGenerationStartTime(Date.now());

    try {
      const result = await createVideoOnlyGeneration({
        compositeImageUrl,
        videoPrompt,
        veo3Mode,
        duration,
        aspectRatio,
        productImageUrl: productImageUrl || undefined,
      });

      console.log('Video generation started:', result.id);
      setCurrentGenerationId(result.id);

    } catch (err: any) {
      // Check if a failed generation was created in the database
      try {
        const result = await getUserAssets({
          assetType: 'VIDEO',
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

      setError(err.message || 'Failed to generate video');
      setIsGenerating(false);
    }
  };

  const handleUploadCompositeImage = async (file: File) => {
    setIsUploadingComposite(true);
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
      setCompositeImageUrl(publicImageUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setIsUploadingComposite(false);
    }
  };

  const validateForm = (): string | null => {
    if (!compositeImageUrl.trim()) {
      return 'Please provide a composite image URL';
    }
    if (!videoPrompt.trim() || videoPrompt.length < 10) {
      return 'Video prompt must be at least 10 characters';
    }
    try {
      new URL(compositeImageUrl);
    } catch {
      return 'Composite image URL is invalid';
    }
    return null;
  };

  const handleDownload = async () => {
    if (!generatedVideo) return;

    try {
      // Fetch the video as a blob
      const response = await fetch(generatedVideo.url);
      const blob = await response.blob();

      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading video:', error);
      setError('Failed to download video. Please try again.');
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
        <h2 className="text-xl sm:text-2xl font-bold">Generate UGC Video</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Create an AI-generated video from your composite image
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {/* Left: Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Video Settings
            </CardTitle>
            {user && (
              <div className="text-sm text-muted-foreground">
                Credits: <strong>{user.videoCredits || 0}</strong> (Cost: {veo3Mode === 'FAST' ? CREDIT_COSTS.VIDEO_FAST : CREDIT_COSTS.VIDEO_STANDARD} credits)
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Composite Image URL */}
            <div className="space-y-2">
              <Label>Composite Image</Label>
              <ImageDropzone
                onImageSelect={handleUploadCompositeImage}
                currentImageUrl={compositeImageUrl}
                onClearImage={() => setCompositeImageUrl('')}
                disabled={isUploadingComposite}
                label="Drop composite image here or click to browse"
                aspectRatio="3/4"
              />
              <p className="text-xs text-muted-foreground">
                Use a generated composite or upload your own
              </p>
            </div>

            {/* Video Prompt */}
            <div className="space-y-2">
              <Label>Video Prompt</Label>
              <Textarea
                placeholder="Describe the video motion and actions..."
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {videoPrompt.length}/500 characters (min 10)
              </p>
            </div>

            {/* Product Image URL (Optional - for GPT-4o Enhancement) */}
            <div className="space-y-2 pt-2 border-t">
              <Label className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Product Image (Optional - AI Enhancement)
              </Label>
              <ImageDropzone
                onImageSelect={handleUploadProductImage}
                currentImageUrl={productImageUrl}
                onClearImage={() => setProductImageUrl('')}
                disabled={isUploadingProduct}
                label="Drop product image here or click to browse"
                aspectRatio="4/3"
              />
              <p className="text-xs text-muted-foreground">
                Providing a product image helps AI generate better video prompts
              </p>
            </div>

            {/* Veo3 Mode */}
            <div className="space-y-2">
              <Label>Video Quality</Label>
              <Select value={veo3Mode} onValueChange={(value: 'FAST' | 'STANDARD') => setVeo3Mode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FAST">Veo Fast ({CREDIT_COSTS.VIDEO_FAST} credits - ${(CREDIT_COSTS.VIDEO_FAST * CREDIT_PRICE).toFixed(2)})</SelectItem>
                  <SelectItem value="STANDARD">Veo Standard ({CREDIT_COSTS.VIDEO_STANDARD} credits - ${(CREDIT_COSTS.VIDEO_STANDARD * CREDIT_PRICE).toFixed(2)})</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {veo3Mode === 'FAST'
                  ? 'Faster generation, good quality'
                  : 'Higher quality, takes longer'}
              </p>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>Duration (seconds)</Label>
              <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="8">8 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={(value) => setAspectRatio(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9:16">9:16 (Vertical/Mobile)</SelectItem>
                  <SelectItem value="16:9">16:9 (Horizontal)</SelectItem>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                </SelectContent>
              </Select>
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
                  <Video className="w-4 h-4 mr-2" />
                  Generate Video
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
              <div className="aspect-[9/16] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center p-8">
                <div className="w-full max-w-sm">
                  <LoadingProgress
                    assetType="video"
                    mode={veo3Mode}
                    startTime={generationStartTime}
                  />
                </div>
              </div>
            )}

            {failedGeneration && !isGenerating && (
              <div className="space-y-4">
                <div className="aspect-[9/16] bg-red-50 rounded-lg flex items-center justify-center border-2 border-red-200">
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

            {generatedVideo && !isGenerating && !failedGeneration && (
              <div className="space-y-4">
                <video
                  src={generatedVideo.url}
                  controls
                  className="w-full rounded-lg"
                  style={{ aspectRatio: aspectRatio.replace(':', '/') }}
                >
                  Your browser does not support the video tag.
                </video>
                <Button onClick={handleDownload} className="w-full" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Video
                </Button>
              </div>
            )}

            {!isGenerating && !generatedVideo && !failedGeneration && (
              <div className="aspect-[9/16] bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Video className="w-8 h-8 mx-auto text-gray-300" />
                  <p className="text-sm text-gray-500">Your generated video will appear here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
