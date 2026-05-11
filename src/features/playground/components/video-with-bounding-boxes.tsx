import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, WifiOff } from 'lucide-react';
import type { BoundingBoxesData, VideoInfo } from '../types/batch-analysis';
import {
  getDetectionsAtTime,
  normalizeBoundingBoxes,
  type NormalizedFrame,
} from '../utils/bounding-box-normalizer';
import { BoundingBoxOverlay } from './bounding-box-overlay';

interface VideoWithBoundingBoxesProps {
  videoUrl: string;
  boundingBoxes?: BoundingBoxesData | null;
  sourceVideoInfo?: VideoInfo | null;
  confidenceThreshold?: number;
  selectedClasses?: string[];
  showTrackIds?: boolean;
  highlightedTrackId?: string;
  autoPlay?: boolean;
  muted?: boolean;
  disableNativeFullscreen?: boolean;
  onEnded?: () => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onError?: (msg: string) => void;
  onDetectionCountChange?: (count: number) => void;
}

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (
    cb: (now: number, metadata: { mediaTime: number }) => void
  ) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

const calculateContainRect = (
  containerWidth: number,
  containerHeight: number,
  contentWidth: number,
  contentHeight: number
) => {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  if (contentWidth <= 0 || contentHeight <= 0) {
    return { x: 0, y: 0, width: containerWidth, height: containerHeight };
  }

  const containerRatio = containerWidth / containerHeight;
  const contentRatio = contentWidth / contentHeight;

  if (contentRatio > containerRatio) {
    const width = containerWidth;
    const height = width / contentRatio;
    return { x: 0, y: (containerHeight - height) / 2, width, height };
  }

  const height = containerHeight;
  const width = height * contentRatio;
  return { x: (containerWidth - width) / 2, y: 0, width, height };
};

const getMediaErrorMessage = (error: MediaError | null): string => {
  if (!error) {
    return 'Unknown media error.';
  }

  switch (error.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return 'Video playback was interrupted before finishing.';
    case MediaError.MEDIA_ERR_NETWORK:
      return 'Network error while loading video data.';
    case MediaError.MEDIA_ERR_DECODE:
      return 'Video decode error while reading stream data.';
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return 'Video source is unsupported or expired.';
    default:
      return error.message || 'Unknown media error.';
  }
};

export function VideoWithBoundingBoxes({
  videoUrl,
  boundingBoxes,
  sourceVideoInfo,
  confidenceThreshold = 0,
  selectedClasses = [],
  showTrackIds = false,
  highlightedTrackId = '',
  autoPlay = false,
  muted = false,
  disableNativeFullscreen = false,
  onEnded,
  onLoadStart,
  onCanPlay,
  onError,
  onDetectionCountChange,
}: VideoWithBoundingBoxesProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [currentMs, setCurrentMs] = useState(0);
  const [videoDurationMs, setVideoDurationMs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(hostRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const syncVideoSize = () => {
      setVideoSize({
        width: video.videoWidth,
        height: video.videoHeight,
      });
      setVideoDurationMs(
        Number.isFinite(video.duration) ? video.duration * 1000 : 0
      );
    };

    const onLoadStartInternal = () => {
      setIsLoading(true);
      setErrorMsg(null);
      setIsBuffering(false);
      onLoadStart?.();
    };

    const onCanPlayInternal = () => {
      setIsLoading(false);
      setErrorMsg(null);
      onCanPlay?.();
    };

    const onPlay = () => setIsBuffering(false);
    const onPause = () => setCurrentMs(video.currentTime * 1000);
    const onSeeked = () => {
      setCurrentMs(video.currentTime * 1000);
      setIsBuffering(false);
    };
    const onTimeUpdate = () => setCurrentMs(video.currentTime * 1000);
    const onWaiting = () => setIsBuffering(true);
    const onStalled = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onEndedInternal = () => onEnded?.();

    syncVideoSize();

    video.addEventListener('loadstart', onLoadStartInternal);
    video.addEventListener('loadedmetadata', syncVideoSize);
    video.addEventListener('durationchange', syncVideoSize);
    video.addEventListener('canplay', onCanPlayInternal);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('stalled', onStalled);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('ended', onEndedInternal);

    return () => {
      video.removeEventListener('loadstart', onLoadStartInternal);
      video.removeEventListener('loadedmetadata', syncVideoSize);
      video.removeEventListener('durationchange', syncVideoSize);
      video.removeEventListener('canplay', onCanPlayInternal);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('stalled', onStalled);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('ended', onEndedInternal);
    };
  }, [onCanPlay, onEnded, onLoadStart, videoUrl]);

  useEffect(() => {
    const video = videoRef.current as VideoWithFrameCallback | null;
    if (!video) {
      return;
    }

    let rafId = 0;
    let frameCallbackId: number | null = null;

    const stopTracking = () => {
      cancelAnimationFrame(rafId);
      rafId = 0;

      if (frameCallbackId !== null && video.cancelVideoFrameCallback) {
        video.cancelVideoFrameCallback(frameCallbackId);
      }

      frameCallbackId = null;
    };

    const scheduleTracking = () => {
      if (video.paused || video.ended) {
        return;
      }

      if (typeof video.requestVideoFrameCallback === 'function') {
        frameCallbackId = video.requestVideoFrameCallback((_now, metadata) => {
          const mediaTimeMs = Number.isFinite(metadata?.mediaTime)
            ? metadata.mediaTime * 1000
            : video.currentTime * 1000;
          setCurrentMs(mediaTimeMs);
          scheduleTracking();
        });
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        setCurrentMs(video.currentTime * 1000);
        scheduleTracking();
      });
    };

    const onPlay = () => {
      stopTracking();
      scheduleTracking();
    };

    const onPause = () => {
      stopTracking();
      setCurrentMs(video.currentTime * 1000);
    };

    const onSeeked = () => {
      const timeMs = video.currentTime * 1000;
      setCurrentMs(timeMs);
      setIsBuffering(false);
      stopTracking();
      scheduleTracking();
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('seeked', onSeeked);

    return () => {
      stopTracking();
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('seeked', onSeeked);
    };
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    const host = hostRef.current;

    if (!video || !host) {
      return;
    }

    const onFullscreenChange = () => {
      // Native video controls fullscreen targets only the <video> element,
      // which hides sibling overlay layers. Promote fullscreen to the host
      // container so video and bounding-box overlay stay together.
      if (document.fullscreenElement === video && document.fullscreenEnabled) {
        host.requestFullscreen?.().catch(() => {});
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  const normalizedFrames = useMemo<NormalizedFrame[]>(() => {
    if (!boundingBoxes?.frames?.length) {
      return [];
    }

    const sourceSize =
      sourceVideoInfo?.videoWidth && sourceVideoInfo?.videoHeight
        ? {
            width: sourceVideoInfo.videoWidth,
            height: sourceVideoInfo.videoHeight,
          }
        : null;

    const actualSize =
      videoSize.width > 0 && videoSize.height > 0 ? videoSize : undefined;

    return normalizeBoundingBoxes(
      boundingBoxes,
      videoDurationMs,
      sourceSize,
      actualSize
    );
  }, [boundingBoxes, sourceVideoInfo, videoDurationMs, videoSize]);

  const currentDetections = useMemo(
    () => getDetectionsAtTime(normalizedFrames, currentMs),
    [currentMs, normalizedFrames]
  );

  const filteredDetections = useMemo(() => {
    return currentDetections.filter((detection) => {
      if (detection.confidence < confidenceThreshold) {
        return false;
      }

      if (
        selectedClasses.length > 0 &&
        !selectedClasses.includes(detection.className)
      ) {
        return false;
      }

      return true;
    });
  }, [confidenceThreshold, currentDetections, selectedClasses]);

  useEffect(() => {
    onDetectionCountChange?.(filteredDetections.length);
  }, [filteredDetections.length, onDetectionCountChange]);

  const containRect = useMemo(() => {
    return calculateContainRect(
      containerSize.width,
      containerSize.height,
      videoSize.width,
      videoSize.height
    );
  }, [
    containerSize.height,
    containerSize.width,
    videoSize.height,
    videoSize.width,
  ]);

  const handleVideoError = () => {
    const mediaError = videoRef.current?.error ?? null;
    const message = getMediaErrorMessage(mediaError);
    setIsLoading(false);
    setIsBuffering(false);
    setErrorMsg(message);
    onError?.(message);
  };

  return (
    <div
      ref={hostRef}
      className="relative h-full w-full overflow-hidden bg-black"
    >
      <video
        ref={videoRef}
        key={videoUrl}
        src={videoUrl}
        controls
        playsInline
        autoPlay={autoPlay}
        muted={muted}
        preload="metadata"
        controlsList={disableNativeFullscreen ? 'nofullscreen' : undefined}
        className="h-full w-full object-contain"
        onError={handleVideoError}
      />

      <div className="pointer-events-none absolute inset-0">
        {normalizedFrames.length > 0 && !isLoading && !errorMsg ? (
          <BoundingBoxOverlay
            renderWidth={containRect.width}
            renderHeight={containRect.height}
            offsetX={containRect.x}
            offsetY={containRect.y}
            detections={filteredDetections}
            showTrackIds={showTrackIds}
            highlightedTrackId={highlightedTrackId}
          />
        ) : null}
      </div>

      {isLoading ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/80">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-sm font-medium text-white/70">
            Loading footage...
          </span>
        </div>
      ) : null}

      {!isLoading && isBuffering ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/60 px-4 py-2 text-white/80">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm">Buffering...</span>
          </div>
        </div>
      ) : null}

      {errorMsg ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 px-6 text-center">
          <div className="max-w-sm space-y-3 rounded-2xl border border-white/10 bg-black/60 p-6 text-white">
            <p className="text-base font-semibold">Video unavailable</p>
            <p className="text-sm text-white/70">{errorMsg}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
