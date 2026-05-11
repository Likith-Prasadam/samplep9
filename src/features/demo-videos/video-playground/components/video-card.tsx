import { useRef, useEffect, useState, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Loader2,
  Play,
  CheckCircle,
  MessageSquare,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogHeader,
} from '@/components/ui/dialog';
import type { DemoVideo } from '@/features/demo-videos/types';
import type { AppDispatch, RootState } from '@/store';
import {
  processDemoVideo,
  fetchDemoEvents,
} from '@/store/slices/demo-videos-slice';
import '@/styles/dialog-close-white.css';

interface VideoCardProps {
  video: DemoVideo;
  videoType: string;
}

function VideoCardComponent({ video, videoType }: VideoCardProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const dialogVideoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const { processingVideoId } = useSelector(
    (state: RootState) => state.demoVideos
  );

  const [, setProcessingCompleted] = useState(false);
  const [videoState, setVideoState] = useState<
    'idle' | 'processing' | 'success'
  >('idle');
  const [isVideoMetadataLoaded, setIsVideoMetadataLoaded] = useState(false);
  const [videoDuration, setVideoDuration] = useState('0:00');
  const [videoTotalSeconds, setVideoTotalSeconds] = useState(0);
  const [presignedUrlState, setPresignedUrlState] = useState({
    isLoaded: false,
    error: false,
  });
  const [isProcessingDialogOpen, setIsProcessingDialogOpen] = useState(false);
  const [dialogCurrentTime, setDialogCurrentTime] = useState(0);
  const [incidentDetected, setIncidentDetected] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [showResultBadge, setShowResultBadge] = useState(false);
  // Add state to control fullscreen dialog
  const [isFullscreenDialogOpen, setIsFullscreenDialogOpen] = useState(false);

  useEffect(() => {
    const element = cardRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setShouldLoadVideo(true), 100);
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && shouldLoadVideo) {
      videoRef.current.preload = 'metadata';
    }
  }, [shouldLoadVideo]);

  useEffect(() => {
    const videoElement = dialogVideoRef.current;
    if (!isProcessingDialogOpen || !videoElement) return;

    const handleTimeUpdate = () => {
      const currentTime = videoElement.currentTime;
      const duration = videoElement.duration;

      if (!isNaN(duration) && duration > 0) {
        setDialogCurrentTime(currentTime);

        const eventStartTime = Number(video.event_start_time);
        if (
          !incidentDetected &&
          !isNaN(eventStartTime) &&
          eventStartTime > 0 &&
          currentTime >= eventStartTime
        ) {
          setIncidentDetected(true);
        }

        if (currentTime >= duration - 0.5 && videoState === 'success') {
          setShowResultBadge(true);
        }
      }
    };

    const handleEnded = () => {
      if (videoState === 'success') {
        setShowResultBadge(true);
      }
    };

    if (videoState === 'processing') {
      videoElement.muted = true;
      videoElement
        .play()
        .catch((err) => console.warn('Autoplay blocked:', err));
    }

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('ended', handleEnded);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, [
    isProcessingDialogOpen,
    videoState,
    video.event_start_time,
    incidentDetected,
  ]);

  useEffect(() => {
    if (!isProcessingDialogOpen && videoState === 'idle') {
      setDialogCurrentTime(0);
      setIncidentDetected(false);
    }
    if (
      !isProcessingDialogOpen &&
      videoState === 'success' &&
      !showResultBadge
    ) {
      setShowResultBadge(true);
    }
  }, [isProcessingDialogOpen, videoState, showResultBadge]);

  const handlePlay = useCallback(() => {
    if (
      videoRef.current &&
      videoRef.current.paused &&
      isVideoMetadataLoaded &&
      shouldLoadVideo
    ) {
      videoRef.current.play().catch((error) => {
        console.warn('Play interrupted:', error.message);
        setPresignedUrlState({ isLoaded: true, error: true });
      });
    }
  }, [isVideoMetadataLoaded, shouldLoadVideo]);

  const handlePause = useCallback(() => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, []);

  const handleVideoLoadedMetadata = (
    e: React.SyntheticEvent<HTMLVideoElement>
  ) => {
    const videoElement = e.target as HTMLVideoElement;
    const duration = videoElement.duration;
    setVideoTotalSeconds(duration);

    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    const formattedDuration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    setVideoDuration(formattedDuration);
    setIsVideoMetadataLoaded(true);
    setPresignedUrlState({ isLoaded: true, error: false });
  };

  const handleVideoError = () => {
    console.error('Error loading video for ID:', video.id);
    setPresignedUrlState({ isLoaded: true, error: true });
  };

  const handleStartProcessing = async () => {
    setIsProcessingDialogOpen(true);
    setIncidentDetected(false);
    setShowResultBadge(false);
    setVideoState('processing');

    try {
      const result = await dispatch(processDemoVideo(video.id)).unwrap();

      setVideoState('success');
      setProcessingCompleted(true);
      const transcriptStr = result?.transcript;
      try {
        const transcriptStatus =
          JSON.parse(transcriptStr)?.status || transcriptStr || '';
        console.log('Transcript status:', transcriptStatus);
      } catch {
        console.log('Transcript:', transcriptStr);
      }
    } catch (e) {
      console.error('Processing error:', e);
      setVideoState('idle');
    } finally {
      // Refresh demo events so notifications update without a full page reload
      dispatch(fetchDemoEvents());
    }
  };

  const navigateToChat = () => {
    const path = `/demo-videos/${videoType}/chat?video_id=${video.id}`;
    navigate(path);
  };

  const handleViewFullScreen = () => {
    setIsFullscreenDialogOpen(true);
  };

  const formatTimeString = (timeString: string | number | null) => {
    if (timeString === null || timeString === undefined) return '--:--';
    const seconds = Number(timeString);
    if (!isNaN(seconds)) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }
    return String(timeString);
  };

  const isProcessing = processingVideoId === video.id;

  return (
    <>
      <div
        ref={cardRef}
        className="w-full max-w-sm border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full"
      >
        <div
          className="relative cursor-pointer h-48 overflow-hidden rounded-t-lg group"
          onMouseEnter={handlePlay}
          onMouseLeave={handlePause}
        >
          {!shouldLoadVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {shouldLoadVideo && !isVideoMetadataLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {shouldLoadVideo ? (
            <video
              ref={videoRef}
              className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                !isVideoMetadataLoaded ? 'opacity-50' : ''
              }`}
              src={video.presigned_url}
              muted
              autoPlay={false}
              preload="none"
              onLoadedMetadata={handleVideoLoadedMetadata}
              onError={handleVideoError}
              onCanPlay={handlePause}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="w-full h-full bg-muted/20" />
          )}
          <div className="absolute bottom-3 right-3 bg-background/80 px-2 py-1 rounded-full text-xs font-medium">
            {videoDuration}
          </div>
        </div>

        <CardHeader className="px-5 pt-2 pb-2 ">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 mt-3 gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CardTitle className="text-xl line-clamp-1 font-semibold cursor-pointer">
                      {video.video_name}
                    </CardTitle>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{video.video_name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex items-center gap-1">
                {isVideoMetadataLoaded && !presignedUrlState.error ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex items-center px-3 py-1 text-xs font-medium rounded-md "
                    onClick={navigateToChat}
                    type="button"
                  >
                    <MessageSquare size={14} className="mr-1" />
                    Chat
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            size="sm"
                            className="flex items-center px-3 py-1 text-xs font-medium rounded-md opacity-50"
                            disabled
                            type="button"
                          >
                            <MessageSquare size={14} className="mr-1" />
                            Chat
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {presignedUrlState.error
                            ? 'Loading...'
                            : 'Loading video...'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {/* Three-dot menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="ml-1 p-1 h-7 w-7"
                      aria-label="More options"
                      type="button"
                    >
                      <MoreVertical size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  {/* align to right of icon */}
                  <DropdownMenuContent align="start" side="right">
                    <DropdownMenuItem onClick={handleViewFullScreen}>
                      View Full Screen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {video.video_description && (
              <div className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {video.video_description}
                </p>
              </div>
            )}
          </div>
        </CardHeader>

        <CardFooter className="px-5  mb-4 mt-auto">
          {videoState === 'idle' && !isProcessing && (
            <Button
              variant="default"
              type="button"
              className="w-full justify-center py-2 text-sm font-medium transition-all"
              onClick={handleStartProcessing}
              disabled={!isVideoMetadataLoaded}
            >
              {!isVideoMetadataLoaded ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Loading Video...
                </>
              ) : (
                <>
                  <Play size={16} className="mr-2" />
                  Start Processing
                </>
              )}
            </Button>
          )}
          {(videoState === 'processing' || isProcessing) && (
            <Button
              variant="default"
              className="w-full justify-center py-2 text-sm font-medium cursor-not-allowed"
              disabled
              type="button"
              onClick={() => setIsProcessingDialogOpen(true)}
            >
              <Loader2 size={16} className="mr-2 animate-spin" />
              Processing...
            </Button>
          )}
          {videoState === 'success' && !isProcessing && showResultBadge && (
            <div className="w-full flex flex-col sm:flex-row gap-2">
              {incidentDetected && (
                <Badge className="flex-1 flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer bg-red-600 hover:bg-red-700 text-white border-0">
                  <CheckCircle size={16} className="mr-1" />
                  Incident detected
                </Badge>
              )}
              {/* No incident badge hidden intentionally
              {!incidentDetected && (
                <Badge className="flex-1 flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer bg-green-600 hover:bg-green-700 text-white border-0">
                  <CheckCircle size={16} className="mr-1" />
                  No Incident detected
                </Badge>
              )}
              */}
              <Button
                size="sm"
                variant="outline"
                type="button"
                className="flex-1 flex justify-center items-center px-3 py-1.5 text-sm font-medium rounded-lg transition"
                onClick={handleStartProcessing}
                disabled={!isVideoMetadataLoaded}
              >
                <RefreshCw size={16} className="mr-1.5" />
                Reprocess
              </Button>
            </div>
          )}
        </CardFooter>
      </div>

      <Dialog
        open={isProcessingDialogOpen}
        onOpenChange={setIsProcessingDialogOpen}
      >
        <DialogContent className="sm:max-w-md w-full p-4 rounded-lg [&>button]:!text-gray-900 dark:[&>button]:!text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Processing Video
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col space-y-4">
              <h4 className="font-medium">{video.video_name}</h4>
              <div className="relative w-full max-w-sm mx-auto bg-black rounded-lg overflow-hidden shadow-lg">
                <video
                  ref={dialogVideoRef}
                  src={video.presigned_url}
                  className="w-full h-auto max-h-[60vh] object-contain"
                  controls
                  autoPlay
                  playsInline
                  muted={false}
                  onLoadedMetadata={(e) => {
                    const videoElement = e.target as HTMLVideoElement;
                    setVideoTotalSeconds(videoElement.duration);
                  }}
                  onTimeUpdate={(e) => {
                    setDialogCurrentTime(
                      (e.target as HTMLVideoElement).currentTime
                    );
                  }}
                />
              </div>
              <div className="mt-2 w-full flex flex-col items-center">
                <div className="w-full h-2 rounded-full overflow-hidden bg-secondary">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{
                      width:
                        videoTotalSeconds > 0 && dialogCurrentTime
                          ? `${Math.floor((dialogCurrentTime / videoTotalSeconds) * 100)}%`
                          : '0%',
                    }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Video Processing:{' '}
                  {videoTotalSeconds > 0
                    ? `${Math.floor(
                        (dialogCurrentTime / videoTotalSeconds) * 100
                      )}%`
                    : '0%'}
                </div>
              </div>
            </div>
            {incidentDetected && video.event_start_time !== null && (
              <div className="border rounded-md p-3 mt-4 bg-destructive/10">
                <p className="font-medium flex items-center">
                  <CheckCircle size={16} className="mr-2" />
                  Incident detected at{' '}
                  {formatTimeString(video.event_start_time)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsProcessingDialogOpen(false)}
            >
              Close
            </Button>

            {videoState !== 'idle' && (
              <Button size="sm" onClick={navigateToChat}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat with this video
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Dialog */}
      <Dialog
        open={isFullscreenDialogOpen}
        onOpenChange={setIsFullscreenDialogOpen}
      >
        <DialogContent className="w-full max-w-4xl h-[90vh] flex flex-col p-0 bg-black border-0 shadow-none">
          <div className="flex-1 flex items-center justify-center bg-black">
            <video
              src={video.presigned_url}
              className="w-full h-full object-contain bg-black"
              controls
              autoPlay
              playsInline
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const VideoCard = memo(VideoCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.video.id === nextProps.video.id &&
    prevProps.videoType === nextProps.videoType
  );
});
