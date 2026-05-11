import React, { useMemo, useState, useRef, useEffect } from 'react';
import { subHours, subMinutes } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DetectionLineChart } from '@/components/chat/charts/DetectionLineChart';
// import { DetectionScatterChart } from '@/components/chat/charts/DetectionScatterChart';
import { DetectionStatCards } from '@/components/chat/charts/DetectionCards';
import DashboardPieChart from '@/components/chat/charts/DashboardPieChart';
import { DashboardBarChart } from '@/components/chat/charts/DashboardBarChart';
// import DashboardHeatMap from '@/components/chat/charts/DashboardHeatMap';
// import FacilityMap from '@/features/dashboard/detention-panel/components/facility-map';
import type { VizMeta } from '@/types/viz';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Loader2, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  fetchDynamicInsights,
  type InsightsGranularity,
  type InsightsResponse,
} from '@/services/dynamic-insights-api';

type TimeRange = 'last_5m' | 'last_15m' | 'last_30m' | 'last_1h' | 'custom';

const rangeOptions: { value: TimeRange; label: string }[] = [
  { value: 'last_5m', label: 'Last 5 minutes' },
  { value: 'last_15m', label: 'Last 15 minutes' },
  { value: 'last_30m', label: 'Last 30 minutes' },
  { value: 'last_1h', label: 'Last 1 hour' },
  { value: 'custom', label: 'Custom range' },
];

