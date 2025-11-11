import { useState, useEffect, useRef } from 'react';
import { useAuth } from 'wasp/client/auth';
import { createVideoGeneration, getUserVideos, getVideoById, useQuery } from 'wasp/client/operations';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';
import { Upload, Video, Zap, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { VideoGeneration } from 'wasp/entities';
import { ImageUploadComponent } from './ImageUploadComponent';

export default function VideoGeneratorPage() {
  // Authentication
  const { data: user } = useAuth();
  
  // Form state
  const [referenceImageUrl, setReferenceImageUrl] = useState('');
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState<VideoGeneration | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Video modal state
  const [selectedVideo, setSelectedVideo] = useState<VideoGeneration | null>(null);

  // Polling state
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // User's videos
  const { data: userVideos, isLoading: videosLoading, refetch: refetchUserVideos } = useQuery(getUserVideos);

  // Handle form submission
  const handleGenerate = async () => {
    if (!referenceImageUrl.trim() || !content.trim()) {
      setError('Please upload a reference image and provide a video description');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setCurrentGeneration(null); // Clear any previous generation

    try {
      const newGeneration = await createVideoGeneration({
        referenceImageUrl: referenceImageUrl.trim(),
        content: content.trim(),
      });

      setCurrentGeneration(newGeneration);
      
      // Clear form
      setReferenceImageUrl('');
      setContent('');
      
      // Start polling for updates (we'll implement this)
      startPollingForUpdates(newGeneration.id);

    } catch (err: any) {
      setError(err.message || 'Failed to start video generation');
      setIsGenerating(false);
    }
  };

  // Poll for video generation updates
  const startPollingForUpdates = (videoId: string) => {
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll every 2 seconds for more responsive updates
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const updatedVideo = await getVideoById({ id: videoId });
        
        if (updatedVideo) {
          setCurrentGeneration(updatedVideo);
          
          // Stop polling if video is completed or failed
          if (updatedVideo.status === 'COMPLETED' || updatedVideo.status === 'FAILED') {
            setIsGenerating(false);
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            
            // Refresh video library immediately when video completes
            if (updatedVideo.status === 'COMPLETED') {
              refetchUserVideos();
            }
            
            // Keep completed video in right panel until next generation
            // Only clear failed videos after 3 seconds
            if (updatedVideo.status === 'FAILED') {
              setTimeout(() => {
                setCurrentGeneration(null);
              }, 3000);
            }
            // Completed videos stay until next generation or page refresh
          }
        }
      } catch (error) {
        console.error('Error polling video status:', error);
      }
    }, 2000);
  };

  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Get video status color and icon
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { color: 'text-yellow-600', icon: Clock, label: 'Generating' };
      case 'PROCESSING':
        return { color: 'text-blue-600', icon: Video, label: 'Processing' };
      case 'COMPLETED':
        return { color: 'text-green-600', icon: CheckCircle, label: 'Completed' };
      case 'FAILED':
        return { color: 'text-red-600', icon: XCircle, label: 'Failed' };
      default:
        return { color: 'text-gray-600', icon: Clock, label: status };
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">UGC Video Generator</h1>
        <p className="text-muted-foreground">
          Create professional UGC-style videos from your images and prompts
        </p>
      </div>

      {/* Main Generation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        
        {/* LEFT SIDE - Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Create New Video
            </CardTitle>
            {user && (
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>Video Credits: <strong>{user.videoCredits || 0}</strong></span>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Reference Image Upload */}
            <ImageUploadComponent
              onImageUploaded={(imageUrl) => setReferenceImageUrl(imageUrl)}
              disabled={isGenerating}
            />

            {/* Video Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Video Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the UGC video you want to create. Example: 'Create a fun review of this product where the character talks about its amazing features in a casual, authentic way.'"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isGenerating}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {content.length}/500 characters
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !!currentGeneration || !referenceImageUrl.trim() || !content.trim()}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Video className="w-4 h-4 mr-2 animate-spin" />
                  Generating Video...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Generate Video (1 Credit)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* RIGHT SIDE - Video Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Generated Video
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentGeneration ? (
              <div className="space-y-4">
                {/* Generation Status */}
                <div className="flex items-center gap-2">
                  {(() => {
                    const { color, icon: StatusIcon, label } = getStatusDisplay(currentGeneration.status);
                    return (
                      <>
                        <StatusIcon className={`w-4 h-4 ${color}`} />
                        <span className={`text-sm font-medium ${color}`}>{label}</span>
                      </>
                    );
                  })()}
                </div>

                {/* Progress Bar */}
                {currentGeneration.status === 'PROCESSING' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{currentGeneration.progress || 0}%</span>
                    </div>
                    <Progress value={currentGeneration.progress || 0} />
                  </div>
                )}

                {/* Video Player */}
                {currentGeneration.finalVideoUrl && (
                  <div className="aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden max-w-xs mx-auto">
                    <video
                      src={currentGeneration.finalVideoUrl}
                      controls
                      autoPlay
                      muted
                      className="w-full h-full object-cover"
                      poster={currentGeneration.thumbnailUrl ?? undefined}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                {/* Placeholder for processing */}
                {!currentGeneration.finalVideoUrl && (
                  <div className="aspect-[9/16] bg-gray-100 rounded-lg flex items-center justify-center max-w-xs mx-auto">
                    <div className="text-center space-y-2">
                      <Video className="w-8 h-8 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-500">
                        {currentGeneration.status === 'PROCESSING' ? 'Generating video...' : 'Generating video...'}
                      </p>
                      {(currentGeneration.status === 'PENDING' || currentGeneration.status === 'PROCESSING') && (
                        <p className="text-xs text-gray-400">
                          It might take up to 10 minutes
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[9/16] bg-gray-50 rounded-lg flex items-center justify-center max-w-xs mx-auto">
                <div className="text-center space-y-2">
                  <Video className="w-8 h-8 mx-auto text-gray-300" />
                  <p className="text-sm text-gray-500">Your generated video will appear here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM SECTION - Previous Videos */}
      <Card>
        <CardHeader>
          <CardTitle>Your Video Library</CardTitle>
        </CardHeader>
        <CardContent>
          {videosLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[9/16] bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : userVideos && userVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {userVideos.map((video) => {
                const { color, icon: StatusIcon, label } = getStatusDisplay(video.status);
                return (
                  <div key={video.id} className="group relative">
                    <div className="aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden">
                      {video.finalVideoUrl ? (
                        <video
                          src={video.finalVideoUrl}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                          poster={video.thumbnailUrl ?? undefined}
                          onClick={() => setSelectedVideo(video)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <StatusIcon className={`w-8 h-8 ${color}`} />
                        </div>
                      )}
                      
                      {/* Status Overlay */}
                      <div className="absolute top-2 right-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium bg-white/90 ${color}`}>
                          {label}
                        </div>
                      </div>
                    </div>
                    
                    {/* Video Info */}
                    <div className="mt-2 space-y-1">
                      <p className="text-sm font-medium truncate" title={video.content}>
                        {video.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(video.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Video className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No videos yet</h3>
              <p className="text-gray-500">Generate your first UGC video using the form above!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold z-10 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
            >
              ×
            </button>
            
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Generated Video Details</h2>
              
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Reference Image */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800">Reference Image</h3>
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {selectedVideo.referenceImageUrl ? (
                      <img
                        src={selectedVideo.referenceImageUrl}
                        alt="Reference"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        No reference image
                      </div>
                    )}
                  </div>
                </div>

                {/* Generated Video */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800">Generated Video</h3>
                  <div className="aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden">
                    {selectedVideo.finalVideoUrl ? (
                      <video
                        src={selectedVideo.finalVideoUrl}
                        controls
                        autoPlay
                        className="w-full h-full object-cover"
                        poster={selectedVideo.thumbnailUrl ?? undefined}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="text-gray-500">Video not available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Video Prompt</h3>
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {selectedVideo.content}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-600">Creation Details</h4>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p><strong>Created:</strong> {new Date(selectedVideo.createdAt).toLocaleString()}</p>
                      <p><strong>Status:</strong> <span className="text-green-600 font-medium">Completed</span></p>
                      {selectedVideo.updatedAt && (
                        <p><strong>Last Updated:</strong> {new Date(selectedVideo.updatedAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  {/* Download Button */}
                  {selectedVideo.finalVideoUrl && (
                    <div className="pt-4">
                      <a
                        href={selectedVideo.finalVideoUrl}
                        download={`ugc-video-${selectedVideo.id}.mp4`}
                        className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Video
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}