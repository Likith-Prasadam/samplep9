import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock localStorage for auth checks
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );

  // Mock localStorage to simulate unauthenticated state (no token)
  mockLocalStorage.getItem.mockReturnValue(null);
  mockLocalStorage.setItem.mockClear();
  mockLocalStorage.removeItem.mockClear();
});

describe('App', () => {
  it('renders login page with username input', async () => {
    render(<App />);

    expect(await screen.findByLabelText(/username/i)).toBeInTheDocument();
  });
});
