import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4173,
  },
  preview: {
    port: 4174,
  },
  test: {
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'convex/**/*.{test,spec}.{ts,tsx}',
      'shared/**/*.{test,spec}.{ts,tsx}',
    ],
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      'convex/_generated/**',
    ],
  },
})
