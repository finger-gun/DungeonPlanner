import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import { devSeedAccounts, formatSeedAccountSummary } from './seed-authenticated-app-utils.mjs'

const rootDir = process.cwd()
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STATIC_PACKS_DIR = path.resolve(__dirname, '../server/content-packs')
const STATIC_PACK_REGISTRY_PATH = path.join(STATIC_PACKS_DIR, 'registry.json')

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

  if (fs.existsSync(STATIC_PACK_REGISTRY_PATH)) {
    process.stdout.write('\nImporting always-active Dragonbane rules packs from static snapshots...\n')
    const registry = JSON.parse(fs.readFileSync(STATIC_PACK_REGISTRY_PATH, 'utf8'))
    const alwaysActivePacks = Array.isArray(registry?.packs)
      ? registry.packs.filter((pack) => pack?.alwaysActive === true)
      : []

    for (const registryEntry of alwaysActivePacks) {
      const packPath = path.join(STATIC_PACKS_DIR, `${registryEntry.packId}.pack.json`)

      if (!fs.existsSync(packPath)) {
        process.stdout.write(`Skipping ${registryEntry.packId}; ${packPath} was not found.\n`)
        continue
      }

      const pack = JSON.parse(fs.readFileSync(packPath, 'utf8'))
      const seedPackOutput = run(
        pnpmCommand,
        [
          '--filter',
          'dungeonplanner-app',
          'exec',
          'convex',
          'run',
          'seed:seedDevDragonbaneRulesPack',
          JSON.stringify({ pack }),
        ],
        { captureOutput: true },
      )

      process.stdout.write(`${seedPackOutput.trim()}\n`)
    }
  } else {
    process.stdout.write(`\nSkipping Dragonbane rules pack import; static registry not found at ${STATIC_PACK_REGISTRY_PATH}.\n`)
  }
}

main().catch((error) => {
  process.stderr.write(`Seed failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
