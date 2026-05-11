/**
 * Development-only logger utility
 * Only logs in development mode or when VITE_DEBUG is enabled
 */
const isDev = import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true';

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log('[LiveStream]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    // Always log errors, even in production
    console.error('[LiveStream]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn('[LiveStream]', ...args);
    }
  },
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug('[LiveStream]', ...args);
    }
  },
};
