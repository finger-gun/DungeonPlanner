#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import {
  buildAiWallStyleRecipe,
  buildWallMaterialSetSource,
  buildWallStyleMaterialSource,
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
    throw new Error(`Invalid wall asset id "${rawId}". Use lowercase letters, numbers, and hyphens.`)
  }

  const name = rawOptions.name ?? toTitleCase(id)
  const size = readPositiveInteger(rawOptions.size ?? 1024, 'size')
  const normalStrength = readPositiveNumber(rawOptions['normal-strength'] ?? 3, 'normal-strength')
  const parallaxScale = readPositiveNumber(rawOptions['parallax-scale'] ?? 0.055, 'parallax-scale')
  const parallaxSteps = readPositiveInteger(rawOptions['parallax-steps'] ?? 10, 'parallax-steps')
  const bumpScale = readPositiveNumber(rawOptions['bump-scale'] ?? 0.08, 'bump-scale')
  const parallaxInvert = parseBooleanFlag(rawOptions['parallax-invert'], false)
  const force = parseBooleanFlag(rawOptions.force, false)
  const skipRegenerate = parseBooleanFlag(rawOptions['skip-regenerate'], false)
  const textureFormat = parseTextureFormat(rawOptions['texture-format'] ?? 'ktx2')

  await assertReadable(imagePath, '--image')
  await assertReadable(depthPath, '--depth')

  const assetDir = path.join(repoRoot, 'editor/src/assets/materials/dungeon/wall-materials', id)
  if (!force && (await exists(assetDir))) {
    throw new Error(`Asset directory already exists: ${path.relative(repoRoot, assetDir)}. Use --force to overwrite generated outputs.`)
  }
  await assertCanCreateRegistrations({ id, force })

  await mkdir(assetDir, { recursive: true })

  const heightBuffer = await createTextureMaps({
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
        parallaxScale,
        parallaxSteps,
        bumpScale,
        parallaxInvert,
        textureFormat,
        heightMean: calculateMean(heightBuffer),
      },
      null,
      2,
    )}\n`,
  )

  await writeGeneratedModules({ id, name, textureFormat, parallaxScale, parallaxSteps, parallaxInvert, bumpScale })
  await upsertWallStyleRecipe({ id, name, textureFormat, force })
  if (!skipRegenerate) {
    await regenerateWallStyles()
  }

  console.log(`Created AI wall asset "${name}" (${id})`)
  console.log(`  Textures: ${path.relative(repoRoot, assetDir)}`)
  console.log(`  Material set: editor/src/content-packs/dungeon/generated/wallMaterialSets/${id}.ts`)
  console.log(`  Wall style material: editor/src/content-packs/dungeon/generated/wallStyleMaterials/${id}.ts`)
  console.log('  Wall style recipe registered and generated.')
}

async function createTextureMaps({ imagePath, depthPath, assetDir, size, normalStrength, textureFormat }) {
  const albedoPngPath = path.join(assetDir, 'wall_albedo.png')
  const normalPngPath = path.join(assetDir, 'wall_normal.png')
  const aoPngPath = path.join(assetDir, 'wall_ao.png')
  const heightPngPath = path.join(assetDir, 'wall_height.png')
  const displacementPngPath = path.join(assetDir, 'wall_displacement.png')
  const roughnessPngPath = path.join(assetDir, 'wall_roughness.png')
  const packedOrmHeightPngPath = path.join(assetDir, 'wall_ormh.png')

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

  await sharp(heightData, { raw: { width: info.width, height: info.height, channels: 1 } })
    .png()
    .toFile(displacementPngPath)

  const normalData = createNormalMap(heightData, info.width, info.height, normalStrength)
  await sharp(normalData, { raw: { width: info.width, height: info.height, channels: 3 } })
    .png()
    .toFile(normalPngPath)

  const aoData = createHeightfieldAoMap(heightData, info.width, info.height)
  await sharp(aoData, { raw: { width: info.width, height: info.height, channels: 1 } })
    .png()
    .toFile(aoPngPath)

  const roughnessData = Buffer.alloc(info.width * info.height, 220)
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
      rm(aoPngPath, { force: true }),
      rm(heightPngPath, { force: true }),
      rm(displacementPngPath, { force: true }),
      rm(roughnessPngPath, { force: true }),
      rm(packedOrmHeightPngPath, { force: true }),
    ])
  }

  return heightData
}

async function createCompressedTextureMaps({ assetDir, albedoPngPath, normalPngPath, packedOrmHeightPngPath }) {
  await runToktx([
    '--t2',
    '--encode', 'etc1s',
    '--clevel', '3',
    '--qlevel', '160',
    '--genmipmap',
    '--assign_oetf', 'srgb',
    path.join(assetDir, 'wall_albedo.ktx2'),
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
    path.join(assetDir, 'wall_normal.ktx2'),
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
    path.join(assetDir, 'wall_ormh.ktx2'),
    packedOrmHeightPngPath,
  ])
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
      output[offset] = clampByte((nx / length) * 127.5 + 127.5)
      output[offset + 1] = clampByte((ny / length) * 127.5 + 127.5)
      output[offset + 2] = clampByte((nz / length) * 127.5 + 127.5)
    }
  }

  return output
}

function sampleHeight(data, width, height, x, y) {
  const wrappedX = ((x % width) + width) % width
  const clampedY = Math.max(0, Math.min(height - 1, y))
  return data[clampedY * width + wrappedX]
}

async function writeGeneratedModules({ id, name, textureFormat, parallaxScale, parallaxSteps, parallaxInvert, bumpScale }) {
  const materialSetDir = path.join(repoRoot, 'editor/src/content-packs/dungeon/generated/wallMaterialSets')
  const wallStyleMaterialDir = path.join(repoRoot, 'editor/src/content-packs/dungeon/generated/wallStyleMaterials')
  await mkdir(materialSetDir, { recursive: true })
  await mkdir(wallStyleMaterialDir, { recursive: true })

  await writeFile(
    path.join(materialSetDir, `${id}.ts`),
    buildWallMaterialSetSource({ id, name, textureFormat, parallaxScale, parallaxSteps, parallaxInvert, bumpScale }),
  )
  await writeFile(
    path.join(wallStyleMaterialDir, `${id}.ts`),
    buildWallStyleMaterialSource({ id, textureFormat, parallaxScale, parallaxSteps, parallaxInvert, bumpScale }),
  )
}

async function upsertWallStyleRecipe({ id, name, textureFormat, force }) {
  const recipePath = path.join(repoRoot, 'editor/src/content-packs/dungeon/wallStyleRecipes.json')
  const recipes = JSON.parse(await readFile(recipePath, 'utf8'))
  const recipe = buildAiWallStyleRecipe({ id, name, textureFormat })
  const existingIndex = recipes.findIndex((candidate) => candidate.id === id)

  if (existingIndex >= 0) {
    if (!force) {
      throw new Error(`Wall style recipe "${id}" already exists. Use --force to replace it.`)
    }
    recipes[existingIndex] = recipe
  } else {
    recipes.push(recipe)
  }

  await writeFile(recipePath, `${JSON.stringify(recipes, null, 2)}\n`)
}

async function assertCanCreateRegistrations({ id, force }) {
  if (force) {
    return
  }

  const recipePath = path.join(repoRoot, 'editor/src/content-packs/dungeon/wallStyleRecipes.json')
  const recipes = JSON.parse(await readFile(recipePath, 'utf8'))
  if (recipes.some((candidate) => candidate.id === id)) {
    throw new Error(`Wall style recipe "${id}" already exists. Use --force to replace it.`)
  }

  const generatedPaths = [
    path.join(repoRoot, 'editor/src/content-packs/dungeon/generated/wallMaterialSets', `${id}.ts`),
    path.join(repoRoot, 'editor/src/content-packs/dungeon/generated/wallStyleMaterials', `${id}.ts`),
  ]
  for (const generatedPath of generatedPaths) {
    if (await exists(generatedPath)) {
      throw new Error(`Generated registration already exists: ${path.relative(repoRoot, generatedPath)}. Use --force to overwrite it.`)
    }
  }
}

async function regenerateWallStyles() {
  const { spawn } = await import('node:child_process')
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/generate-wall-styles.mjs'], {
      cwd: repoRoot,
      stdio: 'inherit',
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`generate-wall-styles exited with code ${code}`))
      }
    })
  })
}

function parseArgs(args) {
  const parsed = {}
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--') {
      continue
    }
    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument "${arg}"`)
    }

    const [keyWithPrefix, inlineValue] = arg.split('=', 2)
    const key = keyWithPrefix.slice(2)
    if (key === 'help') {
      parsed.help = true
      continue
    }
    if (key === 'force') {
      parsed.force = inlineValue ?? true
      continue
    }

    const value = inlineValue ?? args[index + 1]
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`)
    }
    parsed[key] = value
    if (inlineValue === undefined) {
      index += 1
    }
  }
  return parsed
}

function requireOption(options, key) {
  const value = options[key]
  if (!value) {
    throw new Error(`Missing required option --${key}`)
  }
  return value
}

async function assertReadable(filePath, flagName) {
  try {
    const stats = await stat(filePath)
    if (!stats.isFile()) {
      throw new Error(`${flagName} is not a file: ${filePath}`)
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('is not a file')) {
      throw error
    }
    throw new Error(`Cannot read ${flagName} path: ${filePath}`)
  }
}

async function exists(filePath) {
  try {
    await stat(filePath)
    return true
  } catch {
    return false
  }
}

function readPositiveInteger(value, name) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`--${name} must be a positive integer`)
  }
  return parsed
}

function readPositiveNumber(value, name) {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`--${name} must be a positive number`)
  }
  return parsed
}

function parseTextureFormat(value) {
  const normalized = String(value).trim().toLowerCase()
  if (normalized === 'png' || normalized === 'ktx2' || normalized === 'both') {
    return normalized
  }

  throw new Error('--texture-format must be one of: ktx2, png, both')
}

function calculateMean(buffer) {
  let total = 0
  for (const value of buffer) {
    total += value
  }
  return Number.parseFloat((total / buffer.length / 255).toFixed(4))
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function printHelp() {
  console.log(`Create a DungeonPlanner wall asset from an albedo image and AI depth map.

Usage:
  pnpm run create:ai-wall -- --id gothic-ai-variant --name "Gothic AI Variant" --image ./image.png --depth ./depth.png

Options:
  --id <id>                  Stable asset id, lowercase words separated by hyphens.
  --name <name>              Display name. Defaults to title-cased id.
  --image <path>             Source color image. Required.
  --depth <path>             Source depth/height image. Required.
  --size <pixels>            Output square texture size. Default: 1024.
  --normal-strength <value>  Normal-map strength. Default: 3.
  --bump-scale <value>       Height-map bump amount. Default: 0.08.
  --parallax-scale <value>   Runtime parallax amount. Default: 0.055.
  --parallax-steps <count>   Runtime parallax steps. Default: 10.
  --parallax-invert <bool>   Invert sampled height in shader. Default: false.
  --texture-format <format>  Output format: ktx2, png, or both. Default: ktx2.
  --skip-regenerate <bool>   Skip wall style index regeneration. Used by batch import.
  --force                    Overwrite generated files and recipe with the same id.
`)
}
