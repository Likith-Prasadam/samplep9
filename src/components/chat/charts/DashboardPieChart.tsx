import { useCallback, useState } from 'react';
import { PieChart, Pie, Cell, Sector, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface DashboardPieChartProps {
  data?: ChartData[];
  totalLabel?: string;
  totalValue?: number | string;
  valueSuffix?: string;
}

const DEFAULT_DATA: ChartData[] = [
  { name: 'Person', value: 61, color: '#6366f1' },
  { name: 'Vehicle', value: 30, color: '#10b981' },
  { name: 'Bicycle', value: 7, color: '#f59e0b' },
  { name: 'Traffic Sign', value: 2, color: '#ef4444' },
];

const DEFAULT_COLORS: Record<string, string> = {
  Person: '#6366f1',
  Vehicle: '#10b981',
  Bicycle: '#f59e0b',
  'Traffic Sign': '#ef4444',
};

const DashboardPieChart = ({
  data,
  totalLabel = 'Total',
  totalValue,
  valueSuffix = '%',
}: DashboardPieChartProps) => {
  const hasProvidedData = data !== undefined;
  const rawData = hasProvidedData ? data : DEFAULT_DATA;
  const chartData = (rawData ?? []).map((entry) => ({
    ...entry,
    color: entry.color ?? DEFAULT_COLORS[entry.name] ?? '#6366f1',
  }));

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const computedTotal =
    totalValue ?? chartData.reduce((sum, entry) => sum + entry.value, 0);

  const activeEntry = activeIndex !== null ? chartData[activeIndex] : null;

  const renderActiveShape = useCallback((props: any) => {
    return (
      <Sector
        cx={props.cx}
        cy={props.cy}
        innerRadius={props.innerRadius}
        outerRadius={props.outerRadius + 8}
        startAngle={props.startAngle}
        endAngle={props.endAngle}
        fill={props.fill}
        stroke={props.fill}
        strokeWidth={2}
      />
    );
  }, []);

  const handlePieEnter = useCallback((_: any, index: number, event: any) => {
    setActiveIndex(index);
    if (event?.chartX != null && event?.chartY != null) {
      setTooltipPosition({ x: event.chartX, y: event.chartY });
    } else if (event?.svgX != null && event?.svgY != null) {
      setTooltipPosition({ x: event.svgX, y: event.svgY });
    } else {
      setTooltipPosition(null);
    }
  }, []);

  const handlePieLeave = useCallback(() => {
    setActiveIndex(null);
    setTooltipPosition(null);
  }, []);

  const handleLegendEnter = useCallback((index: number) => {
    setActiveIndex(index);
    setTooltipPosition(null);
  }, []);

  if (!chartData.length) {
    return (
      <div className="w-full flex items-center justify-center h-40 rounded-xl border border-border/40 bg-muted/10">
        <p className="text-sm text-muted-foreground">
          No distribution data available
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center p-2">
      <div className="relative w-full h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              label={false}
              activeIndex={activeIndex ?? undefined}
              activeShape={renderActiveShape}
              onMouseEnter={handlePieEnter}
              onMouseLeave={handlePieLeave}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {/* Render center label manually */}
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
              <tspan
                x="50%"
                dy={0}
                className="text-xs"
                style={{ fontSize: '12px', fill: 'currentColor', opacity: 0.7 }}
              >
                {totalLabel}
              </tspan>
              <tspan
                x="50%"
                dy="1.5em"
                className="text-xl font-bold"
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  fill: 'currentColor',
                }}
              >
                {typeof computedTotal === 'number'
                  ? computedTotal.toLocaleString()
                  : computedTotal}
              </tspan>
            </text>
          </PieChart>
        </ResponsiveContainer>

        {activeEntry && (
          <div
            className="pointer-events-none absolute z-10 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-lg text-sm text-foreground"
            style={
              tooltipPosition
                ? {
                    left: `${tooltipPosition.x}px`,
                    top: `${tooltipPosition.y}px`,
                    transform: 'translate(-50%, -120%)',
                    minWidth: 180,
                  }
                : {
                    left: '50%',
                    top: 16,
                    transform: 'translate(-50%, 0)',
                    minWidth: 180,
                  }
            }
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: activeEntry.color }}
                />
                <span className="font-semibold">{activeEntry.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {activeEntry.value}
                {valueSuffix}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">Value</span>
                <span className="font-semibold text-foreground">
                  {activeEntry.value}
                  {valueSuffix}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">Total</span>
                <span className="font-semibold text-foreground">
                  {typeof computedTotal === 'number'
                    ? computedTotal.toLocaleString()
                    : computedTotal}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category List with Progress Bars */}
      <div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-md">
        {chartData.map((entry, index) => {
          const categoryColor = entry.color ?? '#6366f1';
          const isActive = activeIndex === index;
          return (
            <div
              key={`category-${entry.name}`}
              className={`flex flex-col gap-1.5 rounded-2xl border p-3 transition ${isActive ? 'border-border bg-muted/70 shadow-sm' : 'border-border/10 bg-transparent'}`}
              onMouseEnter={() => handleLegendEnter(index)}
              onMouseLeave={handlePieLeave}
            >
              {/* Category Name and Percentage Row */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {entry.name}
                </span>
                <div className="w-px h-4 bg-border" />
                <span className="text-sm font-medium text-muted-foreground">
                  {entry.value}
                  {valueSuffix}
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, entry.value)}%`,
                    backgroundColor: categoryColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardPieChart;
