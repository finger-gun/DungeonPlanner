import { accessSync, copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { constants as fsConstants } from 'node:fs'

export const rootDir = process.cwd()
export const modelRootDir = path.join(rootDir, 'src/assets/models')
export const defaultModelSourceDir = '/Users/roblibob/Projects/models'
export const defaultKtxTranscoderSourceDir = path.join(
  rootDir,
  'node_modules/three/examples/jsm/libs/basis',
)
export const defaultKtxTranscoderTargetDir = path.join(rootDir, 'public/three/basis')

export const corePackAssetNames = [
  'floor',
  'floor_001',
  'floor_002',
  'floor_003',
  'floor_004',
  'floor_005',
  'floor_006',
  'floor_007',
  'props_wall_torch',
  'wall',
  'wall_001',
  'wall_002',
  'wall_003',
  'wall_004',
  'wall_005',
]

export const modelPackConfigs = {
  core: {
    sourceDir: defaultModelSourceDir,
    targetDir: path.join(modelRootDir, 'core'),
    include: corePackAssetNames.map((name) => `${name}.glb`),
  },
}

const modelExtensions = new Set(['.glb', '.gltf'])
const cleanupExtensions = new Set(['.bin', '.jpg', '.jpeg', '.ktx2', '.png', '.webp'])

export function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 ** 2) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  if (bytes < 1024 ** 3) {
    return `${(bytes / (1024 ** 2)).toFixed(2)} MB`
  }

  return `${(bytes / (1024 ** 3)).toFixed(2)} GB`
}

export function isModelFile(filePath) {
  return modelExtensions.has(path.extname(filePath).toLowerCase())
}

export function isCleanupCandidate(filePath) {
  return cleanupExtensions.has(path.extname(filePath).toLowerCase())
}

export function getModelPackConfig(target) {
  return target ? modelPackConfigs[target] ?? null : null
}

export function resolvePackDir(target) {
  if (!target) {
    return modelRootDir
  }

  const config = getModelPackConfig(target)
  if (config) {
    return config.targetDir
  }

  if (target.includes(path.sep) || target.startsWith('.')) {
    return path.resolve(rootDir, target)
  }

  return path.join(modelRootDir, target)
}

export function listPackDirectories() {
  return readdirSync(modelRootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => path.join(modelRootDir, entry.name))
    .sort((left, right) => left.localeCompare(right))
}

export function listFilesRecursive(dir) {
  if (!existsSync(dir)) {
    return []
  }

  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) {
      continue
    }

    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(entryPath))
      continue
    }

    files.push(entryPath)
  }

  return files.sort((left, right) => left.localeCompare(right))
}

export function listModelFiles(dir, filter = null) {
  return listFilesRecursive(dir).filter((filePath) => {
    if (!isModelFile(filePath)) {
      return false
    }

    if (!filter) {
      return true
    }

    const relativePath = path.relative(dir, filePath)
    return relativePath.includes(filter)
  })
}

export function getFileSize(filePath) {
  return existsSync(filePath) ? statSync(filePath).size : 0
}

export function getTotalSize(filePaths) {
  return [...new Set(filePaths)].reduce((total, filePath) => total + getFileSize(filePath), 0)
}

export function getDirectorySize(dir) {
  return listFilesRecursive(dir).reduce((total, filePath) => total + getFileSize(filePath), 0)
}

function isLocalUri(uri) {
  return Boolean(uri) && !uri.startsWith('data:') && !/^[a-z]+:/i.test(uri)
}

export function collectModelArtifactPaths(modelPath) {
  const absoluteModelPath = path.resolve(modelPath)
  const artifactPaths = new Set([absoluteModelPath])

  if (path.extname(absoluteModelPath).toLowerCase() !== '.gltf') {
    return [...artifactPaths].sort((left, right) => left.localeCompare(right))
  }

  const modelDir = path.dirname(absoluteModelPath)
  const json = JSON.parse(readFileSync(absoluteModelPath, 'utf8'))

  return collectLocalArtifactPathsFromGltf(json, modelDir, absoluteModelPath)
}

export function collectLocalArtifactPathsFromGltf(json, modelDir, modelPath) {
  const artifactPaths = new Set([path.resolve(modelPath)])

  for (const buffer of json.buffers ?? []) {
    if (typeof buffer?.uri === 'string' && isLocalUri(buffer.uri)) {
      artifactPaths.add(path.resolve(modelDir, buffer.uri))
    }
  }

  for (const image of json.images ?? []) {
    if (typeof image?.uri === 'string' && isLocalUri(image.uri)) {
      artifactPaths.add(path.resolve(modelDir, image.uri))
    }
  }

  return [...artifactPaths].sort((left, right) => left.localeCompare(right))
}

export function ensureParentDir(filePath) {
  mkdirSync(path.dirname(filePath), { recursive: true })
}

export function copyArtifactsIntoDir(artifactPaths, sourceRootDir, targetRootDir) {
  for (const artifactPath of artifactPaths) {
    const relativePath = path.relative(sourceRootDir, artifactPath)
    if (relativePath.startsWith('..')) {
      throw new Error(`Cannot copy artifact outside source root: ${artifactPath}`)
    }

    const targetPath = path.join(targetRootDir, relativePath)
    ensureParentDir(targetPath)
    copyFileSync(artifactPath, targetPath)
  }
}

export function mirrorDirectory(sourceDir, targetDir) {
  mkdirSync(targetDir, { recursive: true })
  cpSync(sourceDir, targetDir, {
    recursive: true,
    force: true,
    filter: (entryPath) => path.basename(entryPath) !== '.DS_Store',
  })
}

export function findCommandPath(command, extraPaths = []) {
  const pathEntries = [
    ...extraPaths.filter(Boolean),
    ...(process.env.PATH?.split(path.delimiter) ?? []),
  ]

  const candidateNames =
    process.platform === 'win32'
      ? [command, `${command}.exe`, `${command}.cmd`, `${command}.bat`]
      : [command]

  for (const baseDir of pathEntries) {
    for (const candidateName of candidateNames) {
      const candidatePath = path.join(baseDir, candidateName)
      if (!existsSync(candidatePath)) {
        continue
      }

      try {
        accessSync(candidatePath, fsConstants.X_OK)
        return candidatePath
      } catch {
        // keep scanning
      }
    }
  }

  return null
}

export function prependEnvPath(extraPaths = [], env = process.env) {
  const normalizedPaths = extraPaths.filter(Boolean)
  return {
    ...env,
    PATH: [...normalizedPaths, env.PATH ?? ''].filter(Boolean).join(path.delimiter),
  }
}

export function getRelativeModelPath(baseDir, filePath) {
  return path.relative(baseDir, filePath).split(path.sep).join('/')
}

export function isThumbnailForModel(filePath, modelBaseNames) {
  const extension = path.extname(filePath).toLowerCase()
  if (extension !== '.png') {
    return false
  }

  const baseName = filePath.slice(0, -extension.length)
  return modelBaseNames.has(baseName)
}
