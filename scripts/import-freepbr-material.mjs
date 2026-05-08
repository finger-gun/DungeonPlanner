import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

import extractZip from 'extract-zip'
import sharp from 'sharp'

import {
  buildAuthoredWallMaterialSetModule,
  buildFreePbrWallMaterialSetId,
  buildFreePbrWallMaterialSetName,
  buildProcessedTextureFileName,
  extractFreePbrDownloadOptions,
  findFreePbrPreviewFile,
  getFreePbrTextureMapKind,
  isProcessableFreePbrTextureFile,
  parseImportFreePbrMaterialArgs,
  selectFreePbrDownloadOption,
} from './import-freepbr-material-utils.mjs'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FREEPBR_ORIGIN = 'https://freepbr.com'

const PRODUCT_PAGE_HEADERS = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'User-Agent': [
    'Mozilla/5.0',
    '(Macintosh; Intel Mac OS X 10_15_7)',
    'AppleWebKit/537.36',
    '(KHTML, like Gecko)',
    'Chrome/148.0.0.0',
    'Safari/537.36',
  ].join(' '),
}

export async function runImportFreePbrMaterial({
  slug,
  outputDir,
  size = 1024,
} = {}) {
  if (!slug) {
    throw new Error('A FreePBR product slug is required.')
  }

  if (!Number.isInteger(size) || size < 1) {
    throw new Error('Texture size must be a positive integer.')
  }

  const wallMaterialSetId = buildFreePbrWallMaterialSetId(slug)
  const wallMaterialSetName = buildFreePbrWallMaterialSetName(slug)
  const resolvedOutputDir = outputDir
    ?? path.join(rootDir, 'editor', 'src', 'assets', 'materials', 'dungeon', 'wall-materials', wallMaterialSetId)
  const generatedModulePath = path.join(
    rootDir,
    'editor',
    'src',
    'content-packs',
    'dungeon',
    'generated',
    'wallMaterialSets',
    `${wallMaterialSetId}.ts`,
  )

  const productUrl = new URL(`/product/${slug}/`, FREEPBR_ORIGIN).toString()
  const html = await fetchText(productUrl)
  const downloadOptions = extractFreePbrDownloadOptions(html, productUrl)
  const unityOption = selectFreePbrDownloadOption(downloadOptions, 'unity')

  if (!unityOption) {
    throw new Error(`Could not find a Unity download option on ${productUrl}.`)
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'dungeonplanner-freepbr-'))

  try {
    const zipPath = path.join(tempDir, `${slug}-unity.zip`)
    const extractDir = path.join(tempDir, 'extracted')

    await downloadFreePbrArchive(unityOption, productUrl, zipPath)
    await mkdir(extractDir, { recursive: true })
    await extractZip(zipPath, { dir: extractDir })

    const extractedFiles = await listFilesRecursive(extractDir)
    const textureFiles = extractedFiles.filter(isProcessableFreePbrTextureFile)

    if (textureFiles.length === 0) {
      throw new Error(`No processable PBR texture files were found in ${unityOption.label}.`)
    }

    await mkdir(resolvedOutputDir, { recursive: true })
    await mkdir(path.dirname(generatedModulePath), { recursive: true })

    const outputFiles = []
    const textureOutputPaths = {}
    for (const sourcePath of textureFiles.sort()) {
      const outputPath = path.join(resolvedOutputDir, buildProcessedTextureFileName(sourcePath))
      await sharp(sourcePath)
        .resize(size, size, { fit: 'fill' })
        .png()
        .toFile(outputPath)
      outputFiles.push(outputPath)

      const textureMapKind = getFreePbrTextureMapKind(sourcePath)
      if (textureMapKind && !textureOutputPaths[textureMapKind]) {
        textureOutputPaths[textureMapKind] = outputPath
      }
    }

    if (!textureOutputPaths.albedo) {
      throw new Error(`Could not determine an albedo texture for ${slug}.`)
    }

    const previewSourcePath = findFreePbrPreviewFile(extractedFiles)
    const previewOutputPath = previewSourcePath
      ? path.join(resolvedOutputDir, buildProcessedTextureFileName(previewSourcePath))
      : null

    if (previewSourcePath && previewOutputPath) {
      await sharp(previewSourcePath)
        .resize(size, size, { fit: 'fill' })
        .png()
        .toFile(previewOutputPath)
      outputFiles.push(previewOutputPath)
    }

    await writeFile(generatedModulePath, buildAuthoredWallMaterialSetModule({
      setId: wallMaterialSetId,
      name: wallMaterialSetName,
      textures: textureOutputPaths,
      previewImage: previewOutputPath,
      moduleFilePath: generatedModulePath,
    }))

    console.log(`Downloaded ${unityOption.label} from ${productUrl}`)
    console.log(`Wrote ${outputFiles.length} image(s) to ${resolvedOutputDir}`)
    console.log(`Authored wall material set ${wallMaterialSetName} at ${generatedModulePath}`)
    outputFiles.forEach((filePath) => {
      console.log(` - ${path.basename(filePath)}`)
    })

    return {
      modulePath: generatedModulePath,
      outputDir: resolvedOutputDir,
      outputFiles,
      productUrl,
      wallMaterialSetId,
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: PRODUCT_PAGE_HEADERS,
  })

  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`)
  }

  return response.text()
}

async function downloadFreePbrArchive(option, productUrl, outputPath) {
  const formData = new URLSearchParams(option.fields)
  const response = await fetch(option.action, {
    body: formData,
    headers: {
      ...PRODUCT_PAGE_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: FREEPBR_ORIGIN,
      Referer: productUrl,
    },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(`Failed to download ${option.label}: ${response.status} ${response.statusText}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('zip') && !contentType.includes('octet-stream')) {
    throw new Error(`Unexpected response type for ${option.label}: ${contentType || 'unknown'}`)
  }

  const archiveBuffer = Buffer.from(await response.arrayBuffer())
  await writeFile(outputPath, archiveBuffer)
}

async function listFilesRecursive(directoryPath) {
  const entries = await readdir(directoryPath, { withFileTypes: true })
  const nestedFiles = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directoryPath, entry.name)

    if (entry.isDirectory()) {
      return listFilesRecursive(entryPath)
    }

    return entry.isFile() ? [entryPath] : []
  }))

  return nestedFiles.flat()
}

function printHelp() {
  console.log(
    [
      'Usage: pnpm run import:pbr-material -- <freepbr-slug> [--output-dir <dir>] [--size <px>]',
      '',
      'Example:',
      '  pnpm run import:pbr-material -- victorian-brick-pbr',
      '',
      'Defaults:',
      '  output dir: editor/src/assets/materials/dungeon/wall-materials/<slug>',
      '  generated set: editor/src/content-packs/dungeon/generated/wallMaterialSets/<slug>.ts',
      '  size: 1024',
    ].join('\n'),
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const parsed = parseImportFreePbrMaterialArgs(process.argv.slice(2))

    if (parsed.help) {
      printHelp()
    } else {
      runImportFreePbrMaterial(parsed).catch((error) => {
        console.error(error instanceof Error ? error.message : error)
        process.exitCode = 1
      })
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
