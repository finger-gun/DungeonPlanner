import { describe, expect, it } from 'vitest'
import {
  getContentPackAssetSourceLink,
  getContentPackAssetSourcePath,
  getDebugPanelAssetId,
} from './debugSourceLinks'

describe('debugSourceLinks', () => {
  it('resolves a dungeon asset source path and vscode link', () => {
    const sourcePath = getContentPackAssetSourcePath('dungeon.props_chair')
    const sourceLink = getContentPackAssetSourceLink('dungeon.props_chair')

    expect(sourcePath).toContain('/editor/src/content-packs/dungeon/props/chair.tsx')
    expect(sourceLink).toBe(`vscode://file/${encodeURI(sourcePath!)}`)
  })

  it('resolves nested dungeon asset folders without importing the asset module', () => {
    expect(getContentPackAssetSourcePath('dungeon.props_banners_banner_blue')).toContain(
      '/editor/src/content-packs/dungeon/props/banners/banner_blue.tsx',
    )
    expect(getContentPackAssetSourcePath('dungeon.props_bars_bar_straight_A')).toContain(
      '/editor/src/content-packs/dungeon/props/bars/bar_straight_A.tsx',
    )
    expect(getContentPackAssetSourcePath('dungeon.props_banners_stool_round')).toContain(
      '/editor/src/content-packs/dungeon/props/banners/stool_round.tsx',
    )
  })

  it('returns null when an asset does not have a local content pack module', () => {
    expect(getContentPackAssetSourcePath('dungeon.props_banner_blue')).toBeNull()
    expect(getContentPackAssetSourcePath('generated.player.test')).toBeNull()
    expect(getContentPackAssetSourceLink('generated.player.test')).toBeNull()
  })

  it('prefers scene selection over browser selection in the debug panel', () => {
    expect(getDebugPanelAssetId({
      tool: 'prop',
      selectedAssetIds: {
        floor: 'dungeon.floor_floor_tile_small',
        wall: 'dungeon.wall_wall',
        prop: 'dungeon.props_chair',
        opening: 'dungeon.stairs_stairs',
        player: null,
      },
      surfaceBrushAssetIds: {
        floor: 'dungeon.floor_floor_tile_small',
        wall: 'dungeon.wall_wall',
      },
      assetBrowser: {
        category: 'openings',
        subcategory: 'stairs',
      },
      selectedObject: {
        id: 'obj-1',
        type: 'prop',
        assetId: 'dungeon.props_table_round',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        props: {},
        cell: [0, 0],
        cellKey: '0:0',
        layerId: 'layer-1',
      },
      selectedOpening: null,
    })).toBe('dungeon.props_table_round')
  })

  it('falls back to the active browser asset when nothing is selected in scene', () => {
    expect(getDebugPanelAssetId({
      tool: 'prop',
      selectedAssetIds: {
        floor: 'dungeon.floor_floor_tile_small',
        wall: 'dungeon.wall_wall',
        prop: 'dungeon.props_chair',
        opening: 'dungeon.stairs_stairs',
        player: null,
      },
      surfaceBrushAssetIds: {
        floor: 'dungeon.floor_floor_tile_small',
        wall: 'dungeon.wall_wall',
      },
      assetBrowser: {
        category: 'surfaces',
        subcategory: 'walls',
      },
      selectedObject: null,
      selectedOpening: null,
    })).toBe('dungeon.wall_wall')
  })
})
