import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
const VideoShowcase = ({ examples }) => {
    const [currentExample, setCurrentExample] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef(null);
    const currentVideo = examples[currentExample];
    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            }
            else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };
    const handleVideoEnd = () => {
        setIsPlaying(false);
    };
    const handleExampleChange = (index) => {
        if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
        setCurrentExample(index);
    };
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.load(); // Force reload the video source
            videoRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    }, [currentExample]);
    return (<div className="pt-32 pb-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
            See the Magic in Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From reference images and prompts to professional UGC videos. 
            Here's exactly what you get when you use our platform.
          </p>
        </div>

        {/* Main Showcase - Redesigned Layout */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Input Section */}
          <Card className="h-full">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-6 text-foreground">Input</h3>
              
              {/* Reference Image */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Reference Image</h4>
                <div className="aspect-square rounded-lg overflow-hidden bg-muted max-w-48 mx-auto">
                  <img src={currentVideo.referenceImage} alt="Reference" className="w-full h-full object-cover"/>
                </div>
              </div>

              {/* Prompt */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Prompt</h4>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-foreground italic leading-relaxed">
                    "{currentVideo.prompt}"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card className="h-full">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-6 text-foreground">Generated Video</h3>
              
              <div className="aspect-[9/16] rounded-lg overflow-hidden bg-black relative max-w-56 mx-auto">
                <video ref={videoRef} className="w-full h-full object-cover" loop onEnded={handleVideoEnd}>
                  <source src={currentVideo.videoSrc} type="video/mp4"/>
                </video>
                
                {/* Play/Pause Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Button onClick={handlePlayPause} size="lg" className="rounded-full p-4 bg-black/70 hover:bg-black/80 text-white">
                    {isPlaying ? <Pause size={20}/> : <Play size={20}/>}
                  </Button>
                </div>

                {/* Video Title */}
                <div className="absolute bottom-3 left-3 bg-black/70 rounded-lg px-3 py-1">
                  <span className="text-white text-sm font-medium">{currentVideo.title}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-4 text-center leading-relaxed">
                {currentVideo.description}
              </p>
            </CardContent>
          </Card>

          {/* Stats/Info Section */}
          <Card className="h-full">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-6 text-foreground">Results</h3>
              
              <div className="space-y-6">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-foreground mb-1">8s</div>
                  <div className="text-sm text-muted-foreground">Perfect Duration</div>
                </div>
                
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-foreground mb-1">9:16</div>
                  <div className="text-sm text-muted-foreground">Mobile Optimized</div>
                </div>
                
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-foreground mb-1">HD</div>
                  <div className="text-sm text-muted-foreground">High Quality</div>
                </div>
                
                <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="text-lg font-semibold text-primary mb-1">Ready to Use</div>
                  <div className="text-xs text-muted-foreground">Download instantly</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Example Selector - Larger thumbnails, no text */}
        <div className="flex flex-wrap justify-center gap-4">
          {examples.map((example, index) => (<button key={example.id} onClick={() => handleExampleChange(index)} className={`relative rounded-lg overflow-hidden transition-all duration-200 ${index === currentExample
                ? 'ring-3 ring-primary scale-110'
                : 'opacity-70 hover:opacity-100 hover:scale-105'}`}>
              <video className="w-20 h-20 object-cover aspect-square" muted preload="metadata">
                <source src={`${example.videoSrc}#t=1`} type="video/mp4"/>
              </video>
              <div className="absolute inset-0 bg-black/20"/>
            </button>))}
        </div>
      </div>
    </div>);
};
export default VideoShowcase;
