import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Loader2,
  XCircle,
  X,
  Play,
  Sparkles,
  Video,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
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

interface LiveSearchPanelProps {
  camHash?: string;
}

const LiveSearchPanel: React.FC<LiveSearchPanelProps> = ({ camHash }) => {
  const { selectedTimezone } = useTimezone();
  const [searchText, setSearchText] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const apiUrl = import.meta.env.VITE_SEMANTIC_SEARCH_API_URL;

  useEffect(() => {
    setResults([]);
    setTotalCount(0);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setError(null);
    setAppliedQuery('');
    setSearchText('');
  }, [camHash]);

  const isSearchDisabled = useMemo(() => {
    return !searchText.trim() || !camHash || isLoading;
  }, [searchText, camHash, isLoading]);

  const fetchResults = useCallback(
    async ({ queryOverride }: { queryOverride?: string }) => {
      if (!apiUrl) {
        setError('Semantic search API URL is not configured.');
        return;
      }

      if (!camHash) {
        setError('Select a live camera to enable semantic search.');
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
            // The API's total_count/has_more can be inconsistent for live search,
            // so we fetch a larger window and paginate on the client.
            size: 50,
            offset: 0,
            inference_modality: 'live',
            live_hash: camHash,
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

        const fetchedResults = data.results || [];
        setResults(fetchedResults);
        setTotalCount(Math.max(data.total_count || 0, fetchedResults.length));
        setAppliedQuery(trimmedQuery);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to run semantic search.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, camHash, appliedQuery]
  );

  const handleSearchClick = useCallback(async () => {
    const trimmed = searchText.trim();
    setAppliedQuery(trimmed);
    setPagination((prev) => ({ ...prev, pageIndex: 0, pageSize: 10 }));
    await fetchResults({
      queryOverride: trimmed,
    });
  }, [fetchResults, searchText]);

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
    setSearchText('');
    setAppliedQuery('');
    setResults([]);
    setTotalCount(0);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setError(null);
  }, []);

  const handleOpenVideo = useCallback((url: string) => {
    setSelectedVideo(url);
    setIsVideoOpen(true);
  }, []);

  const handleCloseVideo = useCallback(() => {
    setSelectedVideo(null);
    setIsVideoOpen(false);
  }, []);

  const startItem =
    totalCount === 0 || results.length === 0
      ? 0
      : pagination.pageIndex * pagination.pageSize + 1;
  const endItem = Math.min(startItem + pagination.pageSize - 1, totalCount);
  const totalPages = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
  const isFirstPage = pagination.pageIndex === 0;
  const isLastPage = pagination.pageIndex >= totalPages - 1;
  const pagedResults = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    return results.slice(start, start + pagination.pageSize);
  }, [pagination.pageIndex, pagination.pageSize, results]);

  const handlePageSizeChange = useCallback((value: string) => {
    const nextSize = Number(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0, pageSize: nextSize }));
  }, []);

  const handlePageChange = useCallback(
    (nextPageIndex: number) => {
      if (!appliedQuery.trim() || isLoading) {
        return;
      }

      const boundedPageIndex = Math.min(
        Math.max(nextPageIndex, 0),
        Math.max(totalPages - 1, 0)
      );

      if (boundedPageIndex === pagination.pageIndex) {
        return;
      }

      setPagination((prev) => ({ ...prev, pageIndex: boundedPageIndex }));
    },
    [appliedQuery, isLoading, pagination.pageIndex, totalPages]
  );

  const showSearchIntro = !appliedQuery.trim() && !isLoading;

  const searchRow = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={
            showSearchIntro
              ? 'e.g. white van, person with backpack, nighttime activity…'
              : 'Search live video…'
          }
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          disabled={!camHash || isLoading}
          className="h-10 pl-9 pr-9 text-sm shadow-sm"
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
        size="sm"
        className="h-10 shrink-0 sm:px-6"
        onClick={handleSearchClick}
        disabled={isSearchDisabled}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
      </Button>
    </div>
  );

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="gap-4 pb-2">
        <CardTitle className="text-lg">Semantic Search</CardTitle>

        {showSearchIntro ? (
          <div className="space-y-4 rounded-xl border border-border/70 bg-gradient-to-b from-muted/40 to-muted/10 p-4 shadow-sm sm:p-5">
            <div className="flex gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 space-y-2">
                <p className="font-medium leading-snug text-foreground">
                  Search live video with natural language
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Describe anything you want to see—objects, people, actions,
                  lighting, or scenes. Results are ranked by meaning (semantic
                  search), not just exact words. Matching moments appear as
                  short video clips with timestamps from this camera&apos;s
                  stream.
                </p>
                <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground sm:text-sm">
                  <li className="flex gap-2">
                    <Video
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/80"
                      aria-hidden
                    />
                    <span>
                      Each card is a clip aligned to what you searched for—hover
                      to preview, click to open the full chunk.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Sparkles
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/80"
                      aria-hidden
                    />
                    <span>
                      Try informal phrases; you don&apos;t need perfect
                      keywords.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            {searchRow}
            {!camHash && (
              <p className="text-xs text-amber-600 dark:text-amber-500">
                Select a live camera to run semantic search.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
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
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden px-4 py-0 sm:px-5 md:px-6">
        {error && (
          <Alert variant="destructive" className="mt-1">
            <AlertDescription className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              <span>{error}</span>
            </AlertDescription>
          </Alert>
        )}

        <Separator className="my-3" />

        <div className="flex-1 overflow-hidden min-h-0">
          <ScrollArea className="h-full pr-1 sm:pr-2">
            {isLoading && results.length === 0 ? (
              <div className="flex items-center justify-center px-2 py-14 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching live embeddings…
              </div>
            ) : results.length === 0 && appliedQuery.trim() && !isLoading ? (
              <div className="mx-auto max-w-md px-4 py-14 text-center">
                <p className="font-medium text-foreground">
                  No clips matched that search
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Try a different phrase or something more general. Semantic
                  search understands meaning, so synonyms and rephrasing often
                  help.
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="mx-auto max-w-sm px-4 py-12 text-center text-sm text-muted-foreground">
                <p className="text-muted-foreground/90">
                  Clip results from semantic search will show in this area.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {pagedResults.map((item, index) => {
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
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Live
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
          <div className="mt-auto shrink-0 border-t border-border bg-background px-4 pb-2 pt-2 sm:px-5 md:px-6 md:pb-3 md:pt-3">
            {isLoading ? (
              <div className="flex items-center justify-between px-1 py-2">
                <Skeleton className="h-4 w-32" />
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-8 rounded-md" />
                  ))}
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <div className="flex flex-col gap-2 px-1 pb-1 pt-1 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Rows Per Page:
                  </span>
                  <Select
                    value={String(pagination.pageSize)}
                    onValueChange={handlePageSizeChange}
                  >
                    <SelectTrigger size="sm" className="w-[84px]">
                      <SelectValue aria-label="Chunks per page" />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 20, 30, 40, 50].map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">{startItem}</span> to{' '}
                  <span className="font-medium">{endItem}</span> of{' '}
                  <span className="font-medium">{totalCount}</span> results
                </p>
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={isLoading || isFirstPage}
                    onClick={() => handlePageChange(0)}
                    aria-label="Go to first page"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={isLoading || isFirstPage}
                    onClick={() => handlePageChange(pagination.pageIndex - 1)}
                    aria-label="Go to previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-2 text-sm text-muted-foreground">
                    Page {pagination.pageIndex + 1} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={isLoading || isLastPage}
                    onClick={() => handlePageChange(pagination.pageIndex + 1)}
                    aria-label="Go to next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={isLoading || isLastPage}
                    onClick={() => handlePageChange(totalPages - 1)}
                    aria-label="Go to last page"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      {isVideoOpen && selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-xl border border-input bg-background">
            <div className="flex justify-end border-b border-muted p-4">
              <button
                onClick={handleCloseVideo}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              <video
                src={selectedVideo}
                controls
                autoPlay
                className="h-full w-full object-contain"
                onLoadStart={(event) => (event.currentTarget.volume = 0.5)}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default LiveSearchPanel;
