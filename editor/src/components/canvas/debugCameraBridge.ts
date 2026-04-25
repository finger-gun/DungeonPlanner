export type DebugCameraPose = {
  position: readonly [number, number, number]
  target: readonly [number, number, number]
}

let getDebugCameraPoseReader: null | (() => DebugCameraPose) = null
let getDebugWorldProjector: null | ((point: readonly [number, number, number]) => { x: number; y: number } | null) = null

export function registerDebugCameraPoseReader(reader: null | (() => DebugCameraPose)) {
  getDebugCameraPoseReader = reader
}

export function registerDebugWorldProjector(
  projector: null | ((point: readonly [number, number, number]) => { x: number; y: number } | null),
) {
  getDebugWorldProjector = projector
}

export function getDebugCameraPose() {
  return getDebugCameraPoseReader?.() ?? null
}

export function projectDebugWorldPoint(point: readonly [number, number, number]) {
  return getDebugWorldProjector?.(point) ?? null
}
