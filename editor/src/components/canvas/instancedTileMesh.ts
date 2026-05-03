import * as THREE from 'three'
import type { ContentPackModelTransform } from '../../content-packs/types'
import {
  type CompatibleNodeMaterial,
  cloneMaterialWithNodeCompatibility,
  synchronizeCompatibleMaterialProperties,
} from '../../rendering/nodeMaterialUtils'
import type { BatchedTilePlacement } from './batchedTileGeometry'
import { getWebGpuCompatibleGeometryTemplate } from './webgpuGeometry'

// Maximum tiles per instanced bucket. Sized for a fully-packed 9×9 chunk of walls.
export const MAX_TILE_BUCKET_SIZE = 512

export type InstancedMeshEntry = {
  /** Identifies this entry within the bucket (meshIndex:uuid). */
  meshKey: string
  instancedMesh: THREE.InstancedMesh
  tintMesh: THREE.InstancedMesh
  /** Per-instance float (buildAnimationStart sentinel = -1 for non-animated). */
  buildStartAttr: THREE.InstancedBufferAttribute
  /** Per-instance float delay (ms). */
  buildDelayAttr: THREE.InstancedBufferAttribute
  /** Per-instance vec3 baked light direction (zeros = no directional light). */
  bakedLightDirAttr: THREE.InstancedBufferAttribute
  /** Per-instance vec3 secondary baked light direction. */
  bakedLightDirSecAttr: THREE.InstancedBufferAttribute
  /** Per-instance vec2 fog cell (x, z grid coords). */
  fogCellAttr: THREE.InstancedBufferAttribute
  /**
   * Pre-multiplied base transform for this source mesh:
   * `assetTransformMatrix * sourceMesh.matrixWorld`.
   * The per-instance matrix = `placementMatrix * baseTransform`.
   */
  baseTransform: THREE.Matrix4
  sourceMaterial: THREE.Material
}

// Module-level scratch objects — safe since updates run on the main thread only.
const _euler = new THREE.Euler()
const _quat = new THREE.Quaternion()
const _pos = new THREE.Vector3()
const _scale = new THREE.Vector3(1, 1, 1)
const _placeMat = new THREE.Matrix4()
const _instanceMat = new THREE.Matrix4()

const compatibleMaterialTemplateCache = new WeakMap<THREE.Material, THREE.Material>()

function createCompatibleMaterialCloneForInstanced(material: THREE.Material) {
  const cachedTemplate = compatibleMaterialTemplateCache.get(material)
  if (cachedTemplate) {
    const clone = cachedTemplate.clone()
    synchronizeCompatibleMaterialProperties(
      cachedTemplate as CompatibleNodeMaterial,
      clone as CompatibleNodeMaterial,
    )
    return clone
  }

  const template = cloneMaterialWithNodeCompatibility(material)
  compatibleMaterialTemplateCache.set(material, template)
  const clone = template.clone()
  synchronizeCompatibleMaterialProperties(
    template as CompatibleNodeMaterial,
    clone as CompatibleNodeMaterial,
  )
  return clone
}

function resolveTransformScale(scale?: ContentPackModelTransform['scale']): [number, number, number] {
  if (typeof scale === 'number') {
    return [scale, scale, scale]
  }

  return scale ? [scale[0], scale[1], scale[2]] : [1, 1, 1]
}

function buildAssetTransformMatrix(transform: ContentPackModelTransform | undefined): THREE.Matrix4 {
  const scale = resolveTransformScale(transform?.scale)
  const pos = transform?.position ?? [0, 0, 0] as const
  const rot = transform?.rotation ?? [0, 0, 0] as const
  _euler.set(...rot)
  _quat.setFromEuler(_euler)
  _pos.set(...pos)
  _scale.set(...scale)
  return new THREE.Matrix4().compose(_pos, _quat, _scale)
}

