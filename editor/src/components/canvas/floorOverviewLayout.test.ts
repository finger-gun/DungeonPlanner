import { describe, expect, it } from 'vitest'
import { DEFAULT_SPLINE_WALL_HEIGHT } from '../../store/splineWalls'
import { getSceneOverviewFloorY } from './floorOverviewLayout'

describe('getSceneOverviewFloorY', () => {
  it('stacks adjacent scene overview floors at the spline wall height', () => {
    expect(getSceneOverviewFloorY(1) - getSceneOverviewFloorY(0)).toBeCloseTo(
      DEFAULT_SPLINE_WALL_HEIGHT,
    )
    expect(getSceneOverviewFloorY(0) - getSceneOverviewFloorY(-1)).toBeCloseTo(
      DEFAULT_SPLINE_WALL_HEIGHT,
    )
  })
})
