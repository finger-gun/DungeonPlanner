import { describe, expect, it } from 'vitest'
import {
  cellToWorldPosition,
  getCellKey,
  snapWorldPointToGrid,
} from './useSnapToGrid'

describe('snapWorldPointToGrid', () => {
  it('snaps positive world points into 2x2 cells', () => {
    expect(snapWorldPointToGrid({ x: 2.2, y: 0, z: 3.9 })).toEqual({
      cell: [1, 1],
      key: '1:1',
      position: [3, 0, 3],
    })
  })

  it('floors negative values consistently', () => {
    expect(snapWorldPointToGrid({ x: -0.2, y: 0, z: -2.01 })).toEqual({
      cell: [-1, -2],
      key: '-1:-2',
      position: [-1, 0, -3],
    })
  })

  it('exposes stable cell helpers', () => {
    expect(getCellKey([4, -3])).toBe('4:-3')
    expect(cellToWorldPosition([4, -3])).toEqual([9, 0, -5])
  })
})
