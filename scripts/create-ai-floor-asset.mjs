#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import {
  createHeightfieldAoMap,
  createPackedOrmHeightMap,
  parseBooleanFlag,
  slugifyWallAssetId,
  toTitleCase,
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
  const imagePath = requireOption(rawOptions, 'image')
  const depthPath = requireOption(rawOptions, 'depth')
  const rawId = rawOptions.id ?? path.basename(imagePath, path.extname(imagePath))
  const id = slugifyWallAssetId(rawId)
  if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    throw new Error(`Invalid floor asset id "${rawId}". Use lowercase letters, numbers, and hyphens.`)
  }

  const name = rawOptions.name ?? toTitleCase(id)
  const size = readPositiveInteger(rawOptions.size ?? 1024, 'size')
  const normalStrength = readPositiveNumber(rawOptions['normal-strength'] ?? 2.5, 'normal-strength')
  const bumpScale = readPositiveNumber(rawOptions['bump-scale'] ?? 0.12, 'bump-scale')
  const roughness = readPositiveNumber(rawOptions.roughness ?? 0.92, 'roughness')
  const metalness = readPositiveNumber(rawOptions.metalness ?? 0.02, 'metalness')
  const force = parseBooleanFlag(rawOptions.force, false)
  const textureFormat = parseTextureFormat(rawOptions['texture-format'] ?? 'ktx2')

  await assertReadable(imagePath, '--image')
  await assertReadable(depthPath, '--depth')

  const assetDir = path.join(repoRoot, 'editor/src/assets/materials/dungeon/floor-materials', id)
  if (!force && (await exists(assetDir))) {
    throw new Error(`Asset directory already exists: ${path.relative(repoRoot, assetDir)}. Use --force to overwrite generated outputs.`)
  }
  await assertCanCreateRegistrations({ id, force })

  await mkdir(assetDir, { recursive: true })

  await createTextureMaps({
    imagePath,
    depthPath,
    assetDir,
    size,
    normalStrength,
    textureFormat,
  })

  await writeFile(
    path.join(assetDir, 'manifest.json'),
    `${JSON.stringify(
      {
        id,
        name,
        sourceImage: path.resolve(imagePath),
        sourceDepth: path.resolve(depthPath),
        size,
        normalStrength,
        bumpScale,
        roughness,
        metalness,
        textureFormat,
      },
      null,
      2,
    )}\n`,
  )

  await writeGeneratedModule({ id, name, textureFormat, bumpScale, roughness, metalness })

  console.log(`Created AI floor asset "${name}" (${id})`)
  console.log(`  Textures: ${path.relative(repoRoot, assetDir)}`)
  console.log(`  Definition: editor/src/content-packs/dungeon/generated/floorMaterials/${id}.ts`)
}

async function createTextureMaps({ imagePath, depthPath, assetDir, size, normalStrength, textureFormat }) {
  const albedoPngPath = path.join(assetDir, 'floor_albedo.png')
  const normalPngPath = path.join(assetDir, 'floor_normal.png')
  const heightPngPath = path.join(assetDir, 'floor_height.png')
  const roughnessPngPath = path.join(assetDir, 'floor_roughness.png')
  const packedOrmHeightPngPath = path.join(assetDir, 'floor_ormh.png')

  await sharp(imagePath)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .png()
    .toFile(albedoPngPath)

  await sharp(albedoPngPath)
    .resize(256, 256, { fit: 'cover', position: 'center' })
    .webp({ quality: 78 })
    .toFile(path.join(assetDir, 'preview.webp'))

  const { data: heightData, info } = await sharp(depthPath)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .greyscale()
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true })

  await sharp(heightData, { raw: { width: info.width, height: info.height, channels: 1 } })
    .png()
    .toFile(heightPngPath)

  const normalData = createNormalMap(heightData, info.width, info.height, normalStrength)
  await sharp(normalData, { raw: { width: info.width, height: info.height, channels: 3 } })
    .png()
    .toFile(normalPngPath)

  const aoData = createHeightfieldAoMap(heightData, info.width, info.height, { wrapX: true, wrapY: true })
  const roughnessData = Buffer.alloc(info.width * info.height, 224)
  await sharp(roughnessData, { raw: { width: info.width, height: info.height, channels: 1 } })
    .png()
    .toFile(roughnessPngPath)

  const packedOrmHeightData = createPackedOrmHeightMap({
    aoData,
    roughnessData,
    heightData,
    width: info.width,
    height: info.height,
  })
  await sharp(packedOrmHeightData, { raw: { width: info.width, height: info.height, channels: 3 } })
    .png()
    .toFile(packedOrmHeightPngPath)

  if (textureFormat === 'ktx2' || textureFormat === 'both') {
    await createCompressedTextureMaps({
      assetDir,
      albedoPngPath,
      normalPngPath,
      packedOrmHeightPngPath,
    })
  }

  if (textureFormat === 'ktx2') {
    await Promise.all([
      rm(albedoPngPath, { force: true }),
      rm(normalPngPath, { force: true }),
      rm(heightPngPath, { force: true }),
      rm(roughnessPngPath, { force: true }),
      rm(packedOrmHeightPngPath, { force: true }),
    ])
  }
}

