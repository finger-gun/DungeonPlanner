import path from 'node:path'

import * as cheerio from 'cheerio'

export const DEFAULT_FREEPBR_TEXTURE_SIZE = 1024
const FREEPBR_RASTER_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff'])

const PROCESSABLE_TEXTURE_TOKENS = new Set([
  'albedo',
  'alpha',
  'ao',
  'basecolor',
  'basecolour',
  'color',
  'colour',
  'diffuse',
  'disp',
  'displacement',
  'emission',
  'emissive',
  'gloss',
  'glossiness',
  'height',
  'mask',
  'metallic',
  'metalness',
  'normal',
  'occlusion',
  'opacity',
  'orm',
  'rough',
  'roughness',
  'smoothness',
  'specular',
])

const EXCLUDED_TEXTURE_TOKENS = new Set([
  'preview',
  'render',
  'sphere',
  'thumbnail',
])

export function extractFreePbrDownloadOptions(html, productUrl) {
  const $ = cheerio.load(html)

  return $('.somdn-download-form')
    .toArray()
    .map((element) => {
      const form = $(element)
      const label = form.find('.somdn-download-link').first().text().trim()
      const action = form.attr('action')?.trim() || productUrl
      const fields = {}

      form.find('input[name]').each((_, input) => {
        const key = $(input).attr('name')?.trim()
        if (!key) {
          return
        }

        fields[key] = $(input).attr('value') ?? ''
      })

      return {
        action,
        fields,
        label,
      }
    })
    .filter((option) => option.label.length > 0 && option.fields.action)
}

export function selectFreePbrDownloadOption(options, flavor = 'unity') {
  const normalizedFlavor = flavor.trim().toLowerCase()
  return options.find((option) => option.label.toLowerCase().includes(`${normalizedFlavor}.zip`)) ?? null
}

export function isProcessableFreePbrTextureFile(filePath) {
  const extension = path.extname(filePath).toLowerCase()
  if (!FREEPBR_RASTER_EXTENSIONS.has(extension)) {
    return false
  }

  const tokens = tokenizeTextureFilePath(filePath)
  if (tokens.some((token) => EXCLUDED_TEXTURE_TOKENS.has(token))) {
    return false
  }

  return tokens.some((token) => PROCESSABLE_TEXTURE_TOKENS.has(token))
}

export function buildProcessedTextureFileName(filePath) {
  return `${path.basename(filePath, path.extname(filePath))}.png`
}

export function getFreePbrTextureMapKind(filePath) {
  const tokens = tokenizeTextureFilePath(filePath)

  if (tokens.some((token) => ['albedo', 'basecolor', 'basecolour', 'color', 'colour', 'diffuse'].includes(token))) {
    return 'albedo'
  }
  if (tokens.includes('normal')) {
    return 'normal'
  }
  if (tokens.some((token) => ['ao', 'occlusion'].includes(token))) {
    return 'ao'
  }
  if (tokens.some((token) => ['height', 'disp', 'displacement'].includes(token))) {
    return 'height'
  }
  if (tokens.some((token) => ['rough', 'roughness'].includes(token))) {
    return 'roughness'
  }
  if (tokens.some((token) => ['metallic', 'metalness'].includes(token))) {
    return 'metallic'
  }

  return null
}

export function findFreePbrPreviewFile(filePaths) {
  return [...filePaths]
    .filter((filePath) => {
      const extension = path.extname(filePath).toLowerCase()
      return FREEPBR_RASTER_EXTENSIONS.has(extension)
        && tokenizeTextureFilePath(filePath).includes('preview')
    })
    .sort()[0] ?? null
}

export function buildFreePbrWallMaterialSetId(slug) {
  return slug
    .trim()
    .toLowerCase()
    .replace(/-pbr$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildFreePbrWallMaterialSetName(slug) {
  return buildFreePbrWallMaterialSetId(slug)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function buildAuthoredWallMaterialSetModule({
  setId,
  name,
  textures,
  previewImage,
  moduleFilePath,
}) {
  const relativeFromModule = (targetPath) =>
    path.relative(path.dirname(moduleFilePath), targetPath).split(path.sep).join('/')

  const serializeUrl = (targetPath) => `new URL(${JSON.stringify(relativeFromModule(targetPath))}, import.meta.url).href`

  return [
    "import type { ContentPackWallMaterialSet } from '../../../types'",
    '',
    'export const wallMaterialSet: ContentPackWallMaterialSet = {',
    `  id: ${JSON.stringify(setId)},`,
    `  name: ${JSON.stringify(name)},`,
    ...(previewImage ? [`  previewImageUrl: ${serializeUrl(previewImage)},`] : []),
    '  textures: {',
    `    albedoUrl: ${serializeUrl(textures.albedo)},`,
    ...(textures.normal ? [`    normalUrl: ${serializeUrl(textures.normal)},`] : []),
    ...(textures.ao ? [`    aoUrl: ${serializeUrl(textures.ao)},`] : []),
    ...(textures.height ? [`    heightUrl: ${serializeUrl(textures.height)},`] : []),
    ...(textures.roughness ? [`    roughnessUrl: ${serializeUrl(textures.roughness)},`] : []),
    ...(textures.metallic ? [`    metallicUrl: ${serializeUrl(textures.metallic)},`] : []),
    '  },',
    '}',
    '',
  ].join('\n')
}

export function parseImportFreePbrMaterialArgs(args, cwd = process.cwd()) {
  let outputDir = null
  let size = DEFAULT_FREEPBR_TEXTURE_SIZE
  let slug = null
  let help = false

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index]

    if (value === '--') {
      continue
    }

    if (value === '--help' || value === '-h') {
      help = true
      continue
    }

    if (value === '--output-dir') {
      const nextValue = args[index + 1]
      if (!nextValue) {
        throw new Error('Expected a directory path after --output-dir.')
      }
      outputDir = path.resolve(cwd, nextValue)
      index += 1
      continue
    }

    if (value === '--size') {
      const nextValue = Number(args[index + 1] ?? '')
      if (!Number.isInteger(nextValue) || nextValue < 1) {
        throw new Error('Expected a positive integer after --size.')
      }
      size = nextValue
      index += 1
      continue
    }

    if (slug) {
      throw new Error(`Unexpected extra argument: ${value}`)
    }

    slug = value
  }

  if (!slug && !help) {
    throw new Error('A FreePBR product slug is required.')
  }

  return {
    help,
    outputDir,
    size,
    slug,
  }
}

function tokenizeTextureFilePath(filePath) {
  return path.basename(filePath, path.extname(filePath))
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}
