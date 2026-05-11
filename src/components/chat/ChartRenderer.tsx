import type { VizPayload } from '@/types/viz';
import { DetectionBarChart } from './charts/DetectionBarChart';
import { DetectionPieChart } from './charts/DetectionPieChart';
import { DetectionLineChart } from './charts/DetectionLineChart';
import { DetectionStatCards } from './charts/DetectionStatCards';

interface ChartRendererProps {
  viz: VizPayload;
}

export function ChartRenderer({ viz }: ChartRendererProps) {
  if (!viz || !viz.chart_type) return null;

  switch (viz.chart_type) {
    case 'bar':
      return <DetectionBarChart data={viz.data} meta={viz.meta} title={viz.title} />;
    case 'pie':
      return <DetectionPieChart data={viz.data} meta={viz.meta} title={viz.title} />;
    case 'line':
      return <DetectionLineChart data={viz.data} meta={viz.meta} title={viz.title} />;
    case 'stat_cards':
      return <DetectionStatCards data={viz.data} meta={viz.meta} title={viz.title} />;
    case 'multi': {
      const subCharts = viz.meta.charts ?? [];
      return (
        <div className="w-full space-y-1">
          {viz.title && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {viz.title}
            </p>
          )}
          {/* stat_cards spans full width; bar + pie side by side */}
          <div className="grid grid-cols-1 gap-4">
            {subCharts.map((subViz, i) => (
              <div
                key={i}
                className={`rounded-xl border border-border/60 bg-muted/20 p-4 ${
                  subViz.chart_type === 'stat_cards' ? 'col-span-1' : ''
                }`}
              >
                <ChartRenderer viz={subViz} />
              </div>
            ))}
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}
