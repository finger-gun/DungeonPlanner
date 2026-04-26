import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['scripts/**/*.{test,spec}.{js,mjs,ts,tsx}'],
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],
  },
})
