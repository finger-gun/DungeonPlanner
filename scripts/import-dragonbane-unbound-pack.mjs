#!/usr/bin/env node
/**
 * Regenerates the static Dragonbane rules pack snapshots committed to this repo.
 * Run this when the dragonbane-unbound source content changes.
 *
 * Usage:
 *   node scripts/import-dragonbane-unbound-pack.mjs [path-to-dragonbane-unbound]
 *
 * Output written to: server/content-packs/
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { importDragonbaneUnboundPacks } from './dragonbane-unbound-importer.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourceDir = process.argv[2] ?? process.env.DRAGONBANE_UNBOUND_PATH ?? path.resolve(process.cwd(), 'dragonbane-unbound')
const outDir = path.resolve(__dirname, '../server/content-packs')

const packs = importDragonbaneUnboundPacks({ sourceDir })
fs.mkdirSync(outDir, { recursive: true })

const registry = {
  packs: packs.map((pack) => ({
    packId: pack.packId,
    name: pack.name,
    system: pack.system,
    kind: pack.kind,
    version: pack.version,
    description: pack.description,
    alwaysActive: pack.alwaysActive,
    bundled: pack.bundled,
    path: `/api/content-packs/${pack.packId}.pack.json`,
  })),
}

for (const pack of packs) {
  const filePath = path.join(outDir, `${pack.packId}.pack.json`)
  fs.writeFileSync(filePath, `${JSON.stringify(pack, null, 2)}\n`, 'utf8')
  process.stdout.write(`Wrote ${filePath}\n`)
}

const registryPath = path.join(outDir, 'registry.json')
fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8')
process.stdout.write(`Wrote ${registryPath}\n`)
