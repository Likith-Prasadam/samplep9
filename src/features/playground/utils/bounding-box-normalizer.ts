import type {
  BoundingBoxDetection,
  BoundingBoxFrame,
  BoundingBoxesData,
  TrackedPersonBoundingBox,
  TrackedPersonPpeStatus,
} from '../types/batch-analysis';

type RawBoundingBox = BoundingBoxDetection | TrackedPersonBoundingBox;

export interface NormalizedDetection {
  id: string;
  frameId: number;
  timestampMs: number;
  className: string;
  confidence: number;
  trackId: string;
  displayLabel?: string;
  ppeStatus?: TrackedPersonPpeStatus;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface NormalizedFrame {
  frameId: number;
  timestampMs: number;
  detections: NormalizedDetection[];
}

export interface DetectionLookupOptions {
  maxHoldMs?: number;
  preferNearest?: boolean;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const DEFAULT_FPS = 30;

const toFinite = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return value;
};

const getFrameDetections = (frame: BoundingBoxFrame): RawBoundingBox[] => {
  if (
    Array.isArray(frame.tracked_persons) &&
    frame.tracked_persons.length > 0
  ) {
    return frame.tracked_persons;
  }

  if (
    Array.isArray(frame.tracked_objects) &&
    frame.tracked_objects.length > 0
  ) {
    return frame.tracked_objects;
  }

  if (Array.isArray(frame.detections) && frame.detections.length > 0) {
    return frame.detections;
  }

  return [];
};

type FrameDetectionSource =
  | 'tracked_persons'
  | 'tracked_objects'
  | 'detections';

/** Which array `getFrameDetections` reads from (same priority order). */
const getFrameDetectionSource = (
  frame: BoundingBoxFrame
): FrameDetectionSource | null => {
  if (
    Array.isArray(frame.tracked_persons) &&
    frame.tracked_persons.length > 0
  ) {
    return 'tracked_persons';
  }
  if (
    Array.isArray(frame.tracked_objects) &&
    frame.tracked_objects.length > 0
  ) {
    return 'tracked_objects';
  }
  if (Array.isArray(frame.detections) && frame.detections.length > 0) {
    return 'detections';
  }
  return null;
};

const hasPpeMetadata = (detection: RawBoundingBox): boolean =>
  'ppe_status' in detection || 'full_ppe' in detection;

const isPpePersonDetection = (detection: RawBoundingBox): boolean =>
  Boolean(hasPpeMetadata(detection) || detection.class_name === 'person');

const humanizeKey = (value: string): string =>
  value
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const buildPpeDisplayLabel = (
  detection: RawBoundingBox
): string | undefined => {
  if ('ppe_status' in detection && detection.ppe_status) {
    const statusEntries = Object.entries(detection.ppe_status).filter(
      ([, value]) => typeof value === 'boolean'
    );

    if (statusEntries.length > 0) {
      return statusEntries
        .map(([key, value]) => `${humanizeKey(key)}: ${value ? 'yes' : 'no'}`)
        .join(', ');
    }
  }

  if ('full_ppe' in detection && typeof detection.full_ppe === 'boolean') {
    return `PPE: ${detection.full_ppe ? 'yes' : 'no'}`;
  }

  return undefined;
};

const getDetectionClassName = (detection: RawBoundingBox): string => {
  if (typeof detection.class_name === 'string' && detection.class_name.trim()) {
    return detection.class_name;
  }

  if ('full_ppe' in detection || 'ppe_status' in detection) {
    return 'person';
  }

  return 'unknown';
};

const getDetectionTrackId = (detection: RawBoundingBox): string => {
  if (typeof detection.track_id === 'string') {
    return detection.track_id;
  }

  if (typeof detection.track_id === 'number') {
    return String(detection.track_id);
  }

  return '';
};

const resolveSourceSize = (
  data: BoundingBoxesData,
  sourceVideoSize?: { width: number; height: number } | null,
  actualVideoSize?: { width: number; height: number }
): { width: number; height: number } => {
  const sourceWidth = toFinite(sourceVideoSize?.width) ?? 0;
  const sourceHeight = toFinite(sourceVideoSize?.height) ?? 0;

  if (sourceWidth > 0 && sourceHeight > 0) {
    return { width: sourceWidth, height: sourceHeight };
  }

  const explicitWidth = toFinite(data.source_width) ?? 0;
  const explicitHeight = toFinite(data.source_height) ?? 0;

  if (explicitWidth > 0 && explicitHeight > 0) {
    return { width: explicitWidth, height: explicitHeight };
  }

  const actualWidth = toFinite(actualVideoSize?.width) ?? 0;
  const actualHeight = toFinite(actualVideoSize?.height) ?? 0;

  if (actualWidth > 0 && actualHeight > 0) {
    return { width: actualWidth, height: actualHeight };
  }

  return { width: 0, height: 0 };
};

const resolveTimestampMs = (
  frame: BoundingBoxFrame,
  index: number,
  totalFrames: number,
  durationMs: number
): number => {
  const timestampMs = toFinite(frame.timestamp_ms);
  if (timestampMs !== null) {
    return Math.max(0, Math.round(timestampMs));
  }

  const timestampSeconds = toFinite(frame.timestamp_seconds);
  if (timestampSeconds !== null) {
    return Math.max(0, Math.round(timestampSeconds * 1000));
  }

  const frameIndex = toFinite(frame.frame_index) ?? index;
  const spacingMs = durationMs / Math.max(1, totalFrames - 1);

  return Math.max(0, Math.round(Math.max(0, frameIndex) * spacingMs));
};

const normalizeDetection = (
  detection: RawBoundingBox,
  sourceWidth: number,
  sourceHeight: number,
  index: number,
  frameId: number,
  timestampMs: number,
  defaultConfidence: number
): NormalizedDetection | null => {
  const [x1, y1, x2, y2] = detection.bbox;

  if (![x1, y1, x2, y2].every((value) => Number.isFinite(value))) {
    return null;
  }

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return null;
  }

  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const right = Math.max(x1, x2);
  const bottom = Math.max(y1, y2);

