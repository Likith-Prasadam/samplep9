import React, { useEffect, useState, Suspense } from 'react';
import { useLazyQuery } from '@apollo/client';
import {
  Clock,
  Loader2,
  AlertCircle,
  ChevronsRight,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { GET_LIVE_CAM_VIDEOS } from '@/graphql/live_queries';
import type { Camera } from '@/features/live-stream/types/types';
import ChunkPlayer from './live-chunk-player';

interface Video {
  id: string;
  cam_hash: string;
  live_video_name: string;
  presigned_url: string | null;
  total_video_time: number;
  created_at?: string;
}

interface PaginationMeta {
  total: number;
  total_pages: number;
  page_number: number;
  items_per_page: number;
}

export const LiveVideoClips: React.FC<{ camera?: Camera | null }> = ({
  camera,
}) => {
  const camId = camera?.id;

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [videos, setVideos] = useState<Video[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    total_pages: 1,
    page_number: 1,
    items_per_page: 12,
  });

  const [loadVideos, { loading, error, data }] = useLazyQuery(
    GET_LIVE_CAM_VIDEOS,
    {
      fetchPolicy: 'network-only',
    }
  );

  useEffect(() => {
    if (!camId) return;

    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('selection_token') ||
      localStorage.getItem('token');

    if (!token) {
      //null
      return;
    }

    loadVideos({
      variables: {
        camId: Number(camId),
        pageNumber: page,
        itemsPerPage: limit,
      },
    });
  }, [camId, page, limit, loadVideos]);

  useEffect(() => {
    if (data?.live_cam_videos?.fetch_all_live_cam_video_urls) {
      const result = data.live_cam_videos.fetch_all_live_cam_video_urls;
      setVideos(result.live_cam_videos || []);

      if (result.metadata) {
        try {
          const parsed = JSON.parse(result.metadata);
          setMeta({
            total: parsed.total || 0,
            total_pages: parsed.total_pages || 1,
            page_number: parsed.page_number || 1,
            items_per_page: parsed.items_per_page || limit,
          });
        } catch {
          setMeta((prev) => ({
            ...prev,
            total: result.live_cam_videos?.length || 0,
          }));
        }
      }
    }
  }, [data, limit]);

  const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return `${minutes}.${seconds.toString().padStart(2, '0')} sec`;
  };

  const startItem = (meta.page_number - 1) * meta.items_per_page + 1;
  const endItem = Math.min(meta.page_number * meta.items_per_page, meta.total);

  return (
    <div className="flex flex-col h-full bg-background border rounded-lg">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold">
          Video Clips: {camera?.cam_name || 'Unknown Camera'}
        </h3>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading clips</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* No Camera */}
      {!camId && (
        <div className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No camera selected</AlertTitle>
            <AlertDescription>
              Please select a camera to view video clips.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading && videos.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: limit }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="aspect-video w-full rounded-lg mb-3" />
                  <Skeleton className="h-5 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-lg">No video clips found</p>
            {page > 1 && (
              <Button
                variant="outline"
                onClick={() => setPage(1)}
                className="mt-4"
              >
                Go to first page
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => (
              <Card key={video.id} className="overflow-hidden">
                <div className="aspect-video bg-muted/50">
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center bg-muted/30">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    }
                  >
                    <ChunkPlayer url={video.presigned_url} />
                  </Suspense>
                </div>

                <CardContent className="p-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h4 className="text-sm font-medium leading-snug line-clamp-2 cursor-help">
                        {video.live_video_name || `Clip #${video.id}`}
                      </h4>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{video.live_video_name || `Clip #${video.id}`}</p>
                    </TooltipContent>
                  </Tooltip>

                  <div className="mt-3 space-y-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="secondary"
                          className="text-xs px-2.5 py-0.5 cursor-help"
                        >
                          #{video.id}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Video ID: {video.id}</p>
                      </TooltipContent>
                    </Tooltip>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="font-medium">
                        {formatDuration(video.total_video_time)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {meta.total_pages > 1 && (
        <div className="border-t border-border px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Items per page
            </span>
            <Select
              value={limit.toString()}
              onValueChange={(v) => {
                setLimit(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8</SelectItem>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="16">16</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="36">36</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {startItem}–{endItem} of {meta.total.toLocaleString()}
            </span>

            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(1)}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="px-3 font-medium">
                {page} / {meta.total_pages}
              </span>

              <Button
                size="icon"
                variant="outline"
                disabled={page >= meta.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                disabled={page >= meta.total_pages}
                onClick={() => setPage(meta.total_pages)}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveVideoClips;
