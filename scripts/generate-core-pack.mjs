import { mkdirSync, readdirSync, copyFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const sourceDir = '/Users/roblibob/Projects/models'
const assetDir = path.join(root, 'src/assets/models/core')

const assetNames = [
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

mkdirSync(assetDir, { recursive: true })

for (const name of assetNames) {
  const sourceFile = path.join(sourceDir, `${name}.glb`)
  const assetFile = path.join(assetDir, `${name}.glb`)

  copyFileSync(sourceFile, assetFile)
}

const copiedAssets = readdirSync(assetDir).filter((file) => file.endsWith('.glb')).sort()
console.log(`Core content pack generated for ${copiedAssets.length} GLB assets.`)