async function createCompressedTextureMaps({ assetDir, albedoPngPath, normalPngPath, packedOrmHeightPngPath }) {
  await runToktx([
    '--t2',
    '--encode', 'etc1s',
    '--clevel', '3',
    '--qlevel', '160',
    '--genmipmap',
    '--assign_oetf', 'srgb',
    path.join(assetDir, 'floor_albedo.ktx2'),
    albedoPngPath,
  ])
  await runToktx([
    '--t2',
    '--encode', 'uastc',
    '--uastc_quality', '2',
    '--uastc_rdo_l', '0.75',
    '--zcmp', '10',
    '--genmipmap',
    '--assign_oetf', 'linear',
    path.join(assetDir, 'floor_normal.ktx2'),
    normalPngPath,
  ])
  await runToktx([
    '--t2',
    '--encode', 'uastc',
    '--uastc_quality', '2',
    '--uastc_rdo_l', '1.25',
    '--zcmp', '10',
    '--genmipmap',
    '--assign_oetf', 'linear',
    path.join(assetDir, 'floor_ormh.ktx2'),
    packedOrmHeightPngPath,
  ])
}

async function writeGeneratedModule({ id, name, textureFormat, bumpScale, roughness, metalness }) {
  const outputDir = path.join(repoRoot, 'editor/src/content-packs/dungeon/generated/floorMaterials')
  await mkdir(outputDir, { recursive: true })
  await writeFile(
    path.join(outputDir, `${id}.ts`),
    buildFloorMaterialSource({ id, name, textureFormat, bumpScale, roughness, metalness }),
  )
}

function buildFloorMaterialSource({ id, name, textureFormat, bumpScale, roughness, metalness }) {
  const materialPath = `../../../../assets/materials/dungeon/floor-materials/${id}`
  const compressed = textureFormat === 'ktx2'
  const previewFile = 'preview.webp'

  return `import type { GeneratedFloorMaterialDefinition } from '../../shared/createGeneratedFloorMaterialAsset'

export const floorMaterial: GeneratedFloorMaterialDefinition = {
  id: ${JSON.stringify(`dungeon.floor_${id}`)},
  slug: ${JSON.stringify(`dungeon-floor-${id}`)},
  name: ${JSON.stringify(name)},
  thumbnailPath: new URL(${JSON.stringify(`${materialPath}/${previewFile}`)}, import.meta.url).href,
  textures: {
    albedoPath: new URL(${JSON.stringify(`${materialPath}/floor_albedo.${compressed ? 'ktx2' : 'png'}`)}, import.meta.url).href,
    normalPath: new URL(${JSON.stringify(`${materialPath}/floor_normal.${compressed ? 'ktx2' : 'png'}`)}, import.meta.url).href,
    ${compressed
      ? `packedOrmHeightPath: new URL(${JSON.stringify(`${materialPath}/floor_ormh.ktx2`)}, import.meta.url).href,`
      : `heightPath: new URL(${JSON.stringify(`${materialPath}/floor_height.png`)}, import.meta.url).href,
    roughnessPath: new URL(${JSON.stringify(`${materialPath}/floor_roughness.png`)}, import.meta.url).href,`}
  },
  shading: {
    tintColor: '#ffffff',
    roughness: ${roundNumber(roughness)},
    metalness: ${roundNumber(metalness)},
    bumpScale: ${roundNumber(bumpScale)},
  },
}
`
}

