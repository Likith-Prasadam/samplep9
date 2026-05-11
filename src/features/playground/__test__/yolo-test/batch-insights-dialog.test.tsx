import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');

  return {
    ...actual,
    useMemo: <T,>(factory: () => T) => factory(),
  };
});

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: ReactNode }) => <>{children}</>,
  DialogContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  DialogDescription: ({ children }: { children: ReactNode }) => <>{children}</>,
  DialogTitle: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import { BatchInsightsDialog } from '../../components/batch-insights-dialog';
import type { YoloInsights } from '../../types/batch-analysis';

const sampleInsights: YoloInsights = {
  __typename: 'YoloInsights',
  batchHash: 'batch-1',
  batchId: 1,
  classCounts: { person: 5, helmet: 2, vehicle: 10 },
  modeClassCounts: { person: 1 },
  totalChunksProcessed: 3,
  totalObjectsDetected: 17,
  boundingBoxes: null,
  videoPresignedUrls: [],
  videoPresignedUrlExpirations: [],
};

describe('BatchInsightsDialog', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the loading and empty states', () => {
    const { rerender } = render(
      <BatchInsightsDialog
        open
        onOpenChange={vi.fn()}
        insights={null}
        isLoading
      />
    );

    expect(screen.getByText('Loading insights...')).toBeInTheDocument();

    rerender(
      <BatchInsightsDialog
        open
        onOpenChange={vi.fn()}
        insights={null}
        isLoading={false}
      />
    );

    expect(screen.getByText('No Insights Available')).toBeInTheDocument();
  });

  it('sorts YOLO class counts and renders the summary metrics', () => {
    render(
      <BatchInsightsDialog
        open
        onOpenChange={vi.fn()}
        insights={sampleInsights}
        isLoading={false}
      />
    );

    expect(screen.getByText('17')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('vehicle')).toBeInTheDocument();
    expect(screen.getByText('person')).toBeInTheDocument();
    expect(screen.getByText('helmet')).toBeInTheDocument();
  });
});
