import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  // When deploying to a subfolder on GitHub Pages, set VITE_BASE_PATH=/dungeonplanner/
  base: process.env.VITE_BASE_PATH ?? '/',
  assetsInclude: ['**/*.glb'],
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // three.webgpu.js and three.tsl.js (pre-built) contain a debug import
      // to https://greggman.github.io/... that crashes in LAN-only sessions.
      // Alias all three entrypoints to source so Rollup resolves them as one
      // module identity — avoids the "Light node not found" split-instance bug.
      'three/webgpu': path.resolve('./node_modules/three/src/Three.WebGPU.js'),
      'three/tsl':    path.resolve('./node_modules/three/src/Three.TSL.js'),
      'three':        path.resolve('./node_modules/three/src/Three.js'),
    },
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
            return 'react'
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
