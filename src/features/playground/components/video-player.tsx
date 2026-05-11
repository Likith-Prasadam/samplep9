import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Loader2, PlayCircle } from 'lucide-react';

interface VideoPlayerProps {
  presignedUrl: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ presignedUrl }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setError(null);
    setIsLoading(true);

    if (!presignedUrl) {
      setError('No video URL provided');
      setIsLoading(false);
      return;
    }

    // Validate URL format
    try {
      new URL(presignedUrl);
    } catch {
      setError('Invalid video URL');
      setIsLoading(false);
      return;
    }

    // Note: Removed axios.head() validation due to CORS restrictions on S3 bucket.
    // The video element will handle loading and error states directly.
  }, [presignedUrl]);

  const handleVideoError = () => {
    setError('Failed to play video. The link may have expired.');
    setIsLoading(false);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setError(null);
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-gray-800 bg-black shadow-2xl">
      {presignedUrl ? (
        <>
          <video
            ref={videoRef}
            className="h-full w-full object-contain"
            controls
            controlsList="nodownload"
            preload="metadata"
            onCanPlayThrough={handleCanPlay}
            onLoadedData={handleCanPlay}
            onError={handleVideoError}
            onLoadStart={() => setIsLoading(true)}
          >
            <source src={presignedUrl} type="video/mp4" />
            <source src={presignedUrl} type="video/webm" />
            Your browser does not support video playback.
          </video>

          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm">
              <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
              <p className="mt-4 text-sm text-gray-300">Loading video...</p>
            </div>
          )}
        </>
      ) : null}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 px-6 text-center">
          <AlertCircle className="mb-4 h-16 w-16 text-rose-400" />
          <p className="mb-2 text-lg font-medium text-white">
            Video Unavailable
          </p>
          <p className="max-w-xs text-sm text-gray-400">{error}</p>
        </div>
      )}

      {!presignedUrl && !error && (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gray-900">
          <PlayCircle className="h-16 w-16 text-gray-600" />
          <p className="mt-4 text-gray-500">No video selected</p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
