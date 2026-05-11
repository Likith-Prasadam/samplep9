import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  RefreshCw,
  Camera,
  Clock,
  Radio,
  Loader2,
  Play,
  X,
} from 'lucide-react';
import {
  fetchTimelineWindow,
  type WindowEvent,
} from '@/services/timeline-window-api';
import {
  fetchTimelineDensity,
  type Granularity,
  type DensityBucket,
} from '@/services/timeline-density-api';
import {
  fetchTimelineRange,
  type RangeBucket,
} from '@/services/timeline-range-api';
import { formatTimeInTimezone } from '@/utils/timeUtils';

const TOTAL_SECONDS = 86400;
const GRANULARITY: Granularity = '1hour';
const INTERVAL_SECONDS = 3600;
const TOTAL_CANDLES = 24;
const CANDLE_WIDTH_PX = 68;
const RULER_EVERY = 3600;
const MINOR_EVERY = 1800;
const MIN_GAP_SECONDS = 3600;

interface Candle {
  index: number;
  tStart: number;
  tEnd: number;
  height: number;
  color: string;
  eventCount: number;
}

interface VideoTimelineProps {
  camHash?: string;
}

function fmtTime(s: number): string {
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  return `${h}:00`;
}

function fmtDuration(s: number): string {
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m > 0 ? m + 'm' : ''}`;
  if (m > 0) return `${m}m`;
  return '<1m';
}

const getTotalWidth = () => TOTAL_CANDLES * CANDLE_WIDTH_PX;

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function VideoTimeline({ camHash }: VideoTimelineProps = {}) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [selL, setSelL] = useState<number | null>(null);
  const [selR, setSelR] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hoverMarker, setHoverMarker] = useState<'left' | 'right' | null>(null);

  const [fromDate] = useState<string>(todayStr);
  const [fromTime] = useState<string>('00:00');
  const [toDate] = useState<string>(todayStr);
  const [toTime] = useState<string>('23:59');

  const containerRef = useRef<HTMLDivElement>(null);

  const dragModeRef = useRef<'new' | 'left' | 'right' | null>(null);
  const anchorRef = useRef<number>(0);
  const selLRef = useRef<number | null>(null);
  const selRRef = useRef<number | null>(null);

  useEffect(() => {
    selLRef.current = selL;
  }, [selL]);
  useEffect(() => {
    selRRef.current = selR;
  }, [selR]);

  const totalWidth = getTotalWidth();

  // ── Derive UTC strings from date + time pickers ──
  const fromUtc = useMemo(
    () => `${fromDate}T${fromTime}:00+00:00`,
    [fromDate, fromTime]
  );
  const toUtc = useMemo(() => `${toDate}T${toTime}:59+00:00`, [toDate, toTime]);

  // ── Density API state ──
  const [densityBuckets, setDensityBuckets] = useState<DensityBucket[]>([]);
  const [densityLoading, setDensityLoading] = useState(false);
  const [densityError, setDensityError] = useState<string | null>(null);

  // ── Window API state (for live events)──
  const [windowEvents, setWindowEvents] = useState<WindowEvent[]>([]);
  const [, setWindowLoading] = useState(false);

  // ── Range API state (for live feed) ──
  const [rangeBuckets, setRangeBuckets] = useState<RangeBucket[]>([]);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangeError, setRangeError] = useState<string | null>(null);

  // ── Fetch Density API data ──
  useEffect(() => {
    if (!camHash) {
      setDensityBuckets([]);
      setDensityError(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setDensityLoading(true);
      setDensityError(null);
      try {
        const result = await fetchTimelineDensity({
          cam_hash: camHash,
          from_utc: fromUtc,
          to_utc: toUtc,
          granularity: GRANULARITY,
        });
        if (!cancelled) {
          setDensityBuckets(result.buckets);
        }
      } catch (error) {
        if (!cancelled) {
          setDensityError(
            error instanceof Error
              ? error.message
              : 'Failed to fetch timeline density'
          );
          setDensityBuckets([]);
        }
      } finally {
        if (!cancelled) setDensityLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [camHash, fromUtc, toUtc]);

  // ── Fetch Window API data for live events ──
  useEffect(() => {
    if (!camHash) {
      setWindowEvents([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setWindowLoading(true);
      try {
        const allEvents: WindowEvent[] = [];
        let cursor: string | null = null;
        let hasMore = true;
        while (hasMore) {
          if (cancelled) return;
          const result = await fetchTimelineWindow({
            cam_hash: camHash,
            from_utc: fromUtc,
            to_utc: toUtc,
            cursor: cursor ?? undefined,
          });
          allEvents.push(...result.events);
          hasMore = result.has_more;
          cursor = result.next_cursor;
        }
        if (!cancelled) setWindowEvents(allEvents);
      } catch {
        // keep stale data on error
      } finally {
        if (!cancelled) setWindowLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [camHash, fromUtc, toUtc]);

  // ── Fetch Range API data for live feed ──
  useEffect(() => {
    if (!camHash) {
      setRangeBuckets([]);
      setRangeError(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setRangeLoading(true);
      setRangeError(null);
      try {
        const result = await fetchTimelineRange({
          cam_hash: camHash,
          from_utc: fromUtc,
          to_utc: toUtc,
          granularity: GRANULARITY,
        });
        if (!cancelled) setRangeBuckets(result.buckets);
      } catch (error) {
        if (!cancelled) {
          setRangeError(
            error instanceof Error
              ? error.message
              : 'Failed to fetch timeline range'
          );
          setRangeBuckets([]);
        }
      } finally {
        if (!cancelled) setRangeLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [camHash, fromUtc, toUtc]);
  const candles = useMemo<Candle[]>(() => {
    if (densityBuckets.length === 0) {
      return Array.from({ length: TOTAL_CANDLES }, (_, i) => ({
        index: i,
        tStart: i * INTERVAL_SECONDS,
        tEnd: (i + 1) * INTERVAL_SECONDS,
        height: 0.04,
        color: 'hsl(var(--muted))',
        eventCount: 0,
      }));
    }

    const maxCount = Math.max(1, ...densityBuckets.map((b) => b.event_count));

    return densityBuckets.map((bucket, i) => {
      const count = bucket.event_count;
      const h = count / maxCount;

      // Use a more visible color scheme: gradient from primary to accent
      let barColor = 'hsl(var(--muted))';
      if (count > 0) {
        if (h > 0.7) {
          // High activity - bright primary color
          barColor = 'hsl(var(--primary))';
        } else if (h > 0.4) {
          // Medium activity - semi-transparent primary
          barColor = `hsl(var(--primary) / 0.7)`;
        } else {
          // Low activity - more transparent
          barColor = `hsl(var(--primary) / 0.5)`;
        }
      }

      return {
        index: i,
        tStart: i * INTERVAL_SECONDS,
        tEnd: (i + 1) * INTERVAL_SECONDS,
        height: Math.max(0.08, h * 0.95 + 0.05),
        color: barColor,
        eventCount: count,
      };
    });
  }, [densityBuckets]);

  const getRelX = useCallback((e: MouseEvent | React.MouseEvent): number => {
    const el = containerRef.current;
    if (!el) return 0;
    return e.clientX - el.getBoundingClientRect().left + el.scrollLeft;
  }, []);

  const px2time = useCallback((px: number): number => {
    const tw = getTotalWidth();
    return Math.max(0, Math.min(TOTAL_SECONDS, (px / tw) * TOTAL_SECONDS));
  }, []);

  const MARKER_HIT = 14;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const x = getRelX(e);
      const tw = getTotalWidth();
      const L = selLRef.current;
      const R = selRRef.current;
      const lPx = L !== null ? (L / TOTAL_SECONDS) * tw : null;
      const rPx = R !== null ? (R / TOTAL_SECONDS) * tw : null;

      if (lPx !== null && Math.abs(x - lPx) <= MARKER_HIT) {
        dragModeRef.current = 'left';
      } else if (rPx !== null && Math.abs(x - rPx) <= MARKER_HIT) {
        dragModeRef.current = 'right';
      } else {
        const t = px2time(x);
        dragModeRef.current = 'new';
        anchorRef.current = t;
        setSelL(t);
        selLRef.current = t;
        setSelR(t);
        selRRef.current = t;
      }
      setDragging(true);
    },
    [getRelX, px2time]
  );

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: MouseEvent) => {
      const x = getRelX(e);
      const t = px2time(x);
      const mode = dragModeRef.current;

      if (mode === 'new') {
        const anchor = anchorRef.current;
        let L = Math.min(anchor, t);
        let R = Math.max(anchor, t);
        if (R - L < MIN_GAP_SECONDS) {
          if (t >= anchor) R = anchor + MIN_GAP_SECONDS;
          else L = anchor - MIN_GAP_SECONDS;
        }
        L = Math.max(0, L);
        R = Math.min(TOTAL_SECONDS, R);
        setSelL(L);
        selLRef.current = L;
        setSelR(R);
        selRRef.current = R;
      } else if (mode === 'left') {
        const R = selRRef.current!;
        const newL = Math.max(0, Math.min(t, R - MIN_GAP_SECONDS));
        setSelL(newL);
        selLRef.current = newL;
      } else if (mode === 'right') {
        const L = selLRef.current!;
        const newR = Math.min(TOTAL_SECONDS, Math.max(t, L + MIN_GAP_SECONDS));
        setSelR(newR);
        selRRef.current = newR;
      }
    };

    const onUp = () => {
      setDragging(false);
      dragModeRef.current = null;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, getRelX, px2time]);

  const resetSel = () => {
    setSelL(null);
    selLRef.current = null;
    setSelR(null);
    selRRef.current = null;
  };

  const hasSel = selL !== null && selR !== null;
  const selMin = hasSel ? selL! : 0;
  const selMax = hasSel ? selR! : 0;
  const selMinPx = (selMin / TOTAL_SECONDS) * totalWidth;
  const selMaxPx = (selMax / TOTAL_SECONDS) * totalWidth;
  const selDur = selMax - selMin;

  const thumbEvents = useMemo<WindowEvent[]>(() => {
    if (!hasSel || windowEvents.length === 0) return [];
    const fromMidnight = new Date(`${fromDate}T00:00:00Z`);
    return windowEvents.filter((ev) => {
      const secs =
        (new Date(ev.detected_at).getTime() - fromMidnight.getTime()) / 1000;
      return secs >= selMin && secs <= selMax;
    });
  }, [windowEvents, hasSel, selMin, selMax, fromDate]);

  const rulerMajor = useMemo(() => {
    const a: number[] = [];
    for (let t = 0; t <= TOTAL_SECONDS; t += RULER_EVERY) a.push(t);
    return a;
  }, []);

  const rulerMinor = useMemo(() => {
    const a: number[] = [];
    for (let t = 0; t <= TOTAL_SECONDS; t += MINOR_EVERY) a.push(t);
    return a;
  }, []);

  const cursor = dragging
    ? 'grabbing'
    : hoverMarker
      ? 'ew-resize'
      : 'crosshair';

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Surveillance Timeline
          </span>
          {hasSel && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-foreground font-medium">
                  {fmtTime(selMin)}
                </span>
                <span>→</span>
                <span className="text-foreground font-medium">
                  {fmtTime(selMax)}
                </span>
                <span className="text-muted-foreground">
                  ({fmtDuration(selDur)})
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {densityLoading && (
            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
          )}
          {densityError && (
            <span className="text-xs text-destructive">{densityError}</span>
          )}
          <button
            onClick={resetSel}
            title="Clear selection"
            className="p-1.5 rounded hover:bg-accent transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-3 p-4 overflow-auto">
        <div
          ref={containerRef}
          className="rounded-lg border border-border bg-card overflow-x-auto select-none shrink-0"
          style={{ cursor }}
          onMouseDown={handleMouseDown}
          onMouseMove={(e) => {
            if (dragging) return;
            const x = getRelX(e);
            const tw = getTotalWidth();
            const lPx =
              selLRef.current !== null
                ? (selLRef.current / TOTAL_SECONDS) * tw
                : null;
            const rPx =
              selRRef.current !== null
                ? (selRRef.current / TOTAL_SECONDS) * tw
                : null;
            if (lPx !== null && Math.abs(x - lPx) <= MARKER_HIT)
              setHoverMarker('left');
            else if (rPx !== null && Math.abs(x - rPx) <= MARKER_HIT)
              setHoverMarker('right');
            else setHoverMarker(null);
          }}
          onMouseLeave={() => setHoverMarker(null)}
        >
          <div
            className="relative"
            style={{ width: `${totalWidth}px`, height: '160px' }}
          >
            <div className="absolute inset-x-0 top-0 bottom-8 flex items-end bg-muted/10">
              {candles.map((c) => {
                const inSel = !hasSel || (c.tStart < selMax && c.tEnd > selMin);
                const gapPx = Math.max(2, Math.floor(CANDLE_WIDTH_PX * 0.08));
                return (
                  <div
                    key={c.index}
                    title={
                      c.eventCount > 0
                        ? `${c.eventCount} event${c.eventCount !== 1 ? 's' : ''}`
                        : undefined
                    }
                    style={{
                      width: `${CANDLE_WIDTH_PX}px`,
                      flexShrink: 0,
                      height: '100%',
                      display: 'flex',
                      alignItems: 'flex-end',
                      paddingLeft: `${gapPx}px`,
                      paddingRight: `${gapPx}px`,
                      paddingBottom: '2px',
                      position: 'relative',
                    }}
                  >
                    <div
                      className="transition-all duration-150"
                      style={{
                        width: '100%',
                        height: `${Math.round(c.height * 100)}%`,
                        backgroundColor: c.color,
                        opacity: inSel ? 1 : 0.2,
                        borderRadius: '4px 4px 0 0',
                        boxShadow:
                          c.eventCount > 0 && inSel
                            ? '0 2px 6px rgba(0,0,0,0.12)'
                            : 'none',
                      }}
                    />
                    {c.eventCount > 0 && inSel && (
                      <div
                        className="absolute bg-foreground text-background font-bold rounded-full flex items-center justify-center"
                        style={{
                          bottom: `calc(${Math.round(c.height * 100)}% + 4px)`,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '9px',
                          lineHeight: '1',
                          pointerEvents: 'none',
                          whiteSpace: 'nowrap',
                          minWidth: '18px',
                          height: '18px',
                          padding: '0 5px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                        }}
                      >
                        {c.eventCount}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {hasSel && (
              <div
                className="absolute top-0 bottom-8 pointer-events-none bg-primary/10 border-l-2 border-r-2 border-primary/30"
                style={{
                  left: `${selMinPx}px`,
                  width: `${Math.max(0, selMaxPx - selMinPx)}px`,
                }}
              />
            )}

            {hasSel && (
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none"
                style={{ left: `${selMinPx}px` }}
              >
                <div
                  className="absolute inset-y-0 left-0 w-1 bg-primary shadow-md"
                  style={{ boxShadow: '0 0 8px hsl(var(--primary))' }}
                />
                <div className="absolute top-0 left-0 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-2.5 py-1 rounded-md whitespace-nowrap font-bold shadow-md">
                  {fmtTime(selMin)}
                </div>
                <div
                  className="absolute bottom-8 left-0 -translate-x-1/2 w-4 h-4 bg-primary rounded-full shadow-md"
                  style={{ boxShadow: '0 0 6px hsl(var(--primary))' }}
                >
                  <div className="absolute inset-1 bg-primary-foreground rounded-full" />
                </div>
              </div>
            )}

            {hasSel && (
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none"
                style={{ left: `${selMaxPx}px` }}
              >
                <div
                  className="absolute inset-y-0 left-0 w-1 bg-primary shadow-md"
                  style={{ boxShadow: '0 0 8px hsl(var(--primary))' }}
                />
                <div className="absolute top-0 left-0 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-2.5 py-1 rounded-md whitespace-nowrap font-bold shadow-md">
                  {fmtTime(selMax)}
                </div>
                <div
                  className="absolute bottom-8 left-0 -translate-x-1/2 w-4 h-4 bg-primary rounded-full shadow-md"
                  style={{ boxShadow: '0 0 6px hsl(var(--primary))' }}
                >
                  <div className="absolute inset-1 bg-primary-foreground rounded-full" />
                </div>
              </div>
            )}

            <div className="absolute bottom-0 inset-x-0 h-8 border-t-2 border-border bg-card/50">
              {/* Background line */}
              <div className="absolute top-0 inset-x-0 h-0.5 bg-border" />

              {/* Minor ticks */}
              {rulerMinor.map((t) => (
                <div
                  key={`mn-${t}`}
                  className="absolute top-0 w-0.5 bg-border"
                  style={{
                    left: `${(t / TOTAL_SECONDS) * totalWidth}px`,
                    height: '6px',
                  }}
                />
              ))}

              {/* Major ticks with labels */}
              {rulerMajor.map((t) => (
                <div
                  key={`mj-${t}`}
                  className="absolute top-0 flex flex-col items-center"
                  style={{
                    left: `${(t / TOTAL_SECONDS) * totalWidth}px`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="w-0.5 h-3 bg-foreground/60" />
                  <span className="text-foreground font-semibold whitespace-nowrap text-[9px] mt-0.5">
                    {String(Math.floor(t / 3600)).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 min-h-0">
          <div className="flex-1 rounded-lg border border-border bg-card p-3 overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <Camera className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">
                Events
              </span>
              {hasSel && thumbEvents.length > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {thumbEvents.length}
                </span>
              )}
            </div>

            {hasSel ? (
              <div className="flex flex-col overflow-y-auto max-h-48 space-y-2">
                {thumbEvents.length > 0 ? (
                  thumbEvents.map((ev) => (
                    <div
                      key={ev.event_hash}
                      className="flex items-center gap-2.5 p-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer group"
                      onClick={() => {
                        if (ev.chunk_presigned_url) {
                          setSelectedVideo(ev.chunk_presigned_url);
                          setIsVideoOpen(true);
                        }
                      }}
                    >
                      <div className="relative w-20 h-12 rounded overflow-hidden bg-muted shrink-0 border border-border">
                        {ev.chunk_presigned_url ? (
                          <>
                            <video
                              src={ev.chunk_presigned_url}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
                              <div className="w-6 h-6 rounded-full bg-white/95 flex items-center justify-center">
                                <Play
                                  className="w-3 h-3 text-foreground ml-0.5"
                                  fill="currentColor"
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <Camera className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-xs font-medium text-foreground line-clamp-1">
                          {ev.event_title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {ev.detected_at
                            ? formatTimeInTimezone(
                                ev.detected_at,
                                'UTC',
                                'time'
                              )
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-12 rounded border border-dashed border-border">
                    <p className="text-xs text-muted-foreground">
                      No events in selected range
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-12 rounded border border-dashed border-border">
                <p className="text-xs text-muted-foreground">
                  Select a range to view events
                </p>
              </div>
            )}
          </div>

          <div className="w-64 rounded-lg border border-border bg-card p-3 flex flex-col shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-3.5 h-3.5 text-success" />
              <span className="text-xs font-semibold text-foreground">
                Live Feed
              </span>
              <div className="ml-auto flex items-center gap-1">
                {rangeLoading ? (
                  <Loader2 className="w-3 h-3 text-primary animate-spin" />
                ) : (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] text-success font-medium">
                      LIVE
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto max-h-40">
              {!camHash ? (
                <div className="text-xs text-muted-foreground italic py-2">
                  No camera selected
                </div>
              ) : rangeError ? (
                <div className="text-xs text-destructive italic py-2">
                  {rangeError}
                </div>
              ) : rangeBuckets.length === 0 && !rangeLoading ? (
                <div className="text-xs text-muted-foreground italic py-2">
                  No recent events
                </div>
              ) : (
                rangeBuckets
                  .filter((b) => b.total_event_count > 0)
                  .map((bucket) => (
                    <div
                      key={bucket.bucket_start}
                      className="rounded border border-border bg-muted/30 px-2 py-1.5 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-foreground">
                          {new Date(bucket.bucket_start).toLocaleTimeString(
                            'en-US',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                              timeZone: 'UTC',
                            }
                          )}
                        </span>
                        <span className="text-[10px] font-semibold text-primary">
                          {bucket.total_event_count}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {bucket.event_type_counts.slice(0, 3).map((et) => (
                          <div
                            key={et.event_type}
                            className="flex items-start justify-between gap-1"
                          >
                            <span className="text-muted-foreground line-clamp-1 flex-1 text-[9px]">
                              {et.event_type}
                            </span>
                            <span className="text-foreground font-medium shrink-0 text-[9px]">
                              ×{et.event_count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
      {isVideoOpen && selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => {
            setIsVideoOpen(false);
            setSelectedVideo(null);
          }}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/95">
              <span className="text-sm text-foreground font-semibold">
                Event Video
              </span>
              <button
                onClick={() => {
                  setIsVideoOpen(false);
                  setSelectedVideo(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              <video
                src={selectedVideo}
                controls
                autoPlay
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
