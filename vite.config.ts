import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// `base` is set by the GitHub Pages workflow (e.g. /neurodiversity-test/).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
