/// <reference types="vite/client" />

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LiveSearchPanel from './live-search-panel';
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

describe('LiveSearchPanel', () => {
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

  it('renders the intro state when no camera is selected', () => {
    render(<LiveSearchPanel />);

    expect(
      screen.getByText(/Search live video with natural language/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Select a live camera to run semantic search/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('shows an error when authentication is missing', async () => {
    vi.mocked(getUserSession).mockReturnValue({
      token: null,
      cohortId: null,
      userId: null,
    });

    render(<LiveSearchPanel camHash="cam-123" />);

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
            modality: 'live',
            chunk_presigned_url: 'https://example.com/clip.mp4',
            created_at: '2026-04-13T10:00:00Z',
          },
        ],
        total_count: 1,
        size: 50,
        offset: 0,
        has_more: false,
      }),
    } as Response);

    render(<LiveSearchPanel camHash="cam-123" />);

    await userEvent.type(screen.getByRole('textbox'), 'person with backpack');
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
      query: 'person with backpack',
      size: 50,
      offset: 0,
      inference_modality: 'live',
      live_hash: 'cam-123',
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
        size: 50,
        offset: 0,
        has_more: false,
      }),
    } as Response);

    render(<LiveSearchPanel camHash="cam-123" />);

    await userEvent.type(screen.getByRole('textbox'), 'empty match');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(
      await screen.findByText(/No clips matched that search/i)
    ).toBeInTheDocument();
  });

  it('updates the page size without refetching', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        results: Array.from({ length: 12 }).map((_, index) => ({
          embedding_hash: `embed-${index}`,
          similarity_score: 0.9,
          video_hash: `vid-${index}`,
          process_id: index,
          modality: 'live',
          chunk_presigned_url: 'https://example.com/clip.mp4',
          created_at: '2026-04-13T10:00:00Z',
        })),
        total_count: 12,
        size: 50,
        offset: 0,
        has_more: false,
      }),
    } as Response);

    render(<LiveSearchPanel camHash="cam-123" />);

    await userEvent.type(screen.getByRole('textbox'), 'warehouse');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(screen.getByText(/Results for/i)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: '20' }));

    const summaries = screen.getAllByText((_, element) =>
      (element?.textContent ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .includes('Showing 1 to 12 of 12 results')
    );
    expect(summaries[0]).toBeInTheDocument();
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it('paginates results with next/previous controls', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        results: Array.from({ length: 12 }).map((_, index) => ({
          embedding_hash: `embed-${index}`,
          similarity_score: 0.9,
          video_hash: `vid-${index}`,
          process_id: index,
          modality: 'live',
          chunk_presigned_url: 'https://example.com/clip.mp4',
          created_at: `2026-04-13T10:${String(index).padStart(2, '0')}:00Z`,
        })),
        total_count: 12,
        size: 50,
        offset: 0,
        has_more: false,
      }),
    } as Response);

    render(<LiveSearchPanel camHash="cam-123" />);

    await userEvent.type(screen.getByRole('textbox'), 'pagers');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 2/i)).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: /Go to next page/i });
    await userEvent.click(nextButton);

    expect(screen.getByText(/Page 2 of 2/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Go to previous page/i })
    ).toBeEnabled();
  });
});
