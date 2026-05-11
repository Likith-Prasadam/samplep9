import type { ReactNode } from 'react';
import type { Notification } from '@/features/notifications/types/notifications';

export type { Notification } from '@/features/notifications/types/notifications';

export interface BatchVideo {
  batchHash: string;
  batchName: string;
  batchStatus: string;
  batchCloudStreamPath: string;
  thumbnailPresignedUrl: string;
  duration: number;
  batchType?: string;
  batchPlacementZone?: string;
  batchTags?: string[] | null;
  createdAt?: string;
  userRoleCohortHash?: string;
  videoPresignedUrl?: string;
  videoPresignedUrlExpiry?: string;

  // Frontend specific or legacy mapped fields
  id: number;
  progress?: number | null;
  recentlyUploaded?: boolean;
  local_status?: 'processing';
  created_at?: string; // Note: V2 API might not expose this directly in list view
  user_id?: string;
  cohort_id?: string;
}

// Props for VideoGrid
export interface VideoGridProps {
  videos: BatchVideo[];
  viewMode: 'grid' | 'list';
  usernames: Record<string, string>;
  notifications: Notification[];
  viewedNotifications: string[];
  onProcessBatch: (video: BatchVideo) => void;
  onOpenDrawer: (video: BatchVideo) => void;
  onDeleteSuccess: () => void;
  isLoading: boolean;
  totalItems: number;
  itemsPerPage: number;
  showDates?: boolean; // Add this
  externalArrows?: boolean; // Add this
  selectedDate?: Date; // Add this - for date filtering
  searchQuery: string; // Add this - was missing from original
}

// Props for VideoCard
export interface VideoCardProps {
  video: BatchVideo;
  username: string;
  notifications: Notification[];
  viewedNotifications: string[];
  onProcessBatch: (video: BatchVideo) => void;
  onOpenDrawer: (video: BatchVideo) => void;
  onDeleteSuccess: () => void;
  showDate?: boolean;
}

// Props for StatusBadge (sub-component example)
export interface StatusBadgeProps {
  status: string;
  className?: string;
  children?: ReactNode;
}

// Props for ProcessFooter (sub-component example)
export interface ProcessFooterProps {
  status: string;
  video: BatchVideo;
  onProcess: (video: BatchVideo) => void;
  onOpenDrawer: (video: BatchVideo) => void;
  onChat: (id: number) => void;
  progress?: number | null;
}

// Props for NotificationPopover
export interface NotificationPopoverProps {
  notifications: Notification[];
  unreadNotifications: Notification[];
  onViewDetails: (videoId: number, highlightId?: string) => void;
}

// Extended state from Redux slice (for reference)
export interface BatchVideosState {
  searchQuery: string;
  videoslist: BatchVideo[];
  totalItems: number;
  uploadSuccess: boolean;
  isLoading: boolean;
  currentPage: number;
  itemsPerPage: number;
  usernames: Record<string, string>;
}

// V2 Process Config Types
export interface BatchProcessConfigInput {
  orgProcessHash: string;
  processConfig: Record<string, unknown>;
  isEnabled?: boolean;
}

export interface BatchCreateInput {
  batchHash: string;
  batchName: string;
  batchCloudStreamPath: string;
  duration?: number;
  batchType?: string;
  batchPlacementZone?: string;
  processConfigs: BatchProcessConfigInput[];
  batchCity?: string;
  batchAddress1?: string;
  batchFpsSourceRate?: string;
  batchIp?: string;
  batchLatitude?: string;
  batchLongitude?: string;
  batchPlacementSubzone?: string;
  batchPlacementZoneSlot?: string;
  batchThumbnailPath?: string;
  batchZipcode?: string;
}

// User type snippet (from original localStorage usage)
export interface User {
  roles: string[];
}

// VideoGrid ref interface for imperative handle
export interface VideoGridRef {
  prev: () => void;
  next: () => void;
}

