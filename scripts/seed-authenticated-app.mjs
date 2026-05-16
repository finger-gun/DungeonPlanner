import { spawnSync } from 'node:child_process'
import process from 'node:process'
import { devSeedAccounts, formatSeedAccountSummary } from './seed-authenticated-app-utils.mjs'

const rootDir = process.cwd()
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

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

async function main() {
  process.stdout.write('Ensuring local Convex is running...\n')
  run(pnpmCommand, ['run', 'app:convex:up'])

  process.stdout.write('Seeding developer accounts...\n')
  const output = run(pnpmCommand, ['--filter', 'dungeonplanner-app', 'seed:dev'], {
    captureOutput: true,
  })

  process.stdout.write(`${output.trim()}\n`)
  process.stdout.write('\nSeed accounts ready:\n')
  process.stdout.write(`${formatSeedAccountSummary(devSeedAccounts)}\n`)
}

main().catch((error) => {
  process.stderr.write(`Seed failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
