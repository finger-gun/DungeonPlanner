import { describe, expect, it } from 'vitest'
import { GRID_SIZE } from '../hooks/useSnapToGrid'
import { buildPaintedAreaRoomPreview } from './freehandRoomPaint'

describe('freehandRoomPaint', () => {
  it('keeps a single dab circular instead of snapping it to one tile', () => {
    const preview = buildPaintedAreaRoomPreview([[GRID_SIZE, GRID_SIZE]])

    expect(preview).not.toBeNull()
    expect(preview!.points.length).toBeGreaterThanOrEqual(8)
    expect(preview!.splineNodes.some((node) =>
      node.position[0] % 1 !== 0 || node.position[1] % 1 !== 0,
    )).toBe(true)
  })

  it('builds the spline from the boundary of the painted brush area, not from the mouse centerline', () => {
    const preview = buildPaintedAreaRoomPreview([
      [0, 0],
      [GRID_SIZE * 2, 0],
      [GRID_SIZE * 2, GRID_SIZE * 2],
      [0, GRID_SIZE * 2],
      [0, 0],
    ])

    expect(preview).not.toBeNull()
    expect(preview!.cells.length).toBeGreaterThan(4)
    expect(preview!.points.length).toBeGreaterThan(4)
    expect(preview!.splineNodes).toHaveLength(preview!.points.length)
  })

  it('smooths swept brush outlines instead of committing raster stair steps as authored corners', () => {
    const preview = buildPaintedAreaRoomPreview([
      [0, 0],
      [GRID_SIZE * 5, 0],
      [GRID_SIZE * 8, GRID_SIZE * 3],
    ])

    expect(preview).not.toBeNull()
    expect(preview!.points.length).toBeLessThan(20)
    expect(preview!.splineNodes.every((node) => node.cornerMode === 'square')).toBe(true)
    expect(preview!.splineNodes.every((node) => node.cornerAmount === 0)).toBe(true)
  })

  it('preserves local bends on long free-painted cave strokes', () => {
    const stroke = Array.from({ length: 80 }, (_, index) => [
      index * GRID_SIZE * 0.25,
      Math.sin(index * 0.35) * GRID_SIZE * 1.5,
    ] as const)
    const preview = buildPaintedAreaRoomPreview(stroke)

    expect(preview).not.toBeNull()
    expect(preview!.points.length).toBeGreaterThan(40)
    expect(preview!.points.length).toBeLessThan(140)
  })

  it('preserves separate outer and inner outlines for looped brush strokes', () => {
    const preview = buildPaintedAreaRoomPreview([
      [0, 0],
      [GRID_SIZE * 4, 0],
      [GRID_SIZE * 4, GRID_SIZE * 4],
      [0, GRID_SIZE * 4],
      [0, 0],
    ])

    expect(preview).not.toBeNull()
    expect(preview!.paths.length).toBeGreaterThan(1)
    expect(preview!.splinePaths).toHaveLength(preview!.paths.length)
  })
})
