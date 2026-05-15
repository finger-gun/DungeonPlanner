import type { PreparedFloorLightComputePrototype } from './FloorLightComputePrototype'

/**
 * Runtime dispatch helpers for the floor light GPU compute prototype.
 *
 * These helpers isolate renderer capability detection from the rest of the
 * lightfield pipeline so callers can safely dispatch against renderers that
 * may expose either synchronous or asynchronous compute APIs.
 */
export type FloorLightComputeRenderer = {
  compute?: (node: unknown) => unknown
  computeAsync?: (node: unknown) => Promise<unknown>
}

/**
 * Type guard for renderers that can execute a prototype compute node.
 *
 * Checks for either the synchronous `compute` API or the asynchronous
 * `computeAsync` API exposed by the current Three/WebGPU renderer instance.
 */
export function canDispatchFloorLightComputePrototype(
  renderer: unknown,
): renderer is FloorLightComputeRenderer {
  return Boolean(
    renderer
    && (
      typeof (renderer as FloorLightComputeRenderer).compute === 'function'
      || typeof (renderer as FloorLightComputeRenderer).computeAsync === 'function'
    ),
  )
}

/**
 * Dispatches a prepared compute prototype using the best renderer API available.
 *
 * Prefers `computeAsync` when supported so callers can await GPU submission, and
 * falls back to synchronous `compute` for renderers that only expose the older API.
 */
export async function dispatchFloorLightComputePrototype(
  renderer: FloorLightComputeRenderer,
  prototype: PreparedFloorLightComputePrototype,
) {
  const computeNode = prototype.dispatch.computeNode
  if (!computeNode) {
    return false
  }

  if (typeof renderer.computeAsync === 'function') {
    await renderer.computeAsync(computeNode)
    return true
  }

  if (typeof renderer.compute === 'function') {
    renderer.compute(computeNode)
    return true
  }

  return false
}
