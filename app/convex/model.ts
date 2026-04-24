import { v } from 'convex/values'
import { platformRoles } from './roleAccess'

export const roleValidator = v.union(...platformRoles.map((role) => v.literal(role)))

export const packKindValidator = v.union(v.literal('asset'), v.literal('rules'))

export const packVisibilityValidator = v.union(
  v.literal('global'),
  v.literal('public'),
  v.literal('private'),
)

export const sceneCategoryValidator = v.union(
  v.literal('floor'),
  v.literal('wall'),
  v.literal('prop'),
  v.literal('opening'),
  v.literal('player'),
)

export const connectorTypeValidator = v.union(
  v.literal('FLOOR'),
  v.literal('WALL'),
  v.literal('SURFACE'),
)

export const snapsToValidator = v.union(v.literal('GRID'), v.literal('FREE'))

export const assetBrowserCategoryValidator = v.union(
  v.literal('furniture'),
  v.literal('storage'),
  v.literal('decor'),
  v.literal('nature'),
  v.literal('treasure'),
  v.literal('structure'),
  v.literal('openings'),
  v.literal('surfaces'),
)

export const assetBrowserSubcategoryValidator = v.union(
  v.literal('tables'),
  v.literal('seating'),
  v.literal('beds'),
  v.literal('shelving'),
  v.literal('containers'),
  v.literal('barrels'),
  v.literal('lighting'),
  v.literal('banners'),
  v.literal('tabletop'),
  v.literal('books'),
  v.literal('trees'),
  v.literal('bare-trees'),
  v.literal('bushes'),
  v.literal('grass'),
  v.literal('rocks'),
  v.literal('loot'),
  v.literal('tools'),
  v.literal('rubble'),
  v.literal('pillars'),
  v.literal('bars'),
  v.literal('doors'),
  v.literal('stairs'),
  v.literal('floors'),
  v.literal('walls'),
  v.literal('misc'),
)

export const packEntryKindValidator = v.union(
  v.literal('scene-asset'),
  v.literal('rules-data'),
)

export const packConnectorValidator = v.object({
  point: v.array(v.number()),
  type: connectorTypeValidator,
  rotation: v.optional(v.array(v.number())),
})

export const packLightValidator = v.object({
  color: v.string(),
  intensity: v.number(),
  distance: v.number(),
  decay: v.optional(v.number()),
  offset: v.optional(v.array(v.number())),
  flicker: v.optional(v.boolean()),
  castShadow: v.optional(v.boolean()),
})

export const packEffectEmitterValidator = v.object({
  offset: v.optional(v.array(v.number())),
  scale: v.optional(v.number()),
  intensity: v.optional(v.number()),
  color: v.optional(v.string()),
})

export const packEffectValidator = v.object({
  preset: v.literal('fire'),
  emitters: v.optional(v.array(packEffectEmitterValidator)),
})

export const packPlacementValidator = v.object({
  category: v.optional(sceneCategoryValidator),
  snapsTo: v.optional(snapsToValidator),
  connectors: v.optional(v.array(packConnectorValidator)),
  propSurface: v.optional(v.boolean()),
  blocksLineOfSight: v.optional(v.boolean()),
  castShadow: v.optional(v.boolean()),
  receiveShadow: v.optional(v.boolean()),
  wallSpan: v.optional(v.union(v.literal(1), v.literal(2), v.literal(3))),
  openingWidth: v.optional(v.union(v.literal(1), v.literal(2), v.literal(3))),
  stairDirection: v.optional(v.union(v.literal('up'), v.literal('down'))),
  pairedAssetRef: v.optional(v.string()),
  tileSpan: v.optional(
    v.object({
      gridWidth: v.union(v.literal(1), v.literal(2), v.literal(4)),
      gridHeight: v.union(v.literal(1), v.literal(2), v.literal(4)),
    }),
  ),
})

export const packBrowserMetadataValidator = v.object({
  category: v.optional(assetBrowserCategoryValidator),
  subcategory: v.optional(assetBrowserSubcategoryValidator),
  tags: v.optional(v.array(v.string())),
})

export const canonicalPackEntryValidator = v.object({
  id: v.string(),
  localId: v.string(),
  name: v.string(),
  entryKind: packEntryKindValidator,
  category: v.string(),
  assetFileRef: v.optional(v.string()),
  thumbnailFileRef: v.optional(v.string()),
  placement: v.optional(packPlacementValidator),
  browser: v.optional(packBrowserMetadataValidator),
  light: v.optional(packLightValidator),
  effects: v.optional(v.array(packEffectValidator)),
})

export const packDefaultAssetRefsValidator = v.object({
  floor: v.optional(v.string()),
  wall: v.optional(v.string()),
  opening: v.optional(v.string()),
  prop: v.optional(v.string()),
  player: v.optional(v.string()),
})
