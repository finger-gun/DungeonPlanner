import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { chromium } from '@playwright/test'

const rootDir = process.cwd()
const host = '127.0.0.1'
const port = 4174
const baseUrl = `http://${host}:${port}`
const viewportSize = 320

async function main() {
  const { targetDir, filter, missingOnly } = parseArgs(process.argv.slice(2))
  const allModelFiles = readdirSync(targetDir)
    .filter((file) => file.endsWith('.glb') || file.endsWith('.gltf'))
    .filter((file) => !filter || file.includes(filter))
    .sort((left, right) => left.localeCompare(right))
  const modelFiles = missingOnly
    ? allModelFiles.filter((file) => shouldGenerateThumbnail(targetDir, file))
    : allModelFiles

  if (allModelFiles.length === 0) {
    throw new Error(`No GLB/GLTF files found in ${targetDir}`)
  }

  if (modelFiles.length === 0) {
    console.log(`No thumbnails to generate in ${targetDir}`)
    return
  }

  const server = await startViteServer()

  try {
    const browser = await chromium.launch()
    const page = await browser.newPage({
      viewport: { width: viewportSize, height: viewportSize },
      deviceScaleFactor: 1,
    })

    for (const fileName of modelFiles) {
      const assetPath = path.join(targetDir, fileName)
      const outputPath = assetPath.replace(/\.(glb|gltf)$/i, '.png')
      const assetUrl = toViteFsUrl(assetPath)
      const renderUrl = `${baseUrl}/?thumbnail-renderer=1&asset=${encodeURIComponent(assetUrl)}`

      console.log(`Rendering ${fileName}`)
      await page.goto(renderUrl, { waitUntil: 'networkidle' })
      await page.waitForFunction(
        () => window.__THUMBNAIL_READY__ === true || Boolean(window.__THUMBNAIL_ERROR__),
        undefined,
        { timeout: 120_000 },
      )

      const errorMessage = await page.evaluate(() => window.__THUMBNAIL_ERROR__ ?? null)
      if (errorMessage) {
        throw new Error(`Failed to render ${fileName}: ${errorMessage}`)
      }

      const centeredPng = await page.evaluate((size) => {
        const canvas = document.querySelector(
          'canvas[data-testid="thumbnail-canvas"], [data-testid="thumbnail-canvas"] canvas, canvas',
        )
        if (!(canvas instanceof HTMLCanvasElement)) {
          throw new Error('Thumbnail canvas was not found.')
        }

        const sourceCanvas = document.createElement('canvas')
        sourceCanvas.width = size
        sourceCanvas.height = size
        const sourceContext = sourceCanvas.getContext('2d')
        if (!sourceContext) {
          throw new Error('Could not create source thumbnail canvas.')
        }

        sourceContext.drawImage(canvas, 0, 0, size, size)
        const imageData = sourceContext.getImageData(0, 0, size, size)
        const { data } = imageData

        let minX = size
        let minY = size
        let maxX = -1
        let maxY = -1

        for (let y = 0; y < size; y += 1) {
          for (let x = 0; x < size; x += 1) {
            const alpha = data[(y * size + x) * 4 + 3]
            if (alpha === 0) {
              continue
            }

            minX = Math.min(minX, x)
            minY = Math.min(minY, y)
            maxX = Math.max(maxX, x)
            maxY = Math.max(maxY, y)
          }
        }

        if (maxX < minX || maxY < minY) {
          return sourceCanvas.toDataURL('image/png')
        }

        const contentWidth = maxX - minX + 1
        const contentHeight = maxY - minY + 1
        const padding = size * 0.08
        const scale = Math.min(
          (size - padding * 2) / contentWidth,
          (size - padding * 2) / contentHeight,
        )
        const outputCanvas = document.createElement('canvas')
        outputCanvas.width = size
        outputCanvas.height = size
        const outputContext = outputCanvas.getContext('2d')
        if (!outputContext) {
          throw new Error('Could not create output thumbnail canvas.')
        }

        const drawWidth = contentWidth * scale
        const drawHeight = contentHeight * scale
        const drawX = (size - drawWidth) * 0.5
        const drawY = (size - drawHeight) * 0.5

        outputContext.drawImage(
          sourceCanvas,
          minX,
          minY,
          contentWidth,
          contentHeight,
          drawX,
          drawY,
          drawWidth,
          drawHeight,
        )

        return outputCanvas.toDataURL('image/png')
      }, viewportSize)

      writeFileSync(outputPath, Buffer.from(centeredPng.replace(/^data:image\/png;base64,/, ''), 'base64'))
    }

    await browser.close()
    console.log(`Generated ${modelFiles.length} thumbnails in ${targetDir}`)
  } finally {
    await stopServer(server)
  }
}

function parseArgs(args) {
  let target = 'core'
  let filter = null
  let missingOnly = false

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index]
    if (value === '--filter') {
      filter = args[index + 1] ?? null
      index += 1
      continue
    }

    if (value === '--missing-only') {
      missingOnly = true
      continue
    }

    target = value
  }

  return {
    targetDir: resolveContentPackDir(target),
    filter,
    missingOnly,
  }
}

function resolveContentPackDir(input) {
  const directPath = path.resolve(rootDir, input)
  if (input.includes(path.sep) || input.startsWith('.')) {
    return directPath
  }

  return path.join(rootDir, 'src/assets/models', input)
}

function shouldGenerateThumbnail(targetDir, fileName) {
  const assetPath = path.join(targetDir, fileName)
  const outputPath = assetPath.replace(/\.(glb|gltf)$/i, '.png')

  if (!existsSync(outputPath)) {
    return true
  }

  return statSync(outputPath).mtimeMs < statSync(assetPath).mtimeMs
}

function toViteFsUrl(filePath) {
  return `/@fs/${filePath.split(path.sep).join('/')}`
}

async function startViteServer() {
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const child = spawn(
    command,
    ['run', 'dev', '--', '--host', host, '--port', String(port), '--strictPort'],
    {
      cwd: rootDir,
      stdio: 'pipe',
      env: { ...process.env },
    },
  )

  let logs = ''
  child.stdout.on('data', (chunk) => {
    logs += chunk.toString()
  })
  child.stderr.on('data', (chunk) => {
    logs += chunk.toString()
  })

  await waitForServer(baseUrl, child, () => logs)
  return { child, getLogs: () => logs }
}

async function waitForServer(url, child, getLogs) {
  const start = Date.now()

  for (;;) {
    if (child.exitCode !== null) {
      throw new Error(`Vite server exited early.\n${getLogs()}`)
    }

    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch {
      // server still starting
    }

    if (Date.now() - start > 120_000) {
      throw new Error(`Timed out waiting for Vite server.\n${getLogs()}`)
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }
}

async function stopServer(server) {
  server.child.kill('SIGTERM')
  await new Promise((resolve) => {
    server.child.once('exit', resolve)
    setTimeout(resolve, 5_000)
  })
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
