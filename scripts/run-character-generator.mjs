import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import {
  getBootstrapPythonCandidates,
  getCharacterGeneratorPaths,
  normalizeForwardedArgs,
  shouldInstallCharacterGenerator,
} from './run-character-generator-utils.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptDir, '..')
const invocationCwd = process.cwd()
const paths = getCharacterGeneratorPaths(rootDir)
const forwardedArgs = normalizeForwardedArgs(process.argv.slice(2))

function runChecked(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? rootDir,
    stdio: 'inherit',
    env: process.env,
  })

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`)
  }
}

function commandMeetsVersion(command, args) {
  const result = spawnSync(
    command,
    [
      ...args,
      '-c',
      'import sys; raise SystemExit(0 if sys.version_info >= (3, 11) else 1)',
    ],
    {
      stdio: 'ignore',
      env: process.env,
    },
  )

  return result.status === 0
}

function virtualEnvHasPip() {
  if (!existsSync(paths.venvPythonPath)) {
    return false
  }

  const result = spawnSync(
    paths.venvPythonPath,
    ['-m', 'pip', '--version'],
    {
      stdio: 'ignore',
      env: process.env,
    },
  )

  return result.status === 0
}

function readInstallStamp() {
  if (!existsSync(paths.installStampPath)) {
    return null
  }

  try {
    const raw = JSON.parse(readFileSync(paths.installStampPath, 'utf8'))
    return typeof raw === 'object' && raw !== null ? raw : null
  } catch {
    return null
  }
}

function writeInstallStamp(pyprojectMtimeMs) {
  mkdirSync(paths.venvDir, { recursive: true })
  writeFileSync(
    paths.installStampPath,
    JSON.stringify({ pyprojectMtimeMs }, null, 2) + '\n',
    'utf8',
  )
}

function resolveBootstrapPython() {
  for (const candidate of getBootstrapPythonCandidates()) {
    if (commandMeetsVersion(candidate.command, candidate.args)) {
      return candidate
    }
  }

  throw new Error(
    'Python 3.11+ is required. Install Python and ensure one of these commands is available: python3, python, or py -3.11.',
  )
}

function ensureVirtualEnv() {
  if (existsSync(paths.venvPythonPath) && virtualEnvHasPip()) {
    return
  }

  rmSync(paths.venvDir, { recursive: true, force: true })
  const candidateErrors = []

  for (const bootstrapPython of getBootstrapPythonCandidates()) {
    if (!commandMeetsVersion(bootstrapPython.command, bootstrapPython.args)) {
      continue
    }

    process.stdout.write(`Creating virtual environment with ${bootstrapPython.label}...\n`)
    rmSync(paths.venvDir, { recursive: true, force: true })

    try {
      runChecked(
        bootstrapPython.command,
        [...bootstrapPython.args, '-m', 'venv', '.venv'],
        { cwd: paths.toolDir },
      )
      if (!virtualEnvHasPip()) {
        throw new Error('Created virtual environment is missing pip')
      }
      return
    } catch (error) {
      candidateErrors.push(
        `${bootstrapPython.label}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  const resolvedCandidate = resolveBootstrapPython()
  throw new Error(
    `Failed to create a virtual environment with ${resolvedCandidate.label} or any fallback.\n${candidateErrors.join('\n')}`,
  )
}

function environmentCanImportPackage() {
  if (!existsSync(paths.venvPythonPath)) {
    return false
  }

  const result = spawnSync(
    paths.venvPythonPath,
    ['-c', 'import character_generator'],
    {
      cwd: paths.toolDir,
      stdio: 'ignore',
      env: process.env,
    },
  )

  return result.status === 0
}

function ensureInstalled() {
  const pyprojectMtimeMs = statSync(paths.pyprojectPath).mtimeMs
  const installStamp = readInstallStamp()
  const installNeeded = shouldInstallCharacterGenerator(installStamp, pyprojectMtimeMs)

  if (!installNeeded && environmentCanImportPackage()) {
    return
  }

  process.stdout.write('Installing character generator dependencies...\n')
  runChecked(
    paths.venvPythonPath,
    ['-m', 'pip', 'install', '-e', '.'],
    { cwd: paths.toolDir },
  )
  writeInstallStamp(pyprojectMtimeMs)
}

function runCharacterGenerator() {
  const result = spawnSync(
    paths.venvPythonPath,
    ['-m', 'character_generator', ...forwardedArgs],
    {
      cwd: invocationCwd,
      stdio: 'inherit',
      env: process.env,
    },
  )

  if (result.signal) {
    process.kill(process.pid, result.signal)
    return
  }

  process.exitCode = result.status ?? 1
}

function main() {
  ensureVirtualEnv()
  ensureInstalled()
  runCharacterGenerator()
}

try {
  main()
} catch (error) {
  process.stderr.write(
    `Character generator setup failed: ${error instanceof Error ? error.message : String(error)}\n`,
  )
  process.exitCode = 1
}
