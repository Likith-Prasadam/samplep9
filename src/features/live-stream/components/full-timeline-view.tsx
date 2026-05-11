import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useId,
} from 'react';
import {
  RefreshCw,
  Camera,
  Clock,
  CalendarRange,
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
import { formatInTimeZone } from 'date-fns-tz';
import { formatTimeInTimezone } from '@/utils/timeUtils';
import { useNotifications } from '@/providers/notifications-provider';
import { useAppSelector } from '@/store/hooks';
import { selectSelectedTimezoneIana } from '@/store/slices/timezone-slice';
import {
  Calendar as TimelineRangeCalendar,
  type RangeValue,
} from '@/components/ui/calendar-time-range';

const GRANULARITY_CONFIG: Record<
  Granularity,
  {
    label: string;
    totalCandles: number;
    intervalSeconds: number;
    rulerEvery: number;
    minorEvery: number;
    minGapSeconds: number;
  }
> = {
  '5min': {
    label: '5 min buckets',
    totalCandles: 288,
    intervalSeconds: 300,
    rulerEvery: 3600,
    minorEvery: 900,
    minGapSeconds: 60,
  },
  '1hour': {
    label: '1 hour buckets',
    totalCandles: 24,
    intervalSeconds: 3600,
    rulerEvery: 3600,
    minorEvery: 1800,
    minGapSeconds: 3600,
  },
  '1day': {
    label: '1 day buckets',
    totalCandles: 1,
    intervalSeconds: 86400,
    rulerEvery: 3600,
    minorEvery: 1800,
    minGapSeconds: 3600,
  },
};

interface Candle {
  index: number;
  tStart: number;
  tEnd: number;
  height: number;
  eventCount: number;
}

const TIMELINE_PLOT_H = 110;

/** Catmull–Rom style divisor: lower → softer, rounder waves between samples. */
const AREA_CURVE_TENSION = 4;

function dedupeWavePoints(
  points: { x: number; y: number }[]
): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const eps = 0.75;
  for (const p of points) {
    const prev = out[out.length - 1];
    if (prev && Math.abs(prev.x - p.x) < eps && Math.abs(prev.y - p.y) < eps)
      continue;
    out.push(p);
  }
  return out;
}

