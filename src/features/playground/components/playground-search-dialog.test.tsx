/// <reference types="vite/client" />

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import type { ReactNode } from 'react';
import PlaygroundSearchDialog from './playground-search-dialog';
import { getUserSession } from '../../../lib/ssemanager';
import { formatTimeInTimezone } from '../../../utils/timeUtils';

vi.mock('@/hooks/use-timezone', () => ({
  useTimezone: () => ({
    selectedTimezone: {
      value: 'UTC',
      label: 'UTC (00:00)',
      iana: 'UTC',
      city: 'UTC',
    },
    setSelectedTimezone: vi.fn(),
    availableTimezones: [],
  }),
}));

vi.mock('@/lib/ssemanager', () => ({
  getUserSession: vi.fn(),
}));

vi.mock('@/utils/timeUtils', () => ({
  formatTimeInTimezone: vi.fn(() => 'Apr 13, 2026, 10:00 AM'),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: ReactNode; open: boolean }) =>
    open ? <>{children}</> : null,
  DialogContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  DialogHeader: ({ children }: { children: ReactNode }) => <>{children}</>,
  DialogTitle: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const mockMatchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('PlaygroundSearchDialog', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('matchMedia', mockMatchMedia);
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    vi.mocked(getUserSession).mockReturnValue({
      token: 'test-token',
      cohortId: null,
      userId: null,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders the intro state when open', () => {
    render(<PlaygroundSearchDialog open onOpenChange={vi.fn()} />);

    expect(
      screen.getByText(/Describe anything you want to find/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
    expect(screen.getByRole('textbox')).toBeEnabled();
  });

  it('shows an error when authentication is missing', async () => {
    vi.mocked(getUserSession).mockReturnValue({
      token: null,
      cohortId: null,
      userId: null,
    });

    render(<PlaygroundSearchDialog open onOpenChange={vi.fn()} />);

    await userEvent.type(screen.getByRole('textbox'), 'nighttime activity');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain(
      'Authentication required. Please sign in again.'
    );
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('fetches and renders results for a valid search', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        results: [
          {
            embedding_hash: 'embed-1',
            similarity_score: 0.92,
            video_hash: 'vid-1',
            process_id: 10,
            modality: 'batch',
            chunk_presigned_url: 'https://example.com/clip.mp4',
            created_at: '2026-04-13T10:00:00Z',
          },
        ],
        total_count: 1,
        size: 10,
        offset: 0,
        has_more: false,
      }),
    } as Response);

    render(<PlaygroundSearchDialog open onOpenChange={vi.fn()} />);

    await userEvent.type(screen.getByRole('textbox'), 'delivery truck');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(screen.getByText(/Results for/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Apr 13, 2026, 10:00 AM')).toBeInTheDocument();

    const summaries = screen.getAllByText((_, element) =>
      (element?.textContent ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .includes('Showing 1 to 1 of 1 results')
    );
    expect(summaries[0]).toBeInTheDocument();

    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe(import.meta.env.VITE_SEMANTIC_SEARCH_API_URL);
    expect(options?.method).toBe('POST');

    const body = JSON.parse(String(options?.body));
    expect(body).toEqual({
      query: 'delivery truck',
      size: 10,
      offset: 0,
      inference_modality: 'batch',
    });
    expect(vi.mocked(formatTimeInTimezone)).toHaveBeenCalled();
  });

  it('shows the empty-results state when the search returns nothing', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        results: [],
        total_count: 0,
        size: 10,
        offset: 0,
        has_more: false,
      }),
    } as Response);

    render(<PlaygroundSearchDialog open onOpenChange={vi.fn()} />);

    await userEvent.type(screen.getByRole('textbox'), 'empty match');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(
      await screen.findByText(/No clips matched that search/i)
    ).toBeInTheDocument();
  });

  it('requests a new page size when rows per page changes', async () => {
    const makeResponse = (size: number) =>
      ({
        ok: true,
        json: async () => ({
          status: 'success',
          results: [
            {
              embedding_hash: size === 20 ? 'embed-3' : 'embed-2',
              similarity_score: 0.91,
              video_hash: size === 20 ? 'vid-3' : 'vid-2',
              process_id: size === 20 ? 13 : 12,
              modality: 'batch',
              chunk_presigned_url:
                size === 20
                  ? 'https://example.com/clip-3.mp4'
                  : 'https://example.com/clip-2.mp4',
              created_at: '2026-04-13T11:00:00Z',
            },
          ],
          total_count: 12,
          size,
          offset: 0,
          has_more: size !== 20,
        }),
      }) as Response;

    vi.mocked(fetch).mockImplementation(async (_url, init) => {
      const body = JSON.parse(String(init?.body ?? '{}'));
      const size =
        typeof body.size === 'number' && !Number.isNaN(body.size)
          ? body.size
          : 10;
      return makeResponse(size);
    });

    const user = userEvent.setup({ delay: null });
    render(<PlaygroundSearchDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByRole('textbox'), 'warehouse');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(screen.getByText(/Results for/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: '20' }));

    await waitFor(() => {
      const lastCall = vi.mocked(fetch).mock.calls.at(-1);
      const options = lastCall?.[1];
      const body = JSON.parse(String(options?.body));
      expect(body.size).toBe(20);
      expect(body.offset).toBe(0);
      expect(body.query).toBe('warehouse');
    });
  });

  it('resets state when the dialog closes', async () => {
    const { rerender } = render(
      <PlaygroundSearchDialog open onOpenChange={vi.fn()} />
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    await userEvent.type(input, 'reset me');
    expect(input.value).toBe('reset me');

    rerender(<PlaygroundSearchDialog open={false} onOpenChange={vi.fn()} />);
    rerender(<PlaygroundSearchDialog open onOpenChange={vi.fn()} />);

    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('');
  });
});
