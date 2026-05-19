import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const recipePath = path.join(repoRoot, 'editor/src/content-packs/dungeon/wallStyleRecipes.json')
const outputPath = path.join(repoRoot, 'editor/src/content-packs/dungeon/generated/wallStyles.ts')

const recipes = JSON.parse(await readFile(recipePath, 'utf8'))

const generatedSource = `import type { ContentPackWallStyle } from '../../types'
import { createWallStyleFromRecipe, type WallStyleRecipe } from '../wallStyleProfiles'

const wallStyleRecipes = ${JSON.stringify(recipes, null, 2)} as const satisfies readonly WallStyleRecipe[]

export const dungeonWallStyles: ContentPackWallStyle[] = wallStyleRecipes.map(createWallStyleFromRecipe)
`

await writeFile(outputPath, generatedSource)
console.log(`Generated ${path.relative(repoRoot, outputPath)} from ${path.relative(repoRoot, recipePath)}`)
