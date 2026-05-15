import * as THREE from 'three'

const webGpuGeometryTemplateCache = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>()

export function createWebGpuCompatibleGeometry(
  sourceGeometry: THREE.BufferGeometry,
  transform: THREE.Matrix4,
) {
  const geometry = getWebGpuCompatibleGeometryTemplate(sourceGeometry).clone()
  geometry.applyMatrix4(transform)
  return geometry
}

export function getWebGpuCompatibleGeometryTemplate(sourceGeometry: THREE.BufferGeometry) {
  const cached = webGpuGeometryTemplateCache.get(sourceGeometry)
  if (cached) {
    return cached
  }

  const geometry = sourceGeometry.clone()
  normalizeGeometryAttributesForWebGpu(geometry)
  webGpuGeometryTemplateCache.set(sourceGeometry, geometry)
  return geometry
}

export function normalizeGeometryAttributesForWebGpu(geometry: THREE.BufferGeometry) {
  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    if (!(attribute instanceof THREE.BufferAttribute || attribute instanceof THREE.InterleavedBufferAttribute)) {
      continue
    }

    const needsFloat32Copy =
      attribute.normalized ||
      attribute instanceof THREE.InterleavedBufferAttribute ||
      !(attribute.array instanceof Float32Array)

    if (!needsFloat32Copy) {
      continue
    }

    const normalized = new THREE.Float32BufferAttribute(attribute.count * attribute.itemSize, attribute.itemSize)
    normalized.name = attribute.name

    for (let index = 0; index < attribute.count; index += 1) {
      normalized.setX(index, attribute.getX(index))
      if (attribute.itemSize > 1) {
        normalized.setY(index, attribute.getY(index))
      }
      if (attribute.itemSize > 2) {
        normalized.setZ(index, attribute.getZ(index))
      }
      if (attribute.itemSize > 3) {
        normalized.setW(index, attribute.getW(index))
      }
    }

    geometry.setAttribute(name, normalized)
  }

  return geometry
}