  const normalizedX = clamp(left / sourceWidth, 0, 1);
  const normalizedY = clamp(top / sourceHeight, 0, 1);
  const normalizedWidth = clamp(
    (right - left) / sourceWidth,
    0,
    1 - normalizedX
  );
  const normalizedHeight = clamp(
    (bottom - top) / sourceHeight,
    0,
    1 - normalizedY
  );

  const className = getDetectionClassName(detection);
  const trackId = getDetectionTrackId(detection);
  const confidenceValue = toFinite(
    (detection as { confidence?: number }).confidence
  );

  return {
    id: `${frameId}-${index}-${className}-${trackId || index}`,
    frameId,
    timestampMs,
    className,
    confidence: clamp(confidenceValue ?? defaultConfidence, 0, 1),
    trackId,
    displayLabel: buildPpeDisplayLabel(detection),
    ppeStatus: 'ppe_status' in detection ? detection.ppe_status : undefined,
    bbox: {
      x: normalizedX,
      y: normalizedY,
      width: normalizedWidth,
      height: normalizedHeight,
    },
  };
};

export function normalizeBoundingBoxes(
  data: BoundingBoxesData,
  videoDurationMs = 0,
  sourceVideoSize?: { width: number; height: number } | null,
  actualVideoSize?: { width: number; height: number }
): NormalizedFrame[] {
  const frames = data.frames ?? [];
  const sourceSize = resolveSourceSize(data, sourceVideoSize, actualVideoSize);
  const totalFrames = Math.max(
    1,
    Math.round(toFinite(data.total_frames_processed) ?? frames.length),
    frames.length
  );
  const durationMs =
    videoDurationMs > 0 ? videoDurationMs : totalFrames * (1000 / DEFAULT_FPS);

  return frames
    .map((frame, index) => {
      const frameId =
        typeof frame.frame_index === 'number' ? frame.frame_index : index;
      const timestampMs = resolveTimestampMs(
        frame,
        index,
        totalFrames,
        durationMs
      );

      const frameDetections = getFrameDetections(frame);
      const source = getFrameDetectionSource(frame);
      // YOLO / traffic uses `tracked_objects` with COCO classes (person + car + …).
      // Do not strip non-person boxes when any track is labeled "person".
      const shouldApplyPpePersonOnlyFilter =
        source === 'tracked_persons' ||
        (source === 'detections' && frameDetections.some(hasPpeMetadata));
      const detectionsToNormalize =
        shouldApplyPpePersonOnlyFilter &&
        frameDetections.some(isPpePersonDetection)
          ? frameDetections.filter(isPpePersonDetection)
          : frameDetections;

      const detections = detectionsToNormalize
        .map((detection, detectionIndex) =>
          normalizeDetection(
            detection,
            sourceSize.width,
            sourceSize.height,
            detectionIndex,
            frameId,
            timestampMs,
            'full_ppe' in detection || 'ppe_status' in detection ? 1 : 0
          )
        )
        .filter(
          (detection): detection is NormalizedDetection => detection !== null
        );

      return {
        frameId,
        timestampMs,
        detections,
      };
    })
    .sort((a, b) => a.timestampMs - b.timestampMs);
}

export function getDetectionsAtTime(
  frames: NormalizedFrame[],
  timeMs: number,
  options: DetectionLookupOptions = {}
): NormalizedDetection[] {
  if (frames.length === 0) {
    return [];
  }

  const maxHoldMs = Math.max(0, options.maxHoldMs ?? 250);
  const preferNearest = options.preferNearest ?? false;
  const safeTimeMs = Number.isFinite(timeMs) ? timeMs : 0;

  if (safeTimeMs <= frames[0].timestampMs) {
    return preferNearest || frames[0].timestampMs - safeTimeMs <= maxHoldMs
      ? frames[0].detections
      : [];
  }

  let low = 0;
  let high = frames.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midTime = frames[mid].timestampMs;

    if (midTime === safeTimeMs) {
      return frames[mid].detections;
    }

    if (midTime < safeTimeMs) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const previousFrame = frames[Math.max(0, high)];
  if (!previousFrame) {
    return [];
  }

  const delta = safeTimeMs - previousFrame.timestampMs;
  if (delta <= maxHoldMs || preferNearest) {
    return previousFrame.detections;
  }

  return [];
}

export function extractUniqueClasses(
  data: BoundingBoxesData | null | undefined
): string[] {
  if (!data?.frames?.length) {
    return [];
  }

  const classSet = new Set<string>();

  data.frames.forEach((frame) => {
    getFrameDetections(frame).forEach((detection) => {
      classSet.add(getDetectionClassName(detection));
    });
  });

  return Array.from(classSet).sort((a, b) => a.localeCompare(b));
}
