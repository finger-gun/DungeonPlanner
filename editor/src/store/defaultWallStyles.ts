import {
  getContentPackWallStyleById,
  getDefaultContentPackWallStyleId,
} from '../content-packs/registry'

const WALL_STYLE_CONTENT_PACK_ID = 'dungeon'
const FALLBACK_WALL_STYLE_ID = 'dungeon-stone'

export const DEFAULT_INTERIOR_WALL_STYLE_ID =
  'dungeon-stone'

export const DEFAULT_EXTERIOR_WALL_STYLE_ID =
  'dungeon-stone'

export function getDefaultWallStyleId() {
  return getDefaultInteriorWallStyleId()
}

export function getDefaultInteriorWallStyleId() {
  return getAvailableWallStyleId(DEFAULT_INTERIOR_WALL_STYLE_ID)
}

export function getDefaultExteriorWallStyleId() {
  return getAvailableWallStyleId(DEFAULT_EXTERIOR_WALL_STYLE_ID)
}

function getAvailableWallStyleId(wallStyleId: string) {
  return getContentPackWallStyleById(WALL_STYLE_CONTENT_PACK_ID, wallStyleId)
    ? wallStyleId
    : getRegistryDefaultWallStyleId()
}

function getRegistryDefaultWallStyleId() {
  return getDefaultContentPackWallStyleId(WALL_STYLE_CONTENT_PACK_ID) ?? FALLBACK_WALL_STYLE_ID
}
