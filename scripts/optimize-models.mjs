import { mkdtempSync, rmSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawn } from 'node:child_process'
import os from 'node:os'
import { pathToFileURL } from 'node:url'
import {
  collectModelArtifactPaths,
  findCommandPath,
  formatBytes,
  getDirectorySize,
  getPreservedArtifactPaths,
  getRelativeModelPath,
  getTotalSize,
  isCleanupCandidate,
  isThumbnailForModel,
  listFilesRecursive,
  listModelFiles,
  listPackDirectories,
  prependEnvPath,
  resolvePackDir,
  rootDir,
  copyArtifactsIntoDir,
} from './model-pipeline.mjs'

export async function runOptimizeModels({
  targets,
  filter = null,
  textureSize = 2048,
  ktxDir = null,
} = {}) {
  const targetDirs =
    targets && targets.length > 0
      ? targets.map((target) => resolvePackDir(target))
      : listPackDirectories()

  const fallbackKtxDirs = [
    ktxDir,
    process.env.DUNGEONPLANNER_KTX_DIR,
    path.join(os.homedir(), '.local/bin'),
  ].filter(Boolean)
  const resolvedKtxPath = findCommandPath('ktx', fallbackKtxDirs)
  if (!resolvedKtxPath) {
    throw new Error(
      [
        'The KTX-Software CLI was not found.',
        'Install the `ktx` command from https://github.com/KhronosGroup/KTX-Software',
        'or rerun with --ktx-dir <directory-containing-ktx>.',
      ].join('\n'),
    )
  }

  let optimizedCount = 0
  let totalBeforeBytes = 0
  let totalAfterBytes = 0

  console.log(`Using KTX encoder: ${resolvedKtxPath}`)
  console.log(`Texture mode: gltf-transform optimize --texture-compress ktx2 (max ${textureSize}px)`)

  for (const targetDir of targetDirs) {
    const beforeDirSize = getDirectorySize(targetDir)
    const modelFiles = listModelFiles(targetDir, filter)

    if (modelFiles.length === 0) {
      console.log(`No GLB/GLTF files found in ${targetDir}`)
      continue
    }

    console.log(`\nOptimizing ${modelFiles.length} model(s) in ${targetDir}`)

    for (const modelPath of modelFiles) {
      const beforeArtifacts = collectModelArtifactPaths(modelPath)
      const beforeBytes = getTotalSize(beforeArtifacts)
      const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'dungeonplanner-optimize-'))
      const tempOutputPath = path.join(tmpDir, path.basename(modelPath))

      try {
        await runGltfTransformOptimize({
          inputPath: modelPath,
          outputPath: tempOutputPath,
          textureSize,
          resolvedKtxDir: path.dirname(resolvedKtxPath),
        })

        const afterArtifacts = collectModelArtifactPaths(tempOutputPath)
        const afterBytes = getTotalSize(afterArtifacts)
        copyArtifactsIntoDir(afterArtifacts, tmpDir, path.dirname(modelPath))

        optimizedCount += 1
        totalBeforeBytes += beforeBytes
        totalAfterBytes += afterBytes

        const savings = beforeBytes - afterBytes
        console.log(
          `${getRelativeModelPath(targetDir, modelPath)}: ${formatBytes(beforeBytes)} -> ${formatBytes(afterBytes)} (${formatSignedBytes(savings)})`,
        )
      } finally {
        rmSync(tmpDir, { recursive: true, force: true })
      }
    }

    cleanupStaleArtifacts(targetDir)
    const afterDirSize = getDirectorySize(targetDir)
    const dirSavings = beforeDirSize - afterDirSize
    console.log(
      `Pack total ${path.basename(targetDir)}: ${formatBytes(beforeDirSize)} -> ${formatBytes(afterDirSize)} (${formatSignedBytes(dirSavings)})`,
    )
  }

  console.log(
    `\nOptimized ${optimizedCount} model(s): ${formatBytes(totalBeforeBytes)} -> ${formatBytes(totalAfterBytes)} (${formatSignedBytes(totalBeforeBytes - totalAfterBytes)})`,
  )
}

async function runGltfTransformOptimize({ inputPath, outputPath, textureSize, resolvedKtxDir }) {
  await runCommand(
    process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    [
      'exec',
      'gltf-transform',
      'optimize',
      inputPath,
      outputPath,
      '--compress',
      'meshopt',
      '--flatten',
      'false',
      '--join',
      'false',
      '--texture-compress',
      'ktx2',
      '--texture-size',
      String(textureSize),
    ],
    {
      cwd: rootDir,
      env: prependEnvPath(resolvedKtxDir ? [resolvedKtxDir] : []),
    },
  )
}

function cleanupStaleArtifacts(targetDir) {
  const modelFiles = listModelFiles(targetDir)
  const referencedArtifacts = new Set(modelFiles.flatMap((modelPath) => collectModelArtifactPaths(modelPath)))
  const preservedArtifacts = getPreservedArtifactPaths(targetDir)
  const modelBaseNames = new Set(
    modelFiles.map((modelPath) => modelPath.slice(0, -path.extname(modelPath).length)),
  )

  for (const filePath of listFilesRecursive(targetDir)) {
    if (!isCleanupCandidate(filePath)) {
      continue
    }

    if (
      referencedArtifacts.has(filePath) ||
      preservedArtifacts.has(filePath) ||
      isThumbnailForModel(filePath, modelBaseNames)
    ) {
      continue
    }

    rmSync(filePath, { force: true })
  }
}

function runCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stderr = ''
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.stdout.on('data', () => {})

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(
        new Error(
          [
            `gltf-transform optimize failed for ${args[3]}.`,
            stderr.trim(),
          ].filter(Boolean).join('\n'),
        ),
      )
    })
  })
}

function formatSignedBytes(bytes) {
  if (bytes === 0) {
    return '0 B'
  }

  return `${bytes > 0 ? '-' : '+'}${formatBytes(Math.abs(bytes))}`
}

function parseArgs(args) {
  const targets = []
  let filter = null
  let textureSize = 2048
  let ktxDir = null

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index]
    if (value === '--') {
      continue
    }

    if (value === '--filter') {
      filter = args[index + 1] ?? null
      index += 1
      continue
    }

    if (value === '--texture-size') {
      textureSize = Number(args[index + 1] ?? textureSize)
      index += 1
      continue
    }

    if (value === '--ktx-dir') {
      ktxDir = args[index + 1] ? path.resolve(rootDir, args[index + 1]) : null
      index += 1
      continue
    }

    targets.push(value)
  }

  return { targets, filter, textureSize, ktxDir }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runOptimizeModels(parseArgs(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
