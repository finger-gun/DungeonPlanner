import type { ContentPackWallStyle } from '../types'
import { createWallStyleFromRecipe, type WallStyleRecipe } from './wallStyleProfiles'
import { dungeonWallStyles as generatedDungeonWallStyles } from './generated/wallStyles'

export const DEFAULT_DUNGEON_WALL_STYLE_ID = 'dungeon-stone'

const builtinWallStyleRecipes = [
  {
    id: 'dungeon-stone',
    name: 'Dungeon Stone',
    browser: {
      family: 'Dungeon Stone',
      tags: ['stone'],
      source: 'built-in',
    },
    structuralCore: {
      profile: 'wainscot-core',
      material: 'kaykit-stone',
    },
    roomFace: {
      profile: 'wainscot-room-face',
      material: 'keep-room-stone',
    },
    roomFaceDetails: [
      {
        profile: 'wainscot-room-base',
        material: 'tavern-wood-base',
      },
    ],
    exteriorFace: {
      profile: 'wainscot-exterior-face',
      material: 'wedged-cobblestone',
    },
    openingRules: {
      defaultMode: 'structural',
      supportedModes: ['framed', 'structural'],
    },
  },
  {
    id: 'stone-keep',
    name: 'Stone Keep',
    browser: {
      family: 'Stone Keep',
      tags: ['stone'],
      source: 'built-in',
    },
    structuralCore: {
      profile: 'thick-stone-core',
      material: 'keep-core-blue',
    },
    roomFace: {
      profile: 'sloped-stone-room-face',
      material: 'keep-room-stone',
    },
    exteriorFace: {
      profile: 'sloped-stone-exterior-face',
      material: 'wedged-cobblestone-exterior',
    },
    openingRules: {
      defaultMode: 'structural',
      supportedModes: ['framed', 'structural'],
      supportedKinds: ['door', 'window', 'passage'],
      compatibleAssetIds: [
        'core.opening_door_custom',
        'core.opening_door_wall_1',
        'dungeon.wall_wall_opening',
      ],
    },
  },
  {
    id: 'manor-plaster',
    name: 'Manor Plaster',
    browser: {
      family: 'Manor Plaster',
      tags: ['plaster', 'noble'],
      source: 'built-in',
    },
    structuralCore: {
      profile: 'plaster-core',
      material: 'classy-art-deco-wallpaper',
    },
    roomFace: {
      profile: 'soft-plaster-room-face',
      material: 'classy-art-deco-wallpaper',
    },
    exteriorFace: {
      profile: 'soft-plaster-exterior-face',
      material: 'classy-art-deco-wallpaper',
    },
    openingRules: {
      defaultMode: 'structural',
      supportedModes: ['framed', 'structural'],
      supportedKinds: ['door', 'window', 'passage'],
      compatibleAssetIds: [
        'core.opening_door_custom',
        'core.opening_door_wall_1',
        'dungeon.wall_wall_opening',
      ],
    },
  },
  {
    id: 'rocky-cave',
    name: 'Rocky Cave',
    browser: {
      family: 'Rocky Cave',
      tags: ['organic', 'cave'],
      source: 'built-in',
    },
    structuralCore: {
      profile: 'cave-rock-core',
      material: 'rough-rockface-1-pbr-material',
    },
    roomFace: {
      profile: 'cave-rock-room-face',
      material: 'rough-rockface-1-pbr-material',
    },
    exteriorFace: {
      profile: 'cave-rock-exterior-face',
      material: 'rough-rockface-1-pbr-material',
    },
    inserts: [
      {
        assetId: 'dungeon.props_pillars_cave_pillar',
        anchors: ['start', 'end', 'convex-corner', 'curvature-change'],
      },
    ],
    openingRules: {
      defaultMode: 'structural',
      supportedModes: ['framed', 'structural'],
    },
  },
  {
    id: 'ai-gothic',
    name: 'AI Gothic',
    browser: {
      family: 'AI Gothic',
      tags: ['stone', 'noble'],
      source: 'built-in',
    },
    structuralCore: {
      profile: 'thick-stone-core',
      material: 'ai-gothic-depth-wall',
      render: {
        hiddenProfileSegmentIndices: [0, 1, 2],
      },
    },
    roomFace: {
      profile: 'ai-gothic-wall-face',
      material: 'ai-gothic-depth-wall',
    },
    exteriorFace: {
      profile: 'ai-gothic-wall-face',
      material: 'ai-gothic-depth-wall',
    },
    joinMode: 'cover-piece',
    curvatureLimits: {
      minInnerRadius: 1.2,
      maxTurnDegrees: 135,
    },
    openingRules: {
      defaultMode: 'structural',
      supportedModes: ['framed', 'structural'],
      supportedKinds: ['door', 'window', 'passage'],
      compatibleAssetIds: [
        'core.opening_door_custom',
        'core.opening_door_wall_1',
        'dungeon.wall_wall_opening',
      ],
    },
  },
  {
    id: 'art-deco-cobblestone',
    name: 'Art Deco Cobblestone',
    browser: {
      family: 'Art Deco Cobblestone',
      tags: ['stone', 'noble'],
      source: 'built-in',
    },
    structuralCore: {
      profile: 'wainscot-core',
      material: 'modern-brick1-core',
      render: {
        hiddenProfileSegmentIndices: [0, 1, 2, 3, 4, 5, 6],
      },
    },
    roomFace: {
      profile: 'wainscot-room-face',
      material: 'modern-brick1',
    },
    roomFaceDetails: [
      {
        profile: 'wainscot-room-base',
        material: 'tavern-wood-base',
      },
    ],
    exteriorFace: {
      profile: 'wainscot-exterior-face',
      material: 'modern-brick1',
    },
    openingRules: {
      defaultMode: 'structural',
      supportedModes: ['framed', 'structural'],
    },
  },
] as const satisfies readonly WallStyleRecipe[]

const builtinDungeonWallStyles: ContentPackWallStyle[] = builtinWallStyleRecipes.map(createWallStyleFromRecipe)

export const dungeonWallStyles: ContentPackWallStyle[] = [
  ...builtinDungeonWallStyles,
  ...generatedDungeonWallStyles.filter((style) => !builtinDungeonWallStyles.some((builtin) => builtin.id === style.id)),
]
