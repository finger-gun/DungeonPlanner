import { describe, expect, it } from 'vitest'
import { getContentPackAssetById, getContentPackAssetsByCategory } from './registry'

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
    expect(getContentPackAssetsByCategory('player').some((entry) => entry.id === 'core.player_barbarian')).toBe(true)
  })

  it('marks pillar and rubble props as LOS blockers', () => {
    expect(getContentPackAssetById('core.props_pillar')?.metadata?.blocksLineOfSight).toBe(true)
    expect(getContentPackAssetById('core.props_rubble')?.metadata?.blocksLineOfSight).toBe(true)
  })
})
