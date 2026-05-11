import { useRef } from 'react';
import { Play } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { ConnectedIntelligenceClip } from '../types';

interface ConnectedIntelligenceClipCardProps {
  clip: ConnectedIntelligenceClip;
}

export function ConnectedIntelligenceClipCard({
  clip,
}: ConnectedIntelligenceClipCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const playPreview = () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      video.currentTime = 0;
      void video.play().catch(() => {});
    } catch {
      // Ignore autoplay restrictions.
    }
  };

  const pausePreview = () => {
    videoRef.current?.pause();
  };

  const togglePreview = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      playPreview();
      return;
    }

    video.pause();
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div
        className={cn(
          'group relative h-28 cursor-pointer overflow-hidden',
          clip.imgClass
        )}
        role="button"
        tabIndex={0}
        onClick={togglePreview}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            togglePreview();
          }
        }}
      >
        {clip.videoUrl ? (
          <video
            ref={videoRef}
            src={clip.videoUrl}
            poster={clip.imageUrl}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            onMouseEnter={playPreview}
            onMouseLeave={pausePreview}
            onEnded={pausePreview}
          />
        ) : clip.imageUrl ? (
          <img
            src={clip.imageUrl}
            alt={clip.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute left-2 top-2 rounded-md bg-black/50 px-2 py-0.5 text-[11px] text-white">
          Hover or click to play
        </div>
        <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] text-white">
          {clip.duration || '—'}
        </div>
        <div className="absolute inset-0 grid place-items-center">
          <div className="rounded-full bg-black/45 p-2 text-white opacity-90 transition-opacity duration-200 group-hover:opacity-100">
            <Play className="h-4 w-4" />
          </div>
        </div>
      </div>
      <div className="p-3">
        <div className="text-xs font-semibold">{clip.title}</div>
        <div className="text-[11px] text-muted-foreground">{clip.subtitle}</div>
      </div>
    </div>
  );
}
