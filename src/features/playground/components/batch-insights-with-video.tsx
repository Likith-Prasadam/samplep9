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
  HardHat,
  Glasses,
  ShieldAlert,
  Users,
  CheckCircle2,
  XCircle,
  Video,
  Play,
  AlertTriangle,
} from 'lucide-react';
import type { YoloInsights, PpeAstecInsights } from '../types/batch-analysis';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BatchInsightsWithVideoProps {
  insights: YoloInsights | PpeAstecInsights | null;
  isLoading: boolean;
  error?: Error | null;
  onClose: () => void;
  notifications?: any[];
}

export function BatchInsightsWithVideo({
  insights,
  isLoading,
  error,
  onClose,
  notifications = [],
}: BatchInsightsWithVideoProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'alerts' | 'videos'>(
    'analytics'
  );
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const insightType = insights?.__typename;
  const isYolo = insightType === 'YoloInsights';
  const isPPE = insightType === 'PpeAstecInsights';

  // Sort class counts for YOLO (descending)
  const sortedClassCounts = useMemo(() => {
    if (!isYolo || !insights) return [];
    const yoloInsights = insights as YoloInsights;
    return Object.entries(yoloInsights.classCounts || {})
      .map(([className, count]) => ({ className, count }))
      .sort((a, b) => b.count - a.count);
  }, [insights, isYolo]);

  // PPE data processing
  const ppeData = useMemo(() => {
    if (!isPPE || !insights) return null;
    const ppeInsights = insights as PpeAstecInsights;

    const workerCount = ppeInsights.ppeSummary?.persons_detected || 0;
    const totalDetectedPPE =
      (ppeInsights.ppeSummary?.hard_hat || 0) +
      (ppeInsights.ppeSummary?.goggles || 0) +
      (ppeInsights.ppeSummary?.safety_vest || 0) +
      (ppeInsights.ppeSummary?.gloves || 0) +
      (ppeInsights.ppeSummary?.safety_shoes || 0);
    const expectedPPEItems = workerCount * 5;
    const missingPPEItems = Math.max(expectedPPEItems - totalDetectedPPE, 0);

    const ppeItems = [
      {
        icon: <HardHat className="w-4 h-4" />,
        label: 'Hard Hat',
        count: ppeInsights.ppeSummary?.hard_hat || 0,
        color: 'text-yellow-600 dark:text-yellow-400',
      },
      {
        icon: <Glasses className="w-4 h-4" />,
        label: 'Goggles',
        count: ppeInsights.ppeSummary?.goggles || 0,
        color: 'text-sky-600 dark:text-sky-400',
      },
      {
        icon: <ShieldAlert className="w-4 h-4" />,
        label: 'Safety Vest',
        count: ppeInsights.ppeSummary?.safety_vest || 0,
        color: 'text-orange-600 dark:text-orange-400',
      },
      {
        icon: <span className="text-sm leading-none">🧤</span>,
        label: 'Gloves',
        count: ppeInsights.ppeSummary?.gloves || 0,
        color: 'text-green-600 dark:text-green-400',
      },
      {
        icon: <span className="text-sm leading-none">👢</span>,
        label: 'Safety Shoes',
        count: ppeInsights.ppeSummary?.safety_shoes || 0,
        color: 'text-purple-600 dark:text-purple-400',
      },
    ];

    return {
      workerCount,
      totalDetectedPPE,
      missingPPEItems,
      ppeItems,
      perPersonSummary: ppeInsights.perPersonPpeSummary || {},
    };
  }, [insights, isPPE]);

  const videoUrls = insights?.videoPresignedUrls || [];
  const hasVideos = videoUrls.length > 0;

  return (
    <>
      <div className="border-t bg-background">
        {/* Header with tabs */}
        <div className="border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <h3 className="text-sm font-semibold text-foreground">
                {isPPE ? 'PPE Safety Insights' : 'Detection Insights'}
              </h3>
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
            {hasVideos && (
              <button
                onClick={() => setActiveTab('videos')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'videos'
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Video className="w-4 h-4" />
                  Videos ({videoUrls.length})
                </div>
              </button>
            )}
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
                ) : isYolo ? (
                  <div className="space-y-4">
                    {/* YOLO Key Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-4 h-4" />
                          <span className="text-xs text-muted-foreground uppercase font-semibold">
                            Total Detected
                          </span>
                        </div>
                        <div className="text-2xl font-black text-foreground">
                          {(
                            insights as YoloInsights
                          ).modeTotalObjectsDetected.toLocaleString()}
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
                          {
                            Object.keys((insights as YoloInsights).classCounts)
                              .length
                          }
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
                ) : isPPE && ppeData ? (
                  <div className="space-y-4">
                    {/* PPE Quick Numbers */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 p-2.5 flex flex-col items-center">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Users className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <div className="text-[10px] text-blue-700/70 dark:text-blue-500 uppercase font-medium tracking-wide">
                            Persons
                          </div>
                        </div>
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400 leading-none mt-0.5">
                          {ppeData.workerCount}
                        </div>
                      </div>
                      <div className="rounded-lg border bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 p-2.5 flex flex-col items-center">
                        <div className="flex items-center gap-1 mb-0.5">
                          <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                          <div className="text-[10px] text-green-700/70 dark:text-green-500 uppercase font-medium tracking-wide">
                            Detected
                          </div>
                        </div>
                        <div className="text-xl font-bold text-green-600 dark:text-green-400 leading-none mt-0.5">
                          {ppeData.totalDetectedPPE}
                        </div>
                      </div>
                      <div className="rounded-lg border bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 p-2.5 flex flex-col items-center">
                        <div className="flex items-center gap-1 mb-0.5">
                          <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                          <div className="text-[10px] text-red-700/70 dark:text-red-500 uppercase font-medium tracking-wide">
                            Missing
                          </div>
                        </div>
                        <div className="text-xl font-bold text-red-600 dark:text-red-400 leading-none mt-0.5">
                          {ppeData.missingPPEItems}
                        </div>
                      </div>
                    </div>

                    {/* PPE Breakdown */}
                    <div className="rounded-lg border divide-y">
                      <div className="px-3 py-2 bg-muted/40">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          PPE Items Detected
                        </span>
                      </div>
                      {ppeData.ppeItems.map(({ icon, label, count, color }) => {
                        const rate =
                          ppeData.workerCount > 0
                            ? Math.round((count / ppeData.workerCount) * 100)
                            : 0;
                        return (
                          <div
                            key={label}
                            className="flex items-center gap-2.5 px-3 py-2"
                          >
                            <span className={color}>{icon}</span>
                            <span className="text-xs text-foreground flex-1">
                              {label}
                            </span>
                            <span className="text-xs font-bold text-green-600 dark:text-green-400 w-6 text-right">
                              {count}
                            </span>
                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-400 rounded-full"
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Worker Compliance Table */}
                    {Object.keys(ppeData.perPersonSummary).length > 0 && (
                      <div className="rounded-lg border overflow-hidden">
                        <div className="px-3 py-2 bg-muted/40 border-b">
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Worker Compliance (
                            {Object.keys(ppeData.perPersonSummary).length}{' '}
                            workers)
                          </span>
                        </div>

                        {/* Table Header */}
                        <div className="grid grid-cols-[50px_70px_repeat(5,1fr)] px-3 py-2 bg-muted/20 border-b text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          <span>ID</span>
                          <span className="text-center">Issues</span>
                          <span className="text-center">Hat</span>
                          <span className="text-center">Goggles</span>
                          <span className="text-center">Vest</span>
                          <span className="text-center">Gloves</span>
                          <span className="text-center">Shoes</span>
                        </div>

                        {/* Table Body */}
                        <div className="max-h-[200px] overflow-y-auto divide-y">
                          {Object.entries(ppeData.perPersonSummary).map(
                            ([personId, ppe]) => {
                              const items: [string, boolean][] = [
                                ['hardhat', ppe.hardhat],
                                ['goggles', ppe.goggles],
                                ['safety_vest', ppe.safety_vest],
                                ['gloves', ppe.gloves],
                                ['shoes', ppe.shoes],
                              ];
                              const worn = items.filter(([, v]) => v).length;

                              return (
                                <div
                                  key={personId}
                                  className="grid grid-cols-[50px_70px_repeat(5,1fr)] px-3 py-2 items-center hover:bg-muted/30 transition-colors"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <div
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                        worn === 5
                                          ? 'bg-green-500 text-white'
                                          : 'bg-muted text-muted-foreground'
                                      }`}
                                    >
                                      {personId}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-center">
                                    <span className="text-xs font-bold text-red-500 dark:text-red-400">
                                      {5 - worn}
                                    </span>
                                  </div>

                                  {items.map(([key, worn]) => (
                                    <div
                                      key={key}
                                      className="flex justify-center"
                                    >
                                      {worn ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                      ) : (
                                        <XCircle className="w-4 h-4 text-red-400/60" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            ) : activeTab === 'videos' ? (
              <>
                {videoUrls.length === 0 ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-3 max-w-md text-center">
                      <div className="w-14 h-14 rounded-full border flex items-center justify-center">
                        <Video className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">
                          No Videos Available
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Processed videos will appear here.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {videoUrls.map((url, index) => (
                      <div
                        key={index}
                        className="rounded-lg border overflow-hidden hover:border-primary/50 transition-colors"
                      >
                        <div className="p-3 bg-muted/30 border-b flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4" />
                            <span className="text-sm font-semibold">
                              Processed Video {index + 1}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedVideo(url)}
                            className="h-7 text-xs"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Play
                          </Button>
                        </div>
                        <div className="aspect-video bg-black/5 flex items-center justify-center">
                          <div className="text-center">
                            <Video className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">
                              Click Play to view
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
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

      {/* Video Player Dialog */}
      {selectedVideo && (
        <Dialog
          open={!!selectedVideo}
          onOpenChange={() => setSelectedVideo(null)}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Processed Video</DialogTitle>
            </DialogHeader>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {isVideoLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-white/60" />
                  <span className="text-xs text-white/50">Loading video…</span>
                </div>
              )}
              {videoError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-20 gap-2">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                  <p className="text-xs text-destructive text-center px-6">
                    {videoError}
                  </p>
                </div>
              )}
              <video
                controls
                autoPlay
                preload="metadata"
                className="w-full h-full object-contain"
                onLoadStart={() => {
                  setIsVideoLoading(true);
                  setVideoError(null);
                }}
                onCanPlay={() => setIsVideoLoading(false)}
                onError={(e) => {
                  setIsVideoLoading(false);
                  const el = e.target as HTMLVideoElement;
                  setVideoError(
                    `Failed to load: ${el.error?.message || 'Unknown error'}`
                  );
                }}
              >
                <source src={selectedVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
