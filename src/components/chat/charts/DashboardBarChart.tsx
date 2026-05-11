import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useEffect, useState } from 'react';
import type { SeriesDescriptor } from '@/types/viz';
// import { ChartTooltip, tooltipContentStyle } from './ChartTooltip';

interface DetectionData {
  label: string;
  count: number;
  color: string;
}

interface CategoryResult {
  label: string;
  percentage: number;
  color: string;
}

interface DashboardBarChartProps {
  timeSeriesData?: DetectionData[];
  timeSeriesRows?: Record<string, unknown>[];
  timeSeriesSeries?: SeriesDescriptor[];
  xAxisKey?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showCategoryResults?: boolean;
  categoryResults?: CategoryResult[];
  title?: string;
}

const DEFAULT_DETECTION_DATA: DetectionData[] = [
  { label: 'Person', count: 148, color: '#6366f1' },           // Indigo
  { label: 'Vehicle', count: 72, color: '#10b981' },           // Green
  { label: 'Bicycle', count: 18, color: '#f59e0b' },           // Amber
  { label: 'Traffic Sign', count: 6, color: '#ef4444' },       // Red
];

const DEFAULT_CATEGORY_RESULTS: CategoryResult[] = [
  { label: 'Person', percentage: 61, color: '#6366f1' },      // Indigo
  { label: 'Vehicle', percentage: 30, color: '#10b981' },     // Green
  { label: 'Bicycle', percentage: 7, color: '#f59e0b' },      // Amber
  { label: 'Traffic Sign', percentage: 2, color: '#ef4444' }, // Red
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-2">
        {label && (
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            {label}
          </p>
        )}
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-2">
            <span className="text-xs text-foreground">{entry.name}</span>
            <span className="text-xs font-semibold text-foreground">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const renderRotatedTick = (props: {
  x?: number;
  y?: number;
  payload?: { value?: string | number };
}) => {
  const { x = 0, y = 0, payload } = props;
  const value = payload?.value ?? '';
  const parsed = new Date(value);
  const label = !Number.isNaN(parsed.getTime())
    ? parsed.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : String(value);

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="end"
        fill="hsl(var(--foreground))"
        fontSize={10}
        transform="rotate(-35)"
      >
        {label}
      </text>
    </g>
  );
};

export function DashboardBarChart({
  timeSeriesData,
  timeSeriesRows,
  timeSeriesSeries,
  xAxisKey = 'label',
  xAxisLabel,
  yAxisLabel,
  showCategoryResults = true,
  categoryResults = DEFAULT_CATEGORY_RESULTS,
  title = 'Object Detection Distribution',
}: DashboardBarChartProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark mode is enabled
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const labelColor = isDark ? '#f1f5f9' : 'hsl(var(--foreground))';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(203, 213, 225, 0.3)';
  const axisColor = isDark ? '#94a3b8' : 'hsl(var(--muted-foreground))';

  const formatYAxis = (value: number) => {
    return `${value}`;
  };

  const formatXAxis = (value: string | number) => {
    if (typeof value === 'number') {
      if (value > 1e11) {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
          return date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      }
      return String(value);
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return value;
  };

  const hasProvidedSeriesData = timeSeriesData !== undefined;
  const chartData = hasProvidedSeriesData
    ? (timeSeriesData ?? [])
    : DEFAULT_DETECTION_DATA;

  const hasTimeSeries =
    (timeSeriesRows?.length ?? 0) > 0 &&
    (timeSeriesSeries?.length ?? 0) > 0;

  if (!hasTimeSeries && chartData.length === 0) {
    return (
      <div className="w-full flex items-center justify-center h-40 rounded-xl border border-border/40 bg-muted/10">
        <p className="text-sm text-muted-foreground">No distribution data available</p>
      </div>
    );
  }

  return (
    <div className="w-120 space-y-8">
      {/* Bar Chart Section */}
      <div className="w-full overflow-hidden">
        {title && (
          <p className="text-sm font-semibold text-foreground mb-4">
            {title}
          </p>
        )}
        <ResponsiveContainer width="100%" height={280}>
          {hasTimeSeries ? (
            <BarChart
              data={timeSeriesRows}
              margin={{ top: 6, right: 0, left: 30, bottom: 36 }}
              barGap={4}
              barCategoryGap="6%"
            >
              <CartesianGrid
                strokeDasharray="4 4"
                stroke={gridColor}
                vertical={false}
                opacity={0.6}
              />
              <XAxis
                dataKey={xAxisKey}
                tick={renderRotatedTick}
                axisLine={false}
                tickLine={false}
                interval={0}
                tickMargin={12}
                padding={{ left: 30, right: 0 }}
                height={48}
                label={
                  xAxisLabel
                    ? { value: xAxisLabel, position: 'insideBottom', offset: -18, fontSize: 11, fill: axisColor }
                    : undefined
                }
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fill: axisColor, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={70}
                label={
                  yAxisLabel
                    ? { value: yAxisLabel, angle: -90, position: 'insideLeft', offset: 0, fontSize: 11, fill: axisColor }
                    : undefined
                }
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Legend
                verticalAlign="top"
                height={28}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingBottom: 4 }}
                formatter={(value) => (
                  <span style={{ color: 'hsl(var(--foreground))', fontSize: 11 }}>{value}</span>
                )}
              />
              {timeSeriesSeries?.map((series) => (
                <Bar
                  key={series.key}
                  dataKey={series.key}
                  name={series.key}
                  stackId="stack"
                  fill={series.color}
                  maxBarSize={60}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          ) : (
            <BarChart
              data={chartData}
              margin={{ top: 12, right: 20, left: 0, bottom: 12 }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                stroke={gridColor}
                vertical={false}
                opacity={0.6}
              />
              <XAxis
                dataKey="label"
                tickFormatter={formatXAxis}
                tick={{ fill: labelColor, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fill: axisColor, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar
                dataKey="count"
                radius={[6, 6, 0, 0]}
                maxBarSize={60}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Category Results Section */}
      {showCategoryResults && !hasTimeSeries && (
        <div className="w-full">
        <p className="text-sm font-semibold text-foreground mb-4">
          Category Results
        </p>
        <div className="grid grid-cols-2 gap-6">
          {categoryResults.map((category) => (
            <div key={`category-${category.label}`} className="flex items-center gap-3">
              {/* Color indicator circle */}
              <div
                className="w-2 h-2 square-full shrink-0"
                style={{ backgroundColor: category.color }}
              />
              {/* Label and percentage */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-sm text-foreground font-medium">
                  {category.label}
                </span>
                <span className="text-sm text-muted-foreground">
                  – {category.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}

export default DashboardBarChart;
