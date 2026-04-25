/**
 * Client-side BFS pathfinding on the painted-cell grid.
 * Used for movement path preview; the server runs its own authoritative BFS.
 */
import type { GridCell } from '../hooks/useSnapToGrid'
import { getCellKey } from '../hooks/useSnapToGrid'

const NEIGHBORS: GridCell[] = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
]

/**
 * Returns the shortest walkable path from `start` to `goal` (inclusive),
 * or null if no path exists within `maxSteps`.
 * `walkable` is the set of cell keys that can be traversed.
 */
export function bfsPath(
  start: GridCell,
  goal: GridCell,
  walkable: ReadonlySet<string>,
  maxSteps: number,
): GridCell[] | null {
  const startKey = getCellKey(start)
  const goalKey  = getCellKey(goal)

  if (startKey === goalKey) return [start]
  if (!walkable.has(goalKey)) return null

  const prev = new Map<string, string | null>()
  const queue: GridCell[] = [start]
  prev.set(startKey, null)

  while (queue.length > 0) {
    const current = queue.shift()!
    const currentKey = getCellKey(current)

    if (currentKey === goalKey) {
      // Reconstruct path
      const path: GridCell[] = []
      let k: string | null = goalKey
      while (k !== null) {
        const [x, z] = k.split(',').map(Number)
        path.unshift([x, z])
        k = prev.get(k) ?? null
      }
      return path
    }

    const depth = prev.size
    if (depth > maxSteps) break

    for (const [dx, dz] of NEIGHBORS) {
      const neighbor: GridCell = [current[0] + dx, current[1] + dz]
      const nKey = getCellKey(neighbor)
      if (!prev.has(nKey) && walkable.has(nKey)) {
        prev.set(nKey, currentKey)
        queue.push(neighbor)
      }
    }
  }

  return null
}

/** Build a walkable set from the store's paintedCells record keys. */
export function buildWalkableSet(paintedCellKeys: string[]): ReadonlySet<string> {
  return new Set(paintedCellKeys)
}
