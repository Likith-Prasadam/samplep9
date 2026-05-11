/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3,
  Package,
  Activity,
  TrendingUp,
  Loader2,
  AlertCircle,
  Bell,
  X,
} from 'lucide-react';
import type { YoloInsights } from '../types/batch-analysis';
import { Button } from '@/components/ui/button';

interface BatchInsightsInlineProps {
  insights: YoloInsights | null;
  isLoading: boolean;
  error?: Error | null;
  onClose: () => void;
  notifications?: any[];
}

export function BatchInsightsInline({
  insights,
  isLoading,
  error,
  onClose,
  notifications = [],
}: BatchInsightsInlineProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'alerts'>(
    'analytics'
  );

  // Sort class counts by value (descending)
  const sortedClassCounts = useMemo(() => {
    if (!insights?.classCounts) return [];
    return Object.entries(insights.classCounts)
      .map(([className, count]) => ({ className, count }))
      .sort((a, b) => b.count - a.count);
  }, [insights?.classCounts]);

  return (
    <div className="border-t bg-background">
      {/* Header with tabs */}
      <div className="border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <h3 className="text-sm font-semibold text-foreground">Insights</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex border-t">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'analytics'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </div>
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'alerts'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Bell className="w-4 h-4" />
              Alerts
              {notifications.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-foreground text-background">
                  {notifications.length}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="h-[500px]">
        <div className="p-4">
          {activeTab === 'analytics' ? (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <p className="text-sm text-muted-foreground">
                      Loading analytics...
                    </p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3 max-w-md text-center">
                    <div className="w-14 h-14 rounded-full border flex items-center justify-center">
                      <AlertCircle className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">
                        Unable to Load Analytics
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {error.message ||
                          'The batch may not have been processed yet.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : !insights ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3 max-w-md text-center">
                    <div className="w-14 h-14 rounded-full border flex items-center justify-center">
                      <Package className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">
                        No Analytics Available
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Process this video to generate detection analytics.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs text-muted-foreground uppercase font-semibold">
                          Total Detected
                        </span>
                      </div>
                      <div className="text-2xl font-black text-foreground">
                        {insights.totalObjectsDetected.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Objects
                      </p>
                    </div>

                    <div className="rounded-lg border p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs text-muted-foreground uppercase font-semibold">
                          Categories
                        </span>
                      </div>
                      <div className="text-2xl font-black text-foreground">
                        {Object.keys(insights.classCounts).length}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Classes
                      </p>
                    </div>
                  </div>

                  {/* Class Distribution */}
                  <div>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                      <Package className="w-4 h-4" />
                      <h4 className="text-sm font-semibold text-foreground">
                        Detection Distribution
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {sortedClassCounts.map(
                        ({
                          className,
                          count,
                        }: {
                          className: string;
                          count: number;
                        }) => (
                          <div
                            key={className}
                            className="rounded-lg border p-3 hover:bg-accent/5 transition-colors"
                          >
                            <div className="mb-2">
                              <span className="text-sm font-bold text-foreground capitalize">
                                {className.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-black text-foreground">
                                {count.toLocaleString()}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                detections
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Alerts Tab */}
              {notifications.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3 max-w-md text-center">
                    <div className="w-14 h-14 rounded-full border flex items-center justify-center">
                      <Bell className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">
                        No Alerts
                      </p>
                      <p className="text-xs text-muted-foreground">
                        You'll see detection alerts here when they occur.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification: any, index: number) => (
                    <div
                      key={index}
                      className="rounded-lg border p-3 hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-semibold text-foreground">
                          {notification.title || 'Alert'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {notification.timestamp || 'Just now'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {notification.message ||
                          notification.description ||
                          'Detection alert'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
