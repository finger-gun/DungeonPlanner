import { describe, expect, it } from 'vitest'
import { getContentPackAssetById } from './registry'

describe('content pack registry', () => {
  it('registers the core barbarian player asset', () => {
    const asset = getContentPackAssetById('core.player_barbarian')

    expect(asset).toMatchObject({
      id: 'core.player_barbarian',
      slug: 'player_barbarian',
      name: 'Barbarian',
      category: 'player',
      metadata: {
        connectsTo: 'FLOOR',
      },
    })
  })

  it('registers the rest of the core animated player roster', () => {
    expect(getContentPackAssetById('core.player_knight')?.name).toBe('Knight')
    expect(getContentPackAssetById('core.player_mage')?.name).toBe('Mage')
    expect(getContentPackAssetById('core.player_ranger')?.name).toBe('Ranger')
    expect(getContentPackAssetById('core.player_rogue')?.name).toBe('Rogue')
    expect(getContentPackAssetById('core.player_rogue_hooded')?.name).toBe('Rogue (Hooded)')
  })

  it('keeps pillar and rubble props non-blocking for LOS', () => {
    expect(getContentPackAssetById('core.props_pillar')?.metadata?.blocksLineOfSight).toBe(false)
    expect(getContentPackAssetById('core.props_rubble')?.metadata?.blocksLineOfSight).toBe(false)
  })

  it('registers a play-toggleable wall torch with dynamic light state', () => {
    const asset = getContentPackAssetById('core.props_wall_torch')

    expect(asset?.getPlayModeNextProps?.({ lit: true })).toEqual({ lit: false })
    expect(asset?.getPlayModeNextProps?.({ lit: false })).toEqual({ lit: true })
    expect(asset?.getLight?.({})).toMatchObject({ intensity: 5, flicker: true })
    expect(asset?.getLight?.({ lit: false })).toBeNull()
  })
})
