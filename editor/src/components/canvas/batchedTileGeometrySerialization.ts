import * as THREE from 'three'
import type {
  SerializedGeometry,
  SerializedGeometryArray,
  SerializedGeometryAttribute,
} from './batchedTileGeometryWorkerTypes'

type SerializableAttribute = THREE.BufferAttribute | THREE.InterleavedBufferAttribute

export function serializeBufferGeometry(geometry: THREE.BufferGeometry): SerializedGeometry {
  const attributes: SerializedGeometryAttribute[] = []
  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    if (!isSerializableAttribute(attribute)) {
      continue
    }

    attributes.push({
      name,
      array: copyAttributeArray(attribute),
      itemSize: attribute.itemSize,
      normalized: attribute.normalized,
    })
  }

  return {
    attributes,
    index: geometry.index
      ? {
        array: copyIndexArray(geometry.index),
      }
      : null,
  }
}

export function hydrateSerializedBufferGeometry(serialized: SerializedGeometry) {
  const geometry = new THREE.BufferGeometry()
  serialized.attributes.forEach((attribute) => {
    geometry.setAttribute(
      attribute.name,
      new THREE.BufferAttribute(attribute.array, attribute.itemSize, attribute.normalized),
    )
  })
  if (serialized.index) {
    geometry.setIndex(new THREE.BufferAttribute(serialized.index.array, 1))
  }
  return geometry
}

export function getSerializedGeometryTransferables(serialized: SerializedGeometry): Transferable[] {
  const transferables: Transferable[] = []
  const seenBuffers = new Set<ArrayBufferLike>()
  serialized.attributes.forEach((attribute) => {
    addBufferTransferable(attribute.array.buffer, transferables, seenBuffers)
  })
  if (serialized.index) {
    addBufferTransferable(serialized.index.array.buffer, transferables, seenBuffers)
  }
  return transferables
}

function addBufferTransferable(
  buffer: ArrayBufferLike,
  transferables: Transferable[],
  seenBuffers: Set<ArrayBufferLike>,
) {
  if (buffer instanceof SharedArrayBuffer || seenBuffers.has(buffer)) {
    return
  }

  seenBuffers.add(buffer)
  transferables.push(buffer)
}

function isSerializableAttribute(attribute: unknown): attribute is SerializableAttribute {
  return attribute instanceof THREE.BufferAttribute || attribute instanceof THREE.InterleavedBufferAttribute
}

function copyAttributeArray(attribute: SerializableAttribute): SerializedGeometryArray {
  if (attribute instanceof THREE.BufferAttribute && isSerializedGeometryArray(attribute.array)) {
    return attribute.array.slice() as SerializedGeometryArray
  }

  const array = new Float32Array(attribute.count * attribute.itemSize)
  for (let index = 0; index < attribute.count; index += 1) {
    array[index * attribute.itemSize] = attribute.getX(index)
    if (attribute.itemSize > 1) {
      array[index * attribute.itemSize + 1] = attribute.getY(index)
    }
    if (attribute.itemSize > 2) {
      array[index * attribute.itemSize + 2] = attribute.getZ(index)
    }
    if (attribute.itemSize > 3) {
      array[index * attribute.itemSize + 3] = attribute.getW(index)
    }
  }
  return array
}

function copyIndexArray(index: THREE.BufferAttribute): Uint16Array | Uint32Array {
  if (index.array instanceof Uint16Array || index.array instanceof Uint32Array) {
    return index.array.slice()
  }

  const maxIndex = getMaxIndex(index)
  const array = maxIndex > 65535
    ? new Uint32Array(index.count)
    : new Uint16Array(index.count)
  for (let itemIndex = 0; itemIndex < index.count; itemIndex += 1) {
    array[itemIndex] = index.getX(itemIndex)
  }
  return array
}

function getMaxIndex(index: THREE.BufferAttribute) {
  let maxIndex = 0
  for (let itemIndex = 0; itemIndex < index.count; itemIndex += 1) {
    maxIndex = Math.max(maxIndex, index.getX(itemIndex))
  }
  return maxIndex
}

function isSerializedGeometryArray(array: ArrayLike<number>): array is SerializedGeometryArray {
  return array instanceof Float32Array
    || array instanceof Uint8Array
    || array instanceof Uint16Array
    || array instanceof Uint32Array
    || array instanceof Int8Array
    || array instanceof Int16Array
    || array instanceof Int32Array
}
