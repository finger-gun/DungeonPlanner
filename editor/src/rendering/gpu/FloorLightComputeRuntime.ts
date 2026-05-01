import type { PreparedFloorLightComputePrototype } from './FloorLightComputePrototype'

export type FloorLightComputeRenderer = {
  compute?: (node: unknown) => unknown
  computeAsync?: (node: unknown) => Promise<unknown>
}

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
