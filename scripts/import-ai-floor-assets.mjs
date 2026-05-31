#!/usr/bin/env node
import { readdir, stat } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  deriveWallTextureNameFromFilename,
  pairTextureDepthFilename,
  parseBooleanFlag,
  slugifyWallAssetId,
} from './create-ai-wall-asset-utils.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const options = parseArgs(process.argv.slice(2))
if (options.help) {
  printHelp()
  process.exit(0)
}

try {
  await main(options)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}

async function main(rawOptions) {
  const dir = requireOption(rawOptions, 'dir')
  const textureToken = rawOptions['texture-token'] ?? '-main_'
  const depthToken = rawOptions['depth-token'] ?? '-depth_'
  const force = parseBooleanFlag(rawOptions.force, false)
  const textureFormat = rawOptions['texture-format'] ?? 'ktx2'
  const bumpScale = rawOptions['bump-scale'] ?? '0.12'
  const normalStrength = rawOptions['normal-strength'] ?? '2.5'
  const roughness = rawOptions.roughness ?? '0.92'
  const metalness = rawOptions.metalness ?? '0.02'

  const entries = await readdir(dir)
  const textureFiles = entries
    .filter((entry) => entry.toLowerCase().endsWith('.png') && entry.includes(textureToken))
    .sort((left, right) => left.localeCompare(right))

  if (textureFiles.length === 0) {
    throw new Error(`No *${textureToken}*.png files found in ${dir}`)
  }

  for (const textureFile of textureFiles) {
    const depthFile = pairTextureDepthFilename(textureFile, {
      textureToken,
      depthToken,
    })
    const imagePath = path.join(dir, textureFile)
    const depthPath = path.join(dir, depthFile)
    if (!(await isFile(depthPath))) {
      console.log(`Skipping ${textureFile}: missing ${depthFile}`)
      continue
    }

    const baseName = deriveWallTextureNameFromFilename(textureFile, textureToken)
    const id = slugifyWallAssetId(baseName)
    await runCreateFloorAsset({
      id,
      name: baseName,
      imagePath,
      depthPath,
      force,
      textureFormat,
      bumpScale,
      normalStrength,
      roughness,
      metalness,
    })
  }
}

async function runCreateFloorAsset({
  id,
  name,
  imagePath,
  depthPath,
  force,
  textureFormat,
  bumpScale,
  normalStrength,
  roughness,
  metalness,
}) {
  const args = [
    'scripts/create-ai-floor-asset.mjs',
    '--id',
    id,
    '--name',
    name,
    '--image',
    imagePath,
    '--depth',
    depthPath,
    '--normal-strength',
    normalStrength,
    '--texture-format',
    textureFormat,
    '--bump-scale',
    bumpScale,
    '--roughness',
    roughness,
    '--metalness',
    metalness,
  ]
  if (force) {
    args.push('--force')
  }

  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: repoRoot,
      stdio: 'inherit',
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`create-ai-floor-asset exited with code ${code}`))
      }
    })
  })
}

async function isFile(filePath) {
  try {
    return (await stat(filePath)).isFile()
  } catch {
    return false
  }
}

function requireOption(options, key) {
  const value = options[key]
  if (value === undefined || value === '') {
    throw new Error(`Missing required --${key} option`)
  }
  return String(value)
}

function parseArgs(argv) {
  const parsed = {}
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === '--help' || token === '-h') {
      parsed.help = true
      continue
    }
    if (!token.startsWith('--')) {
      throw new Error(`Unexpected argument "${token}"`)
    }
    const key = token.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith('--')) {
      parsed[key] = true
      continue
    }
    parsed[key] = next
    index += 1
  }
  return parsed
}

function printHelp() {
  console.log(`Usage:
  node scripts/import-ai-floor-assets.mjs --dir /Volumes/output

Options:
  --dir <path>                 Directory containing paired main/depth PNGs
  --texture-token <token>      Match token in albedo filename. Default: -main_
  --depth-token <token>        Replacement token for depth filename. Default: -depth_
  --texture-format <format>    ktx2, png, or both. Default: ktx2
  --normal-strength <value>    Default: 2.5
  --bump-scale <value>         Default: 0.12
  --roughness <value>          Default: 0.92
  --metalness <value>          Default: 0.02
  --force                      Overwrite existing outputs
`)
}
