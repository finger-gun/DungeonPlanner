import { describe, expect, it } from 'vitest'
import { getMetadataConnectors } from '../connectors'
import { dungeonContentPack } from './index'

describe('dungeonContentPack', () => {
  it('defines placement with connectors instead of connectsTo', () => {
    for (const asset of dungeonContentPack.assets) {
      expect(asset.metadata?.connectsTo, asset.id).toBeUndefined()
    }
  })

  it('supports placing bottles onto prop surfaces like bars', () => {
    const bottle = dungeonContentPack.assets.find((asset) => asset.id === 'dungeon.props_bottle_A_brown')
    const bar = dungeonContentPack.assets.find((asset) => asset.id === 'dungeon.props_bars_bar_straight_A')

    expect(getMetadataConnectors(bottle?.metadata)).toContainEqual({
      type: 'SURFACE',
      point: [0, 0, 0],
    })
    expect(bar?.metadata?.propSurface).toBe(true)
  })

  it('normalizes all tabletop props to free floor and surface placement', () => {
    const tabletopAssets = dungeonContentPack.assets.filter((asset) =>
      /^dungeon\.props_(plate|bottle|food)/.test(asset.id),
    )

    expect(tabletopAssets.length).toBeGreaterThan(0)

    for (const asset of tabletopAssets) {
      expect(asset.metadata?.snapsTo, asset.id).toBe('FREE')
      expect(getMetadataConnectors(asset.metadata), asset.id).toEqual([
        { point: [0, 0, 0], type: 'FLOOR' },
        { point: [0, 0, 0], type: 'SURFACE' },
      ])
    }
  })

  it('enables prop surfaces on all dungeon tables and bars', () => {
    const tableAndBarAssets = dungeonContentPack.assets.filter((asset) =>
      /^dungeon\.props_(table|bars_bar_|banners_(bartop_|table_round_))/.test(asset.id),
    )

    expect(tableAndBarAssets.length).toBeGreaterThan(0)

    for (const asset of tableAndBarAssets) {
      expect(asset.metadata?.propSurface, asset.id).toBe(true)
    }
  })

  it('normalizes all dungeon bar props to Bar Straight A placement metadata', () => {
    const barAssets = dungeonContentPack.assets.filter((asset) =>
      /^dungeon\.props_bars_bar_/.test(asset.id),
    )

    expect(barAssets.length).toBeGreaterThan(0)

    for (const asset of barAssets) {
      expect(asset.metadata?.snapsTo, asset.id).toBe('FREE')
      expect(asset.metadata?.propSurface, asset.id).toBe(true)
      expect(getMetadataConnectors(asset.metadata), asset.id).toEqual([
        { point: [0, 0, 0], type: 'FLOOR' },
      ])
    }
  })

  it('provides reusable fire effects for dungeon flame props', () => {
    const litTorch = dungeonContentPack.assets.find((asset) => asset.id === 'dungeon.props_torch_lit')
    const litCandle = dungeonContentPack.assets.find((asset) => asset.id === 'dungeon.props_candle_lit')
    const unlitCandle = dungeonContentPack.assets.find((asset) => asset.id === 'dungeon.props_candle')

    expect(litTorch?.getEffect?.({})).toMatchObject({
      preset: 'fire',
      emitters: [{ offset: [0, 0.3, 0] }],
    })
    expect(litTorch?.getEffect?.({ lightOverrides: { color: '#55aaff' } })).toMatchObject({
      preset: 'fire',
      emitters: [{ offset: [0, 0.3, 0], color: '#55aaff' }],
    })
    expect(litCandle?.getEffect?.({})).toMatchObject({
      preset: 'fire',
      emitters: [{ offset: [0, 0.56, 0] }],
    })
    expect(unlitCandle?.getEffect?.({})).toBeNull()
    expect(unlitCandle?.getEffect?.({ lit: true })).toMatchObject({ preset: 'fire' })
  })
})
