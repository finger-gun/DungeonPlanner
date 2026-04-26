import { accessSync, copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { constants as fsConstants } from 'node:fs'
import { modelPackConfigs } from './model-packs.config.mjs'

export const rootDir = process.cwd()
export const editorDir = path.join(rootDir, 'editor')
export const modelRootDir = path.join(editorDir, 'src/assets/models')
export const defaultKtxTranscoderSourceDir = path.join(
  editorDir,
  'node_modules/three/examples/jsm/libs/basis',
)
export const defaultKtxTranscoderTargetDir = path.join(editorDir, 'public/three/basis')

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

export function resolvePipelinePath(inputPath) {
  if (!inputPath) {
    return null
  }

  return path.isAbsolute(inputPath) ? inputPath : path.resolve(rootDir, inputPath)
}

export function resolvePackSourceDir(target, source = null, env = process.env) {
  if (source) {
    return resolvePipelinePath(source)
  }

  const config = getModelPackConfig(target)
  if (!config) {
    return null
  }

  const configuredSource =
    (config.sourceDirEnv ? env[config.sourceDirEnv] : null) ??
    config.sourceDir ??
    null

  return resolvePipelinePath(configuredSource)
}

export function resolvePackDir(target) {
  if (!target) {
    return modelRootDir
  }

  const config = getModelPackConfig(target)
  if (config) {
    return resolvePackDirForConfig(config)
  }

  if (target.includes(path.sep) || target.startsWith('.')) {
    return path.resolve(rootDir, target)
  }

  return path.join(modelRootDir, target)
}

export function shouldCleanPack(target) {
  return getModelPackConfig(target)?.clean === true
}

export function getPackConfigByDir(targetDir) {
  const normalizedTargetDir = path.resolve(targetDir)

  return (
    Object.values(modelPackConfigs).find((config) => resolvePackDirForConfig(config) === normalizedTargetDir) ?? null
  )
}

export function getPreservedArtifactPaths(targetDir) {
  const config = getPackConfigByDir(targetDir)
  if (!config?.preserveArtifacts?.length) {
    return new Set()
  }

  return new Set(
    config.preserveArtifacts.map((relativePath) => path.join(path.resolve(targetDir), relativePath)),
  )
}

export function listPackDirectories() {
  return readdirSync(modelRootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => path.join(modelRootDir, entry.name))
    .sort((left, right) => left.localeCompare(right))
}

function resolvePackDirForConfig(config) {
  return path.resolve(rootDir, config.targetDir)
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
