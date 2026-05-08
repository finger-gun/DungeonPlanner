import type { StorageBufferAttribute } from 'three/webgpu'
import {
  applySplineWallComputePrototypeTriangleCollapse,
  extractSplineWallComputePrototypeGeometry,
  type PreparedSplineWallComputePrototype,
} from './SplineWallComputePrototype'

export type SplineWallComputeRenderer = {
  compute?: (computeNode: unknown) => unknown
  computeAsync?: (computeNode: unknown) => Promise<unknown>
  getArrayBufferAsync: (attribute: StorageBufferAttribute) => Promise<ArrayBuffer>
}

export function canDispatchSplineWallComputePrototype(
  renderer: unknown,
): renderer is SplineWallComputeRenderer {
  return Boolean(
    renderer
    && typeof (renderer as SplineWallComputeRenderer).getArrayBufferAsync === 'function'
    && (
      typeof (renderer as SplineWallComputeRenderer).computeAsync === 'function'
      || typeof (renderer as SplineWallComputeRenderer).compute === 'function'
    ),
  )
}

export async function dispatchSplineWallComputePrototype(
  renderer: SplineWallComputeRenderer,
  prototype: PreparedSplineWallComputePrototype,
) {
  const { computeNode, collapseComputeNode } = prototype.dispatch
  if (!computeNode) {
    return extractSplineWallComputePrototypeGeometry(prototype.packed)
  }

  if (typeof renderer.computeAsync === 'function') {
    await renderer.computeAsync(computeNode as never)
    if (collapseComputeNode && prototype.packed.cutoutCount > 0) {
      await renderer.computeAsync(collapseComputeNode as never)
    }
  } else if (typeof renderer.compute === 'function') {
    renderer.compute(computeNode as never)
    if (collapseComputeNode && prototype.packed.cutoutCount > 0) {
      renderer.compute(collapseComputeNode as never)
    }
  }

  const [positionsBuffer, normalsBuffer, uvsBuffer, indicesBuffer] = await Promise.all([
    renderer.getArrayBufferAsync(prototype.dispatch.bufferAttributes.outputPositionData),
    renderer.getArrayBufferAsync(prototype.dispatch.bufferAttributes.outputNormalData),
    renderer.getArrayBufferAsync(prototype.dispatch.bufferAttributes.outputUvData),
    renderer.getArrayBufferAsync(prototype.dispatch.bufferAttributes.indexData),
  ])

  copyBufferIntoTypedArray(prototype.packed.buffers.outputPositionData.data, positionsBuffer)
  copyBufferIntoTypedArray(prototype.packed.buffers.outputNormalData.data, normalsBuffer)
  copyBufferIntoTypedArray(prototype.packed.buffers.outputUvData.data, uvsBuffer)
  copyBufferIntoTypedArray(prototype.packed.buffers.indexData.data, indicesBuffer)
  if (prototype.packed.cutoutCount > 0) {
    applySplineWallComputePrototypeTriangleCollapse(prototype.packed)
  }

  return extractSplineWallComputePrototypeGeometry(prototype.packed)
}

function copyBufferIntoTypedArray(
  target: Float32Array | Int32Array,
  arrayBuffer: ArrayBuffer,
) {
  const source = createMatchingView(target, arrayBuffer)
  target.fill(0)
  target.set(source.subarray(0, target.length))
}

function createMatchingView(
  target: Float32Array | Int32Array,
  arrayBuffer: ArrayBuffer,
) {
  if (target instanceof Int32Array) {
    return new Int32Array(arrayBuffer)
  }

  return new Float32Array(arrayBuffer)
}

export function cloneStorageBufferAttributeArray(attribute: StorageBufferAttribute) {
  const array = attribute.array
  if (array instanceof Int32Array) {
    return new Int32Array(array)
  }
  if (array instanceof Uint32Array) {
    return new Uint32Array(array)
  }
  return new Float32Array(array as Float32Array)
}
