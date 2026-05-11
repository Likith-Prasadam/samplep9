import { useState, useRef } from 'react';

interface VideoPlayerProps {
  presignedUrl: string;
}

export function VideoPlayer({ presignedUrl }: VideoPlayerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error('Video error:', e);
    const videoElement = e.target as HTMLVideoElement;
    const errorCode = videoElement.error?.code;
    const errorMessage = videoElement.error?.message;
    setError(
      `Failed to load video: ${errorMessage || ''} (Code: ${errorCode || 'unknown'})`
    );
    setIsLoading(false);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleWaiting = () => {
    setIsLoading(true);
  };

  const handlePlaying = () => {
    setIsLoading(false);
  };

  if (!presignedUrl) {
    return (
      <div className="shadow-md overflow-hidden rounded-lg border">
        <div className="flex items-center justify-center h-[300px] text-destructive bg-background">
          No video URL provided
        </div>
      </div>
    );
  }

  return (
    <div className="shadow-md overflow-hidden rounded-lg border relative w-full aspect-video bg-black flex items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
          <p className="text-destructive text-center px-4">{error}</p>
        </div>
      )}
      <video
        ref={videoRef}
        controls
        preload="metadata"
        className="w-full h-full object-contain"
        onError={handleError}
        onCanPlay={handleCanPlay}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
      >
        <source src={presignedUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
