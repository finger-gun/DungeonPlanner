import { describe, expect, it } from 'vitest'
import { createContentRef, normalizeContentRef, parseContentRef } from './contentRefs'

describe('content ref helpers', () => {
  it('creates namespaced refs', () => {
    expect(createContentRef('Dungeon Core', 'wall_window_open')).toBe('dungeon-core:wall_window_open')
  })

  it('normalizes legacy flat asset ids into namespaced refs', () => {
    expect(normalizeContentRef('dungeon.wall_window_open')).toBe('dungeon:wall_window_open')
  })

  it('uses the fallback pack id for unqualified local ids', () => {
    expect(normalizeContentRef('wall_window_open', 'dungeon-core')).toBe('dungeon-core:wall_window_open')
  })

  it('preserves runtime-generated character refs', () => {
    expect(normalizeContentRef('generated.player.abc123')).toBe('generated.player.abc123')
  })

  it('parses namespaced refs', () => {
    expect(parseContentRef('dungeon:wall_window_open')).toEqual({
      kind: 'namespaced',
      ref: 'dungeon:wall_window_open',
      packId: 'dungeon',
      localId: 'wall_window_open',
    })
  })
})
