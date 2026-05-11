import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3,
  Package,
  Activity,
  TrendingUp,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { YoloInsights } from '../types/batch-analysis';

interface BatchInsightsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insights: YoloInsights | null;
  isLoading: boolean;
  error?: Error | null;
}

export function BatchInsightsDialog({
  open,
  onOpenChange,
  insights,
  isLoading,
  error,
}: BatchInsightsDialogProps) {
  const sortedClassCounts = useMemo(() => {
    if (!insights?.classCounts) return [];
    return Object.entries(insights.classCounts)
      .map(([className, count]) => ({ className, count }))
      .sort((a, b) => b.count - a.count);
  }, [insights?.classCounts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1000px] max-h-[90vh] p-0 gap-0 rounded-2xl shadow-2xl">
        <DialogTitle className="sr-only">Detection Insights</DialogTitle>
        <DialogDescription className="sr-only">
          Object detection analysis and distribution for the selected batch.
        </DialogDescription>
        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border">
              <BarChart3 className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-foreground">
                Detection Insights
              </h2>
              <p className="text-xs text-muted-foreground">
                Object detection analysis and distribution
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-12 h-12 animate-spin text-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Loading insights...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Analyzing detection data
                  </p>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3 max-w-md text-center">
                <div className="w-16 h-16 rounded-full border flex items-center justify-center">
                  <AlertCircle className="w-8 h-8" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground mb-2">
                    Unable to Load Insights
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {error.message ||
                      'The batch may not have been processed yet with YOLO detection.'}
                  </p>
                </div>
              </div>
            </div>
          ) : !insights ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3 max-w-md text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border">
                  <Package
                    className="h-8 w-8 text-muted-foreground"
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground mb-2">
                    No Insights Available
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Process this video with YOLO detection to generate insights.
                    Click the settings icon to configure processing.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">
                      Total Detected
                    </span>
                  </div>
                  <div className="text-3xl font-black text-foreground">
                    {insights.totalObjectsDetected.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Objects</p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">
                      Categories
                    </span>
                  </div>
                  <div className="text-3xl font-black text-foreground">
                    {Object.keys(insights.classCounts).length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Classes</p>
                </div>
              </div>

              {/* Class Distribution */}
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                  <Package className="w-4 h-4" strokeWidth={2} />
                  <h3 className="text-sm font-bold text-foreground">
                    Detection Distribution
                  </h3>
                </div>

                <ScrollArea className="h-[400px] pr-3">
                  <div className="grid grid-cols-2 gap-2">
                    {sortedClassCounts.map(({ className, count }) => (
                      <div
                        key={className}
                        className="rounded-lg border border-border p-3 transition-colors hover:bg-accent/5"
                      >
                        <div className="mb-2">
                          <span className="text-sm font-bold capitalize text-foreground">
                            {className.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-foreground">
                            {count.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            detections
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
