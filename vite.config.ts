import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import type { Plugin } from 'vite'
import {
  GeneratedCharacterRequestError,
  handleGeneratedCharacterImageRequest,
} from './server/src/generatedCharacterImage'
import {
  deleteGeneratedCharacterAssets,
  GeneratedCharacterStorageError,
  readGeneratedCharacterAsset,
  saveGeneratedCharacterAssets,
} from './server/src/generatedCharacterStorage'

/**
 * Three.js r182's three.webgpu.js pre-built file contains a debug-only
 * side-effect import to greggman.github.io. In LAN-only environments
 * the request fails and crashes the entire WebGPU module at init time.
 * This plugin strips that import before Rollup processes the file.
 */
function stripThreeDebugImport(): Plugin {
  return {
    name: 'strip-three-debug-import',
    transform(code, id) {
      if (!id.includes('three.webgpu') && !id.includes('three.tsl')) return
      const cleaned = code.replace(
        /import\s+['"]https?:\/\/greggman[^'"]*['"]\s*;?/g,
        '',
      )
      if (cleaned !== code) return { code: cleaned, map: null }
    },
  }
}

function generatedCharacterDevFallback(): Plugin {
  return {
    name: 'generated-character-dev-fallback',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const requestPath = getRequestPath(req)

          if (req.method === 'POST' && requestPath === '/api/generated-characters/image') {
            const body = await readJsonBody(req)
            const payload = await handleGeneratedCharacterImageRequest(body)
            sendJson(res, 200, payload)
            return
          }

          if (req.method === 'POST' && requestPath === '/api/generated-characters/assets') {
            const body = await readJsonBody(req)
            const payload = await saveGeneratedCharacterAssets(body)
            sendJson(res, 200, payload)
            return
          }

          if (req.method === 'DELETE' && requestPath.startsWith('/api/generated-characters/assets/')) {
            const storageId = decodeURIComponent(requestPath.slice('/api/generated-characters/assets/'.length))
            await deleteGeneratedCharacterAssets(storageId)
            res.statusCode = 204
            res.end()
            return
          }

          if (req.method === 'GET' && requestPath.startsWith('/generated-character-assets/')) {
            const asset = await readGeneratedCharacterAsset(requestPath)
            if (!asset) {
              res.statusCode = 404
              res.end()
              return
            }

            res.statusCode = 200
            res.setHeader('Content-Type', asset.contentType)
            res.end(asset.buffer)
            return
          }

          next()
        } catch (error) {
          const status =
            error instanceof GeneratedCharacterRequestError || error instanceof GeneratedCharacterStorageError
              ? error.status
              : 502
          sendJson(res, status, {
            error:
              error instanceof Error
                ? error.message
                : 'Generated character request failed.',
          })
        }
      })
    },
  }
}

function getRequestPath(req: IncomingMessage) {
  return new URL(req.url ?? '/', 'http://localhost').pathname
}

async function readJsonBody(req: IncomingMessage) {
  const chunks: Buffer[] = []

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  const rawBody = Buffer.concat(chunks).toString('utf8').trim()
  if (!rawBody) {
    return {}
  }

  try {
    return JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    throw new GeneratedCharacterRequestError(400, 'Request body must be valid JSON.')
  }
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

export default defineConfig({
  // When deploying to a subfolder on GitHub Pages, set VITE_BASE_PATH=/dungeonplanner/
  base: process.env.VITE_BASE_PATH ?? '/',
  assetsInclude: ['**/*.glb'],
  plugins: [generatedCharacterDevFallback(), react(), tailwindcss(), stripThreeDebugImport()],
  resolve: {
    alias: {
      // three.webgpu.js and three.tsl.js pre-built files contain a debug
      // import to greggman.github.io that crashes in LAN-only environments.
      // Point them at the pre-built files; the stripThreeDebugImport plugin
      // below removes the offending line before Rollup processes them.
      // 'three' stays at its default (three.module.js). Both three.module.js
      // and three.webgpu.js import from three.core.js, so Rollup deduplicates
      // the shared core — AmbientLight etc. are the same class instance in both.
      'three/webgpu': path.resolve('./node_modules/three/build/three.webgpu.js'),
      'three/tsl':    path.resolve('./node_modules/three/build/three.tsl.js'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:2567',
        changeOrigin: true,
      },
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
