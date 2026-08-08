import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vitest-tsconfig-paths';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    pool: 'threads',
    testTimeout: 15000,
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
});
