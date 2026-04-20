import type {
  AssetBrowserState,
  DungeonObjectRecord,
  DungeonTool,
  OpeningRecord,
  SelectedAssetIds,
  SurfaceBrushAssetIds,
} from '../store/useDungeonStore'

const CONTENT_PACK_ASSET_MODULE_PATHS = new Set(Object.keys(import.meta.glob([
  './core/props/**/*.tsx',
  './core/openings/**/*.tsx',
  './core/tiles/**/*.tsx',
  './dungeon/props/**/*.tsx',
  './dungeon/openings/**/*.tsx',
  './dungeon/tiles/**/*.tsx',
])))

const CORE_ASSET_SOURCE_PATHS: Record<string, string> = {
  'core.floor': './core/tiles/Floor.tsx',
  'core.wall': './core/tiles/Wall.tsx',
  'core.opening_door_wall_1': './core/openings/DoorWall1.tsx',
  'core.opening_door_wall_3': './core/openings/DoorWall3.tsx',
  'core.opening_door_wall_bars_1': './core/openings/DoorWallBars1.tsx',
  'core.props_barrel': './core/props/Barrel.tsx',
  'core.props_pillar': './core/props/Pillar.tsx',
  'core.props_pillar_wall': './core/props/PillarWall.tsx',
  'core.props_rubble': './core/props/Rubble.tsx',
  'core.props_staircase_down': './core/openings/StairCaseDown.tsx',
  'core.props_staircase_up': './core/openings/StairCaseUp.tsx',
  'core.props_wall_torch': './core/props/WallTorch.tsx',
}

function getDungeonAssetModulePath(assetId: string) {
  const candidates = getDungeonAssetModulePathCandidates(assetId)
  return candidates.find((candidate) => CONTENT_PACK_ASSET_MODULE_PATHS.has(candidate)) ?? null
}

function getDungeonAssetModulePathCandidates(assetId: string) {
  if (assetId.startsWith('dungeon.props_')) {
    const name = assetId.slice('dungeon.props_'.length)
    const nestedFolderCandidates = [
      ['banners_', './dungeon/props/banners/'],
      ['bars_', './dungeon/props/bars/'],
      ['pillars_', './dungeon/props/pillars/'],
    ].flatMap(([prefix, folder]) =>
      name.startsWith(prefix)
        ? [`${folder}${name.slice(prefix.length)}.tsx`]
        : [],
    )

    return [
      `./dungeon/props/${name}.tsx`,
      ...nestedFolderCandidates,
    ]
  }

  if (assetId.startsWith('dungeon.stairs_')) {
    return [`./dungeon/openings/stairs/${assetId.slice('dungeon.stairs_'.length)}.tsx`]
  }

  if (assetId.startsWith('dungeon.floor_')) {
    return [`./dungeon/tiles/floors/${assetId.slice('dungeon.floor_'.length)}.tsx`]
  }

  if (assetId.startsWith('dungeon.wall_')) {
    return [`./dungeon/tiles/walls/${assetId.slice('dungeon.wall_'.length)}.tsx`]
  }

  return []
}

function joinProjectPath(relativePath: string) {
  const separator = __PROJECT_ROOT__.includes('\\') ? '\\' : '/'
  const normalizedRoot = __PROJECT_ROOT__.replace(/[\\/]+$/, '')
  const normalizedRelative = relativePath.replace(/^\.?\//, '').replace(/\//g, separator)
  return `${normalizedRoot}${separator}src${separator}content-packs${separator}${normalizedRelative}`
}

export function getContentPackAssetSourcePath(assetId: string) {
  const modulePath = CORE_ASSET_SOURCE_PATHS[assetId] ?? getDungeonAssetModulePath(assetId)
  if (!modulePath) {
    return null
  }

  return joinProjectPath(modulePath)
}

export function getContentPackAssetSourceLink(assetId: string) {
  const sourcePath = getContentPackAssetSourcePath(assetId)
  if (!sourcePath) {
    return null
  }

  return `vscode://file/${encodeURI(sourcePath.replace(/\\/g, '/'))}`
}

type DebugPanelAssetState = {
  tool: DungeonTool
  selectedAssetIds: SelectedAssetIds
  surfaceBrushAssetIds: SurfaceBrushAssetIds
  assetBrowser: AssetBrowserState
  selectedObject: DungeonObjectRecord | null
  selectedOpening: OpeningRecord | null
}

export function getDebugPanelAssetId(state: DebugPanelAssetState) {
  if (state.selectedObject?.assetId) {
    return state.selectedObject.assetId
  }

  if (state.selectedOpening?.assetId) {
    return state.selectedOpening.assetId
  }

  if (state.tool === 'character') {
    return state.selectedAssetIds.player
  }

  if (state.tool !== 'prop') {
    return null
  }

  if (state.assetBrowser.category === 'openings') {
    return state.selectedAssetIds.opening
  }

  if (state.assetBrowser.category === 'surfaces') {
    return state.assetBrowser.subcategory === 'walls'
      ? state.surfaceBrushAssetIds.wall
      : state.surfaceBrushAssetIds.floor
  }

  return state.selectedAssetIds.prop
}
