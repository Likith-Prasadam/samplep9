import { useState, useMemo, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  HardHat,
  Glasses,
  ShieldAlert,
  Users,
  User,
  Bike,
  Car,
  Bus,
  Truck,
  TrainFront,
  Plane,
  Ship,
  TrafficCone,
  CircleParking,
  OctagonAlert,
  Lamp,
  Armchair,
  Shapes,
  CheckCircle2,
  XCircle,
  BarChart3,
  Video as VideoIcon,
  SlidersHorizontal,
  ChevronDown,
  Maximize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { YoloInsights, PpeAstecInsights } from '../types/batch-analysis';
import { VideoWithBoundingBoxes } from './video-with-bounding-boxes';
import { DetectionFilters } from './detection-filters';
import { extractUniqueClasses } from '../utils/bounding-box-normalizer';

interface BatchInsightsPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insights: YoloInsights | PpeAstecInsights | null;
  batchName?: string;
  /** Original (un-annotated) input video presigned URL for the SVG bounding box overlay */
  originalVideoUrl?: string | null;
}

export function BatchInsightsPopover({
  open,
  onOpenChange,
  insights,
  batchName,
  originalVideoUrl,
}: BatchInsightsPopoverProps) {
  const [videoError, setVideoError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [showTrackIds, setShowTrackIds] = useState(true);
  const [isExpandedVideoOpen, setIsExpandedVideoOpen] = useState(false);

  const insightType = insights?.__typename;
  const isYolo = insightType === 'YoloInsights';
  const isPPE = insightType === 'PpeAstecInsights';

  // Extract available detection classes
  const availableClasses = useMemo(
    () => extractUniqueClasses(insights?.boundingBoxes),
    [insights?.boundingBoxes]
  );

  // Initialize selected classes when insights change
  useEffect(() => {
    if (availableClasses.length > 0) {
      setSelectedClasses(availableClasses);
    }
  }, [availableClasses]);

  // Reset video error when modal opens or insights change
  useEffect(() => {
    setVideoError(null);
  }, [insights, open]);

  // Sort class counts for YOLO (descending)
  const sortedClassCounts = useMemo(() => {
    if (!isYolo || !insights) return [];
    const yoloInsights = insights as YoloInsights;
    return Object.entries(yoloInsights.classCounts || {})
      .map(([className, count]) => ({ className, count }))
      .sort((a, b) => b.count - a.count);
  }, [insights, isYolo]);

  const sortedModeClassCounts = useMemo(() => {
    if (!isYolo || !insights) return [];
    const yoloInsights = insights as YoloInsights;
    return Object.entries(yoloInsights.modeClassCounts || {})
      .map(([className, count]) => ({ className, count }))
      .sort((a, b) => b.count - a.count);
  }, [insights, isYolo]);

  // const topYoloClass = sortedClassCounts[0];

  const topYoloClass = sortedClassCounts[0];

  const getClassIcon = (className: string) => {
    const key = className.toLowerCase().replace(/_/g, ' ');
    if (key === 'person') return User;
    if (key === 'bicycle') return Bike;
    if (key === 'car') return Car;
    if (key === 'bus') return Bus;
    if (key === 'truck') return Truck;
    if (key === 'train') return TrainFront;
    if (key === 'airplane') return Plane;
    if (key === 'boat') return Ship;
    if (key === 'traffic light') return TrafficCone;
    if (key === 'parking meter') return CircleParking;
    if (key === 'stop sign') return OctagonAlert;
    if (key === 'fire hydrant') return Lamp;
    if (key === 'bench') return Armchair;
    return Shapes;
  };

  // PPE data processing
  const ppeData = useMemo(() => {
    if (!isPPE || !insights) return null;
    const ppeInsights = insights as PpeAstecInsights;
    const personsDetected =
      ppeInsights.modePersonsPerFrame ??
      ppeInsights.uniqueCounts?.unique_persons ??
      0;

    const workerCount =
      ppeInsights.modeTotalObjectsDetected ??
      ppeInsights.ppeSummary?.persons_detected ??
      0;
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
      personsDetected,
      workerCount,
      totalDetectedPPE,
      missingPPEItems,
      ppeItems,
      perPersonSummary: ppeInsights.perPersonPpeSummary || {},
    };
  }, [insights, isPPE]);

  const highlightCards = useMemo(() => {
    if (isPPE && ppeData) {
      return [
        {
          label: 'Persons Detected',
          value: ppeData.personsDetected,
          hint: 'Workers in frame',
          accent: 'from-blue-500/70 to-blue-400/40',
        },
        {
          label: 'PPE Items Detected',
          value: ppeData.totalDetectedPPE,
          hint: `Total Detected items`,
          accent: 'from-emerald-500/70 to-emerald-400/40',
        },
      ];
    }

    if (isYolo && insights) {
      const yoloInsights = insights as YoloInsights;
      return [
        {
          label: 'Total Detections',
          value: (
            yoloInsights.modeTotalObjectsDetected ??
            yoloInsights.totalObjectsDetected ??
            0
          ).toLocaleString(),
          hint: 'Across all frames',
          accent: 'from-sky-500/70 to-sky-400/40',
        },
        {
          label: 'Top Detected Object',
          value: topYoloClass ? topYoloClass.className.replace(/_/g, ' ') : '—',
          hint: topYoloClass
            ? 'Most frequently detected category in this video'
            : 'No detections yet',
          accent: 'from-rose-500/70 to-rose-400/40',
        },
      ];
    }

    return [];
  }, [insights, isPPE, isYolo, ppeData, topYoloClass]);

  const sheetSurfaceClass =
    'border-border/70 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.08),_transparent)]';

  if (!insights) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className={`flex h-full max-h-svh w-full flex-col gap-0 overflow-hidden p-0 shadow-2xl sm:max-w-none md:w-[min(50vw,720px)] md:min-w-[40vw] md:max-w-[50vw] ${sheetSurfaceClass}`}
        >
          <SheetTitle className="sr-only">No Insights Available</SheetTitle>
          <SheetDescription className="sr-only">
            Process this video to generate detection insights.
          </SheetDescription>
          <div className="flex shrink-0 items-center border-b bg-background/95 px-6 py-4 pr-14 backdrop-blur-sm">
            <p className="text-sm font-semibold text-foreground">Insights</p>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground" />
            <p className="text-lg font-semibold">No Insights Available</p>
            <p className="text-sm text-muted-foreground">
              Process this video to generate detection insights.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className={`flex h-full max-h-svh w-full flex-col gap-0 overflow-hidden p-0 shadow-2xl sm:max-w-none md:w-[min(50vw,720px)] md:min-w-[40vw] md:max-w-[50vw] ${sheetSurfaceClass}`}
        >
          <SheetTitle className="sr-only">
            {batchName || 'Video Analysis Results'}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {isPPE
              ? 'PPE oversight and individual compliance insights for this batch.'
              : 'Video insights with bounding box playback and filters.'}
          </SheetDescription>

          <div className="flex shrink-0 items-center gap-4 border-b bg-background/95 px-6 py-4 pr-14 backdrop-blur-sm">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                {isPPE ? 'Safety Oversight' : 'Video Insights'}
              </p>
              <h2 className="text-[1.1rem] leading-tight font-semibold text-foreground truncate md:text-[1.2rem]">
                {batchName || 'Video Analysis Results'}
              </h2>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-background via-background/95 to-background px-4 py-3 md:px-5 md:py-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-5">
                <div
                  className={cn(
                    'flex gap-2.5',
                    highlightCards.length > 0
                      ? 'flex-nowrap items-start'
                      : 'flex-col'
                  )}
                >
                  <div
                    className={cn(
                      'min-w-0',
                      highlightCards.length > 0 ? 'flex-1' : 'w-full'
                    )}
                  >
                    <div className="relative aspect-video rounded-xl border border-border/60 bg-black shadow-lg overflow-hidden">
                      {!originalVideoUrl ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80">
                          <div className="h-20 w-20 rounded-[1.5rem] bg-white/10 border border-white/15 flex items-center justify-center">
                            <VideoIcon className="h-10 w-10" />
                          </div>
                          <p className="text-base font-semibold">
                            No video available
                          </p>
                          <p className="text-xs text-white/70">
                            Process this video to inspect detections.
                          </p>
                        </div>
                      ) : (
                        <VideoWithBoundingBoxes
                          videoUrl={originalVideoUrl}
                          boundingBoxes={insights?.boundingBoxes ?? null}
                          sourceVideoInfo={insights?.videoInfo ?? null}
                          confidenceThreshold={confidenceThreshold}
                          selectedClasses={selectedClasses}
                          showTrackIds={showTrackIds}
                          autoPlay={false}
                          disableNativeFullscreen
                          onLoadStart={() => {
                            setVideoError(null);
                          }}
                          onCanPlay={() => {}}
                          onError={(msg) => setVideoError(msg)}
                        />
                      )}

                      {originalVideoUrl ? (
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="absolute right-2 top-2 z-20 h-8 w-8"
                          onClick={() => setIsExpandedVideoOpen(true)}
                          aria-label="Open enlarged detection video"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      ) : null}

                      {videoError && (
                        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-2 bg-destructive/90 px-4 py-2">
                          <p className="text-xs text-white truncate">
                            {videoError}
                          </p>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-6 text-xs shrink-0"
                            onClick={() => setVideoError(null)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {highlightCards.length > 0 ? (
                    <div className="flex w-[min(42%,11.5rem)] shrink-0 flex-col gap-2">
                      {highlightCards.map((card) => (
                        <div
                          key={card.label}
                          className="rounded-xl border border-border/55 bg-gradient-to-br from-card/90 via-card/60 to-muted/25 p-2.5 shadow-sm ring-1 ring-border/30"
                        >
                          <p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground font-semibold leading-tight">
                            {card.label}
                          </p>
                          <div className="mt-1 text-xl font-black tabular-nums tracking-tight text-foreground leading-none">
                            {card.value}
                          </div>
                          {card.hint ? (
                            <p className="text-[11px] text-muted-foreground/85 mt-1 leading-snug line-clamp-2">
                              {card.hint}
                            </p>
                          ) : null}
                          <div
                            className={`mt-2 h-0.5 rounded-full bg-gradient-to-r ${card.accent} opacity-90`}
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {isYolo && availableClasses.length > 0 && (
                  <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                    <div className="overflow-hidden rounded-xl border border-border/50 bg-card/25 shadow-sm backdrop-blur-sm">
                      <CollapsibleTrigger
                        className={cn(
                          'flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors',
                          'hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25',
                          'data-[state=open]:border-b data-[state=open]:border-border/45 data-[state=open]:bg-muted/15'
                        )}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/40 text-muted-foreground">
                            <SlidersHorizontal
                              className="h-3.5 w-3.5"
                              aria-hidden
                            />
                          </span>
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold tracking-tight text-foreground">
                              Detection Filters
                            </span>
                            <span className="inline-flex items-center rounded-md border border-border/55 bg-background/70 px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                              {selectedClasses.length}/{availableClasses.length}
                            </span>
                          </div>
                        </div>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                            showFilters && 'rotate-180'
                          )}
                          aria-hidden
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t border-border/40 bg-muted/5 px-3 py-2.5 pb-6">
                          <DetectionFilters
                            classes={availableClasses}
                            selectedClasses={selectedClasses}
                            confidenceThreshold={confidenceThreshold}
                            showTrackIds={showTrackIds}
                            onChangeClasses={setSelectedClasses}
                            onChangeConfidence={setConfidenceThreshold}
                            onChangeShowTrackIds={setShowTrackIds}
                          />
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {isPPE && ppeData ? (
                  <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                      <div>
                        <p className="text-sm font-bold text-muted-foreground">
                          Detection Breakdown
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 p-3 sm:grid-cols-2">
                      {ppeData.ppeItems.map(({ icon, label, count, color }) => {
                        const rawRate =
                          ppeData.workerCount > 0
                            ? Math.round((count / ppeData.workerCount) * 100)
                            : 0;
                        const rate = Math.min(rawRate, 100);
                        return (
                          <div
                            key={label}
                            className="group flex flex-col rounded-xl border border-border/45 bg-gradient-to-b from-background/90 to-muted/15 p-3 shadow-xs transition-colors hover:border-border hover:shadow-sm"
                          >
                            <div className="flex items-start gap-2">
                              <span className={`${color} mt-0.5 text-base`}>
                                {icon}
                              </span>
                              <p className="line-clamp-2 min-h-[2.25rem] text-xs font-semibold leading-tight text-foreground">
                                {label}
                              </p>
                            </div>
                            <p className="mt-2 text-xl font-bold tabular-nums tracking-tight text-foreground">
                              {count}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              items detected
                            </p>
                            <div
                              className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/80"
                              aria-hidden
                            >
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500/80 to-emerald-400/60 transition-all"
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {isYolo && sortedModeClassCounts.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-border/50 bg-card/40 p-3 shadow-sm backdrop-blur-sm">
                    <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-border/40 pb-2">
                      <div>
                        <p className="text-md text-muted-foreground font-semibold">
                          Detection Breakdown
                        </p>
                        <p className="text-xs text-muted-foreground/90 mt-0.5">
                          Sorted by highest activity
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[11px] font-medium"
                      >
                        {sortedModeClassCounts.length} Detected Categories
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                      {sortedModeClassCounts.map(({ className, count }) => {
                        const Icon = getClassIcon(className);
                        const maxCount = Math.max(
                          ...sortedModeClassCounts.map((cls) => cls.count),
                          1
                        );
                        const percentage = Math.min(
                          100,
                          (count / maxCount) * 100
                        );
                        return (
                          <div
                            key={className}
                            className="group flex flex-col rounded-xl border border-border/45 bg-gradient-to-b from-background/90 to-muted/15 p-3 shadow-xs transition-colors hover:border-border hover:shadow-sm"
                          >
                            <div className="flex items-start gap-2">
                              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/80" />
                              <p className="line-clamp-2 min-h-[2.25rem] text-xs font-semibold capitalize leading-tight text-foreground">
                                {className.replace(/_/g, ' ')}
                              </p>
                            </div>
                            <p className="mt-2 text-xl font-bold tabular-nums tracking-tight text-foreground">
                              {count.toLocaleString()}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              instances
                            </p>
                            <div
                              className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/80"
                              aria-hidden
                            >
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary/40 transition-all group-hover:from-primary/85 group-hover:to-primary/55"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              {isPPE &&
                ppeData &&
                Object.keys(ppeData.perPersonSummary).length > 0 && (
                  <div className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border/60">
                      <div className="flex items-center gap-2 text-lg font-semibold text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Individual compliance
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          Detected
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-rose-500" />
                          Missing
                        </span>
                      </div>
                    </div>
                    <ScrollArea className="max-h-[320px]">
                      <div className="grid gap-2.5 p-3">
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
                                className="rounded-xl border border-border/45 bg-gradient-to-b from-background/90 to-muted/15 p-3 shadow-xs"
                              >
                                <div className="mb-2 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`h-7 w-7 rounded-full text-xs font-black flex items-center justify-center shadow-sm ${
                                        worn === 5
                                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
                                          : 'bg-muted text-muted-foreground'
                                      }`}
                                    >
                                      {personId}
                                    </div>
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                      Worker {personId}
                                    </span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {worn}/5 compliant
                                  </span>
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                  {items.map(([key, itemWorn]) => (
                                    <div
                                      key={key}
                                      className="flex flex-col items-center gap-1 rounded-md border border-border/40 bg-background/60 px-1 py-1.5"
                                    >
                                      <span className="text-[10px] text-muted-foreground capitalize">
                                        {key === 'hardhat'
                                          ? 'Helmet'
                                          : key === 'safety_vest'
                                            ? 'Vest'
                                            : key}
                                      </span>
                                      {itemWorn ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-rose-400" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <Dialog open={isExpandedVideoOpen} onOpenChange={setIsExpandedVideoOpen}>
        <DialogContent className="h-[95vh] w-[95vw] max-w-[95vw] border-border bg-black p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Expanded detection video</DialogTitle>
          </DialogHeader>
          {originalVideoUrl ? (
            <div className="h-full w-full overflow-hidden rounded-lg">
              <VideoWithBoundingBoxes
                videoUrl={originalVideoUrl}
                boundingBoxes={insights?.boundingBoxes ?? null}
                sourceVideoInfo={insights?.videoInfo ?? null}
                confidenceThreshold={confidenceThreshold}
                selectedClasses={selectedClasses}
                showTrackIds={showTrackIds}
                autoPlay
                disableNativeFullscreen
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
