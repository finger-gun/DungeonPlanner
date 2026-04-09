import { getCellKey, type GridCell } from '../hooks/useSnapToGrid'

const BUILD_DEPTH        = 3.0   // world units tiles emerge from below ground
const RISE_DURATION_MS   = 450   // ms each tile takes to rise to the surface
const MAX_STAGGER_MS     = 320   // max additional delay for the furthest cells
const CLEANUP_BUFFER_MS  = 200   // extra time after full animation before map cleanup

type AnimEntry = { delay: number; startedAt: number }

const registry = new Map<string, AnimEntry>()

/**
 * Schedule a build animation for a set of newly painted cells.
 *
 * @param cells      The cells that were just painted.
 * @param originCell The cascade origin — typically the stroke release corner
 *                   (opposite diagonal from where the drag started). Tiles here
 *                   appear first (delay=0); tiles near the drag start appear last.
 */
export function triggerBuild(cells: GridCell[], originCell: GridCell): void {
  if (cells.length === 0) return
  const now = performance.now()

  // Normalise: find the max Manhattan distance from the origin so delays scale to [0, MAX_STAGGER_MS]
  const maxDist = cells.reduce((max, cell) => {
    const d = Math.abs(cell[0] - originCell[0]) + Math.abs(cell[1] - originCell[1])
    return Math.max(max, d)
  }, 1)

  cells.forEach((cell) => {
    const d     = Math.abs(cell[0] - originCell[0]) + Math.abs(cell[1] - originCell[1])
    const delay = (d / maxDist) * MAX_STAGGER_MS
    registry.set(getCellKey(cell), { delay, startedAt: now })
  })
}

/**
 * Returns the Y-axis offset (always ≤ 0) that should be applied to a tile at this moment.
 * Returns 0 when there is no active animation for the given key.
 *
 * @param cellKey    The floor cell key (e.g. "3:5").
 * @param now        `performance.now()` — pass this once per useFrame call and share.
 * @param extraDelay Optional additional delay in ms (used by walls to trail their floor tile).
 */
export function getBuildYOffset(cellKey: string, now: number, extraDelay = 0): number {
  const entry = registry.get(cellKey)
  if (!entry) return 0

  const elapsed = now - entry.startedAt - entry.delay - extraDelay
  if (elapsed < 0) return -BUILD_DEPTH

  if (elapsed >= RISE_DURATION_MS) {
    if (elapsed >= RISE_DURATION_MS + MAX_STAGGER_MS + CLEANUP_BUFFER_MS) {
      registry.delete(cellKey)
    }
    return 0
  }

  // Cubic ease-out: rises quickly then settles smoothly
  const t = elapsed / RISE_DURATION_MS
  return -BUILD_DEPTH * Math.pow(1 - t, 3)
}

/** True when at least one build animation is still in progress. */
export function hasActiveBuildAnimations(): boolean {
  return registry.size > 0
}
