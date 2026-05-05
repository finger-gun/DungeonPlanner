import {
  buildDungeonColorVariants,
  type AtlasCell,
} from '../../shared/dungeonColorAtlas'
import { getAtlasCellKey } from '../../../shared/atlasColorVariants'

export const PLAIN_BANNER_DEFAULT_SOURCE_CELLS = {
  blue: [6, 2],
  brown: [6, 0],
  green: [1, 2],
  red: [3, 2],
  white: [0, 3],
  yellow: [4, 2],
} as const satisfies Record<string, AtlasCell>

const KNOWN_BANNER_VARIANTS_BY_CELL = Object.fromEntries(
  Object.entries(PLAIN_BANNER_DEFAULT_SOURCE_CELLS).map(([id, cell]) => [
    getAtlasCellKey(cell),
    { id, label: capitalize(id) },
  ]),
)

export const ALL_PLAIN_BANNER_SWATCHES = buildDungeonColorVariants({
  excludedCells: [[1, 0]],
  namedVariantsByCell: KNOWN_BANNER_VARIANTS_BY_CELL,
})

export const BANNER_WALL_CONNECTORS = [
  {
    point: [0, 0, 0.5] as const,
    type: 'WALL' as const,
  },
]

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