// Batch Insights Types (YOLO)
export interface YoloInsights {
  __typename: 'YoloInsights';
  batchHash: string;
  batchId: number;
  timingMetrics?: TimingMetrics | null;
  annotationConfig?: AnnotationConfig | null;
  videoInfo?: VideoInfo | null;
  classCounts: Record<string, number>;
  modeClassCounts: Record<string, number>;
  totalChunksProcessed: number;
  totalObjectsDetected: number;
  modeTotalObjectsDetected: number;
  boundingBoxes?: BoundingBoxesData | null;
  videoPresignedUrls?: string[];
  videoPresignedUrlExpirations?: string[];
}

// Bounding box data shape returned from backend
export interface BoundingBoxDetection {
  class_name: string;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2] in pixels
  confidence: number;
  track_id?: string;
  frame_index?: number;
  timestamp_ms?: number;
  timestamp_seconds?: number;
}

export interface BoundingBoxFrame {
  frame_index?: number;
  timestamp_ms?: number;
  timestamp_seconds?: number;
  detections?: BoundingBoxDetection[];
  tracked_persons?: TrackedPersonBoundingBox[];
  tracked_objects?: TrackedPersonBoundingBox[];
}

export interface BoundingBoxesData {
  total_frames_processed?: number;
  source_width?: number;
  source_height?: number;
  frames: BoundingBoxFrame[];
}

// PPE Insights Types
export interface PpeAstecInsights {
  __typename: 'PpeAstecInsights';
  batchHash: string;
  batchId: number;
  timingMetrics?: TimingMetrics | null;
  annotationConfig?: AnnotationConfig | null;
  videoInfo?: VideoInfo | null;
  totalChunksProcessed: number;
  modeTotalObjectsDetected?: number;
  uniqueCounts: Record<string, number>;
  modePersonsPerFrame: number;
  perPersonPpeSummary: Record<string, PersonPPE>;
  ppeSummary: PPESummary;
  boundingBoxes?: BoundingBoxesData | null;
  videoPresignedUrls?: string[];
  videoPresignedUrlExpirations?: string[];
}

export interface PersonPPE {
  hardhat: boolean;
  goggles: boolean;
  gloves: boolean;
  shoes: boolean;
  safety_vest: boolean;
  PPE: boolean;
}

export interface TrackedPersonPpeStatus {
  helmet?: boolean;
  glasses?: boolean;
  vest?: boolean;
  gloves?: boolean;
  shoes?: boolean;
  [key: string]: boolean | undefined;
}

export interface TrackedPersonBoundingBox {
  track_id?: string | number;
  bbox: [number, number, number, number];
  ppe_status?: TrackedPersonPpeStatus;
  full_ppe?: boolean;
  confidence?: number;
  class_name?: string;
  frame_index?: number;
  timestamp_ms?: number;
  timestamp_seconds?: number;
}

export interface TimingMetrics {
  downloadSeconds?: number;
  processingSeconds?: number;
  webConversionSeconds?: number;
  webConversionSuccess?: boolean;
  uploadSeconds?: number;
  overallSeconds?: number;
}

export interface AnnotationConfig {
  ppeDisplayNames?: Record<string, string>;
  compliantColor?: [number, number, number];
  nonCompliantColor?: [number, number, number];
}

export interface VideoInfo {
  durationSeconds?: number;
  fps?: number;
  inputType?: string;
  inputUri?: string;
  outputJsonPresignedUrl?: string;
  outputS3VideoUri?: string;
  outputS3JsonUri?: string;
  outputVideoPresignedUrl?: string;
  processUuid?: string;
  processedAt?: string;
  processingTimeSeconds?: number;
  videoHeight?: number;
  totalFrames?: number;
  videoWidth?: number;
}

export interface PPESummary {
  hard_hat: number;
  goggles: number;
  safety_vest: number;
  gloves: number;
  safety_shoes: number;
  persons_detected: number;
  list_of_vehicles?: string[];
}

export interface BatchInsightsData {
  getBatchInsights: YoloInsights | PpeAstecInsights | null;
}