/**
 * Creates one `InstancedMeshEntry` per material in the source scene.
 * Each entry contains a pre-allocated `THREE.InstancedMesh` with
 * `InstancedBufferAttribute` slots for per-tile data (animation, light, fog).
 * The mesh objects are stable — they are updated in-place via
 * `updateInstancedMeshEntries` without ever being recreated.
 */
export function makeInstancedMeshEntries(
  sourceScene: THREE.Object3D,
  transform: ContentPackModelTransform | undefined,
): InstancedMeshEntry[] {
  sourceScene.updateWorldMatrix(true, true)
  const transformMatrix = buildAssetTransformMatrix(transform)
  const entries: InstancedMeshEntry[] = []
  let meshIndex = 0

  sourceScene.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.geometry) {
      return
    }

    const sourceMaterial = child.material instanceof THREE.Material ? child.material : null
    if (!sourceMaterial) {
      return
    }

    const geometry = getWebGpuCompatibleGeometryTemplate(child.geometry).clone()

    // InstancedBufferAttribute: one value per instance (step mode = instance).
    // TSL `attribute('name')` reads per-instance because InstancedBufferAttribute
    // sets meshPerAttribute > 1, which Three.js maps to step mode 'instance' in WebGPU.
    const buildStartAttr = new THREE.InstancedBufferAttribute(new Float32Array(MAX_TILE_BUCKET_SIZE).fill(-1), 1)
    const buildDelayAttr = new THREE.InstancedBufferAttribute(new Float32Array(MAX_TILE_BUCKET_SIZE).fill(0), 1)
    const bakedLightDirAttr = new THREE.InstancedBufferAttribute(new Float32Array(MAX_TILE_BUCKET_SIZE * 3).fill(0), 3)
    const bakedLightDirSecAttr = new THREE.InstancedBufferAttribute(new Float32Array(MAX_TILE_BUCKET_SIZE * 3).fill(0), 3)
    const fogCellAttr = new THREE.InstancedBufferAttribute(new Float32Array(MAX_TILE_BUCKET_SIZE * 2).fill(0), 2)
    buildStartAttr.setUsage(THREE.DynamicDrawUsage)
    buildDelayAttr.setUsage(THREE.DynamicDrawUsage)
    bakedLightDirAttr.setUsage(THREE.DynamicDrawUsage)
    bakedLightDirSecAttr.setUsage(THREE.DynamicDrawUsage)
    fogCellAttr.setUsage(THREE.DynamicDrawUsage)

    geometry.setAttribute('buildAnimationStart', buildStartAttr)
    geometry.setAttribute('buildAnimationDelay', buildDelayAttr)
    geometry.setAttribute('bakedLightDirection', bakedLightDirAttr)
    geometry.setAttribute('bakedLightDirectionSecondary', bakedLightDirSecAttr)
    geometry.setAttribute('fogCell', fogCellAttr)

    const material = createCompatibleMaterialCloneForInstanced(sourceMaterial)

    const instancedMesh = new THREE.InstancedMesh(geometry, material, MAX_TILE_BUCKET_SIZE)
    instancedMesh.count = 0
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    // Always cast shadow — avoids a second pipeline variant when animation ends.
    instancedMesh.castShadow = true
    instancedMesh.receiveShadow = true
    instancedMesh.frustumCulled = false

    // Tint mesh for "explored" overlay (same geometry, simple tint material).
    const tintMaterial = new THREE.MeshBasicMaterial({
      color: '#050609',
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    })
    const tintMesh = new THREE.InstancedMesh(geometry, tintMaterial, MAX_TILE_BUCKET_SIZE)
    tintMesh.count = 0
    tintMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    tintMesh.renderOrder = 1
    tintMesh.frustumCulled = false
    tintMesh.userData.ignoreLosRaycast = true
    tintMesh.raycast = () => {}

    // baseTransform = assetTransformMatrix * sourceMesh.matrixWorld
    const baseTransform = new THREE.Matrix4().multiplyMatrices(transformMatrix, child.matrixWorld)

    entries.push({
      meshKey: `${meshIndex}:${child.uuid}`,
      instancedMesh,
      tintMesh,
      buildStartAttr,
      buildDelayAttr,
      bakedLightDirAttr,
      bakedLightDirSecAttr,
      fogCellAttr,
      baseTransform,
      sourceMaterial,
    })

    meshIndex++
  })

  return entries
}

