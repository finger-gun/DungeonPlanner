import { spawnSync } from 'node:child_process'
import { access, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { createInterface } from 'node:readline/promises'
import {
  buildConvexEnvFile,
  mergeEnvFile,
  parseAdminKey,
  parseEnvAssignments,
} from './setup-authenticated-app-utils.mjs'

const rootDir = process.cwd()
const appDir = path.join(rootDir, 'app')
const envLocalPath = path.join(appDir, '.env.local')
const tempEnvPath = path.join(os.tmpdir(), 'dungeonplanner-convex-self-hosted.env')
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const siteUrl = 'http://localhost:4173'
const yesMode = process.argv.includes('--yes')

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? rootDir,
    encoding: 'utf8',
    stdio: options.captureOutput ? ['inherit', 'pipe', 'pipe'] : 'inherit',
  })

  if (result.status !== 0) {
    const stderr = result.stderr?.trim()
    throw new Error(stderr || `Command failed: ${command} ${args.join(' ')}`)
  }

  return result.stdout ?? ''
}

async function fileExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function confirmProceed() {
  if (yesMode) {
    return true
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const answer = await rl.question(
    'This will start the local Convex stack, update app/.env.local, and push auth env vars. Continue? [Y/n] ',
  )

  rl.close()
  const normalizedAnswer = answer.trim().toLowerCase()
  return normalizedAnswer === '' || normalizedAnswer === 'y' || normalizedAnswer === 'yes'
}

async function main() {
  if (!(await confirmProceed())) {
    process.stdout.write('Setup cancelled.\n')
    return
  }

  process.stdout.write('\n1. Checking Docker...\n')
  run('docker', ['info'], { captureOutput: true })

  process.stdout.write('2. Starting self-hosted Convex...\n')
  run(pnpmCommand, ['run', 'app:convex:up'])

  process.stdout.write('3. Generating admin key...\n')
  const adminKeyOutput = run(pnpmCommand, ['run', 'app:convex:admin-key'], {
    captureOutput: true,
  })
  const adminKey = parseAdminKey(adminKeyOutput)

  process.stdout.write('4. Updating app/.env.local...\n')
  const existingEnvLocal = (await fileExists(envLocalPath)) ? await readFile(envLocalPath, 'utf8') : ''
  const mergedEnvLocal = mergeEnvFile(existingEnvLocal, {
    VITE_CONVEX_URL: 'http://127.0.0.1:3210',
    CONVEX_SELF_HOSTED_URL: 'http://127.0.0.1:3210',
    CONVEX_SELF_HOSTED_ADMIN_KEY: adminKey,
  })
  await writeFile(envLocalPath, mergedEnvLocal)

  process.stdout.write('5. Generating Convex Auth signing keys...\n')
  const authKeyOutput = run(pnpmCommand, ['run', 'app:convex:auth-keys'], {
    captureOutput: true,
  })
  const authAssignments = parseEnvAssignments(authKeyOutput)

  if (!authAssignments.JWT_PRIVATE_KEY || !authAssignments.JWKS) {
    throw new Error('Missing Convex Auth key output. Expected JWT_PRIVATE_KEY and JWKS.')
  }

  process.stdout.write('6. Applying Convex auth environment...\n')
  await writeFile(tempEnvPath, buildConvexEnvFile(siteUrl, authAssignments))

  try {
    run(pnpmCommand, ['exec', 'convex', 'env', 'set', '--from-file', tempEnvPath, '--force'], {
      cwd: appDir,
    })

    process.stdout.write('7. Syncing Convex functions and generated API...\n')
    run(pnpmCommand, ['exec', 'convex', 'dev', '--once', '--typecheck', 'disable'], {
      cwd: appDir,
    })
  } finally {
    await rm(tempEnvPath, { force: true })
  }

  process.stdout.write('\nSetup complete.\n')
  process.stdout.write('Next steps:\n')
  process.stdout.write('  pnpm run app:start\n')
  process.stdout.write('  # or run pnpm run app and pnpm run app:convex separately\n')
}

main().catch((error) => {
  process.stderr.write(`\nSetup failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
