import React, {
  useState,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useEffect,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import VideoCard from './playground-video-card';
import type { BatchVideo } from './../types/batch-analysis';

interface VideoGridRef {
  prev: () => void;
  next: () => void;
}

interface VideoGridProps {
  videos: BatchVideo[];
  searchQuery: string;
  viewMode: 'grid' | 'list';
  usernames: Record<string, string>;
  onProcessBatch: (video: BatchVideo) => void;
  onOpenDrawer: (video: BatchVideo) => void;
  onDeleteSuccess: (videoId: number) => void;
  isLoading: boolean;
  totalItems: number;
  itemsPerPage: number;
  showDates?: boolean;
  externalArrows?: boolean;
}

const VideoGrid = forwardRef<VideoGridRef, VideoGridProps>(
  (
    {
      videos,
      searchQuery,
      viewMode,
      usernames,
      onOpenDrawer,
      onDeleteSuccess,
      isLoading,
      showDates = true,
      externalArrows = false,
      onProcessBatch,
    },
    ref
  ) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (videos.length > 0) {
        const firstVideo = videos[0];
        console.log('[VideoGrid] Username mapping for first video:', {
          videoId: firstVideo.id,
          userId: firstVideo.user_id,
          usernamesObject: usernames,
          mappedUsername: firstVideo.user_id
            ? usernames[firstVideo.user_id]
            : undefined,
          fallbackResult:
            (firstVideo.user_id && usernames[firstVideo.user_id]) || 'Unknown',
        });
      }
    }, [videos, usernames]);

    const filteredVideos = useMemo(() => {
      if (!searchQuery.trim()) return videos;

      const query = searchQuery.toLowerCase().trim();
      const filtered = videos.filter((video) =>
        video.batchName?.toLowerCase().includes(query)
      );

      // Enhanced sorting to prioritize exact matches at the top
      return filtered.sort((a, b) => {
        const aName = a.batchName?.toLowerCase() || '';
        const bName = b.batchName?.toLowerCase() || '';

        // 1. Exact match gets highest priority (case-insensitive)
        const aExact = aName === query;
        const bExact = bName === query;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // 2. Starts with query gets second priority
        const aStartsWith = aName.startsWith(query);
        const bStartsWith = bName.startsWith(query);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        // 3. Contains query as whole word gets third priority
        const aWordMatch = new RegExp(`\\b${query}\\b`).test(aName);
        const bWordMatch = new RegExp(`\\b${query}\\b`).test(bName);
        if (aWordMatch && !bWordMatch) return -1;
        if (!aWordMatch && bWordMatch) return 1;

        // 4. Earlier occurrence in string gets fourth priority
        const aIndex = aName.indexOf(query);
        const bIndex = bName.indexOf(query);
        if (aIndex !== bIndex) return aIndex - bIndex;

        // 5. Shorter name (more relevant) gets fifth priority
        if (aName.length !== bName.length) return aName.length - bName.length;

        // 6. Otherwise maintain original order (by creation date, etc.)
        return 0;
      });
    }, [videos, searchQuery]);

    const visibleVideosPerView = viewMode === 'grid' ? 4 : 2;
    const maxIndex = Math.max(
      0,
      filteredVideos.length > visibleVideosPerView
        ? filteredVideos.length - visibleVideosPerView
        : 0
    );

    const scrollToIndex = useCallback(
      (index: number) => {
        setCurrentIndex(() => Math.max(0, Math.min(index, maxIndex)));
      },
      [maxIndex]
    );

    const handleLeftClick = useCallback(() => {
      scrollToIndex(currentIndex - 1);
    }, [currentIndex, scrollToIndex]);

    const handleRightClick = useCallback(() => {
      scrollToIndex(currentIndex + 1);
    }, [currentIndex, scrollToIndex]);

    useImperativeHandle(
      ref,
      () => ({
        prev: handleLeftClick,
        next: handleRightClick,
      }),
      [handleLeftClick, handleRightClick]
    );

    React.useEffect(() => {
      setCurrentIndex(0);
    }, [searchQuery]);

    // Only show full-page skeleton when loading and we have no videos (initial load).
    // When we have cached videos and refetch (e.g. after navigating back), keep showing them.
    if (isLoading && videos.length === 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: visibleVideosPerView }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-muted rounded-lg"></div>
              <div className="pt-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (filteredVideos.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No videos found.
        </div>
      );
    }

    return (
      <div className="relative">
        {/* Carousel Container */}
        <div className="relative overflow-hidden">
          <div
            ref={scrollContainerRef}
            className={`flex transition-transform duration-400 ease-in-out ${
              viewMode === 'grid' ? 'gap-6' : 'gap-4 flex-col lg:flex-row'
            }`}
            style={{
              transform: `translateX(-${currentIndex * (100 / visibleVideosPerView)}%)`,
            }}
          >
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className={`flex-shrink-0 ${
                  viewMode === 'grid'
                    ? 'w-full md:w-1/2 lg:w-1/2 xl:w-1/5'
                    : 'w-full lg:w-1/2'
                }`}
              >
                <VideoCard
                  video={video}
                  onOpenDrawer={onOpenDrawer}
                  onProcessBatch={onProcessBatch}
                  username={
                    (video.user_id && usernames[video.user_id]) || 'Unknown'
                  }
                  showDate={showDates}
                  onDeleteSuccess={onDeleteSuccess}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows - only if not external */}
        {!externalArrows && maxIndex > 0 && (
          <>
            <button
              onClick={handleLeftClick}
              disabled={currentIndex === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background/95 text-foreground p-2 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleRightClick}
              disabled={currentIndex === maxIndex}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background/95 text-foreground p-2 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {maxIndex > 0 && (
          <div className="flex justify-center space-x-2 mt-4">
            {Array.from({
              length: filteredVideos.length - visibleVideosPerView + 1,
            }).map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-foreground' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

VideoGrid.displayName = 'VideoGrid';

export default VideoGrid;
