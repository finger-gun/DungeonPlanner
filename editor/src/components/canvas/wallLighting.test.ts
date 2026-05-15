import { describe, expect, it } from 'vitest'
import { getCornerInteriorLightDirections, getWallInteriorLightDirection, getWallSpanInteriorLightDirections } from './wallLighting'

describe('wallLighting', () => {
  it('maps wall keys to inward-facing light directions', () => {
    expect(getWallInteriorLightDirection('3:4:north')).toEqual([0, 0, -1])
    expect(getWallInteriorLightDirection('3:4:south')).toEqual([0, 0, 1])
    expect(getWallInteriorLightDirection('3:4:east')).toEqual([-1, 0, 0])
    expect(getWallInteriorLightDirection('3:4:west')).toEqual([1, 0, 0])
  })

  it('deduplicates corner wall directions while keeping order', () => {
    expect(
      getCornerInteriorLightDirections([
        '1:1:north',
        '1:1:west',
        '1:1:north',
      ]),
    ).toEqual({
      primary: [0, 0, -1],
      secondary: [1, 0, 0],
    })
  })

  it('adds both interior directions for shared wall spans', () => {
    expect(getWallSpanInteriorLightDirections(
      ['1:1:east'],
      {
        '1:1': { cell: [1, 1], layerId: 'default', roomId: 'left' },
        '2:1': { cell: [2, 1], layerId: 'default', roomId: 'right' },
      },
    )).toEqual({
      primary: [-1, 0, 0],
      secondary: [1, 0, 0],
    })
  })
})
