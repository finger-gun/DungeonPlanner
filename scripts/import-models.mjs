import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { spawn } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import sharp from 'sharp'
import {
  findCommandPath,
  collectModelArtifactPaths,
  copyArtifactsIntoDir,
  formatBytes,
  getDirectorySize,
  getModelPackConfig,
  mirrorDirectory,
  resolvePackSourceDir,
  resolvePackDir,
  rootDir,
  shouldCleanPack,
} from './model-pipeline.mjs'
import { runOptimizeModels } from './optimize-models.mjs'
import { rmSync } from 'node:fs'

export async function runImportModels({
  target,
  source = null,
  filter = null,
  skipOptimize = false,
  skipThumbnails = false,
  ktxDir = null,
  textureSize = 2048,
  clean = null,
} = {}) {
  if (!target) {
    throw new Error('A target pack or target directory is required.')
  }

  const packConfig = getModelPackConfig(target)
  const sourceDir = resolvePackSourceDir(target, source)
  if (!sourceDir) {
    const envHint = packConfig?.sourceDirEnv ? ` or set ${packConfig.sourceDirEnv}` : ''
    throw new Error(`A source directory is required. Pass --source <dir>${envHint}.`)
  }

  const targetDir = resolvePackDir(target)
  const beforeSize = getDirectorySize(targetDir)
  const shouldResetTarget = clean ?? shouldCleanPack(target)

  if (shouldResetTarget) {
    rmSync(targetDir, { recursive: true, force: true })
  }

  if (packConfig?.include?.length) {
    for (const relativeModelPath of packConfig.include) {
      const sourceModelPath = path.join(sourceDir, relativeModelPath)
      const artifactPaths = collectModelArtifactPaths(sourceModelPath)
      copyArtifactsIntoDir(artifactPaths, sourceDir, targetDir)
    }
  } else {
    mirrorDirectory(sourceDir, targetDir)
  }

  const afterCopySize = getDirectorySize(targetDir)
  console.log(
    `Imported assets into ${targetDir}: ${formatBytes(beforeSize)} -> ${formatBytes(afterCopySize)}`,
  )

  await generateDerivedTextures(targetDir, packConfig, 'pre-optimize')

  if (!skipOptimize) {
    await runOptimizeModels({
      targets: [targetDir],
      filter,
      textureSize,
      ktxDir,
    })
  }

  if (!skipOptimize) {
    await generateDerivedTextures(targetDir, packConfig, 'post-optimize')
  }

  if (!skipThumbnails) {
    await runCommand(
      process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
      [
        'run',
        'generate:thumbnails',
        '--',
        targetDir,
        ...(filter ? ['--filter', filter] : []),
      ],
      { cwd: rootDir, env: process.env },
    )
  }
}

async function generateDerivedTextures(targetDir, packConfig, phase) {
  const derivedTextures = (packConfig?.derivedTextures ?? []).filter((derivedTexture) => (
    (derivedTexture.phase ?? 'pre-optimize') === phase
  ))

  for (const derivedTexture of derivedTextures) {
    const sourcePath = path.join(targetDir, derivedTexture.source)
    const outputPath = path.join(targetDir, derivedTexture.output)
    const preparedSourcePath = await prepareDerivedTextureSource(sourcePath, derivedTexture)
    const metadata = await sharp(preparedSourcePath).metadata()
    const sourceWidth = metadata.width ?? 0
    const sourceHeight = metadata.height ?? 0

    if (!sourceWidth || !sourceHeight) {
      throw new Error(`Could not read texture dimensions for ${sourcePath}.`)
    }

    const extractWidth = Math.max(8, Math.ceil(sourceWidth * (derivedTexture.cropUv.maxU - derivedTexture.cropUv.minU)))
    const extractHeight = Math.max(
      8,
      Math.ceil(sourceHeight * (derivedTexture.cropUv.maxV - derivedTexture.cropUv.minV)),
    )

    await sharp(preparedSourcePath)
      .extract({
        left: Math.floor(sourceWidth * derivedTexture.cropUv.minU),
        top: Math.floor(sourceHeight * derivedTexture.cropUv.minV),
        width: extractWidth,
        height: extractHeight,
      })
      .png()
      .toFile(outputPath)

    if (preparedSourcePath !== sourcePath) {
      await safeRm(preparedSourcePath)
    }
  }
}

async function prepareDerivedTextureSource(sourcePath, derivedTexture) {
  if (path.extname(sourcePath).toLowerCase() !== '.ktx2') {
    return sourcePath
  }

  const tempDir = await fsMkdtemp(path.join(os.tmpdir(), 'dungeonplanner-derived-texture-'))
  const extractedPath = path.join(tempDir, `${path.basename(sourcePath, '.ktx2')}.png`)
  const ktxPath = resolveKtxCommandPath()

  await runCommand(ktxPath, [
    'extract',
    '--transcode',
    derivedTexture.transcode ?? 'rgba8',
    sourcePath,
    extractedPath,
  ], {
    cwd: rootDir,
    env: process.env,
  })

  return extractedPath
}

function resolveKtxCommandPath() {
  const fallbackKtxDirs = [
    process.env.DUNGEONPLANNER_KTX_DIR,
    path.join(os.homedir(), '.local/bin'),
  ].filter(Boolean)
  const resolvedKtxPath = findCommandPath('ktx', fallbackKtxDirs)

  if (!resolvedKtxPath) {
    throw new Error(
      [
        'The KTX-Software CLI was not found.',
        'Install the `ktx` command from https://github.com/KhronosGroup/KTX-Software',
        'or set DUNGEONPLANNER_KTX_DIR to the directory containing `ktx`.',
      ].join('\n'),
    )
  }

  return resolvedKtxPath
}

async function fsMkdtemp(prefix) {
  const { mkdtemp } = await import('node:fs/promises')
  return mkdtemp(prefix)
}

async function safeRm(filePath) {
  const { rm } = await import('node:fs/promises')
  await rm(path.dirname(filePath), { recursive: true, force: true })
}

function runCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      stdio: 'inherit',
    })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 'unknown'}.`))
    })
  })
}

function parseArgs(args) {
  let target = null
  let source = null
  let filter = null
  let skipOptimize = false
  let skipThumbnails = false
  let ktxDir = null
  let textureSize = 2048
  let clean = null

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index]
    if (value === '--') {
      continue
    }

    if (value === '--source') {
      source = args[index + 1] ?? null
      index += 1
      continue
    }

    if (value === '--filter') {
      filter = args[index + 1] ?? null
      index += 1
      continue
    }

    if (value === '--skip-optimize') {
      skipOptimize = true
      continue
    }

    if (value === '--skip-thumbnails') {
      skipThumbnails = true
      continue
    }

    if (value === '--ktx-dir') {
      ktxDir = args[index + 1] ? path.resolve(rootDir, args[index + 1]) : null
      index += 1
      continue
    }

    if (value === '--texture-size') {
      textureSize = Number(args[index + 1] ?? textureSize)
      index += 1
      continue
    }

    if (value === '--clean') {
      clean = true
      continue
    }

    if (value === '--no-clean') {
      clean = false
      continue
    }

    target = value
  }

  return {
    target,
    source,
    filter,
    skipOptimize,
    skipThumbnails,
    ktxDir,
    textureSize,
    clean,
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runImportModels(parseArgs(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
