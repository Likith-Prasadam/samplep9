import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const videoSpy = vi.fn();
const filtersSpy = vi.fn();
const stateQueue: unknown[] = [];

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');

  return {
    ...actual,
    useState: <T,>(initialState: T) => {
      const value =
        stateQueue.length > 0
          ? (stateQueue.shift() as T)
          : typeof initialState === 'function'
            ? ((initialState as () => T)() as T)
            : initialState;

      return [value, vi.fn()] as const;
    },
    useMemo: <T,>(factory: () => T) => factory(),
    useEffect: vi.fn(),
  };
});

vi.mock('../../components/video-with-bounding-boxes', () => ({
  VideoWithBoundingBoxes: (props: Record<string, unknown>) => {
    videoSpy(props);
    return <div data-testid="video-with-boxes" />;
  },
}));

vi.mock('../../components/detection-filters', () => ({
  DetectionFilters: (props: Record<string, unknown>) => {
    filtersSpy(props);
    return <div data-testid="detection-filters" />;
  },
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: ReactNode }) => <>{children}</>,
  SheetContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SheetDescription: ({ children }: { children: ReactNode }) => <>{children}</>,
  SheetTitle: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import { BatchInsightsPopover } from '../../components/batch-insights-popover';
import type { YoloInsights } from '../../types/batch-analysis';

const insights: YoloInsights = {
  __typename: 'YoloInsights',
  batchHash: 'batch-1',
  batchId: 1,
  classCounts: { vehicle: 10, person: 4 },
  modeClassCounts: { vehicle: 2 },
  totalChunksProcessed: 2,
  totalObjectsDetected: 14,
  boundingBoxes: {
    source_width: 100,
    source_height: 100,
    frames: [
      {
        frame_index: 0,
        timestamp_ms: 0,
        detections: [
          { class_name: 'vehicle', confidence: 0.9, bbox: [0, 0, 10, 10] },
          { class_name: 'person', confidence: 0.8, bbox: [10, 10, 20, 20] },
        ],
      },
    ],
  },
  videoPresignedUrls: ['https://example.com/v1.mp4'],
  videoPresignedUrlExpirations: ['2026-01-01T00:00:00Z'],
};

describe('BatchInsightsPopover', () => {
  beforeEach(() => {
    videoSpy.mockClear();
    filtersSpy.mockClear();
    stateQueue.length = 0;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the empty state when insights are missing', () => {
    render(
      <BatchInsightsPopover open onOpenChange={vi.fn()} insights={null} />
    );

    expect(screen.getByText('No Insights Available')).toBeInTheDocument();
  });

  it('passes detection data into the video player and initializes filters from available classes', () => {
    stateQueue.push(null, false, 0.5, ['person', 'vehicle'], true);

    render(
      <BatchInsightsPopover
        open
        onOpenChange={vi.fn()}
        insights={insights}
        batchName="Batch A"
        originalVideoUrl="https://example.com/input.mp4"
      />
    );

    expect(screen.getByText('Video Insights')).toBeInTheDocument();
    expect(screen.getByTestId('video-with-boxes')).toBeInTheDocument();
    expect(
      screen.getByText((_, node) => node?.textContent === '2/2')
    ).toBeInTheDocument();

    const videoProps = videoSpy.mock.calls.at(-1)?.[0] as {
      videoUrl?: string;
      confidenceThreshold?: number;
      selectedClasses?: string[];
      showTrackIds?: boolean;
    };

    expect(videoProps.videoUrl).toBe('https://example.com/input.mp4');
    expect(videoProps.confidenceThreshold).toBe(0.5);
    expect(videoProps.selectedClasses).toEqual(['person', 'vehicle']);
    expect(videoProps.showTrackIds).toBe(true);
  });
});
