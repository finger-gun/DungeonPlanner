import express from 'express'
import cors from 'cors'
import { createServer as createHttpServer } from 'http'
import { createServer as createHttpsServer } from 'https'
import { readFileSync, existsSync } from 'fs'
import { Server } from 'colyseus'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { networkInterfaces } from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  GeneratedCharacterRequestError,
  handleGeneratedCharacterImageRequest,
} from './generatedCharacterImage.js'
import {
  deleteGeneratedCharacterAssets,
  GENERATED_CHARACTER_ASSET_PUBLIC_PATH,
  GENERATED_CHARACTER_STORAGE_DIR,
  GeneratedCharacterStorageError,
  saveGeneratedCharacterAssets,
} from './generatedCharacterStorage.js'
import { DungeonRoom } from './rooms/DungeonRoom.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 2567
// ── Express app ───────────────────────────────────────────────────────────────
const app = express()

// Allow requests from the Vite dev server (any localhost origin) and from the
// same-host production case. Colyseus WebSocket handshake also uses HTTP.
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (same-origin prod, curl) or any
    // localhost / LAN origin over http or https.
    cb(null, true)
  },
  credentials: true,
}))

app.use(express.json({ limit: '50mb' }))

app.post('/api/generated-characters/image', async (req, res) => {
  try {
    res.json(await handleGeneratedCharacterImageRequest(req.body))
  } catch (error) {
    res.status(error instanceof GeneratedCharacterRequestError ? error.status : 502).json({
      error: error instanceof Error ? error.message : 'Image generation failed.',
    })
  }
})

app.post('/api/generated-characters/assets', async (req, res) => {
  try {
    res.json(await saveGeneratedCharacterAssets(req.body))
  } catch (error) {
    const status = error instanceof GeneratedCharacterStorageError ? error.status : 502
    res.status(status).json({
      error: error instanceof Error ? error.message : 'Could not save generated character assets.',
    })
  }
})

app.delete('/api/generated-characters/assets/:storageId', async (req, res) => {
  try {
    await deleteGeneratedCharacterAssets(req.params.storageId)
    res.status(204).end()
  } catch (error) {
    const status = error instanceof GeneratedCharacterStorageError ? error.status : 502
    res.status(status).json({
      error: error instanceof Error ? error.message : 'Could not delete generated character assets.',
    })
  }
})

app.use(GENERATED_CHARACTER_ASSET_PUBLIC_PATH, express.static(GENERATED_CHARACTER_STORAGE_DIR))

// Serve the built frontend from ../dist (relative to this file at build time,
// or ../../dist relative to src/ at dev time)
const distPath = path.resolve(__dirname, '..', '..', 'dist')
app.use(express.static(distPath))

// Fallback: serve index.html for client-side routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// ── HTTP / HTTPS + Colyseus server ───────────────────────────────────────────
// WebGPU requires a secure context — plain http:// on a LAN IP won't expose
// navigator.gpu and the renderer crashes.  If mkcert certs exist next to this
// file we start HTTPS; otherwise fall back to HTTP (localhost only works fine).
const certDir = path.resolve(__dirname, '..', 'certs')
const certFile = path.join(certDir, 'cert.pem')
const keyFile  = path.join(certDir, 'key.pem')
const hasCerts = existsSync(certFile) && existsSync(keyFile)

const httpServer = hasCerts
  ? createHttpsServer({ cert: readFileSync(certFile), key: readFileSync(keyFile) }, app)
  : createHttpServer(app)

const protocol = hasCerts ? 'https' : 'http'

const gameServer = new Server({
  transport: new WebSocketTransport({
    server: httpServer,
    maxPayload: 50 * 1024 * 1024, // 50 MB — map JSON can be large
  }),
})

gameServer.define('dungeon', DungeonRoom)

// ── Start ─────────────────────────────────────────────────────────────────────
gameServer.listen(PORT).then(() => {
  const lanIp = getLanIp()

  console.log('')
  console.log('  ╔════════════════════════════════════════╗')
  console.log('  ║       DungeonPlanner — Server          ║')
  console.log('  ╠════════════════════════════════════════╣')
  console.log(`  ║  DM (you):  ${protocol}://localhost:${PORT}      ║`)
  console.log(`  ║  Players:   ${protocol}://${lanIp}:${PORT}   ║`)
  if (!hasCerts) {
    console.log('  ╠════════════════════════════════════════╣')
    console.log('  ║  ⚠  Running HTTP — WebGPU needs HTTPS  ║')
    console.log('  ║  Run scripts/setup-certs.sh to fix it  ║')
  }
  console.log('  ╚════════════════════════════════════════╝')
  console.log('')
  console.log('  Share the Players URL with your group.')
  console.log('  Press Ctrl+C to stop the server.')
  console.log('')
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function getLanIp(): string {
  const nets = networkInterfaces()
  for (const ifaces of Object.values(nets)) {
    for (const iface of ifaces ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return 'localhost      '
}