const TimeRangeDropdown = ({
  selectedRange,
  onRangeChange,
  customHours,
  onCustomHoursChange,
  onApplyCustomHours,
}: {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  customHours: string;
  onCustomHoursChange: (value: string) => void;
  onApplyCustomHours: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = rangeOptions.find(option => option.value === selectedRange);

  const [durationValue, setDurationValue] = useState(customHours);

  const handleSelect = (option: typeof rangeOptions[0]) => {
    onRangeChange(option.value);
    setIsOpen(false);
  };

  const handleApplyDuration = () => {
    if (!durationValue.trim()) return;
    onCustomHoursChange(durationValue.trim());
    onApplyCustomHours();
    setIsOpen(false);
  };

  useEffect(() => {
    setDurationValue(customHours);
  }, [customHours]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative min-w-[220px]" ref={dropdownRef}>
      {/* Dropdown Button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-full px-3 py-2 text-sm bg-background border border-input rounded-md hover:bg-accent hover:text-accent-foreground flex items-center justify-between group transition-colors"
      >
        <span className="font-medium">{selectedOption?.label || 'Select time range'}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute w-full mt-1 rounded-md border border-border bg-popover shadow-md z-50"
          >
            {rangeOptions.map((option, index) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                onClick={() => handleSelect(option)}
                className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center justify-between group transition-colors"
              >
                <div className="font-medium text-sm">{option.label}</div>
                {selectedRange === option.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check className="w-4 h-4" />
                  </motion.div>
                )}
              </motion.button>
            ))}
            <div className="border-t border-border px-3 py-3 bg-background">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Enter Duration
              </p>
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="number"
                  min="0"
                  placeholder="Enter hours"
                  value={durationValue}
                  onChange={(event) => setDurationValue(event.target.value)}
                  className="min-w-0 flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleApplyDuration}
                  className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DEFAULT_SERIES_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#f97316',
  '#a855f7',
];

const TIME_RANGE_MINUTES: Record<Exclude<TimeRange, 'custom'>, number> = {
  last_5m: 5,
  last_15m: 15,
  last_30m: 30,
  last_1h: 60,
};

const formatBucketLabel = (value: string, granularity?: InsightsGranularity) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const formatOptions: Intl.DateTimeFormatOptions =
    granularity === '1day'
      ? { month: 'short', day: '2-digit', timeZone: 'UTC' }
      : { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' };
  return new Intl.DateTimeFormat('en-US', formatOptions).format(parsed);
};

type BatchDynamicInsightsDashboardProps = {
  sourceHash?: string;
};

const LiveDynamicInsightsDashboard: React.FC<BatchDynamicInsightsDashboardProps> = ({
  sourceHash,
}) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('last_1h');
  const [customHours, setCustomHours] = useState('');
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const resolvedRange = useMemo(() => {
    const now = new Date();
    if (selectedRange === 'custom') {
      const hours = Number(customHours);
      if (Number.isFinite(hours) && hours > 0) {
        return { from: subHours(now, hours), to: now };
      }
      return { from: null, to: null };
    }

    const minutes = TIME_RANGE_MINUTES[selectedRange];
    return { from: subMinutes(now, minutes), to: now };
  }, [selectedRange, customHours, refreshKey]);

  const resolvedGranularity = useMemo<InsightsGranularity>(() => {
    const minutes =
      selectedRange === 'custom'
        ? Number(customHours) * 60
        : TIME_RANGE_MINUTES[selectedRange];

    if (!Number.isFinite(minutes) || minutes <= 0) return '1hour';
    if (minutes >= 24 * 60) return '1day';
    if (minutes >= 60) return '1hour';
    return '5min';
  }, [selectedRange, customHours]);

  const canFetch = Boolean(sourceHash && resolvedRange.from && resolvedRange.to);

  useEffect(() => {
    if (!canFetch || !resolvedRange.from || !resolvedRange.to) {
      if (!sourceHash) {
        setError('Select a batch video to load insights.');
      }
      return;
    }

    if (resolvedRange.from > resolvedRange.to) {
      setError('Start time must be before end time.');
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchDynamicInsights({
      source_hash: sourceHash ?? '',
      source_type: 'batch',
      from_ts: resolvedRange.from.toISOString(),
      to_ts: resolvedRange.to.toISOString(),
      granularity: resolvedGranularity,
    })
      .then((data) => {
        if (isMounted) {
          setInsights(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load insights.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    canFetch,
    resolvedRange.from,
    resolvedRange.to,
    resolvedGranularity,
    refreshKey,
    sourceHash,
  ]);

  const summaryStats = insights?.summary_stats;
  const timeSeries = insights?.time_series ?? [];
  const classTotals = insights?.class_totals ?? [];
  const breakdown = summaryStats?.class_breakdown ?? [];
  const totalDetections = summaryStats?.total_detections ?? 0;

  const classColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    classTotals.forEach((item) => {
      if (item.color) map[item.class_label] = item.color;
    });
    breakdown.forEach((item) => {
      if (item.color && !map[item.class_label]) {
        map[item.class_label] = item.color;
      }
    });
    return map;
  }, [classTotals, breakdown]);

  const statCardsData = useMemo(() => {
    const source = breakdown.length ? breakdown : classTotals;
    return source.map((item, index) => ({
      name: item.class_label,
      value: item.count,
      color:
        item.color ??
        classColorMap[item.class_label] ??
        DEFAULT_SERIES_COLORS[index % DEFAULT_SERIES_COLORS.length],
    }));
  }, [breakdown, classTotals, classColorMap]);

  const pieChartData = useMemo(() => {
    if (breakdown.length) {
      return breakdown.map((item, index) => ({
        name: item.class_label,
        value: item.percentage,
        color:
          item.color ??
          classColorMap[item.class_label] ??
          DEFAULT_SERIES_COLORS[index % DEFAULT_SERIES_COLORS.length],
      }));
    }

    return classTotals.map((item, index) => ({
      name: item.class_label,
      value:
        totalDetections > 0
          ? Number(((item.count / totalDetections) * 100).toFixed(1))
          : 0,
      color:
        item.color ??
        classColorMap[item.class_label] ??
        DEFAULT_SERIES_COLORS[index % DEFAULT_SERIES_COLORS.length],
    }));
  }, [breakdown, classTotals, classColorMap, totalDetections]);

  const barChartData = useMemo(() => {
    const source = classTotals.length ? classTotals : breakdown;
    return source.map((item, index) => ({
      label: item.class_label,
      count: item.count,
      color:
        item.color ??
        classColorMap[item.class_label] ??
        DEFAULT_SERIES_COLORS[index % DEFAULT_SERIES_COLORS.length],
    }));
  }, [classTotals, breakdown, classColorMap]);

  const timeSeriesSeries = useMemo(() => {
    const keySet = new Set<string>();
    timeSeries.forEach((bucket) => {
      Object.keys(bucket.class_counts || {}).forEach((key) => keySet.add(key));
    });
    const orderedKeys = classTotals.length
      ? classTotals.map((item) => item.class_label)
      : breakdown.length
        ? breakdown.map((item) => item.class_label)
        : Array.from(keySet);

    return orderedKeys.map((key, index) => ({
      key,
      color:
        classColorMap[key] ??
        DEFAULT_SERIES_COLORS[index % DEFAULT_SERIES_COLORS.length],
    }));
  }, [timeSeries, classTotals, breakdown, classColorMap]);

  const timeSeriesRows = useMemo(() => {
    return timeSeries.map((bucket) => ({
      segment: formatBucketLabel(bucket.bucket_start, resolvedGranularity),
      ...bucket.class_counts,
    }));
  }, [timeSeries, resolvedGranularity]);

  const lineChartMeta: VizMeta = useMemo(
    () => ({
      x_axis_label: 'Time (UTC)',
      y_axis_label: 'Detections',
      dot: true,
      stroke_width: 2,
      rows: timeSeriesRows,
      series: timeSeriesSeries,
    }),
    [timeSeriesRows, timeSeriesSeries]
  );

  const statCardsMeta: VizMeta = useMemo(
    () => ({ total_objects: totalDetections }),
    [totalDetections]
  );

  const formattedPeakWindow = useMemo(() => {
    if (!summaryStats?.peak_window) return '—';
    const parsed = new Date(summaryStats.peak_window);
    if (Number.isNaN(parsed.getTime())) return summaryStats.peak_window;
    return parsed.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
  }, [summaryStats?.peak_window]);

  return (
    <Card className="flex flex-col h-full">
      {/* Modern Dashboard Header */}
      <div className="bg-white dark:bg-slate-900">
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 md:px-6">
          {/* Header With Icon */}
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Icon Container */}
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900 dark:bg-opacity-30">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-indigo-600 dark:text-indigo-400"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>
            </div>

            {/* Text Content */}
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Dynamic Insights Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time overview of detected objects and insights
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Timeline</span>
            <TimeRangeDropdown
              selectedRange={selectedRange}
              onRangeChange={(range) => {
                setSelectedRange(range);
              }}
              customHours={customHours}
              onCustomHoursChange={setCustomHours}
              onApplyCustomHours={() => {
                setSelectedRange('custom');
                setRefreshKey((prev) => prev + 1);
              }}
            />
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Refresh"
                  onClick={() => setRefreshKey((prev) => prev + 1)}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <img
                    src="/loop-right-ai-line.svg"
                    alt=""
                    aria-hidden="true"
                    className="h-4 w-4 dark:brightness-0 dark:invert"
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                Refresh
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col overflow-hidden px-4 py-0 sm:px-5 md:px-6">
        <div className="flex-1 overflow-y-auto pr-2">
          {error && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <section className="pt-4 border border-border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 p-6">
            {/* Detection Summary Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                
                {/* Text Content */}
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Detection Summary</h2>
                  {/* <p className="text-sm text-gray-600">Object counts and distribution</p> */}
                </div>
              </div>
              
              {/* Total Objects Count */}
              <div className="flex items-center gap-1  px-4 py-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Objects:</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {statCardsMeta.total_objects ?? statCardsData.reduce((sum, item) => sum + item.value, 0)}
                </p>
              </div>
            </div>

            {/* Detection Stat Cards */}
            <div className="overflow-x-auto">
              <DetectionStatCards
                title=""
                data={statCardsData}
                meta={statCardsMeta}
                hideTotal
              />
            </div>
          </section>

          {/* Live Insights Banner */}
          <div className="mt-6 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-2 py-2 sm:px-5 md:px-6">
            <div className="flex items-center justify-between gap-4">
              {/* Left Section */}
              <div className="flex items-center gap-4">
                {/* Icon Container */}
                <div className="flex flex-shrink-0 items-center justify-center w-7 h-7 rounded-md bg-indigo-100 dark:bg-indigo-900 dark:bg-opacity-30">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400">
                    <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
                    <path d="M20 2v4" />
                    <path d="M22 4h-4" />
                    <circle cx="4" cy="20" r="2" />
                  </svg>
                </div>

                {/* Text Content */}
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Batch insights</h3>
                  </div>

                  {/* Vertical Divider */}
                  <div className="h-8 w-px bg-gray-300 dark:bg-slate-600" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Data updates in real-time</p>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-2">
                <div className="flex h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs font-semibold text-gray-700 dark:text-green-400">Batch</span>
              </div>
            </div>
          </div>

          {summaryStats && (
            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="border border-border bg-card shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dominant class</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {summaryStats.dominant_class}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summaryStats.dominant_class_count.toLocaleString()} detections
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-border bg-card shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Detection rate</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {summaryStats.detection_rate_per_minute.toFixed(2)}
                    <span className="text-sm font-medium text-muted-foreground">/min</span>
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-border bg-card shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Peak window</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {formattedPeakWindow}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summaryStats.peak_window_count.toLocaleString()} detections
                  </p>
                </CardContent>
              </Card>
            </section>
          )}

          <section className="mt-6">
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader className="pb-0 px-4 sm:px-5">
                {/* <CardTitle className="text-sm font-semibold">Object Detection Count</CardTitle> */}
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <DashboardBarChart
                  title="Detections Over Time"
                  timeSeriesRows={timeSeriesRows}
                  timeSeriesSeries={timeSeriesSeries}
                  timeSeriesData={barChartData}
                  xAxisKey="segment"
                  xAxisLabel="Time (UTC)"
                  yAxisLabel="Detections"
                  showCategoryResults={false}
                />
              </CardContent>
            </Card>

            
          </section>
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader className="pb-0 px-4 sm:px-5">
              <CardTitle className="text-sm font-semibold">Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <DashboardPieChart
                data={pieChartData}
                totalLabel="Total detections"
                totalValue={summaryStats?.total_detections ?? 0}
                valueSuffix="%"
              />
            </CardContent>
          </Card>

          {/* <section className="mt-6 grid gap-6 xl:grid-cols-2">
         
              <CardContent className="p-0">
                <DashboardHeatMap zones={heatmapZones} />
              </CardContent>
           
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader className="pb-2 px-4 sm:px-5">
                <CardTitle className="text-sm font-semibold">Speed vs. Detection Time</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <DetectionScatterChart
                  title="Speed vs. detection time"
                  data={dashboardData.scatterChartData}
                  meta={scatterChartMeta}
                />
              </CardContent>
            </Card>
          </section> */}

          <section className="mt-6">
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader className="pb-2 px-4 sm:px-5">
                <CardTitle className="text-sm font-semibold">Activity Over Time</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <DetectionLineChart
                  title="Hourly detections"
                  data={[]}
                  meta={lineChartMeta}
                />
              </CardContent>
            </Card>
          </section>

          {/* Peak Windows - show peaks from API response */}
          <section className="mt-6">
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader className="pb-2 px-4 sm:px-5">
                <CardTitle className="text-sm font-semibold">Peak Windows</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                {insights?.peak_windows?.length ? (
                  <div className="space-y-3">
                    {insights.peak_windows.map((window) => (
                      <div key={window.bucket_start} className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {formatBucketLabel(window.bucket_start, resolvedGranularity)} UTC
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Top class: {window.top_class}
                          </p>
                          {window.class_counts && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {Object.entries(window.class_counts)
                                .sort(([, left], [, right]) => right - left)
                                .map(([label, count]) => (
                                  <span
                                    key={label}
                                    className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
                                  >
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: classColorMap[label] ?? '#6366f1' }} />
                                    <span className="font-semibold text-foreground">
                                      {label}
                                    </span>
                                    <span>{count.toLocaleString()}</span>
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">
                            {window.total_count.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">detections</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No peak windows available.</p>
                )}
              </CardContent>
            </Card>
          </section>

          
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveDynamicInsightsDashboard;
