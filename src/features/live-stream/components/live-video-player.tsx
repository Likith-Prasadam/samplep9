import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, Wifi, AlertTriangle } from 'lucide-react';
import Hls from 'hls.js';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';

interface LiveStreamProps {
  hlsUrl: string;
  camId: number;
}

const VideoPlayer: React.FC<LiveStreamProps> = ({ hlsUrl, camId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<
    'connecting' | 'buffering' | 'ready'
  >('connecting');
  const lastUrlRef = useRef<string>('');
  const recoveryAttemptRef = useRef<number>(0);
  const maxRecoveryAttempts = 3;
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const readyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for state values used in timeout to avoid dependency issues
  const loadingRef = useRef(loading);
  const isVideoReadyRef = useRef(isVideoReady);
  const loadingPhaseRef = useRef(loadingPhase);

  // Update refs when state changes
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    isVideoReadyRef.current = isVideoReady;
  }, [isVideoReady]);

  useEffect(() => {
    loadingPhaseRef.current = loadingPhase;
  }, [loadingPhase]);

  // Handle video ready state with proper timing
  const handleVideoReady = useCallback(() => {
    logger.log('Video ready detected');
    setLoadingPhase('ready');

    // Clear any existing timeout
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
    }

    // Delay hiding loading overlay to ensure smooth transition
    readyTimeoutRef.current = setTimeout(() => {
      setLoading(false);
      setIsVideoReady(true);
      logger.log('Loading overlay hidden');
    }, 800); // 800ms delay for smooth UX
  }, []);

  // Reset all states
  const resetStates = useCallback(() => {
    setLoading(true);
    setIsVideoReady(false);
    setError(null);
    setLoadingPhase('connecting');

    // Clear timeouts
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    logger.log('LiveStream mounted with:', { hlsUrl, camId });

    if (!hlsUrl) {
      setError('No stream URL');
      return;
    }

    // Extract base URL without query params to prevent unnecessary reloads
    const getBaseUrl = (url: string) => {
      try {
        const urlObj = new URL(url);
        return `${urlObj.origin}${urlObj.pathname}`;
      } catch {
        return url.split('?')[0];
      }
    };

    const baseUrl = getBaseUrl(hlsUrl);

    // Only reinitialize if the base URL actually changed
    if (baseUrl === lastUrlRef.current && hlsRef.current) {
      logger.debug('Base URL unchanged, skipping reinitialization');
      return;
    }

    lastUrlRef.current = baseUrl;

    if (!videoRef.current) {
      logger.error('Video ref not available');
      return;
    }

    const video = videoRef.current;
    resetStates();
    recoveryAttemptRef.current = 0;

    // Set a maximum loading timeout (15 seconds)
    loadingTimeoutRef.current = setTimeout(() => {
      if (loadingRef.current && !isVideoReadyRef.current) {
        logger.warn('Loading timeout reached, forcing ready state');
        handleVideoReady();
      }
    }, 15000);

    const initializeHls = () => {
      // Clean up existing instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const hls = new Hls({
        lowLatencyMode: false, // Disable for more stable buffering
        backBufferLength: 10,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.5,
        enableWorker: true,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        manifestLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 4,
        manifestLoadingRetryDelay: 1000,
        levelLoadingTimeOut: 20000,
        levelLoadingMaxRetry: 4,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        logger.log('HLS Manifest parsed successfully');
        setLoadingPhase('buffering');

        video
          .play()
          .then(() => {
            logger.log('Video play() successful');
            setError(null);
            recoveryAttemptRef.current = 0;
            // Don't immediately set loading false, wait for actual video data
          })
          .catch((err) => {
            logger.error('Play failed:', err);
            if (err.name !== 'AbortError') {
              setError('Playback failed');
              setLoading(false);
            }
          });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        logger.error('HLS Error:', data);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              logger.warn('Fatal network error, attempting recovery...');
              if (recoveryAttemptRef.current < maxRecoveryAttempts) {
                recoveryAttemptRef.current++;
                setTimeout(() => {
                  hls.startLoad();
                }, 1000 * recoveryAttemptRef.current);
              } else {
                setError('Network error: Unable to load stream');
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              logger.warn('Fatal media error, attempting recovery...');
              if (recoveryAttemptRef.current < maxRecoveryAttempts) {
                recoveryAttemptRef.current++;
                hls.recoverMediaError();
              } else {
                setError('Media error: Playback failed');
              }
              break;
            default:
              setError(`Stream error: ${data.details}`);
              break;
          }
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          // Non-fatal media errors like buffer stalls
          logger.debug('Non-fatal media error:', data.details);
          if (data.details === 'bufferStalledError') {
            // Let HLS.js handle it automatically
            logger.debug('Buffer stall detected, HLS.js will attempt recovery');
          }
        }
      });

      // Enhanced event handling for better loading detection
      hls.on(Hls.Events.BUFFER_APPENDING, () => {
        if (error) setError(null);
        if (loadingPhaseRef.current === 'connecting') {
          setLoadingPhase('buffering');
        }
      });

      // Video element event listeners
      const handleCanPlay = () => {
        logger.log('Video canplay event');
        if (loadingRef.current && loadingPhaseRef.current !== 'ready') {
          handleVideoReady();
        }
      };

      const handlePlaying = () => {
        logger.log('Video playing event');
        if (loadingRef.current) {
          handleVideoReady();
        }
      };

      const handleLoadedData = () => {
        logger.log('Video loadeddata event');
        if (loadingPhaseRef.current === 'connecting') {
          setLoadingPhase('buffering');
        }
      };

      // Add event listeners
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('playing', handlePlaying);
      video.addEventListener('loadeddata', handleLoadedData);

      // Cleanup function for event listeners
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('playing', handlePlaying);
        video.removeEventListener('loadeddata', handleLoadedData);
      };
    };

    if (Hls.isSupported()) {
      logger.log('HLS.js is supported, initializing...');
      initializeHls();
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      logger.log('Native HLS support detected');
      video.src = hlsUrl;
      video
        .play()
        .then(() => {
          logger.log('Video playing (native)');
          handleVideoReady();
        })
        .catch((err) => {
          logger.error('Native play failed:', err);
          setError('Playback failed');
          setLoading(false);
        });
    } else {
      setError('HLS not supported');
      toast.error('HLS streaming is not supported in this browser.');
    }

    return () => {
      logger.debug('LiveStream cleanup');

      // Clear timeouts
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
      }

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (video) {
        video.pause();
        video.src = '';
      }
    };
  }, [hlsUrl, camId, error, handleVideoReady, resetStates]);

  return (
    <div className="relative w-full h-full bg-black border-2 overflow-hidden">
      {/* Video Element */}
      <video
        ref={videoRef}
        className={cn(
          'w-full h-full object-contain transition-opacity duration-500',
          '[&::-webkit-media-controls-volume-slider]:hidden [&::-webkit-media-controls-mute-button]:hidden',
          isVideoReady ? 'opacity-100' : 'opacity-0'
        )}
        controls={isVideoReady}
        playsInline
        autoPlay
        style={{ display: 'block' }}
      />

      {/* Enhanced Loading States */}
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="text-center space-y-6 p-8">
            {/* Dynamic Loading Animation based on phase */}
            <div className="relative">
              {loadingPhase === 'connecting' && (
                <>
                  <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
                  <Wifi className="w-8 h-8 text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </>
              )}
              {loadingPhase === 'buffering' && (
                <>
                  <div className="w-20 h-20 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto" />
                  <Camera className="w-8 h-8 text-teal-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </>
              )}
              {loadingPhase === 'ready' && (
                <>
                  <div className="w-20 h-20 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto" />
                  <Camera className="w-8 h-8 text-green-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </>
              )}
            </div>

            {/* Dynamic Text Content */}
            <div className="space-y-2">
              {loadingPhase === 'connecting' && (
                <>
                  <p className="text-blue-300 font-semibold text-lg">
                    Connecting
                  </p>
                  <p className="text-slate-400 text-sm">
                    Establishing connection to camera...
                  </p>
                </>
              )}
              {loadingPhase === 'buffering' && (
                <>
                  <p className="text-teal-300 font-semibold text-lg">
                    Loading Stream
                  </p>
                  <p className="text-slate-400 text-sm">
                    Buffering video data...
                  </p>
                </>
              )}
              {loadingPhase === 'ready' && (
                <>
                  <p className="text-green-300 font-semibold text-lg">
                    Almost Ready
                  </p>
                  <p className="text-slate-400 text-sm">Finalizing stream...</p>
                </>
              )}

              {/* Progress indicator */}
              <div className="flex justify-center space-x-1 pt-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-2 h-2 rounded-full animate-pulse',
                      loadingPhase === 'connecting'
                        ? 'bg-blue-400'
                        : loadingPhase === 'buffering'
                          ? 'bg-teal-400'
                          : 'bg-green-400'
                    )}
                    style={{
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: '1.2s',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95">
          <div className="text-center space-y-4 p-8">
            <div className="w-16 h-16 border-4 border-red-500/30 rounded-full mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div className="space-y-2">
              <p className="text-red-400 font-medium text-lg">
                Stream Unavailable
              </p>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">{error}</p>
              {recoveryAttemptRef.current > 0 && (
                <p className="text-slate-500 text-xs">
                  Retry attempt: {recoveryAttemptRef.current}/
                  {maxRecoveryAttempts}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
