import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@apollo/client';
import {
  Cctv,
  Upload,
  BellRing,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Wifi,
  WifiOff,
  Search,
  Sparkles,
  Play,
  FileVideo,
  TrendingUp,
  Circle,
} from 'lucide-react';

import { Header } from '@/components/layouts/header';
import { Main } from '@/components/layouts/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { ConfigDrawer } from '@/components/config-drawer';
import { SearchField } from '@/components/search';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/context/user-context';
import { GET_LIVE_EVENTS } from '@/graphql/events_queries';
import { GET_BATCHES_VIDEOS } from '@/graphql/batch_mutations';
import {
  selectCams,
  selectLoading as selectCamsLoading,
  selectTotalCount as selectCamsTotalCount,
  fetchCams,
} from '@/store/slices/camera-slice';
import {
  selectVideosList,
  selectTotalItems as selectBatchTotalItems,
} from '@/store/slices/playground-slice';
import type { RootState, AppDispatch } from '@/store';
import { getActiveCohortHash } from '@/utils/cohort-utils';

// ─── helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
  loading,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col gap-4 rounded-xl border border-border bg-gradient-to-b from-card to-muted/20 p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${onClick ? 'cursor-pointer hover:border-primary/30' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        {onClick && (
          <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-all group-hover:text-primary group-hover:translate-x-0.5" />
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      ) : (
        <div>
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground/80">{label}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
      )}
    </button>
  );
}

// ─── CameraRow ────────────────────────────────────────────────────────────────

interface CamType {
  camHash: string;
  camName: string;
  camStatus: string;
  camPlacementZone?: string;
  camType?: string;
}

function CameraRow({ cam, onClick }: { cam: CamType; onClick: () => void }) {
  const isOnline = cam.camStatus === 'ACTIVE';
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
    >
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${isOnline ? 'bg-emerald-500/10' : 'bg-muted'}`}
      >
        {isOnline ? (
          <Wifi className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {cam.camName}
        </p>
        {cam.camPlacementZone && (
          <p className="truncate text-xs text-muted-foreground">
            {cam.camPlacementZone}
          </p>
        )}
      </div>
      <Badge
        variant="outline"
        className={`flex-shrink-0 text-[10px] font-medium ${
          isOnline
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'border-border text-muted-foreground'
        }`}
      >
        {isOnline ? 'Live' : 'Offline'}
      </Badge>
    </button>
  );
}

// ─── BatchRow ─────────────────────────────────────────────────────────────────

interface BatchType {
  batchHash: string;
  batchName: string;
  batchStatus: string;
  createdAt: string;
  duration?: number;
}

const batchStatusConfig: Record<string, { label: string; cls: string }> = {
  COMPLETED: {
    label: 'Completed',
    cls: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  PROCESSING: {
    label: 'Processing',
    cls: 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  FAILED: {
    label: 'Failed',
    cls: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400',
  },
  PENDING: {
    label: 'Pending',
    cls: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
};

function BatchRow({
  batch,
  onClick,
}: {
  batch: BatchType;
  onClick: () => void;
}) {
  const s = batchStatusConfig[batch.batchStatus] ?? {
    label: batch.batchStatus,
    cls: 'text-muted-foreground',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
        <FileVideo className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {batch.batchName}
        </p>
        <p className="text-xs text-muted-foreground">
          {timeAgo(batch.createdAt)}
        </p>
      </div>
      <Badge
        variant="outline"
        className={`flex-shrink-0 text-[10px] font-medium ${s.cls}`}
      >
        {s.label}
      </Badge>
    </button>
  );
}

// ─── EventRow ─────────────────────────────────────────────────────────────────

interface EventType {
  eventHash: string;
  eventTitle: string;
  eventDescription: string;
  eventType: string;
  createdAt: string;
}

function EventRow({ event }: { event: EventType }) {
  const isAlert = event.eventType === 'ALERT' || event.eventType === 'WARNING';
  return (
    <div className="flex items-start gap-3 px-3 py-2.5">
      <div
        className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${isAlert ? 'bg-amber-500/10' : 'bg-primary/10'}`}
      >
        {isAlert ? (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        ) : (
          <Activity className="h-3.5 w-3.5 text-primary" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground leading-snug">
          {event.eventTitle || 'Event'}
        </p>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {event.eventDescription}
        </p>
      </div>
      <span className="mt-0.5 flex-shrink-0 text-[10px] tabular-nums text-muted-foreground">
        {timeAgo(event.createdAt)}
      </span>
    </div>
  );
}

