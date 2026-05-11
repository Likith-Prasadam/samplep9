/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, useEffect } from 'react';
import {
  BarChart3,
  Package,
  Activity,
  TrendingUp,
  Loader2,
  AlertCircle,
  Bell,
  AlertTriangle,
  Maximize2,
  HardHat,
  Glasses,
  ShieldAlert,
  Users,
  CheckCircle2,
  XCircle,
  Video,
  Play,
} from 'lucide-react';
import type { YoloInsights, PpeAstecInsights } from '../types/batch-analysis';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface InsightsAlertsTabsProps {
  insights: YoloInsights | PpeAstecInsights | null;
  insightsLoading: boolean;
  insightsError?: Error | null;
  notifications: any[];
  formatUtcTimestamp: (value: string) => string;
  expandedAlertId: string | null;
  setExpandedAlertId: (id: string | null) => void;
  onOpenAlertVideo: (url: string, title: string) => void;
  activeTab?: 'analytics' | 'alerts' | 'videos';
}

export function InsightsAlertsTabs({
  insights,
  insightsLoading,
  insightsError,
  notifications,
  formatUtcTimestamp,
  expandedAlertId,
  setExpandedAlertId,
  onOpenAlertVideo,
  activeTab: initialTab = 'alerts',
}: InsightsAlertsTabsProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'alerts' | 'videos'>(
    initialTab
  );
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Update active tab when prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const insightType = insights?.__typename;
  const isYolo = insightType === 'YoloInsights';
  const isPPE = insightType === 'PpeAstecInsights';

  // Sort class counts by value (descending) - YOLO only
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
      <div className="flex flex-col">
        {/* Tabs Header */}
        <div className="flex items-center border-b mb-3">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'alerts'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Bell className="w-4 h-4" />
              Alerts
              {notifications.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-foreground text-background font-semibold">
                  {notifications.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'analytics'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </div>
          </button>
          {hasVideos && (
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 ${
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
        </div>

        {/* Tab Content */}
        <div className="border border-border rounded-xl bg-card/60 max-h-[calc(65vh-180px)] overflow-y-auto spectra-scrollbar-wide">
          {activeTab === 'analytics' ? (
            <div className="p-4">
              {insightsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-xs text-muted-foreground">
                      Loading analytics...
                    </p>
                  </div>
                </div>
              ) : insightsError ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3 max-w-md text-center">
                    <div className="w-12 h-12 rounded-full border flex items-center justify-center">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">
                        Unable to Load Analytics
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {insightsError.message ||
                          'The batch may not have been processed yet.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : !insights ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3 max-w-md text-center">
                    <div className="w-12 h-12 rounded-full border flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" />
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
                      <div className="grid grid-cols-[40px_60px_repeat(5,1fr)] px-2 py-1.5 bg-muted/20 border-b text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
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
                                className="grid grid-cols-[40px_60px_repeat(5,1fr)] px-2 py-1.5 items-center hover:bg-muted/30 transition-colors text-xs"
                              >
                                <div className="flex items-center gap-1">
                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                      worn === 5
                                        ? 'bg-green-500 text-white'
                                        : 'bg-muted text-muted-foreground'
                                    }`}
                                  >
                                    {personId}
                                  </div>
                                </div>

                                <div className="flex items-center justify-center">
                                  <span className="font-bold text-red-500 dark:text-red-400">
                                    {5 - worn}
                                  </span>
                                </div>

                                {items.map(([key, worn]) => (
                                  <div
                                    key={key}
                                    className="flex justify-center"
                                  >
                                    {worn ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                    ) : (
                                      <XCircle className="w-3.5 h-3.5 text-red-400/60" />
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
            </div>
          ) : activeTab === 'videos' ? (
            <div className="p-4">
              {videoUrls.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3 max-w-md text-center">
                    <div className="w-12 h-12 rounded-full border flex items-center justify-center">
                      <Video className="w-6 h-6 text-muted-foreground" />
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
            </div>
          ) : (
            <>
              {/* Alerts Tab */}
              {notifications.length === 0 ? (
                <div className="p-4 flex flex-col items-center justify-center text-center text-sm text-muted-foreground gap-2 py-12">
                  <AlertTriangle className="w-8 h-8 text-muted-foreground/70" />
                  <span>No alerts for this video yet.</span>
                </div>
              ) : (
                notifications.map((n) => {
                  const alertId = n.event_id ?? `${n.timestamp}-${n.alert}`;
                  const isExpanded = expandedAlertId === alertId;

                  return (
                    <div
                      key={alertId}
                      className="p-3 border-b border-border/60 last:border-b-0 bg-card/80 hover:bg-card transition-colors"
                    >
                      <div className="flex gap-3">
                        {/* Video thumbnail / clip preview */}
                        <div className="relative w-28 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          {n.details?.presigned_url ? (
                            <video
                              className="w-full h-full object-cover"
                              src={n.details.presigned_url}
                              muted
                              playsInline
                              preload="metadata"
                              onMouseEnter={(e) => {
                                const el = e.currentTarget;
                                el.currentTime = 0;
                                const playPromise = el.play();
                                if (
                                  playPromise &&
                                  typeof playPromise.catch === 'function'
                                ) {
                                  playPromise.catch(() => {});
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.pause();
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                              No clip
                            </div>
                          )}
                          {n.details?.presigned_url && (
                            <button
                              type="button"
                              className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white p-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenAlertVideo(
                                  n.details!.presigned_url!,
                                  n.alert
                                );
                              }}
                              aria-label="Open alert video"
                            >
                              <Maximize2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Text content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-foreground line-clamp-2">
                              {n.alert}
                            </p>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {formatUtcTimestamp(n.timestamp)}
                            </span>
                          </div>

                          {n.details?.description && (
                            <div className="space-y-0.5">
                              <p
                                className={
                                  'text-[11px] text-muted-foreground ' +
                                  (isExpanded ? '' : 'line-clamp-3')
                                }
                              >
                                {n.details.description}
                              </p>
                              {n.details.description.length > 120 && (
                                <button
                                  type="button"
                                  className="text-[11px] font-medium text-primary hover:underline"
                                  onClick={() =>
                                    setExpandedAlertId(
                                      isExpanded ? null : alertId
                                    )
                                  }
                                >
                                  {isExpanded ? 'Show less' : 'Read more'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
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
