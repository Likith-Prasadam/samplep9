// src/components/live-stream-cam/video-player/chunk-player.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader2, AlertCircle, Play, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ChunkPlayerProps {
  url: string | null;
  autoPlay?: boolean;
  poster?: string;
}

const ChunkPlayer: React.FC<ChunkPlayerProps> = ({
  url,
  autoPlay = false,
  poster,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canPlay, setCanPlay] = useState(false);

  useEffect(() => {
    if (!url || !videoRef.current) return;

    const video = videoRef.current;
    setLoading(true);
    setError(null);
    setCanPlay(false);

    const isHls = url.toLowerCase().endsWith('.m3u8');

    const cleanup = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = '';
      video.removeAttribute('src');
    };

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 10,
        maxMaxBufferLength: 15,
        startLevel: -1, // auto quality
        capLevelToPlayerSize: true,
      });
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setCanPlay(true);
        setLoading(false);
        if (autoPlay) video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError(`Failed to load chunk: ${data.details}`);
          setLoading(false);
        }
      });

      video.addEventListener('canplay', () => setCanPlay(true), { once: true });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') && isHls) {
      video.src = url;
      video.addEventListener(
        'canplay',
        () => {
          setCanPlay(true);
          setLoading(false);
          if (autoPlay) video.play().catch(() => {});
        },
        { once: true }
      );
    } else if (!isHls) {
      video.src = url;
      video.load();
      video.addEventListener(
        'canplay',
        () => {
          setCanPlay(true);
          setLoading(false);
          if (autoPlay) video.play().catch(() => {});
        },
        { once: true }
      );
    } else {
      setError('HLS not supported');
      setLoading(false);
    }

    return cleanup;
  }, [url, autoPlay]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    if (videoRef.current && url) {
      videoRef.current.src = url;
      videoRef.current.load();
    }
  };

  if (!url) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/30 text-muted-foreground">
        No video
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="h-full w-full object-contain [&::-webkit-media-controls-volume-slider]:hidden [&::-webkit-media-controls-mute-button]:hidden"
        controls
        poster={poster}
        playsInline
        preload="metadata"
      />

      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}

      {/* Play Button Overlay (for VOD) */}
      {!loading && !canPlay && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Button
            size="lg"
            className="rounded-full p-6"
            onClick={() => videoRef.current?.play()}
          >
            <Play className="h-8 w-8" />
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4">
          <Alert variant="destructive" className="max-w-sm">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Playback failed</AlertTitle>
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
          <Button variant="secondary" onClick={handleRetry} className="mt-3">
            <RotateCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChunkPlayer;
