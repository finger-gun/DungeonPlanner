#!/usr/bin/env node
import { readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  deriveWallTextureNameFromPrompt,
  extractComfyPositivePrompt,
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
  const texturePrefix = rawOptions['texture-prefix'] ?? 'wall-texture-'
  const depthPrefix = rawOptions['depth-prefix'] ?? 'wall-depth-'
  const depthSuffix = rawOptions['depth-suffix']
  const idPrefix = rawOptions['id-prefix'] ?? 'interior'
  const force = parseBooleanFlag(rawOptions.force, false)
  const parallaxInvert = parseBooleanFlag(rawOptions['parallax-invert'], true)
  const parallaxScale = rawOptions['parallax-scale'] ?? '0.12'
  const parallaxSteps = rawOptions['parallax-steps'] ?? '16'
  const bumpScale = rawOptions['bump-scale'] ?? '0.16'
  const normalStrength = rawOptions['normal-strength'] ?? '4'

  const entries = await readdir(dir)
  const textureFiles = entries
    .filter((entry) => {
      if (!entry.startsWith(texturePrefix) || !entry.toLowerCase().endsWith('.png')) {
        return false
      }
      return !depthSuffix || !entry.endsWith(depthSuffix)
    })
    .sort((left, right) => left.localeCompare(right))

  if (textureFiles.length === 0) {
    throw new Error(`No ${texturePrefix}*.png files found in ${dir}`)
  }

  const skipped = []
  const jobs = []
  for (const textureFile of textureFiles) {
    const suffix = textureFile.slice(texturePrefix.length)
    const depthFile = depthSuffix ? `${textureFile}${depthSuffix}` : `${depthPrefix}${suffix}`
    const imagePath = path.join(dir, textureFile)
    const depthPath = path.join(dir, depthFile)
    if (!(await isFile(depthPath))) {
      skipped.push(`${textureFile}: missing ${depthFile}`)
      continue
    }

    const prompt = extractComfyPositivePrompt(await readFile(imagePath))
    const baseName = deriveWallTextureNameFromPrompt(prompt)
    const sequence = suffix.replace(/\.png$/i, '').replace(/[^0-9a-z]+/gi, '')
    const name = `${baseName} ${sequence}`
    const id = slugifyWallAssetId(`${idPrefix}-${baseName}-${sequence}`)

    jobs.push({ id, name, imagePath, depthPath })
  }

  if (force) {
    await pruneStaleGeneratedImports({
      idPrefix,
      plannedIds: new Set(jobs.map((job) => job.id)),
    })
  }

  const imported = []
  for (const job of jobs) {
    await runCreateWallAsset({
      id: job.id,
      name: job.name,
      imagePath: job.imagePath,
      depthPath: job.depthPath,
      force,
      parallaxInvert,
      parallaxScale,
      parallaxSteps,
      bumpScale,
      normalStrength,
    })
    imported.push(`${job.name} (${job.id})`)
  }

  console.log(`Imported ${imported.length} AI wall assets from ${dir}`)
  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length}:`)
    skipped.forEach((message) => console.log(`  ${message}`))
  }
}

async function pruneStaleGeneratedImports({ idPrefix, plannedIds }) {
  const prefix = `${idPrefix}-`
  const staleIds = new Set()
  const recipePath = path.join(repoRoot, 'editor/src/content-packs/dungeon/wallStyleRecipes.json')
  const recipes = JSON.parse(await readFile(recipePath, 'utf8'))
  const nextRecipes = recipes.filter((recipe) => {
    if (typeof recipe.id !== 'string' || !recipe.id.startsWith(prefix) || plannedIds.has(recipe.id)) {
      return true
    }
    staleIds.add(recipe.id)
    return false
  })

  if (nextRecipes.length !== recipes.length) {
    await writeFile(recipePath, `${JSON.stringify(nextRecipes, null, 2)}\n`)
  }

  const generatedDirs = [
    path.join(repoRoot, 'editor/src/content-packs/dungeon/generated/wallMaterialSets'),
    path.join(repoRoot, 'editor/src/content-packs/dungeon/generated/wallStyleMaterials'),
  ]
  for (const generatedDir of generatedDirs) {
    const files = await readdir(generatedDir).catch(() => [])
    for (const file of files) {
      if (!file.endsWith('.ts')) {
        continue
      }
      const id = file.slice(0, -'.ts'.length)
      if (id.startsWith(prefix) && !plannedIds.has(id)) {
        staleIds.add(id)
        await rm(path.join(generatedDir, file), { force: true })
      }
    }
  }

  const assetDir = path.join(repoRoot, 'editor/src/assets/materials/dungeon/wall-materials')
  const assetEntries = await readdir(assetDir).catch(() => [])
  for (const entry of assetEntries) {
    if (entry.startsWith(prefix) && !plannedIds.has(entry)) {
      staleIds.add(entry)
      await rm(path.join(assetDir, entry), { recursive: true, force: true })
    }
  }

  if (staleIds.size > 0) {
    console.log(`Pruned ${staleIds.size} stale generated AI wall assets.`)
  }
}

async function runCreateWallAsset({
  id,
  name,
  imagePath,
  depthPath,
  force,
  parallaxInvert,
  parallaxScale,
  parallaxSteps,
  bumpScale,
  normalStrength,
}) {
  const args = [
    'scripts/create-ai-wall-asset.mjs',
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
    '--bump-scale',
    bumpScale,
    '--parallax-scale',
    parallaxScale,
    '--parallax-steps',
    parallaxSteps,
    '--parallax-invert',
    String(parallaxInvert),
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
        reject(new Error(`create-ai-wall-asset exited with code ${code}`))
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

function printHelp() {
  console.log(`Import a directory of ComfyUI wall-texture/wall-depth image pairs as DungeonPlanner wall styles.

Usage:
  pnpm run import:ai-walls -- --dir /Volumes/roblinas/sd

Options:
  --dir <path>               Directory containing generated PNG files. Required.
  --texture-prefix <prefix>  Source texture prefix. Default: wall-texture-
  --depth-prefix <prefix>    Source depth prefix. Default: wall-depth-
  --depth-suffix <suffix>    Pair depth as texture filename plus suffix.
  --id-prefix <prefix>       Prefix for generated content ids. Default: interior.
  --normal-strength <value>  Normal-map strength. Default: 4.
  --bump-scale <value>       Height-map bump amount. Default: 0.16.
  --parallax-scale <value>   Runtime parallax amount. Default: 0.12.
  --parallax-steps <count>   Runtime parallax steps. Default: 16.
  --parallax-invert <bool>   Invert sampled height in shader. Default: true.
  --force                    Overwrite generated outputs with the same ids.
`)
}
