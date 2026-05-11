import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    testTimeout: 10000, // Increase default timeout to 10s
    // Avoid default `forks` pool: on some Windows setups Vitest can hit
    // "[vitest-pool]: Timeout starting forks runner" and exit non-zero despite all tests passing.
    pool: 'threads',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
