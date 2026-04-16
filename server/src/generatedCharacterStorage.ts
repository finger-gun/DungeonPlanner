import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const GENERATED_CHARACTER_STORAGE_DIR = path.resolve(__dirname, '..', 'generated-character-storage')
export const GENERATED_CHARACTER_ASSET_PUBLIC_PATH = '/generated-character-assets'

export class GeneratedCharacterStorageError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'GeneratedCharacterStorageError'
    this.status = status
  }
}

type SaveGeneratedCharacterAssetsInput = {
  originalImageDataUrl?: unknown
  processedImageDataUrl?: unknown
  thumbnailDataUrl?: unknown
}

export async function saveGeneratedCharacterAssets(input: SaveGeneratedCharacterAssetsInput) {
  const originalImageDataUrl = expectImageDataUrl(input.originalImageDataUrl, 'originalImageDataUrl')
  const processedImageDataUrl = expectImageDataUrl(input.processedImageDataUrl, 'processedImageDataUrl')
  const thumbnailDataUrl = expectImageDataUrl(input.thumbnailDataUrl, 'thumbnailDataUrl')
  const storageId = randomUUID()
  const storageDir = path.join(GENERATED_CHARACTER_STORAGE_DIR, storageId)

  await mkdir(storageDir, { recursive: true })

  const original = decodeImageDataUrl(originalImageDataUrl)
  const processed = decodeImageDataUrl(processedImageDataUrl)
  const thumbnail = decodeImageDataUrl(thumbnailDataUrl)

  const originalFileName = `original.${original.extension}`
  const processedFileName = `processed.${processed.extension}`
  const thumbnailFileName = `thumbnail.${thumbnail.extension}`

  await Promise.all([
    writeFile(path.join(storageDir, originalFileName), original.buffer),
    writeFile(path.join(storageDir, processedFileName), processed.buffer),
    writeFile(path.join(storageDir, thumbnailFileName), thumbnail.buffer),
  ])

  return {
    storageId,
    originalImageUrl: `${GENERATED_CHARACTER_ASSET_PUBLIC_PATH}/${storageId}/${originalFileName}`,
    processedImageUrl: `${GENERATED_CHARACTER_ASSET_PUBLIC_PATH}/${storageId}/${processedFileName}`,
    thumbnailUrl: `${GENERATED_CHARACTER_ASSET_PUBLIC_PATH}/${storageId}/${thumbnailFileName}`,
  }
}

export async function deleteGeneratedCharacterAssets(storageId: string) {
  assertStorageId(storageId)
  await rm(path.join(GENERATED_CHARACTER_STORAGE_DIR, storageId), {
    recursive: true,
    force: true,
  })
}

export async function readGeneratedCharacterAsset(requestPath: string) {
  const diskPath = resolveGeneratedCharacterAssetPath(requestPath)
  if (!diskPath) {
    return null
  }

  try {
    return {
      buffer: await readFile(diskPath),
      contentType: getContentType(diskPath),
    }
  } catch {
    return null
  }
}

function resolveGeneratedCharacterAssetPath(requestPath: string) {
  if (!requestPath.startsWith(`${GENERATED_CHARACTER_ASSET_PUBLIC_PATH}/`)) {
    return null
  }

  const relativePath = requestPath.slice(GENERATED_CHARACTER_ASSET_PUBLIC_PATH.length + 1)
  if (!relativePath || relativePath.includes('..')) {
    return null
  }

  return path.join(GENERATED_CHARACTER_STORAGE_DIR, relativePath)
}

function expectImageDataUrl(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !value.startsWith('data:image/')) {
    throw new GeneratedCharacterStorageError(400, `${fieldName} must be an image data URL.`)
  }
  return value
}

function decodeImageDataUrl(value: string) {
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) {
    throw new GeneratedCharacterStorageError(400, 'Image payload must be a valid base64 image data URL.')
  }

  const mimeType = match[1]
  const extension = mimeTypeToExtension(mimeType)
  if (!extension) {
    throw new GeneratedCharacterStorageError(400, `Unsupported image type: ${mimeType}.`)
  }

  return {
    extension,
    buffer: Buffer.from(match[2], 'base64'),
  }
}

function mimeTypeToExtension(mimeType: string) {
  switch (mimeType) {
    case 'image/png':
      return 'png'
    case 'image/jpeg':
      return 'jpg'
    case 'image/webp':
      return 'webp'
    default:
      return null
  }
}

function getContentType(filePath: string) {
  switch (path.extname(filePath).toLowerCase()) {
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.webp':
      return 'image/webp'
    default:
      return 'application/octet-stream'
  }
}

function assertStorageId(storageId: string) {
  if (!/^[a-f0-9-]+$/i.test(storageId)) {
    throw new GeneratedCharacterStorageError(400, 'Invalid generated character storage id.')
  }
}
