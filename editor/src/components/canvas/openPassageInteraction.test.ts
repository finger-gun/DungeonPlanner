import { describe, expect, it } from 'vitest'
import {
  getEligibleOpenPassageWallKey,
  shouldAllowObjectContextDelete,
} from './openPassageInteraction'
import type { PaintedCellRecord } from '../../store/useDungeonStore'

describe('openPassageInteraction', () => {
  it('limits object context deletion to prop placement and character tools', () => {
    expect(shouldAllowObjectContextDelete('prop', 'furniture')).toBe(true)
    expect(shouldAllowObjectContextDelete('character', 'openings')).toBe(true)
    expect(shouldAllowObjectContextDelete('prop', 'openings')).toBe(false)
    expect(shouldAllowObjectContextDelete('prop', 'surfaces')).toBe(false)
    expect(shouldAllowObjectContextDelete('opening', 'openings')).toBe(false)
  })

  it('returns the hovered inter-room wall key for open passages', () => {
    const paintedCells: Record<string, PaintedCellRecord> = {
      '0:0': { cell: [0, 0], layerId: 'layer-1', roomId: 'room-a' },
      '0:1': { cell: [0, 1], layerId: 'layer-1', roomId: 'room-b' },
    }

    expect(getEligibleOpenPassageWallKey(
      { x: 0, y: 0, z: 0.45 },
      paintedCells,
      new Set(['0:0:north']),
    )).toBe('0:0:north')
  })

  it('ignores walls that are not eligible open-passage targets', () => {
    const paintedCells: Record<string, PaintedCellRecord> = {
      '0:0': { cell: [0, 0], layerId: 'layer-1', roomId: 'room-a' },
      '1:0': { cell: [1, 0], layerId: 'layer-1', roomId: 'room-a' },
    }

    expect(getEligibleOpenPassageWallKey(
      { x: 0.45, y: 0, z: 0 },
      paintedCells,
      new Set(),
    )).toBeNull()
  })
})
