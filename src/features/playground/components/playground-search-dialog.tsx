import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Loader2,
  X,
  XCircle,
  Play,
  Sparkles,
  Video,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getUserSession } from '@/lib/ssemanager';
import { formatTimeInTimezone } from '@/utils/timeUtils';
import { useTimezone } from '@/hooks/use-timezone';
import { cn } from '@/lib/utils';

interface SemanticSearchResult {
  embedding_hash: string;
  similarity_score: number;
  video_hash: string;
  process_id: number;
  modality: string;
  chunk_presigned_url: string;
  created_at: string;
}

interface SemanticSearchResponse {
  status: string;
  results: SemanticSearchResult[];
  total_count: number;
  size: number;
  offset: number;
  has_more: boolean;
  message?: string;
}

interface PlaygroundSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PlaygroundSearchDialog: React.FC<PlaygroundSearchDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { selectedTimezone } = useTimezone();
  const offsetOptions = [5, 10, 20, 30, 50];
  const apiUrl = import.meta.env.VITE_SEMANTIC_SEARCH_API_URL;
  const [searchText, setSearchText] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offsetLimit, setOffsetLimit] = useState(offsetOptions[1]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const resetState = useCallback(() => {
    setSearchText('');
    setAppliedQuery('');
    setResults([]);
    setTotalCount(0);
    setIsLoading(false);
    setError(null);
    setSelectedVideo(null);
    setIsVideoOpen(false);
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  const isSearchDisabled = useMemo(() => {
    return !searchText.trim() || isLoading;
  }, [isLoading, searchText]);

  const fetchResults = useCallback(
    async ({
      sizeOverride,
      queryOverride,
    }: {
      sizeOverride?: number;
      queryOverride?: string;
    }) => {
      if (!apiUrl) {
        setError('Semantic search API URL is not configured.');
        return;
      }

      const trimmedQuery = (queryOverride ?? appliedQuery).trim();
      if (!trimmedQuery) {
        setError('Enter a search query to continue.');
        return;
      }

      const { token } = getUserSession();
      if (!token) {
        setError('Authentication required. Please sign in again.');
        return;
      }

      const size = sizeOverride ?? offsetLimit;
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: trimmedQuery,
            size,
            offset: 0,
            inference_modality: 'batch',
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Search failed (${response.status}): ${errorText || response.statusText}`
          );
        }

        const data = (await response.json()) as SemanticSearchResponse;
        if (data.status !== 'success') {
          throw new Error(data.message || 'Search failed.');
        }

        setResults(data.results || []);
        setTotalCount(data.total_count || 0);
        setAppliedQuery(trimmedQuery);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to run semantic search.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, appliedQuery, offsetLimit]
  );

  const handleSearchClick = useCallback(() => {
    const trimmed = searchText.trim();
    setAppliedQuery(trimmed);
    // Fetch runs once via the effect below when `appliedQuery` updates (avoids double-fetch).
  }, [searchText]);

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSearchClick();
      }
    },
    [handleSearchClick]
  );

  const handleClear = useCallback(() => {
    resetState();
  }, [resetState]);

  const handleOpenVideo = useCallback((url: string) => {
    setSelectedVideo(url);
    setIsVideoOpen(true);
  }, []);

  const handleCloseVideo = useCallback(() => {
    setSelectedVideo(null);
    setIsVideoOpen(false);
  }, []);

  const handleDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isVideoOpen) {
        return;
      }
      onOpenChange(nextOpen);
    },
    [isVideoOpen, onOpenChange]
  );

  const displayTotalCount = Math.min(totalCount, offsetLimit);
  const startItem = displayTotalCount === 0 ? 0 : 1;
  const endItem = displayTotalCount;

  const showSearchIntro = !appliedQuery.trim() && !isLoading;

  const searchRow = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={
            showSearchIntro
              ? 'e.g. delivery truck, crowd near entrance, reflective vest…'
              : 'Search processed videos…'
          }
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          disabled={isLoading}
          className="h-10 pl-9 pr-9 shadow-sm"
        />
        {(searchText || appliedQuery) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            disabled={isLoading}
            className="absolute right-1 top-1/2 z-10 h-8 w-8 -translate-y-1/2 p-0"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Button
        type="button"
        className="h-10 shrink-0 sm:px-6"
        onClick={handleSearchClick}
        disabled={isSearchDisabled}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
      </Button>
    </div>
  );

  useEffect(() => {
    if (!appliedQuery.trim()) {
      return;
    }

    fetchResults({
      sizeOverride: offsetLimit,
      queryOverride: appliedQuery,
    });
  }, [appliedQuery, fetchResults, offsetLimit]);

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-[980px] gap-0 overflow-hidden p-0 sm:max-w-[min(980px,calc(100vw-2rem))]">
        <div className="flex h-[75vh] min-h-0 max-h-[85vh] flex-col">
          <DialogHeader className="space-y-1 border-b border-border/60 px-5 pb-4 pt-5 text-left sm:px-8 sm:pb-5 sm:pt-6">
            <DialogTitle className="text-lg">Semantic Search</DialogTitle>
            <p className="text-sm font-normal text-muted-foreground">
              Find moments across processed videos using meaning, not just
              keywords.
            </p>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-5 pt-4 sm:px-8 sm:pb-6">
            {showSearchIntro ? (
              <div className="mb-4 space-y-4 rounded-xl border border-border/70 bg-gradient-to-b from-muted/40 to-muted/10 p-4 shadow-sm sm:p-5">
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
                    <Sparkles className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <p className="font-medium leading-snug text-foreground">
                      Describe anything you want to find
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Type a question or phrase in plain language. Semantic
                      search matches what happens in your videos—not only exact
                      text—so you get relevant clips. Each result is a short
                      video with a timestamp from your batch-processed footage.
                    </p>
                    <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground sm:text-sm">
                      <li className="flex gap-2">
                        <Video
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/80"
                          aria-hidden
                        />
                        <span>
                          Results appear as playable thumbnails; hover to
                          preview, click to open the full clip.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <Sparkles
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/80"
                          aria-hidden
                        />
                        <span>
                          Rephrase or broaden your query if the first try is too
                          narrow.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
                {searchRow}
              </div>
            ) : (
              <div className="mb-3 space-y-2">
                {searchRow}
                {appliedQuery.trim() ? (
                  <p className="text-xs text-muted-foreground">
                    Results for{' '}
                    <span className="font-medium text-foreground">
                      &ldquo;{appliedQuery.trim()}&rdquo;
                    </span>
                  </p>
                ) : null}
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mb-3 shrink-0">
                <AlertDescription className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  <span>{error}</span>
                </AlertDescription>
              </Alert>
            )}

            <Separator className="mb-3 shrink-0" />

            <div className="min-h-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-1 sm:pr-2">
                {isLoading && results.length === 0 ? (
                  <div className="flex items-center justify-center px-2 py-14 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching batch embeddings…
                  </div>
                ) : results.length === 0 &&
                  appliedQuery.trim() &&
                  !isLoading ? (
                  <div className="mx-auto max-w-md px-4 py-14 text-center">
                    <p className="font-medium text-foreground">
                      No clips matched that search
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Try different wording or a broader description. Semantic
                      search understands concepts, so synonyms and rephrases
                      often surface new results.
                    </p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="mx-auto max-w-sm px-4 py-12 text-center text-sm text-muted-foreground">
                    <p className="text-muted-foreground/90">
                      Matching video clips will appear here after you search.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                    {results.map((item, index) => {
                      const url = item.chunk_presigned_url;
                      return (
                        <div
                          key={`${item.embedding_hash}-${index}`}
                          className="w-full max-w-[220px] overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all duration-200 hover:border-border/80 hover:shadow-md"
                        >
                          <div
                            className={cn(
                              'group relative aspect-video bg-muted outline-none ring-offset-background transition-shadow',
                              url &&
                                'cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                            )}
                            role={url ? 'button' : undefined}
                            tabIndex={url ? 0 : undefined}
                            aria-label={url ? 'Open video preview' : undefined}
                            onClick={() => url && handleOpenVideo(url)}
                            onKeyDown={(e) => {
                              if (url && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault();
                                handleOpenVideo(url);
                              }
                            }}
                          >
                            {url ? (
                              <video
                                className="h-full w-full object-cover"
                                src={url}
                                muted
                                playsInline
                                preload="metadata"
                                onMouseEnter={(event) => {
                                  const video = event.currentTarget;
                                  video.dataset.hover = 'true';
                                  video.currentTime = 0;
                                  const playPromise = video.play();
                                  if (
                                    playPromise &&
                                    typeof playPromise.catch === 'function'
                                  ) {
                                    playPromise.catch(() => {});
                                  }
                                }}
                                onMouseLeave={(event) => {
                                  const video = event.currentTarget;
                                  video.dataset.hover = 'false';
                                  video.pause();
                                }}
                                onPlay={(event) => {
                                  const video = event.currentTarget;
                                  if (video.dataset.hover !== 'true') {
                                    video.pause();
                                  }
                                }}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] text-muted-foreground">
                                No preview available
                              </div>
                            )}
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                            <div className="pointer-events-none absolute left-2 top-2">
                              <div className="inline-flex items-center gap-1.5 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-[2px]">
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                                Batch
                              </div>
                            </div>
                            {url ? (
                              <span
                                className="pointer-events-none absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white shadow-md ring-1 ring-white/20 backdrop-blur-sm transition-transform duration-200 group-hover:scale-105 group-hover:bg-black/65"
                                aria-hidden
                              >
                                <Play className="h-3.5 w-3.5 translate-x-px fill-current" />
                              </span>
                            ) : null}
                          </div>
                          <div className="border-t border-border/40 px-2.5 py-1.5">
                            <p className="text-[11px] leading-snug text-muted-foreground">
                              {formatTimeInTimezone(
                                item.created_at,
                                selectedTimezone.iana,
                                'datetime'
                              )}{' '}
                              <span className="font-medium text-foreground/80">
                                {selectedTimezone.value}
                              </span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {totalCount > 0 && (
              <div className="mt-auto shrink-0 border-t border-border bg-background/95 px-1 pb-2 pt-3 backdrop-blur-sm sm:px-0">
                <div className="flex flex-wrap items-center justify-between gap-3 py-1">
                  <div className="flex items-center gap-2">
                    <Select
                      value={`${offsetLimit}`}
                      onValueChange={(value) => setOffsetLimit(Number(value))}
                    >
                      <SelectTrigger className="h-8 w-[90px]">
                        <SelectValue placeholder={offsetLimit} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {offsetOptions.map((option) => (
                          <SelectItem key={option} value={`${option}`}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="whitespace-nowrap text-sm font-medium leading-none">
                      Rows Per Page
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{startItem}</span> to{' '}
                    <span className="font-medium">{endItem}</span> of{' '}
                    <span className="font-medium">{displayTotalCount}</span>{' '}
                    results
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      <Dialog
        open={isVideoOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleCloseVideo();
          }
        }}
      >
        <DialogContent className="max-w-4xl p-0" showCloseButton={false}>
          <div className="flex justify-end border-b border-muted p-4">
            <button
              onClick={handleCloseVideo}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="aspect-video bg-black">
            {selectedVideo && (
              <video
                src={selectedVideo}
                controls
                autoPlay
                className="h-full w-full object-contain"
                onLoadStart={(event) => (event.currentTarget.volume = 0.5)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default PlaygroundSearchDialog;
