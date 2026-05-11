import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  HardHat,
  Glasses,
  ShieldAlert,
  Users,
  Car,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Flame,
  Factory,
  Zap,
  Shield,
  X,
} from 'lucide-react';

interface PersonPPE {
  hardhat: boolean;
  goggles: boolean;
  gloves: boolean;
  shoes: boolean;
  safety_vest: boolean;
  PPE: boolean;
  vehicles?: Record<string, number>;
}

interface InsightsData {
  video_info: {
    total_frames: number;
    duration_seconds: number;
    processed_at?: string;
  };
  unique_counts: { persons: number; vehicles: number };
  per_person_ppe_summary: Record<string, PersonPPE>;
  ppe_summary: {
    hard_hat: number;
    goggles: number;
    safety_vest: number;
    gloves: number;
    safety_shoes: number;
    persons_detected: number;
    list_of_vehicles: string[];
  };
  vehicle_counts?: Record<string, number>;
}

interface VideoConfig {
  title: string;
  subtitle: string;
  videoUrl: string;
  accentColor: 'green' | 'red' | 'blue';
  data: InsightsData;
}

const VIDEO_CONFIGS: Record<string, VideoConfig> = {
  '16': {
    title: 'Steel Factory Safety Insights',
    subtitle:
      'AI-powered PPE compliance analysis for steel manufacturing facility',
    videoUrl:
      'https://spectra-manifacturing-usecase.s3.amazonaws.com/Steel_Factory_Annotated.mp4?AWSAccessKeyId=AKIA467DTTIJ7BJRFCGT&Signature=wqdwtGMAHIs5skNBwbyFfoHqUZY%3D&Expires=1775709949',
    accentColor: 'green',
    data: {
      video_info: { total_frames: 1032, duration_seconds: 29 },
      unique_counts: { persons: 9, vehicles: 0 },
      per_person_ppe_summary: {
        '1': {
          hardhat: false,
          goggles: false,
          safety_vest: false,
          gloves: true,
          shoes: true,
          PPE: false,
        },
        '8': {
          hardhat: false,
          goggles: false,
          safety_vest: false,
          gloves: false,
          shoes: true,
          PPE: false,
        },
        '18': {
          hardhat: false,
          goggles: false,
          safety_vest: false,
          gloves: true,
          shoes: true,
          PPE: false,
        },
        '30': {
          hardhat: false,
          goggles: false,
          safety_vest: false,
          gloves: true,
          shoes: true,
          PPE: false,
        },
        '60': {
          hardhat: false,
          goggles: false,
          safety_vest: false,
          gloves: false,
          shoes: true,
          PPE: false,
        },
        '99': {
          hardhat: false,
          goggles: false,
          safety_vest: false,
          gloves: true,
          shoes: true,
          PPE: false,
        },
        '105': {
          hardhat: false,
          goggles: false,
          safety_vest: false,
          gloves: false,
          shoes: true,
          PPE: false,
        },
        '147': {
          hardhat: false,
          goggles: false,
          safety_vest: false,
          gloves: true,
          shoes: true,
          PPE: false,
        },
        '192': {
          hardhat: false,
          goggles: false,
          safety_vest: false,
          gloves: false,
          shoes: true,
          PPE: false,
        },
      },
      ppe_summary: {
        hard_hat: 0,
        goggles: 0,
        safety_vest: 0,
        gloves: 5,
        safety_shoes: 9,
        persons_detected: 9,
        list_of_vehicles: [],
      },
    },
  },
  '28': {
    title: 'Fire Accident Safety Insights',
    subtitle: 'AI-powered PPE compliance analysis — fire incident scenario',
    videoUrl:
      'https://spectra-manifacturing-usecase.s3.amazonaws.com/Fire_Accident_annotated.mp4?AWSAccessKeyId=AKIA467DTTIJ7BJRFCGT&Signature=cQCVkd3DA0fXdalpss2ndLdETRA%3D&Expires=1775709949',
    accentColor: 'red',
    data: {
      video_info: {
        total_frames: 915,
        duration_seconds: 30.5,
        processed_at: '2026-01-08T03:36:07',
      },
      unique_counts: { persons: 2, vehicles: 0 },
      per_person_ppe_summary: {
        '1': {
          hardhat: false,
          goggles: false,
          gloves: true,
          shoes: true,
          safety_vest: false,
          PPE: false,
        },
        '2': {
          hardhat: false,
          goggles: false,
          gloves: true,
          shoes: true,
          safety_vest: false,
          PPE: false,
        },
      },
      ppe_summary: {
        hard_hat: 0,
        goggles: 0,
        safety_vest: 0,
        gloves: 2,
        safety_shoes: 2,
        persons_detected: 2,
        list_of_vehicles: [],
      },
    },
  },
  '29': {
    title: 'Tesla Factory Safety Insights',
    subtitle: 'AI-powered PPE compliance analysis',
    videoUrl:
      'https://spectra-manifacturing-usecase.s3.amazonaws.com/Tesla_Annotated.mp4?AWSAccessKeyId=AKIA467DTTIJ7BJRFCGT&Signature=9sjO1PchHDKmO%2Fiwp15CgAmEHvM%3D&Expires=1775709949',
    accentColor: 'blue',
    data: {
      video_info: {
        total_frames: 1039,
        duration_seconds: 34,
        processed_at: '2025-12-30T06:11:16',
      },
      unique_counts: { persons: 15, vehicles: 1 },
      per_person_ppe_summary: {
        '1': {
          hardhat: false,
          goggles: true,
          gloves: false,
          shoes: true,
          safety_vest: false,
          PPE: false,
        },
        '2': {
          hardhat: true,
          goggles: true,
          gloves: true,
          shoes: false,
          safety_vest: false,
          PPE: false,
        },
        '3': {
          hardhat: false,
          goggles: true,
          gloves: true,
          shoes: true,
          safety_vest: false,
          PPE: false,
        },
        '4': {
          hardhat: false,
          goggles: true,
          gloves: false,
          shoes: false,
          safety_vest: false,
          PPE: false,
        },
        '5': {
          hardhat: false,
          goggles: true,
          gloves: false,
          shoes: false,
          safety_vest: false,
          PPE: false,
          vehicles: { forklift: 1 },
        },
        '6': {
          hardhat: false,
          goggles: false,
          gloves: false,
          shoes: true,
          safety_vest: true,
          PPE: false,
        },
        '7': {
          hardhat: false,
          goggles: true,
          gloves: true,
          shoes: false,
          safety_vest: true,
          PPE: false,
        },
        '8': {
          hardhat: false,
          goggles: true,
          gloves: true,
          shoes: false,
          safety_vest: true,
          PPE: false,
        },
        '9': {
          hardhat: true,
          goggles: false,
          gloves: true,
          shoes: false,
          safety_vest: true,
          PPE: false,
        },
        '10': {
          hardhat: false,
          goggles: false,
          gloves: true,
          shoes: true,
          safety_vest: false,
          PPE: false,
        },
        '11': {
          hardhat: false,
          goggles: false,
          gloves: false,
          shoes: false,
          safety_vest: false,
          PPE: false,
        },
        '12': {
          hardhat: false,
          goggles: false,
          gloves: true,
          shoes: false,
          safety_vest: false,
          PPE: false,
        },
        '13': {
          hardhat: false,
          goggles: true,
          gloves: true,
          shoes: true,
          safety_vest: false,
          PPE: false,
        },
        '14': {
          hardhat: false,
          goggles: false,
          gloves: false,
          shoes: false,
          safety_vest: false,
          PPE: false,
        },
        '15': {
          hardhat: false,
          goggles: false,
          gloves: false,
          shoes: false,
          safety_vest: false,
          PPE: false,
        },
      },
      ppe_summary: {
        hard_hat: 2,
        goggles: 8,
        safety_vest: 4,
        gloves: 8,
        safety_shoes: 5,
        persons_detected: 15,
        list_of_vehicles: ['forklift'],
      },
      vehicle_counts: { forklift: 1 },
    },
  },
};

