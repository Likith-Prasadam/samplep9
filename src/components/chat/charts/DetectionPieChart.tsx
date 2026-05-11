import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { VizDataPoint, VizMeta } from '@/types/viz';
import { ChartTooltip, tooltipContentStyle } from './ChartTooltip';

interface DetectionPieChartProps {
  title: string;
  data: VizDataPoint[];
  meta: VizMeta;
}

const DEFAULT_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];

export function DetectionPieChart({ title, data, meta }: DetectionPieChartProps) {
  const innerRadius = Math.min(meta.inner_radius ?? 55, 55);
  const outerRadius = Math.min(meta.outer_radius ?? 85, 85);
  const showLegend = meta.show_legend ?? true;
  const isDonut = innerRadius > 0;
  const total = meta.total_objects ?? data.reduce((s, d) => s + d.value, 0);
  const chartHeight = showLegend ? 240 : 180;

  return (
    <div className="w-full" style={{ cursor: 'pointer' }}>
      {title && (
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {title}
        </p>
      )}

      <div className="relative" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart margin={{ top: 16, right: 16, bottom: 8, left: 16 }}>
            <Pie
              data={data}
              cx="50%"
              cy={showLegend ? '44%' : '50%'}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              dataKey="value"
              paddingAngle={2}
              labelLine={false}
              label={false}
              stroke="transparent"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                  stroke="transparent"
                  style={{ cursor: 'pointer', outline: 'none' }}
                />
              ))}
            </Pie>
            <Tooltip
              content={<ChartTooltip total={total} unit="detections" showLabel={false} />}
              contentStyle={tooltipContentStyle}
              wrapperStyle={{ outline: 'none' }}
            />
            {showLegend && (
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  fontSize: 11,
                  paddingTop: '8px',
                  lineHeight: '1.9',
                  cursor: 'default',
                }}
                formatter={(value) => (
                  <span style={{ color: 'hsl(var(--foreground))', fontSize: 11 }}>
                    {value}
                  </span>
                )}
              />
            )}
          </PieChart>
        </ResponsiveContainer>

        {/* Donut center — pinned exactly to the pie's cy */}
        {isDonut && (
          <div
            className="absolute pointer-events-none flex flex-col items-center gap-0.5"
            style={{
              top: showLegend ? '44%' : '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className="text-2xl font-bold text-foreground tabular-nums leading-none">
              {total.toLocaleString()}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
              total
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