/**
 * Updates instance matrices and per-instance attribute data in-place.
 * This is O(n) in the number of placements and does NOT upload the full geometry.
 * Only the changed attribute sub-ranges are marked dirty.
 */
export function updateInstancedMeshEntries(
  meshEntries: InstancedMeshEntry[],
  placements: BatchedTilePlacement[],
): void {
  const count = Math.min(placements.length, MAX_TILE_BUCKET_SIZE)

  for (const entry of meshEntries) {
    const { instancedMesh, tintMesh, buildStartAttr, buildDelayAttr, bakedLightDirAttr, bakedLightDirSecAttr, fogCellAttr, baseTransform } = entry

    for (let i = 0; i < count; i++) {
      const p = placements[i]!

      // Instance matrix = placementMatrix * baseTransform
      _euler.set(...p.rotation)
      _quat.setFromEuler(_euler)
      _pos.set(...p.position)
      _scale.set(1, 1, 1)
      _placeMat.compose(_pos, _quat, _scale)
      _instanceMat.multiplyMatrices(_placeMat, baseTransform)
      instancedMesh.setMatrixAt(i, _instanceMat)
      tintMesh.setMatrixAt(i, _instanceMat)

      buildStartAttr.array[i] = p.buildAnimationStart ?? -1
      buildDelayAttr.array[i] = p.buildAnimationDelay ?? 0

      const ld = p.bakedLightDirection
      if (ld) {
        bakedLightDirAttr.array[i * 3] = ld[0]
        bakedLightDirAttr.array[i * 3 + 1] = ld[1]
        bakedLightDirAttr.array[i * 3 + 2] = ld[2]
      } else {
        bakedLightDirAttr.array[i * 3] = 0
        bakedLightDirAttr.array[i * 3 + 1] = 0
        bakedLightDirAttr.array[i * 3 + 2] = 0
      }

      const lds = p.bakedLightDirectionSecondary
      if (lds) {
        bakedLightDirSecAttr.array[i * 3] = lds[0]
        bakedLightDirSecAttr.array[i * 3 + 1] = lds[1]
        bakedLightDirSecAttr.array[i * 3 + 2] = lds[2]
      } else {
        bakedLightDirSecAttr.array[i * 3] = 0
        bakedLightDirSecAttr.array[i * 3 + 1] = 0
        bakedLightDirSecAttr.array[i * 3 + 2] = 0
      }

      const fc = p.fogCell
      if (fc) {
        fogCellAttr.array[i * 2] = fc[0]
        fogCellAttr.array[i * 2 + 1] = fc[1]
      }
    }

    instancedMesh.count = count
    tintMesh.count = count
    instancedMesh.instanceMatrix.needsUpdate = true
    tintMesh.instanceMatrix.needsUpdate = true
    buildStartAttr.needsUpdate = true
    buildDelayAttr.needsUpdate = true
    bakedLightDirAttr.needsUpdate = true
    bakedLightDirSecAttr.needsUpdate = true
    fogCellAttr.needsUpdate = true
  }
}

/** Disposes geometry, materials, and overlay resources owned by this bucket. */
export function disposeInstancedMeshEntries(meshEntries: InstancedMeshEntry[]): void {
  for (const entry of meshEntries) {
    entry.instancedMesh.geometry.dispose()
    const instancedMaterial = entry.instancedMesh.material
    if (Array.isArray(instancedMaterial)) {
      instancedMaterial.forEach((material) => material.dispose())
    } else {
      instancedMaterial.dispose()
    }
    const tintMat = entry.tintMesh.material
    if (Array.isArray(tintMat)) {
      tintMat.forEach((m) => m.dispose())
    } else {
      tintMat.dispose()
    }
  }
}
