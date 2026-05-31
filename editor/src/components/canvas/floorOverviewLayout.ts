import { DEFAULT_SPLINE_WALL_HEIGHT } from '../../store/splineWalls'

export const SCENE_OVERVIEW_FLOOR_HEIGHT_UNIT = DEFAULT_SPLINE_WALL_HEIGHT

export function getSceneOverviewFloorY(level: number) {
  return level * SCENE_OVERVIEW_FLOOR_HEIGHT_UNIT
}