// ─── QuickAction ─────────────────────────────────────────────────────────────

function QuickAction({
  icon: Icon,
  label,
  desc,
  iconBg,
  iconColor,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
  iconBg: string;
  iconColor: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-all hover:bg-accent hover:border-primary/20 hover:shadow-sm"
    >
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${iconBg}`}
      >
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/40 transition-all group-hover:text-primary group-hover:translate-x-0.5" />
    </button>
  );
}

// ─── SectionCard ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  count,
  action,
  onAction,
  loading,
  empty,
  emptyIcon: EmptyIcon,
  emptyText,
  emptyAction,
  onEmptyAction,
  children,
}: {
  title: string;
  count?: number;
  action?: string;
  onAction?: () => void;
  loading?: boolean;
  empty?: boolean;
  emptyIcon?: React.ElementType;
  emptyText?: string;
  emptyAction?: string;
  onEmptyAction?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-gradient-to-b from-card to-muted/15 shadow-sm overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {count !== undefined && count > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </div>
        {action && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={onAction}
          >
            {action}
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* body */}
      <div className="flex-1 p-2">
        {loading ? (
          <div className="space-y-1 p-1">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : empty ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            {EmptyIcon && (
              <EmptyIcon className="h-9 w-9 text-muted-foreground/30" />
            )}
            <p className="text-sm text-muted-foreground">{emptyText}</p>
            {emptyAction && onEmptyAction && (
              <Button
                size="sm"
                variant="outline"
                className="mt-1 h-7 text-xs"
                onClick={onEmptyAction}
              >
                {emptyAction}
              </Button>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// ─── StatusPill ──────────────────────────────────────────────────────────────

function StatusPill({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2.5">
        <Circle
          className={`h-2 w-2 fill-current ${ok ? 'text-emerald-500' : 'text-amber-500'}`}
        />
        <span className="text-sm text-foreground/80">{label}</span>
      </div>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </div>
  );
}

// ─── LiveDot ──────────────────────────────────────────────────────────────────

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
    </span>
  );
}

// ─── Main dashboard component ─────────────────────────────────────────────────

export default function OverviewDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useUser();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Cameras from Redux store ────────────────────────────────────────────────
  const cams = useSelector((s: RootState) => selectCams(s));
  const camsLoading = useSelector((s: RootState) => selectCamsLoading(s));
  const totalCams = useSelector((s: RootState) => selectCamsTotalCount(s));
  const currentRoleCohortHash = useSelector(
    (s: RootState) => s.auth.currentRoleCohortHash
  );

  // Fetch cameras if not yet loaded
  useEffect(() => {
    if (cams.length === 0 && !camsLoading) {
      const cohortHash = currentRoleCohortHash ?? getActiveCohortHash() ?? '';
      dispatch(fetchCams({ cohortHash, page: 1, itemsPerPage: 50 }));
    }
  }, [cams.length, camsLoading, currentRoleCohortHash, dispatch]);

  const onlineCams = cams.filter((c) => c.camStatus === 'ACTIVE');

  // ── Batch videos from Redux store ───────────────────────────────────────────
  const batches = useSelector((s: RootState) => selectVideosList(s));
  const totalBatchesFromStore = useSelector((s: RootState) =>
    selectBatchTotalItems(s)
  );

  // Use a lightweight direct query for fast dashboard rendering
  const { data: recentBatchesData, loading: recentBatchesLoading } = useQuery(
    GET_BATCHES_VIDEOS,
    {
      variables: {
        page: 1,
        itemsPerPage: 7,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      },
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    }
  );

  const recentBatches: BatchType[] =
    recentBatchesData?.getBatchVideos?.batches ?? batches;
  const totalBatches: number =
    recentBatchesData?.getBatchVideos?.totalCount ?? totalBatchesFromStore ?? 0;
  const batchLoading = recentBatchesLoading && recentBatches.length === 0;

  const processingBatches = recentBatches.filter(
    (b) => b.batchStatus === 'PROCESSING'
  ).length;

  // ── Events from Redux notifications slice ──────────────────────────────────
  const reduxTotalLive = useSelector(
    (s: RootState) => s.notifications.totalLiveEvents
  );
  const reduxTotalBatch = useSelector(
    (s: RootState) => s.notifications.totalBatchEvents
  );

  // ── Live events (recent list) ───────────────────────────────────────────────
  const { data: liveEventsData, loading: liveEventsLoading } = useQuery(
    GET_LIVE_EVENTS,
    {
      variables: {
        filters: {},
        itemsPerPage: 6,
        page: 1,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      },
      fetchPolicy: 'cache-and-network',
    }
  );

  const liveEvents: EventType[] = liveEventsData?.getLiveEvents?.events ?? [];
  const totalLiveEvents: number =
    liveEventsData?.getLiveEvents?.totalCount ?? reduxTotalLive ?? 0;
  const totalBatchEvents: number = reduxTotalBatch ?? 0;
  const totalAlerts = totalLiveEvents + totalBatchEvents;

  // ── Derived ────────────────────────────────────────────────────────────────
  const greeting = (() => {
    const h = currentTime.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const displayName = user?.first_name
    ? user.first_name.charAt(0).toUpperCase() + user.first_name.slice(1)
    : (user?.username ?? 'there');

  const statsLoading = camsLoading || batchLoading;

  return (
    <>
      {/* ── Header — matches all other pages ─────────────────────────────── */}
      <Header fixed className="bg-background border-b border-border shadow-sm">
        <SearchField />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <TimezoneDropdown />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <Main fixed className="flex-1 overflow-y-auto px-6 lg:px-8 xl:px-10">
        {/* Page title + live clock */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {greeting}, {displayName}
            </h2>
            <p className="text-muted-foreground">
              Here's what's happening across your system right now.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs shadow-sm">
            <LiveDot />
            <span className="text-muted-foreground">Live</span>
            <Separator orientation="vertical" className="h-3.5" />
            <span className="font-mono font-medium text-foreground tabular-nums">
              {currentTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* ── Stats grid ─────────────────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Cctv}
            label="Cameras"
            value={statsLoading ? '—' : totalCams}
            sub={!statsLoading ? `${onlineCams.length} live` : undefined}
            iconBg="bg-blue-500/10"
            iconColor="text-blue-600 dark:text-blue-400"
            loading={camsLoading}
            onClick={() => navigate('/live')}
          />
          <StatCard
            icon={FileVideo}
            label="Batch Videos"
            value={statsLoading ? '—' : totalBatches}
            sub={
              !statsLoading
                ? processingBatches > 0
                  ? `${processingBatches} processing`
                  : 'All processed'
                : undefined
            }
            iconBg="bg-violet-500/10"
            iconColor="text-violet-600 dark:text-violet-400"
            loading={batchLoading}
            onClick={() => navigate('/playground')}
          />
          <StatCard
            icon={BellRing}
            label="Total Alerts"
            value={statsLoading ? '—' : totalAlerts}
            sub={
              !statsLoading
                ? `${totalLiveEvents} live · ${totalBatchEvents} batch`
                : undefined
            }
            iconBg="bg-amber-500/10"
            iconColor="text-amber-600 dark:text-amber-400"
            loading={liveEventsLoading}
            onClick={() => navigate('/notifications')}
          />
          <StatCard
            icon={TrendingUp}
            label="Online Feeds"
            value={statsLoading ? '—' : onlineCams.length}
            sub={!statsLoading ? 'Cameras broadcasting' : undefined}
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-600 dark:text-emerald-400"
            loading={camsLoading}
            onClick={() => navigate('/live')}
          />
        </div>

        {/* ── Top row: camera feeds + system status ─────────────────────── */}
        <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <SectionCard
              title="Camera Feeds"
              action="View all"
              onAction={() => navigate('/live')}
              loading={camsLoading}
              empty={!camsLoading && cams.length === 0}
              emptyIcon={Cctv}
              emptyText="No cameras configured yet."
              emptyAction="Add Camera"
              onEmptyAction={() => navigate('/cameras/add')}
            >
              <div className="space-y-0.5">
                {cams.slice(0, 6).map((cam) => (
                  <CameraRow
                    key={cam.camHash}
                    cam={cam}
                    onClick={() =>
                      navigate(`/live/${encodeURIComponent(cam.camName)}`)
                    }
                  />
                ))}
                {cams.length > 6 && (
                  <button
                    type="button"
                    className="w-full rounded-lg px-3 py-2 text-center text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    onClick={() => navigate('/live')}
                  >
                    + {cams.length - 6} more cameras — view all
                  </button>
                )}
              </div>
            </SectionCard>
          </div>

          <div className="xl:col-span-4">
            <div className="h-full rounded-xl border border-border bg-gradient-to-b from-card to-muted/20 p-4 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-foreground">
                System Status
              </p>
              <div className="space-y-2">
                <StatusPill
                  label="Live Streaming"
                  ok={onlineCams.length > 0}
                  detail={
                    camsLoading
                      ? 'Loading...'
                      : onlineCams.length > 0
                        ? `${onlineCams.length} feed${onlineCams.length > 1 ? 's' : ''} active`
                        : 'No active feeds'
                  }
                />
                <StatusPill
                  label="Batch Processing"
                  ok={processingBatches === 0}
                  detail={
                    batchLoading
                      ? 'Loading...'
                      : processingBatches > 0
                        ? `${processingBatches} in queue`
                        : 'All clear'
                  }
                />
                <StatusPill
                  label="Alert System"
                  ok
                  detail="Monitoring active"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Middle row: batches + live events ─────────────────────────── */}
        <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <SectionCard
              title="Recent Batch Videos"
              action="View all"
              onAction={() => navigate('/playground')}
              loading={batchLoading}
              empty={!batchLoading && recentBatches.length === 0}
              emptyIcon={Upload}
              emptyText="No videos uploaded yet."
              emptyAction="Upload Video"
              onEmptyAction={() => navigate('/playground/upload')}
            >
              <div className="space-y-0.5">
                {recentBatches.slice(0, 7).map((b) => (
                  <BatchRow
                    key={b.batchHash}
                    batch={b}
                    onClick={() => navigate('/playground')}
                  />
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="xl:col-span-5">
            <SectionCard
              title="Live Events"
              count={totalLiveEvents}
              action="All alerts"
              onAction={() => navigate('/notifications')}
              loading={liveEventsLoading}
              empty={!liveEventsLoading && liveEvents.length === 0}
              emptyIcon={CheckCircle2}
              emptyText="No live events yet."
            >
              <div className="space-y-0.5">
                {liveEvents.map((ev) => (
                  <EventRow key={ev.eventHash} event={ev} />
                ))}
              </div>
            </SectionCard>
          </div>
        </div>

        {/* ── Bottom row: quick actions ──────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-gradient-to-b from-card to-muted/20 shadow-sm overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">
              Quick Actions
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 xl:grid-cols-4">
            <QuickAction
              icon={Play}
              label="Open Live Feed"
              desc="Monitor cameras in real time"
              iconBg="bg-emerald-500/10"
              iconColor="text-emerald-600 dark:text-emerald-400"
              onClick={() => navigate('/live')}
            />
            <QuickAction
              icon={Upload}
              label="Upload Video"
              desc="Start batch analysis"
              iconBg="bg-violet-500/10"
              iconColor="text-violet-600 dark:text-violet-400"
              onClick={() => navigate('/playground/upload')}
            />
            <QuickAction
              icon={Search}
              label="Semantic Search"
              desc="Search across video content"
              iconBg="bg-blue-500/10"
              iconColor="text-blue-600 dark:text-blue-400"
              onClick={() => navigate('/playground')}
            />
            <QuickAction
              icon={Sparkles}
              label="AI Assistant"
              desc="Chat with your video data"
              iconBg="bg-amber-500/10"
              iconColor="text-amber-600 dark:text-amber-400"
              onClick={() => navigate('/chat-page')}
            />
          </div>
        </div>
      </Main>
    </>
  );
}
