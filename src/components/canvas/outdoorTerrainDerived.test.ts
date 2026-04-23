import { describe, expect, it } from 'vitest'
import { buildSteppedOutdoorTerrain } from './outdoorTerrainDerived'

describe('buildSteppedOutdoorTerrain', () => {
  it('creates raised cliff faces from higher cells to lower neighbors', () => {
    const result = buildSteppedOutdoorTerrain({
      '0:0': { cell: [0, 0], level: 1 },
    }, {})

    expect(result.topSurfaces).toContainEqual(expect.objectContaining({ cellKey: '0:0', worldY: 2 }))
    expect(result.cliffSides.length).toBe(4)
  })

  it('creates inward cliff faces around lowered pits', () => {
    const result = buildSteppedOutdoorTerrain({
      '0:0': { cell: [0, 0], level: -1 },
    }, {})

    expect(result.holeCells).toContainEqual([0, 0])
    expect(result.topSurfaces).toContainEqual(expect.objectContaining({ cellKey: '0:0', worldY: -2 }))
    expect(result.cliffSides).toEqual(expect.arrayContaining([
      expect.objectContaining({ cellKey: '0:-1', direction: 'south', worldY: -2 }),
      expect.objectContaining({ cellKey: '1:0', direction: 'west', worldY: -2 }),
      expect.objectContaining({ cellKey: '0:1', direction: 'north', worldY: -2 }),
      expect.objectContaining({ cellKey: '-1:0', direction: 'east', worldY: -2 }),
    ]))
  })

  it('stacks tall and short cliff segments for larger drops', () => {
    const result = buildSteppedOutdoorTerrain({
      '0:0': { cell: [0, 0], level: 3 },
    }, {})

    const northSegments = result.cliffSides.filter((segment) => (
      segment.cellKey === '0:0' && segment.direction === 'north'
    ))
    expect(northSegments).toHaveLength(2)
    expect(northSegments[0]).toMatchObject({ worldY: 0, tall: true })
    expect(northSegments[1]).toMatchObject({ worldY: 4, tall: false })
  })

  it('uses stepped top assets for flat cells that border elevation changes', () => {
    const result = buildSteppedOutdoorTerrain({
      '0:0': { cell: [0, 0], level: 1 },
    }, {})

    expect(result.topSurfaces).toEqual(expect.arrayContaining([
      expect.objectContaining({ cellKey: '0:0', usesSteppedAsset: true }),
      expect.objectContaining({ cellKey: '0:-1', usesSteppedAsset: true }),
      expect.objectContaining({ cellKey: '1:0', usesSteppedAsset: true }),
      expect.objectContaining({ cellKey: '0:1', usesSteppedAsset: true }),
      expect.objectContaining({ cellKey: '-1:0', usesSteppedAsset: true }),
    ]))
  })
})
