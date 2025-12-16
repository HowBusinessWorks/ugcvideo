import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Progress } from './progress';
export function LoadingProgress({ assetType, mode, startTime }) {
    const [progress, setProgress] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    // Estimated completion times in seconds
    const estimatedTime = assetType === 'person' ? 45 :
        assetType === 'composite' ? 45 :
            mode === 'FAST' ? 150 : 270; // 2.5 min or 4.5 min for video
    useEffect(() => {
        const timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setElapsedSeconds(elapsed);
            // Calculate simulated progress (caps at 95% to avoid showing 100% before completion)
            const calculatedProgress = Math.min(95, (elapsed / estimatedTime) * 100);
            setProgress(calculatedProgress);
        }, 500);
        return () => clearInterval(timer);
    }, [startTime, estimatedTime]);
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    const getStatusMessage = () => {
        if (assetType === 'person') {
            return progress < 30 ? 'Initializing AI model...' :
                progress < 60 ? 'Generating person features...' :
                    'Finalizing image...';
        }
        else if (assetType === 'composite') {
            return progress < 30 ? 'Processing images...' :
                progress < 60 ? 'Compositing layers...' :
                    'Enhancing details...';
        }
        else {
            return progress < 20 ? 'Initializing video generation...' :
                progress < 50 ? 'Generating video frames...' :
                    progress < 80 ? 'Processing motion...' :
                        'Finalizing video...';
        }
    };
    return (<div className="w-full space-y-4">
      <div className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary"/>
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-2"/>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{getStatusMessage()}</span>
          <span className="text-muted-foreground font-mono">{formatTime(elapsedSeconds)}</span>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Estimated time: {Math.floor(estimatedTime / 60)} min {estimatedTime % 60} sec
        </p>
      </div>
    </div>);
}