interface ManufacturingInsightsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId?: string;
}

export function ManufacturingInsightsDialog({
  open,
  onOpenChange,
  videoId = '16',
}: ManufacturingInsightsDialogProps) {
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);

  const hasInsights = videoId in VIDEO_CONFIGS;
  const config = VIDEO_CONFIGS[videoId] ?? VIDEO_CONFIGS['16'];
  const { data: insights, title, subtitle, videoUrl } = config;

  const workerCount = insights.ppe_summary.persons_detected;
  const totalDetectedPPE =
    insights.ppe_summary.hard_hat +
    insights.ppe_summary.goggles +
    insights.ppe_summary.safety_vest +
    insights.ppe_summary.gloves +
    insights.ppe_summary.safety_shoes;
  const expectedPPEItems = workerCount * 5;
  const missingPPEItems = Math.max(expectedPPEItems - totalDetectedPPE, 0);

  const TitleIcon = () => {
    if (videoId === '28') return <Flame className="w-5 h-5 text-red-500" />;
    if (videoId === '29') return <Zap className="w-5 h-5 text-blue-500" />;
    return <Factory className="w-5 h-5 text-emerald-600" />;
  };

  if (!hasInsights) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
            <Factory className="w-12 h-12 text-muted-foreground" />
            <p className="text-lg font-semibold">No Insights Available</p>
            <p className="text-sm text-muted-foreground">
              No insights are available for this video.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const ppeItems = [
    {
      icon: <HardHat className="w-4 h-4" />,
      label: 'Hard Hat',
      count: insights.ppe_summary.hard_hat,
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      icon: <Glasses className="w-4 h-4" />,
      label: 'Goggles',
      count: insights.ppe_summary.goggles,
      color: 'text-sky-600 dark:text-sky-400',
    },
    {
      icon: <ShieldAlert className="w-4 h-4" />,
      label: 'Safety Vest',
      count: insights.ppe_summary.safety_vest,
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      icon: <span className="text-sm leading-none">🧤</span>,
      label: 'Gloves',
      count: insights.ppe_summary.gloves,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      icon: <span className="text-sm leading-none">👢</span>,
      label: 'Safety Shoes',
      count: insights.ppe_summary.safety_shoes,
      color: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1100px] max-h-[94vh] overflow-y-auto p-0 gap-0 rounded-2xl">
        {/* ━━━ Sticky Header ━━━ */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <TitleIcon />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground truncate">
                {title}
              </h2>
              <p className="text-[11px] text-muted-foreground truncate">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="ml-4 p-1 rounded-lg hover:bg-muted/50 transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* ━━━ Hero: Video + Stats Side by Side ━━━ */}
          <div className="grid grid-cols-[1fr_320px] gap-4">
            {/* Video Player */}
            <div className="relative h-full rounded-xl overflow-hidden bg-black border border-border">
              {isVideoLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-white/60" />
                  <span className="text-[11px] text-white/50">
                    Loading video…
                  </span>
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
                <source src={videoUrl} type="video/mp4" />
              </video>
            </div>

            {/* Stats Sidebar */}
            <div className="flex flex-col gap-3">
              {/* Quick Numbers */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 p-2.5 flex flex-col items-center">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Users className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <div className="text-[10px] text-blue-700/70 dark:text-blue-500 uppercase font-medium tracking-wide">
                      Persons
                    </div>
                  </div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400 leading-none mt-0.5">
                    {insights.unique_counts.persons}
                  </div>
                </div>
                <div className="rounded-lg border bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 p-2.5 flex flex-col items-center">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Car className="w-3 h-3 text-green-600 dark:text-green-400" />
                    <div className="text-[10px] text-green-700/70 dark:text-green-500 uppercase font-medium tracking-wide">
                      Vehicles
                    </div>
                  </div>
                  <div className="text-xl font-bold text-green-600 dark:text-green-400 leading-none mt-0.5">
                    {insights.unique_counts.vehicles}
                  </div>
                  {insights.ppe_summary.list_of_vehicles.length > 0 && (
                    <div className="text-[9px] text-green-700/70 dark:text-green-500 capitalize mt-0.5">
                      {insights.ppe_summary.list_of_vehicles.join(', ')}
                    </div>
                  )}
                </div>
                <div className="rounded-lg border bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 p-2.5 flex flex-col items-center">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Shield className="w-3 h-3 text-red-600 dark:text-red-400" />
                    <div className="text-[10px] text-red-700/70 dark:text-red-500 uppercase font-medium tracking-wide">
                      Violations
                    </div>
                  </div>
                  <div className="text-xl font-bold text-red-600 dark:text-red-400 leading-none mt-0.5">
                    {missingPPEItems}
                  </div>
                </div>
              </div>

              {/* PPE Breakdown List */}
              <div className="rounded-lg border divide-y flex-1">
                <div className="px-3 py-2 bg-muted/40">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    PPE's Detected
                  </span>
                </div>
                {ppeItems.map(({ icon, label, count, color }) => {
                  const rate =
                    workerCount > 0
                      ? Math.round((count / workerCount) * 100)
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
                      <div className="w-30 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-400 rounded-full"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ━━━ Worker Compliance Table ━━━ */}
          <div className="rounded-xl border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Individual Worker Compliance
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />{' '}
                  Detected
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />{' '}
                  Missing
                </span>
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[50px_90px_repeat(5,1fr)] px-4 py-2 bg-muted/20 border-b text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span>ID</span>
              <span className="text-center">Violations</span>
              <span className="text-center">Hard Hat</span>
              <span className="text-center">Goggles</span>
              <span className="text-center">Vest</span>
              <span className="text-center">Gloves</span>
              <span className="text-center">Shoes</span>
            </div>

            {/* Table Body */}
            <ScrollArea className="h-[280px]">
              <div className="divide-y">
                {Object.entries(insights.per_person_ppe_summary).map(
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
                        className="grid grid-cols-[50px_90px_repeat(5,1fr)] px-4 py-2 items-center hover:bg-muted/30 transition-colors"
                      >
                        {/* Worker ID */}
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

                        {/* Non-compliance count */}
                        <div className="flex items-center justify-center">
                          <span className="text-xs font-bold text-red-500 dark:text-red-400">
                            {5 - worn}
                          </span>
                        </div>

                        {/* PPE Checks */}
                        {items.map(([key, worn]) => (
                          <div key={key} className="flex justify-center">
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
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