async function runToktx(args) {
  await new Promise((resolve, reject) => {
    const child = spawn('toktx', args, {
      cwd: repoRoot,
      stdio: 'inherit',
    })
    child.on('error', (error) => {
      reject(new Error(`Failed to run toktx. Install KTX-Software and ensure "toktx" is on PATH. ${error.message}`))
    })
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`toktx exited with code ${code}`))
      }
    })
  })
}

function createNormalMap(heightData, width, height, strength) {
  const output = Buffer.alloc(width * height * 3)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const left = sampleHeight(heightData, width, height, x - 1, y)
      const right = sampleHeight(heightData, width, height, x + 1, y)
      const up = sampleHeight(heightData, width, height, x, y - 1)
      const down = sampleHeight(heightData, width, height, x, y + 1)
      const dx = ((right - left) / 255) * strength
      const dy = ((down - up) / 255) * strength

      const nx = -dx
      const ny = dy
      const nz = 1
      const length = Math.hypot(nx, ny, nz) || 1

      const offset = (y * width + x) * 3
      output[offset] = Math.round(((nx / length) * 0.5 + 0.5) * 255)
      output[offset + 1] = Math.round(((ny / length) * 0.5 + 0.5) * 255)
      output[offset + 2] = Math.round(((nz / length) * 0.5 + 0.5) * 255)
    }
  }

  return output
}

function sampleHeight(data, width, height, x, y) {
  const sampleX = Math.max(0, Math.min(width - 1, x))
  const sampleY = Math.max(0, Math.min(height - 1, y))
  return data[sampleY * width + sampleX]
}

function parseTextureFormat(value) {
  const normalized = String(value).trim().toLowerCase()
  if (normalized === 'png' || normalized === 'ktx2' || normalized === 'both') {
    return normalized
  }
  throw new Error('--texture-format must be one of: ktx2, png, both')
}

function roundNumber(value) {
  return Number.parseFloat(Number(value).toFixed(4))
}

function readPositiveInteger(value, label) {
  const parsed = Number.parseInt(String(value), 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Expected ${label} to be a positive integer, got "${value}"`)
  }
  return parsed
}

function readPositiveNumber(value, label) {
  const parsed = Number.parseFloat(String(value))
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Expected ${label} to be a non-negative number, got "${value}"`)
  }
  return parsed
}

async function assertCanCreateRegistrations({ id, force }) {
  const generatedModulePath = path.join(repoRoot, 'editor/src/content-packs/dungeon/generated/floorMaterials', `${id}.ts`)
  if (!force && (await exists(generatedModulePath))) {
    throw new Error(`Generated floor definition already exists: ${path.relative(repoRoot, generatedModulePath)}. Use --force to overwrite.`)
  }
}

async function assertReadable(filePath, flagName) {
  try {
    const result = await stat(filePath)
    if (!result.isFile()) {
      throw new Error()
    }
  } catch {
    throw new Error(`${flagName} file does not exist or is not readable: ${filePath}`)
  }
}

async function exists(targetPath) {
  try {
    await stat(targetPath)
    return true
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
  node scripts/create-ai-floor-asset.mjs --id standard-living-room --name "Standard Living Room" --image /path/to/main.png --depth /path/to/depth.png

Options:
  --id <id>                    Asset id suffix under dungeon.floor_<id>
  --name <name>                Display name
  --image <path>               Source albedo image
  --depth <path>               Source depth image
  --size <px>                  Resize target. Default: 1024
  --normal-strength <value>    Normal map intensity. Default: 2.5
  --bump-scale <value>         Runtime bump scale. Default: 0.12
  --roughness <value>          Runtime roughness. Default: 0.92
  --metalness <value>          Runtime metalness. Default: 0.02
  --texture-format <format>    ktx2, png, or both. Default: ktx2
  --force                      Overwrite existing asset outputs
`)
}
