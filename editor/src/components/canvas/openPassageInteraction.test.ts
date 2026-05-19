import { describe, expect, it, vi } from 'vitest'
import { buildSplineWallOpeningPlacement } from '../../store/openingPlacement'
import {
  getEligibleOpenPassageWallKey,
  shouldAllowObjectContextDelete,
} from './openPassageInteraction'
import type { PaintedCellRecord } from '../../store/useDungeonStore'

vi.mock('../../store/openingPlacement', () => ({
  buildSplineWallOpeningPlacement: vi.fn(),
}))

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

  it('uses spline wall placement when a graph-backed wall is available', () => {
    vi.mocked(buildSplineWallOpeningPlacement).mockReturnValueOnce({
      wallKey: '0:0:east',
      width: 1,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      spanWorldWidth: 1,
      valid: true,
      segmentId: 'segment-1',
      segmentStartRatio: 0.25,
      segmentEndRatio: 0.5,
    })

    expect(getEligibleOpenPassageWallKey(
      { x: 1.5, y: 0, z: 1.5 },
      {},
      new Set(['0:0:east']),
      { nodes: {}, segments: {}, paths: {} },
      {} as never,
    )).toBe('0:0:east')
  })
})