/** Smooth cubic segments through points (first point already reached by caller). */
function buildSmoothWaveThrough(
  points: { x: number; y: number }[],
  tension: number
): string {
  if (points.length < 2) return '';
  let d = '';
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / tension;
    const cp1y = p1.y + (p2.y - p0.y) / tension;
    const cp2x = p2.x - (p3.x - p1.x) / tension;
    const cp2y = p2.y - (p3.y - p1.y) / tension;
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

function buildTimelineAreaPath(
  candles: Candle[],
  widthPx: number,
  axisSpanSeconds: number,
  plotHeight: number
): string {
  if (widthPx <= 0 || axisSpanSeconds <= 0 || candles.length === 0) {
    return '';
  }
  const baseline = plotHeight - 2;
  const topPad = 4;
  const usable = baseline - topPad;

  const toY = (h: number) => baseline - Math.max(0.02, Math.min(1, h)) * usable;

  const xAt = (t: number) => (t / axisSpanSeconds) * widthPx;

  const mids = candles.map((c) => {
    const midT = (c.tStart + c.tEnd) / 2;
    return { x: xAt(midT), y: toY(c.height) };
  });

  const first = candles[0];
  const last = candles[candles.length - 1];
  const xFirst = xAt(first.tStart);
  const xLast = xAt(last.tEnd);
  const yFirst = toY(first.height);
  const yLast = toY(last.height);

  const topPoints = dedupeWavePoints([
    { x: xFirst, y: yFirst },
    ...mids,
    { x: xLast, y: yLast },
  ]);

  if (topPoints.length < 2) {
    return `M 0 ${baseline} L ${xFirst} ${baseline} L ${xFirst} ${yFirst} L ${widthPx} ${yFirst} L ${widthPx} ${baseline} Z`;
  }

  let d = `M 0 ${baseline} L ${topPoints[0].x} ${baseline} L ${topPoints[0].x} ${topPoints[0].y}`;
  d += buildSmoothWaveThrough(topPoints, AREA_CURVE_TENSION);
  const pl = topPoints[topPoints.length - 1];
  d += ` L ${widthPx} ${pl.y} L ${widthPx} ${baseline} Z`;
  return d;
}

interface FullTimelineViewProps {
  camHash?: string;
}

function normalizeApiUtcTimestamp(raw: string): string {
  // Some APIs return UTC-like timestamps without explicit zone info.
  // Add trailing Z so Date parsing is stable and timezone-safe.
  return /(?:Z|[+-]\d{2}:\d{2})$/.test(raw) ? raw : `${raw}Z`;
}

function formatTimelineLabel(
  secondsFromStart: number,
  rangeStartMs: number,
  rangeDurationSeconds: number,
  granularity: Granularity,
  timezone: string
): string {
  const date = new Date(rangeStartMs + secondsFromStart * 1000);
  const time = formatInTimeZone(date, timezone, 'hh:mm a').toUpperCase();
  const dayMonth = formatInTimeZone(date, timezone, 'dd/MM');

  const showDate = granularity === '1day' || rangeDurationSeconds > 86400;
  return showDate ? `${dayMonth} ${time}` : time;
}

function formatTimelineLabelParts(
  secondsFromStart: number,
  rangeStartMs: number,
  timezone: string
): { time: string; date: string } {
  const date = new Date(rangeStartMs + secondsFromStart * 1000);
  return {
    time: formatInTimeZone(date, timezone, 'hh:mm a').toUpperCase(),
    date: `(${formatInTimeZone(date, timezone, 'dd/MM')})`,
  };
}

function getRulerIntervals(
  rangeDurationSeconds: number,
  granularity: Granularity
) {
  if (granularity === '5min') {
    if (rangeDurationSeconds <= 86400)
      return { majorEvery: 3600, minorEvery: 900, microEvery: 300 };
    if (rangeDurationSeconds <= 3 * 86400)
      return { majorEvery: 12 * 3600, minorEvery: 3600, microEvery: 900 };
    return { majorEvery: 24 * 3600, minorEvery: 6 * 3600, microEvery: 3600 };
  }

  if (granularity === '1hour') {
    if (rangeDurationSeconds <= 86400)
      return { majorEvery: 3600, minorEvery: 1800, microEvery: 300 };
    if (rangeDurationSeconds <= 3 * 86400)
      return { majorEvery: 12 * 3600, minorEvery: 3600, microEvery: 900 };
    return { majorEvery: 24 * 3600, minorEvery: 6 * 3600, microEvery: 3600 };
  }

  if (rangeDurationSeconds <= 2 * 86400)
    return { majorEvery: 12 * 3600, minorEvery: 3600, microEvery: 900 };
  if (rangeDurationSeconds <= 7 * 86400)
    return { majorEvery: 24 * 3600, minorEvery: 6 * 3600, microEvery: 3600 };
  return {
    majorEvery: 2 * 24 * 3600,
    minorEvery: 24 * 3600,
    microEvery: 6 * 3600,
  };
}

/** Right-anchored default brush; width scales with range and respects min gap. */
function computeDefaultBrushSelection(
  axisSpanSeconds: number,
  minGapSeconds: number
): { L: number; R: number } {
  const span = Math.max(1, axisSpanSeconds);
  const gap = Math.min(minGapSeconds, span);
  const width = Math.max(gap, Math.min(span * 0.01, span * 0.14, span));
  // Keep the right handle slightly inset so it is clearly visible.
  let R = Math.max(gap, span * 0.97);
  let L = Math.max(0, R - width);
  if (R - L < gap) {
    R = Math.min(span, L + gap);
    L = Math.max(0, R - gap);
  }
  return { L, R };
}

function buildDefaultRangeValue(): RangeValue {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  return {
    // Use local day bounds so the timeline always defaults to
    // 12:00 AM through 11:59 PM for the current day.
    start: new Date(year, month, date, 0, 0, 0, 0),
    end: new Date(year, month, date, 23, 59, 59, 999),
  };
}

export default function FullTimelineView({ camHash }: FullTimelineViewProps) {
  const ONE_MINUTE_MS = 60 * 1000;
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const timelineChartId = useId().replace(/:/g, '');
  const areaGradientId = `tl-area-grad-${timelineChartId}`;
  const areaSelectionClipId = `tl-area-sel-${timelineChartId}`;

  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [selL, setSelL] = useState<number | null>(null);
  const [selR, setSelR] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hoverMarker, setHoverMarker] = useState<'left' | 'right' | null>(null);
  const [hoverEventCount, setHoverEventCount] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; t: number } | null>(
    null
  );
  const granularity: Granularity = '5min';
  const [selectedRange, setSelectedRange] =
    useState<RangeValue>(buildDefaultRangeValue);
  const userTimezone = useAppSelector(selectSelectedTimezoneIana);
  const { notifications } = useNotifications();

  const containerRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState<number>(0);
  const zoomFloorMsRef = useRef(ONE_MINUTE_MS);

  const dragModeRef = useRef<'new' | 'left' | 'right' | null>(null);
  const anchorRef = useRef<number>(0);
  const selLRef = useRef<number | null>(null);
  const selRRef = useRef<number | null>(null);
  const hasUserMovedBrushRef = useRef(false);

  useEffect(() => {
    selLRef.current = selL;
  }, [selL]);
  useEffect(() => {
    selRRef.current = selR;
  }, [selR]);

  const config = GRANULARITY_CONFIG[granularity];
  const totalWidth = config.totalCandles * 68;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      setTimelineWidth(el.clientWidth);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const effectiveTimelineWidth = timelineWidth > 0 ? timelineWidth : totalWidth;

  const fromUtc = useMemo(
    () => (selectedRange.start ? selectedRange.start.toISOString() : ''),
    [selectedRange.start]
  );
  const toUtc = useMemo(
    () => (selectedRange.end ? selectedRange.end.toISOString() : ''),
    [selectedRange.end]
  );
  const rangeStartMs = useMemo(
    () => (selectedRange.start ? selectedRange.start.getTime() : Date.now()),
    [selectedRange.start]
  );
  const rangeEndMs = useMemo(
    () => (selectedRange.end ? selectedRange.end.getTime() : Date.now()),
    [selectedRange.end]
  );
  const rangeDurationSeconds = useMemo(() => {
    const sec = Math.floor((rangeEndMs - rangeStartMs) / 1000);
    return Math.max(60, sec > 0 ? sec : 60);
  }, [rangeStartMs, rangeEndMs]);
  const axisSpanSeconds = rangeDurationSeconds;

  const [densityBuckets, setDensityBuckets] = useState<DensityBucket[]>([]);
  const [densityLoading, setDensityLoading] = useState(false);
  const [densityError, setDensityError] = useState<string | null>(null);

  const [windowEvents, setWindowEvents] = useState<WindowEvent[]>([]);
  const [, setWindowLoading] = useState(false);

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
          granularity,
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
  }, [camHash, fromUtc, toUtc, granularity]);

  useEffect(() => {
    if (!camHash) {
      setWindowEvents([]);
      return;
    }
    let cancelled = false;
    const PAGE_SIZE = 250;
    const MAX_PAGES = 200;

    const load = async () => {
      setWindowLoading(true);
      try {
        const allEvents: WindowEvent[] = [];
        let cursor: string | null = null;
        let pages = 0;
        let hasMore = true;

        while (hasMore && pages < MAX_PAGES) {
          if (cancelled) return;
          const result = await fetchTimelineWindow({
            cam_hash: camHash,
            from_utc: fromUtc,
            to_utc: toUtc,
            cursor: cursor ?? undefined,
            limit: PAGE_SIZE,
          });
          allEvents.push(...result.events);
          hasMore = result.has_more;
          cursor = result.next_cursor;
          pages += 1;
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

  const candles = useMemo<Candle[]>(() => {
    const step = config.intervalSeconds;
    const n = Math.max(1, Math.ceil(axisSpanSeconds / step));
    const counts = Array.from({ length: n }, () => 0);

    // Re-bucket backend density into currently selected granularity so
    // switching Minutes/Hours/Days always updates the chart shape.
    for (const bucket of densityBuckets) {
      const startMs = new Date(bucket.bucket_start).getTime();
      const offsetSec = (startMs - rangeStartMs) / 1000;
      if (offsetSec < 0 || offsetSec >= axisSpanSeconds) continue;
      const idx = Math.min(n - 1, Math.floor(offsetSec / step));
      counts[idx] += bucket.event_count;
    }

    const maxCount = Math.max(1, ...counts);

    return Array.from({ length: n }, (_, i) => {
      const tStart = Math.min(i * step, Math.max(0, axisSpanSeconds - 1));
      const tEnd = Math.min(axisSpanSeconds, (i + 1) * step);
      const eventCount = counts[i];
      const h = eventCount / maxCount;

      return {
        index: i,
        tStart,
        tEnd: Math.max(tStart + 1, tEnd),
        height: Math.max(0.08, h * 0.95 + 0.05),
        eventCount,
      };
    });
  }, [densityBuckets, config.intervalSeconds, rangeStartMs, axisSpanSeconds]);

  const timelineAreaPath = useMemo(
    () =>
      buildTimelineAreaPath(
        candles,
        effectiveTimelineWidth,
        axisSpanSeconds,
        TIMELINE_PLOT_H
      ),
    [candles, effectiveTimelineWidth, axisSpanSeconds]
  );

  const getRelX = useCallback((e: MouseEvent | React.MouseEvent): number => {
    const el = containerRef.current;
    if (!el) return 0;
    return e.clientX - el.getBoundingClientRect().left;
  }, []);

  const px2time = useCallback(
    (px: number): number => {
      const tw = effectiveTimelineWidth || 1;
      return Math.max(
        0,
        Math.min(axisSpanSeconds, (px / tw) * axisSpanSeconds)
      );
    },
    [effectiveTimelineWidth, axisSpanSeconds]
  );

  const MARKER_HIT = 14;
  const handleTimelineWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const currentStart = selectedRange.start?.getTime();
      const currentEnd = selectedRange.end?.getTime();
      if (!currentStart || !currentEnd || currentEnd <= currentStart) return;

      const currentRangeMs = currentEnd - currentStart;
      const zoomIn = e.deltaY < 0;
      const zoomFactor = zoomIn ? 0.85 : 1.15;
      const nextRangeMsUnclamped = Math.round(currentRangeMs * zoomFactor);

      const minRangeMs = zoomFloorMsRef.current;
      const maxRangeMs = 30 * ONE_DAY_MS;
      const nextRangeMs = Math.min(
        maxRangeMs,
        Math.max(minRangeMs, nextRangeMsUnclamped)
      );

      const x = getRelX(e);
      const tw = effectiveTimelineWidth || 1;
      const cursorRatio = Math.max(0, Math.min(1, x / tw));
      const anchorMs = currentStart + cursorRatio * currentRangeMs;

      let nextStartMs = Math.round(anchorMs - cursorRatio * nextRangeMs);
      let nextEndMs = nextStartMs + nextRangeMs;

      const nowMs = Date.now();
      if (nextEndMs > nowMs) {
        const shift = nextEndMs - nowMs;
        nextEndMs -= shift;
        nextStartMs -= shift;
      }
      if (nextStartMs < 0) {
        nextEndMs += -nextStartMs;
        nextStartMs = 0;
      }

      const currentRangeSec = currentRangeMs / 1000;
      const nextRangeSec = nextRangeMs / 1000;
      const currentL = selLRef.current;
      const currentR = selRRef.current;

      if (
        hasUserMovedBrushRef.current &&
        currentL !== null &&
        currentR !== null &&
        currentRangeSec > 0
      ) {
        const leftRatio = Math.max(0, Math.min(1, currentL / currentRangeSec));
        const rightRatio = Math.max(0, Math.min(1, currentR / currentRangeSec));
        let nextL = leftRatio * nextRangeSec;
        let nextR = rightRatio * nextRangeSec;

        if (nextR - nextL < config.minGapSeconds) {
          nextR = Math.min(nextRangeSec, nextL + config.minGapSeconds);
          nextL = Math.max(0, nextR - config.minGapSeconds);
        }

        setSelL(nextL);
        setSelR(nextR);
        selLRef.current = nextL;
        selRRef.current = nextR;
      } else {
        // Keep brush at default placement while user hasn't moved it manually.
        setSelL(null);
        setSelR(null);
        selLRef.current = null;
        selRRef.current = null;
      }

      setSelectedRange({
        start: new Date(nextStartMs),
        end: new Date(nextEndMs),
      });
    },
    [
      effectiveTimelineWidth,
      getRelX,
      selectedRange.end,
      selectedRange.start,
      ONE_DAY_MS,
      config.minGapSeconds,
    ]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      hasUserMovedBrushRef.current = true;
      const x = getRelX(e);
      const tw = effectiveTimelineWidth || 1;
      const L = selLRef.current;
      const R = selRRef.current;
      const lPx = L !== null ? (L / axisSpanSeconds) * tw : null;
      const rPx = R !== null ? (R / axisSpanSeconds) * tw : null;

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
    [effectiveTimelineWidth, getRelX, px2time, axisSpanSeconds]
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
        if (R - L < config.minGapSeconds) {
          if (t >= anchor) R = anchor + config.minGapSeconds;
          else L = anchor - config.minGapSeconds;
        }
        L = Math.max(0, L);
        R = Math.min(axisSpanSeconds, R);
        setSelL(L);
        selLRef.current = L;
        setSelR(R);
        selRRef.current = R;
      } else if (mode === 'left') {
        const R = selRRef.current!;
        const newL = Math.max(0, Math.min(t, R - config.minGapSeconds));
        setSelL(newL);
        selLRef.current = newL;
      } else if (mode === 'right') {
        const L = selLRef.current!;
        const newR = Math.min(
          axisSpanSeconds,
          Math.max(t, L + config.minGapSeconds)
        );
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
  }, [dragging, getRelX, px2time, config.minGapSeconds, axisSpanSeconds]);

  const applyDefaultBrush = useCallback(() => {
    const { L, R } = computeDefaultBrushSelection(
      axisSpanSeconds,
      config.minGapSeconds
    );
    setSelL(L);
    setSelR(R);
    selLRef.current = L;
    selRRef.current = R;
  }, [axisSpanSeconds, config.minGapSeconds]);

  const resetSel = useCallback(() => {
    const defaultRange = buildDefaultRangeValue();
    const newFromMs = defaultRange.start?.getTime() ?? Date.now();
    const newToMs = defaultRange.end?.getTime() ?? Date.now();
    const newAxisSpanSeconds = Math.max(
      60,
      Math.floor((newToMs - newFromMs) / 1000)
    );
    const { L, R } = computeDefaultBrushSelection(
      newAxisSpanSeconds,
      config.minGapSeconds
    );
    setSelectedRange(defaultRange);
    zoomFloorMsRef.current = ONE_MINUTE_MS;
    setSelL(L);
    setSelR(R);
    selLRef.current = L;
    selRRef.current = R;
    hasUserMovedBrushRef.current = false;
  }, [config.minGapSeconds, ONE_MINUTE_MS]);

  useEffect(() => {
    const L = selLRef.current;
    const R = selRRef.current;
    if (L === null || R === null) {
      applyDefaultBrush();
      return;
    }
    let nL = L;
    let nR = R;
    if (nR > axisSpanSeconds) nR = axisSpanSeconds;
    if (nL < 0) nL = 0;
    if (nR - nL < config.minGapSeconds || nR > axisSpanSeconds || nL < 0) {
      applyDefaultBrush();
      return;
    }
    if (nL !== L || nR !== R) {
      setSelL(nL);
      setSelR(nR);
      selLRef.current = nL;
      selRRef.current = nR;
    }
  }, [axisSpanSeconds, config.minGapSeconds, applyDefaultBrush]);

  const hasSel = selL !== null && selR !== null;
  const selMin = hasSel ? selL! : 0;
  const selMax = hasSel ? selR! : 0;
  const selMinPx = (selMin / axisSpanSeconds) * effectiveTimelineWidth;
  const selMaxPx = (selMax / axisSpanSeconds) * effectiveTimelineWidth;
  const LABEL_EDGE_GUARD_PX = 52;
  const leftLabelTransform =
    selMinPx <= LABEL_EDGE_GUARD_PX ? 'translateX(0)' : 'translateX(-50%)';
  const rightLabelTransform =
    effectiveTimelineWidth - selMaxPx <= LABEL_EDGE_GUARD_PX
      ? 'translateX(-100%)'
      : 'translateX(-50%)';
  const selStartMs = rangeStartMs + selMin * 1000;
  const selEndMs = rangeStartMs + selMax * 1000;

  const thumbEvents = useMemo<WindowEvent[]>(() => {
    if (!hasSel || windowEvents.length === 0) return [];
    return windowEvents.filter((ev) => {
      const evMs = new Date(normalizeApiUtcTimestamp(ev.detected_at)).getTime();
      return evMs >= selStartMs && evMs <= selEndMs;
    });
  }, [windowEvents, hasSel, selStartMs, selEndMs]);

  const rulerIntervals = useMemo(
    () => getRulerIntervals(rangeDurationSeconds, granularity),
    [rangeDurationSeconds, granularity]
  );
  const rulerMajor = useMemo(() => {
    const a: number[] = [];
    for (let t = 0; t <= axisSpanSeconds; t += rulerIntervals.majorEvery)
      a.push(t);
    if (a[a.length - 1] !== axisSpanSeconds) a.push(axisSpanSeconds);
    return a;
  }, [axisSpanSeconds, rulerIntervals.majorEvery]);

  const rulerMinor = useMemo(() => {
    const a: number[] = [];
    for (let t = 0; t <= axisSpanSeconds; t += rulerIntervals.minorEvery)
      a.push(t);
    return a;
  }, [axisSpanSeconds, rulerIntervals.minorEvery]);

  const rulerMicro = useMemo(() => {
    const a: number[] = [];
    for (let t = 0; t <= axisSpanSeconds; t += rulerIntervals.microEvery)
      a.push(t);
    return a;
  }, [axisSpanSeconds, rulerIntervals.microEvery]);

  useEffect(() => {
    if (!camHash) return;

    const rangeStart = selectedRange.start?.getTime();
    const rangeEnd = selectedRange.end?.getTime();
    if (!rangeStart || !rangeEnd) return;

    const alertEvents = notifications
      .filter((n) => {
        if (n.type !== 'live') return false;
        const notifCam = (n.details?.camera_id || '').trim().toLowerCase();
        if (!notifCam || notifCam !== camHash.trim().toLowerCase()) return false;
        const rawTs = n.event_received_utc || n.timestamp;
        if (!rawTs) return false;
        const ts = new Date(normalizeApiUtcTimestamp(rawTs)).getTime();
        return ts >= rangeStart && ts <= rangeEnd;
      })
      .map((n) => ({
        id: n.event_id || '',
        title: n.alert || '',
        ts: new Date(
          normalizeApiUtcTimestamp(n.event_received_utc || n.timestamp)
        ).getTime(),
      }));

    const timelineEvents = windowEvents.map((ev) => ({
      id: ev.event_hash,
      title: ev.event_title || '',
      ts: new Date(normalizeApiUtcTimestamp(ev.detected_at)).getTime(),
    }));

    const alertsById = new Set(alertEvents.map((e) => e.id).filter(Boolean));
    const timelineById = new Set(timelineEvents.map((e) => e.id).filter(Boolean));
    const onlyInTimeline = timelineEvents.filter((e) => !alertsById.has(e.id));
    const onlyInAlerts = alertEvents.filter((e) => !timelineById.has(e.id));

    const LOG_PREFIX = '[Timeline vs Alerts Debug]';
    console.groupCollapsed(
      `${LOG_PREFIX} cam=${camHash} timeline=${timelineEvents.length} alerts=${alertEvents.length}`
    );
    console.log('selected_range', {
      fromUtc,
      toUtc,
      fromLocal: new Date(rangeStart).toString(),
      toLocal: new Date(rangeEnd).toString(),
    });
    console.log('summary', {
      timelineCount: timelineEvents.length,
      alertCount: alertEvents.length,
      commonById:
        timelineEvents.length - onlyInTimeline.length,
      onlyInTimelineCount: onlyInTimeline.length,
      onlyInAlertsCount: onlyInAlerts.length,
    });
    if (onlyInTimeline.length > 0) {
      console.table(
        onlyInTimeline.slice(0, 20).map((e) => ({
          event_hash: e.id,
          title: e.title,
          detected_at_local: new Date(e.ts).toString(),
          detected_at_iso: new Date(e.ts).toISOString(),
        }))
      );
    }
    if (onlyInAlerts.length > 0) {
      console.table(
        onlyInAlerts.slice(0, 20).map((e) => ({
          event_id: e.id,
          title: e.title,
          alert_time_local: new Date(e.ts).toString(),
          alert_time_iso: new Date(e.ts).toISOString(),
        }))
      );
    }
    console.groupEnd();
  }, [camHash, notifications, windowEvents, selectedRange.start, selectedRange.end, fromUtc, toUtc]);

  const visibleMajorLabels = useMemo(() => {
    if (rulerMajor.length <= 1) return rulerMajor;

    const MIN_LABEL_SPACING_PX = 100; // Minimum horizontal space between labels (increased for safety)
    const visibleIndices: number[] = [0]; // Always show first label

    // Add intermediate labels that have sufficient spacing
    for (let i = 1; i < rulerMajor.length - 1; i++) {
      const currT = rulerMajor[i];
      const prevT = rulerMajor[visibleIndices[visibleIndices.length - 1]];

      const currPx = (currT / axisSpanSeconds) * effectiveTimelineWidth;
      const prevPx = (prevT / axisSpanSeconds) * effectiveTimelineWidth;
      const spacingPx = Math.abs(currPx - prevPx);

      if (spacingPx >= MIN_LABEL_SPACING_PX) {
        visibleIndices.push(i);
      }
    }

    // Add last label only if it has sufficient spacing from the previous visible label
    const lastIdx = rulerMajor.length - 1;
    if (lastIdx > 0) {
      const lastT = rulerMajor[lastIdx];
      const prevT = rulerMajor[visibleIndices[visibleIndices.length - 1]];
      const lastPx = (lastT / axisSpanSeconds) * effectiveTimelineWidth;
      const prevPx = (prevT / axisSpanSeconds) * effectiveTimelineWidth;
      const spacingPx = Math.abs(lastPx - prevPx);

      if (spacingPx >= MIN_LABEL_SPACING_PX) {
        visibleIndices.push(lastIdx);
      } else if (visibleIndices[visibleIndices.length - 1] !== lastIdx) {
        // If last label doesn't fit but we need to show it, replace the previous label
        if (visibleIndices.length > 1) {
          visibleIndices.pop();
        }
        visibleIndices.push(lastIdx);
      }
    }

    return visibleIndices.map((idx) => rulerMajor[idx]);
  }, [rulerMajor, axisSpanSeconds, effectiveTimelineWidth]);

  const cursor = dragging
    ? 'grabbing'
    : hoverMarker
      ? 'ew-resize'
      : 'crosshair';

  return (
    <div className="flex w-full flex-col bg-background">
      {/* Timeline Header */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-1.5 border-b border-border bg-card shrink-0 animate-in slide-in-from-top-2 duration-200 delay-100">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground whitespace-nowrap">
            Timeline
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {densityLoading && (
            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
          )}
          {densityError && (
            <span className="text-[10px] text-destructive hidden sm:inline">
              {densityError}
            </span>
          )}
          <button
            onClick={resetSel}
            title="Reset brush to default (left)"
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </div>
      </header>

      <div className="relative z-30 flex items-center gap-3 px-3 sm:px-4 py-2 border-b border-border bg-card shrink-0 flex-wrap">
        <div className="flex items-center gap-1.5">
          <CalendarRange className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Range
          </span>
        </div>
        <TimelineRangeCalendar
          value={selectedRange}
          onChange={(next) => {
            if (next?.start && next?.end) {
              const selectedRangeMs = next.end.getTime() - next.start.getTime();
              zoomFloorMsRef.current =
                selectedRangeMs > ONE_DAY_MS ? ONE_DAY_MS : ONE_MINUTE_MS;
              setSelectedRange(next);
              // Keep brush at default placement across date-range changes
              // until the user manually interacts with the brush.
              if (!hasUserMovedBrushRef.current) {
                setSelL(null);
                setSelR(null);
                selLRef.current = null;
                selRRef.current = null;
              }
            }
          }}
          showTimeInput
          horizontalLayout
          popoverAlignment="start"
        />
        {hasSel && (
          <div className="ml-auto text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {formatTimelineLabel(
                selMin,
                rangeStartMs,
                rangeDurationSeconds,
                granularity,
                userTimezone
              )}
            </span>
            <span className="mx-1">→</span>
            <span className="font-medium text-foreground">
              {formatTimelineLabel(
                selMax,
                rangeStartMs,
                rangeDurationSeconds,
                granularity,
                userTimezone
              )}
            </span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative z-0 px-3 sm:px-4 py-3 bg-background shrink-0 animate-in slide-in-from-top-2 duration-200 delay-150">
        <div
          ref={containerRef}
          className="rounded-lg border-2 border-border bg-card overflow-hidden select-none shadow-sm hover:shadow-md transition-shadow"
          style={{
            cursor,
            height: '200px',
            paddingRight: '10px',
            overscrollBehavior: 'contain',
          }}
          onMouseDown={handleMouseDown}
          onWheel={handleTimelineWheel}
          onMouseMove={(e) => {
            if (dragging) return;
            const x = getRelX(e);
            const t = px2time(x);
            const tw = effectiveTimelineWidth || 1;
            const lPx =
              selLRef.current !== null
                ? (selLRef.current / axisSpanSeconds) * tw
                : null;
            const rPx =
              selRRef.current !== null
                ? (selRRef.current / axisSpanSeconds) * tw
                : null;
            if (lPx !== null && Math.abs(x - lPx) <= MARKER_HIT)
              setHoverMarker('left');
            else if (rPx !== null && Math.abs(x - rPx) <= MARKER_HIT)
              setHoverMarker('right');
            else setHoverMarker(null);

            // Find event count at hover position
            const hoveredCandle = candles.find(
              (c) => t >= c.tStart && t < c.tEnd
            );
            if (hoveredCandle) {
              setHoverEventCount(hoveredCandle.eventCount);
              setHoverPos({ x, t });
            } else {
              setHoverEventCount(null);
              setHoverPos(null);
            }
          }}
          onMouseLeave={() => {
            setHoverMarker(null);
            setHoverEventCount(null);
            setHoverPos(null);
          }}
        >
          <div
            className="relative bg-[hsl(248_52%_97%/0.85)]"
            style={{ width: `${effectiveTimelineWidth}px`, height: '186px' }}
          >
            <div className="absolute left-2 top-2 z-20">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                Event Density Trend
              </span>
            </div>
            <div className="absolute inset-x-0 top-8 bottom-11 pointer-events-none">
              {timelineAreaPath ? (
                <svg
                  className="absolute inset-0 h-full w-full block"
                  viewBox={`0 0 ${effectiveTimelineWidth} ${TIMELINE_PLOT_H}`}
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <defs>
                    <linearGradient
                      id={areaGradientId}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="hsl(258 78% 56%)"
                        stopOpacity={0.72}
                      />
                      <stop
                        offset="45%"
                        stopColor="hsl(252 72% 68%)"
                        stopOpacity={0.38}
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(248 62% 92%)"
                        stopOpacity={0.35}
                      />
                    </linearGradient>
                    {hasSel && (
                      <clipPath id={areaSelectionClipId}>
                        <rect
                          x={selMinPx}
                          y={0}
                          width={Math.max(0, selMaxPx - selMinPx)}
                          height={TIMELINE_PLOT_H}
                        />
                      </clipPath>
                    )}
                  </defs>
                  {hasSel ? (
                    <>
                      <path
                        d={timelineAreaPath}
                        fill="hsl(252 48% 90% / 0.92)"
                        className="transition-opacity duration-150"
                      />
                      <path
                        d={timelineAreaPath}
                        fill={`url(#${areaGradientId})`}
                        clipPath={`url(#${areaSelectionClipId})`}
                      />
                      <path
                        d={timelineAreaPath}
                        fill="none"
                        stroke="hsl(258 72% 46% / 0.55)"
                        strokeWidth={1.25}
                        vectorEffect="nonScalingStroke"
                        clipPath={`url(#${areaSelectionClipId})`}
                      />
                    </>
                  ) : (
                    <>
                      <path
                        d={timelineAreaPath}
                        fill={`url(#${areaGradientId})`}
                      />
                      <path
                        d={timelineAreaPath}
                        fill="none"
                        stroke="hsl(258 68% 48% / 0.5)"
                        strokeWidth={1.25}
                        vectorEffect="nonScalingStroke"
                      />
                    </>
                  )}
                </svg>
              ) : null}
            </div>

            {hasSel && (
              <div
                className="absolute top-0 bottom-7 pointer-events-none bg-primary/10 border-l-2 border-r-2 border-primary/30 animate-in fade-in duration-200"
                style={{
                  left: `${selMinPx}px`,
                  width: `${Math.max(0, selMaxPx - selMinPx)}px`,
                }}
              />
            )}

            {hasSel && (
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none animate-in slide-in-from-left-2 duration-200"
                style={{ left: `${selMinPx}px` }}
              >
                <div
                  className="absolute inset-y-0 left-0 w-1 bg-primary shadow-lg"
                  style={{ boxShadow: '0 0 10px hsl(var(--primary))' }}
                />
                <div
                  className="absolute top-0 left-0 bg-primary text-primary-foreground text-[11px] px-2.5 py-1 rounded-md whitespace-nowrap font-bold shadow-lg"
                  style={{ transform: leftLabelTransform }}
                >
                  {formatTimelineLabel(
                    selMin,
                    rangeStartMs,
                    rangeDurationSeconds,
                    granularity,
                    userTimezone
                  )}
                </div>
                <div
                  className="absolute bottom-7 left-0 w-4 h-4 bg-primary rounded-full shadow-lg"
                  style={{ transform: leftLabelTransform, boxShadow: '0 0 8px hsl(var(--primary))' }}
                >
                  <div className="absolute inset-1 bg-primary-foreground rounded-full" />
                </div>
              </div>
            )}

            {hasSel && (
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none animate-in slide-in-from-right-2 duration-200"
                style={{ left: `${selMaxPx}px` }}
              >
                <div
                  className="absolute inset-y-0 left-0 w-1 bg-primary shadow-lg"
                  style={{ boxShadow: '0 0 10px hsl(var(--primary))' }}
                />
                <div
                  className="absolute top-0 left-0 bg-primary text-primary-foreground text-[11px] px-2.5 py-1 rounded-md whitespace-nowrap font-bold shadow-lg"
                  style={{ transform: rightLabelTransform }}
                >
                  {formatTimelineLabel(
                    selMax,
                    rangeStartMs,
                    rangeDurationSeconds,
                    granularity,
                    userTimezone
                  )}
                </div>
                <div
                  className="absolute bottom-7 left-0 w-4 h-4 bg-primary rounded-full shadow-lg"
                  style={{
                    transform: rightLabelTransform,
                    boxShadow: '0 0 8px hsl(var(--primary))',
                  }}
                >
                  <div className="absolute inset-1 bg-primary-foreground rounded-full" />
                </div>
              </div>
            )}

            <div className="absolute bottom-0 inset-x-0 h-11 border-t-2 border-border bg-card">
              {/* Background line */}
              <div className="absolute top-0 inset-x-0 h-0.5 bg-border" />

              {/* Micro ticks (5-minute intervals) */}
              {rulerMicro.map((t) => (
                <div
                  key={`mc-${t}`}
                  className="absolute top-0 w-0.5 bg-muted-foreground/40"
                  style={{
                    left: `${(t / axisSpanSeconds) * effectiveTimelineWidth}px`,
                    height: '6px',
                  }}
                />
              ))}

              {/* Minor ticks */}
              {rulerMinor.map((t) => (
                <div
                  key={`mn-${t}`}
                  className="absolute top-0 w-0.5 bg-border"
                  style={{
                    left: `${(t / axisSpanSeconds) * effectiveTimelineWidth}px`,
                    height: '14px',
                  }}
                />
              ))}

              {/* Major ticks with labels */}
              {rulerMajor.map((t) => (
                <div
                  key={`mj-${t}`}
                  className="absolute top-0 flex flex-col items-center"
                  style={{
                    left: `${(t / axisSpanSeconds) * effectiveTimelineWidth}px`,
                    transform:
                      t === 0
                        ? 'translateX(0)'
                        : t === axisSpanSeconds
                          ? 'translateX(-100%)'
                          : 'translateX(-50%)',
                  }}
                >
                  <div className="w-px h-5 bg-foreground/70" />
                  {visibleMajorLabels.includes(t) && (
                    <span className="text-foreground font-bold text-[11px] mt-1 leading-tight text-center whitespace-nowrap">
                      <span className="block">
                        {formatTimelineLabelParts(
                          t,
                          rangeStartMs,
                          userTimezone
                        ).time}
                      </span>
                      <span className="block text-[10px] text-muted-foreground font-medium">
                        {formatTimelineLabelParts(
                          t,
                          rangeStartMs,
                          userTimezone
                        ).date}
                      </span>
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Event Count Tooltip */}
            {hoverEventCount !== null && hoverPos && (
              <div
                className="absolute bg-foreground text-background text-xs font-semibold px-2 py-1 rounded-md shadow-lg pointer-events-none z-30"
                style={{
                  left: `${Math.min(
                    hoverPos.x,
                    effectiveTimelineWidth - 80
                  )}px`,
                  top: '30px',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                }}
              >
                {hoverEventCount} event{hoverEventCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Video Clips */}
      <div className="px-3 sm:px-4 py-3 pb-4 animate-in slide-in-from-bottom-2 duration-200 delay-200">
        <div className="rounded-lg border-2 border-border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Event Clips
            </span>
            {hasSel && thumbEvents.length > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {thumbEvents.length}
              </span>
            )}
          </div>

          {hasSel ? (
            <div
              className="flex gap-3 overflow-x-auto pb-1 spectra-scrollbar"
              style={{ height: '240px' }}
            >
              {thumbEvents.length > 0 ? (
                thumbEvents.map((ev, index) => (
                  <div
                    key={ev.event_hash}
                    className="shrink-0 w-64 rounded-lg border-2 border-border bg-muted/20 overflow-hidden hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer group animate-in fade-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => {
                      if (ev.chunk_presigned_url) {
                        setSelectedVideo(ev.chunk_presigned_url);
                        setIsVideoOpen(true);
                      }
                    }}
                  >
                    <div className="relative w-full h-36 bg-black">
                      {ev.chunk_presigned_url ? (
                        <>
                          <video
                            src={ev.chunk_presigned_url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                              <Play
                                className="w-6 h-6 text-foreground ml-0.5"
                                fill="currentColor"
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <Camera className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div
                      className="p-2.5 bg-card flex flex-col"
                      style={{ minHeight: '72px' }}
                    >
                      <p className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-1.5 flex-1">
                        {ev.event_title}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {ev.detected_at
                          ? `${formatTimeInTimezone(normalizeApiUtcTimestamp(ev.detected_at), userTimezone, 'date')} ${formatTimeInTimezone(normalizeApiUtcTimestamp(ev.detected_at), userTimezone, 'time')}`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  className="flex-1 flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/10"
                  style={{ height: '240px' }}
                >
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      No events in selected range
                    </p>
                    <p className="text-xs text-muted-foreground/80 mt-1">
                      Try expanding the selected timeline window
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/10"
              style={{ height: '240px' }}
            >
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  Select a range on the timeline to view event clips
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Modal */}
      {isVideoOpen && selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => {
            setIsVideoOpen(false);
            setSelectedVideo(null);
          }}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card/95">
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
                <X className="w-4 h-4" />
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
