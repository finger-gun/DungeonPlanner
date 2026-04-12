import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // When deploying to a subfolder on GitHub Pages, set VITE_BASE_PATH=/dungeonplanner/
  base: process.env.VITE_BASE_PATH ?? '/',
  assetsInclude: ['**/*.glb'],
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react')) {
            return 'react'
          }

          // Keep three + fiber + drei in ONE chunk so Rollup can resolve
          // Three.js WebGPU/TSL circular-dependency init order correctly.
          // Splitting them caused "LT is undefined" crashes in the prod build.
          if (
            id.includes('node_modules/three') ||
            id.includes('@react-three/fiber') ||
            id.includes('@react-three/drei') ||
            id.includes('node_modules/three-stdlib')
          ) {
            return 'three'
          }

          if (
            id.includes('@react-three/rapier') ||
            id.includes('@dimforge/rapier3d-compat')
          ) {
            return 'rapier'
          }

          if (id.includes('node_modules/zustand')) {
            return 'state'
          }

          return undefined
        },
      },
    },
  },
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    exclude: ['tests/e2e/**'],
  },
})
