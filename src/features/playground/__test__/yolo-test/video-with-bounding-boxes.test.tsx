import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const overlaySpy = vi.fn();
const hookStateQueue: unknown[] = [];

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');

  return {
    ...actual,
    useState: <T,>(initialState: T) => {
      const value =
        hookStateQueue.length > 0
          ? (hookStateQueue.shift() as T)
          : typeof initialState === 'function'
            ? ((initialState as () => T)() as T)
            : initialState;

      return [value, vi.fn()] as const;
    },
    useRef: <T,>(initialValue: T) => ({ current: initialValue }),
    useMemo: <T,>(factory: () => T) => factory(),
    useEffect: vi.fn(),
  };
});

vi.mock('../../components/bounding-box-overlay', () => ({
  BoundingBoxOverlay: (props: Record<string, unknown>) => {
    overlaySpy(props);
    return null;
  },
}));

vi.mock('../../utils/bounding-box-normalizer', () => ({
  normalizeBoundingBoxes: vi.fn(() => [
    {
      frameId: 0,
      timestampMs: 0,
      detections: [
        {
          id: 'vehicle-1',
          frameId: 0,
          timestampMs: 0,
          className: 'vehicle',
          confidence: 0.95,
          trackId: '1',
          bbox: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        },
        {
          id: 'person-2',
          frameId: 0,
          timestampMs: 0,
          className: 'person',
          confidence: 0.4,
          trackId: '2',
          bbox: { x: 0.3, y: 0.3, width: 0.2, height: 0.2 },
        },
      ],
    },
  ]),
  getDetectionsAtTime: vi.fn(() => [
    {
      id: 'vehicle-1',
      frameId: 0,
      timestampMs: 0,
      className: 'vehicle',
      confidence: 0.95,
      trackId: '1',
      bbox: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
    },
    {
      id: 'person-2',
      frameId: 0,
      timestampMs: 0,
      className: 'person',
      confidence: 0.4,
      trackId: '2',
      bbox: { x: 0.3, y: 0.3, width: 0.2, height: 0.2 },
    },
  ]),
}));

import { VideoWithBoundingBoxes } from '../../components/video-with-bounding-boxes';
import type { BoundingBoxesData } from '../../types/batch-analysis';

const setVideoDimensions = (
  video: HTMLVideoElement,
  width: number,
  height: number,
  duration = 10
) => {
  Object.defineProperty(video, 'videoWidth', {
    configurable: true,
    value: width,
  });
  Object.defineProperty(video, 'videoHeight', {
    configurable: true,
    value: height,
  });
  Object.defineProperty(video, 'duration', {
    configurable: true,
    value: duration,
  });
  Object.defineProperty(video, 'currentTime', {
    configurable: true,
    value: 0,
    writable: true,
  });
};

describe('VideoWithBoundingBoxes', () => {
  beforeEach(() => {
    overlaySpy.mockClear();
    hookStateQueue.length = 0;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('filters detections by confidence and selected class before passing them to the overlay', () => {
    hookStateQueue.push(
      { width: 500, height: 250 },
      { width: 100, height: 100 },
      0,
      10000,
      false,
      null,
      false
    );

    render(
      <VideoWithBoundingBoxes
        videoUrl="https://example.com/video.mp4"
        boundingBoxes={
          {
            source_width: 100,
            source_height: 100,
            frames: [{ frame_index: 0, timestamp_ms: 0, detections: [] }],
          } as BoundingBoxesData
        }
        sourceVideoInfo={{ videoWidth: 100, videoHeight: 100 }}
        confidenceThreshold={0.5}
        selectedClasses={['vehicle']}
      />
    );

    const video = document.querySelector('video') as HTMLVideoElement;
    expect(video).toBeTruthy();
    setVideoDimensions(video, 100, 100);

    expect(overlaySpy).toHaveBeenCalled();

    const lastCall = overlaySpy.mock.calls.at(-1)?.[0] as {
      detections?: Array<{ id: string }>;
      renderWidth?: number;
      renderHeight?: number;
    };

    expect(lastCall.renderWidth).toBe(250);
    expect(lastCall.renderHeight).toBe(250);
    expect(lastCall.detections?.map((item) => item.id)).toEqual(['vehicle-1']);
  });

  it('renders a media error overlay when the video starts with an error state', () => {
    hookStateQueue.push(
      { width: 0, height: 0 },
      { width: 0, height: 0 },
      0,
      0,
      false,
      'Network error while loading video data.',
      false
    );

    render(<VideoWithBoundingBoxes videoUrl="https://example.com/video.mp4" />);

    expect(screen.getByText('Video unavailable')).toBeInTheDocument();
    expect(
      screen.getByText(/Network error while loading video data/i)
    ).toBeInTheDocument();
  });
});
