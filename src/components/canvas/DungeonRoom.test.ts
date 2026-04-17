import { describe, expect, it } from 'vitest'
import { deriveWallCornersFromSegments } from './wallCornerLayout'

describe('deriveWallCornersFromSegments', () => {
  it('creates passage-end corners from surviving orthogonal wall segments', () => {
    const corners = deriveWallCornersFromSegments([
      { key: '0:0:north' },
      { key: '0:0:west' },
      { key: '2:0:north' },
      { key: '3:0:west' },
    ])

    expect(corners).toHaveLength(2)
    expect(corners).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: '0:1:corner',
          wallKeys: expect.arrayContaining(['0:0:north', '0:0:west']),
          position: [0, 0, 2],
        }),
        expect.objectContaining({
          key: '3:1:corner',
          wallKeys: expect.arrayContaining(['2:0:north', '3:0:west']),
          position: [6, 0, 2],
        }),
      ]),
    )
  })

  it('does not create corners for straight wall runs', () => {
    const corners = deriveWallCornersFromSegments([
      { key: '0:0:north' },
      { key: '1:0:north' },
    ])

    expect(corners).toHaveLength(0)
  })
})
