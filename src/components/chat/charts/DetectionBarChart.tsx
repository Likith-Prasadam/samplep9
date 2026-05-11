import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import type { VizDataPoint, VizMeta } from '@/types/viz';
import { ChartTooltip, tooltipContentStyle } from './ChartTooltip';
import { useEffect, useState } from 'react';

interface DetectionBarChartProps {
  title: string;
  data: VizDataPoint[];
  meta: VizMeta;
}

const DEFAULT_COLOR = '#6366f1';

export function DetectionBarChart({ title, data, meta }: DetectionBarChartProps) {
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

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const wantHorizontalBars = (meta.layout ?? 'vertical') === 'vertical';
  const longestLabel = data.reduce((max, d) => Math.max(max, d.name.length), 0);
  const leftMargin = wantHorizontalBars ? Math.min(longestLabel * 6 + 8, 110) : 8;
  const total = meta.total_objects ?? data.reduce((s, d) => s + d.value, 0);
  const chartHeight = wantHorizontalBars
    ? Math.max(data.length * 40 + 30, 110)
    : 220;

  const labelColor = isDark ? '#ffffff' : 'hsl(var(--foreground))';

  const sharedTooltip = (
    <Tooltip
      content={<ChartTooltip total={total} unit="detections" showLabel={false} />}
      contentStyle={tooltipContentStyle}
      wrapperStyle={{ outline: 'none' }}
      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.25 }}
    />
  );

  return (
    <div className="w-full" style={{ cursor: 'crosshair' }}>
      {title && (
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          {title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={chartHeight}>
        {wantHorizontalBars ? (
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 4, right: 48, left: 0, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.3}
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: 'var(--chart-axis-tick-muted, hsl(var(--muted-foreground)))' }}
              tickLine={false}
              axisLine={false}
              hide
            />
            <YAxis
              type="category"
              dataKey="name"
              width={Math.min(longestLabel * 8 + 12, 95)}
              tick={{ fontSize: 11, fill: 'var(--chart-axis-tick, hsl(var(--foreground)))', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            {sharedTooltip}
            <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={32}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color ?? DEFAULT_COLOR} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                style={{ fontSize: 12, fill: labelColor, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        ) : (
          <BarChart
            layout="horizontal"
            data={data}
            margin={{ top: 16, right: 16, left: leftMargin, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.3}
              vertical={false}
            />
            <XAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: 'var(--chart-axis-tick, hsl(var(--foreground)))' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="number"
              width={40}
              tick={{ fontSize: 11, fill: 'var(--chart-axis-tick-muted, hsl(var(--muted-foreground)))' }}
              tickLine={false}
              axisLine={false}
            />
            {sharedTooltip}
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color ?? DEFAULT_COLOR} />
              ))}
              <LabelList
                dataKey="value"
                position="top"
                style={{ fontSize: 12, fill: labelColor, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
