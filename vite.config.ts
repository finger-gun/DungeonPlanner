import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
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

          if (id.includes('node_modules/three')) {
            return 'three'
          }

          if (id.includes('@react-three/fiber')) {
            return 'fiber'
          }

          if (
            id.includes('@react-three/drei') ||
            id.includes('node_modules/three-stdlib')
          ) {
            return 'drei'
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
