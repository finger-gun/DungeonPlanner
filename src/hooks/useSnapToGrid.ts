import type { Vector3Tuple } from 'three'

export const GRID_SIZE = 2

export type GridCell = [x: number, z: number]

export type Vector3Like = {
  x: number
  y: number
  z: number
}

export type SnappedGridPosition = {
  cell: GridCell
  key: string
  position: Vector3Tuple
}

export function getCellKey(cell: GridCell) {
  return `${cell[0]}:${cell[1]}`
}

export function cellToWorldPosition(
  cell: GridCell,
  gridSize = GRID_SIZE,
): Vector3Tuple {
  return [(cell[0] + 0.5) * gridSize, 0, (cell[1] + 0.5) * gridSize]
}

export function getRectangleCells(
  startCell: GridCell,
  endCell: GridCell,
): GridCell[] {
  const cells: GridCell[] = []
  const xStep = endCell[0] >= startCell[0] ? 1 : -1
  const zStep = endCell[1] >= startCell[1] ? 1 : -1

  for (
    let z = startCell[1];
    zStep > 0 ? z <= endCell[1] : z >= endCell[1];
    z += zStep
  ) {
    for (
      let x = startCell[0];
      xStep > 0 ? x <= endCell[0] : x >= endCell[0];
      x += xStep
    ) {
      cells.push([x, z])
    }
  }

  return cells
}

export function snapWorldPointToGrid(
  point: Vector3Like,
  gridSize = GRID_SIZE,
): SnappedGridPosition {
  const cell: GridCell = [
    Math.floor(point.x / gridSize),
    Math.floor(point.z / gridSize),
  ]

  return {
    cell,
    key: getCellKey(cell),
    position: cellToWorldPosition(cell, gridSize),
  }
}

export function useSnapToGrid(gridSize = GRID_SIZE) {
  return {
    gridSize,
    snap(point: Vector3Like) {
      return snapWorldPointToGrid(point, gridSize)
    },
  }
}
