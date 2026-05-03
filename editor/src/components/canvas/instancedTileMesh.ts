import * as THREE from 'three'
import type { ContentPackModelTransform } from '../../content-packs/types'
import {
  type CompatibleNodeMaterial,
  cloneMaterialWithNodeCompatibility,
  synchronizeCompatibleMaterialProperties,
} from '../../rendering/nodeMaterialUtils'
import { getWebGpuCompatibleGeometryTemplate } from './webgpuGeometry'
import type { TilePlacement } from './tileEntries'

export const TILE_PAGE_SIZE = 64

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

export type TileUploadRange = {
  start: number
  count: number
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
  capacity: number = TILE_PAGE_SIZE,
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
    const buildStartAttr = new THREE.InstancedBufferAttribute(new Float32Array(capacity).fill(-1), 1)
    const buildDelayAttr = new THREE.InstancedBufferAttribute(new Float32Array(capacity).fill(0), 1)
    const bakedLightDirAttr = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3).fill(0), 3)
    const bakedLightDirSecAttr = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3).fill(0), 3)
    const fogCellAttr = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 2).fill(0), 2)
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

    const instancedMesh = new THREE.InstancedMesh(geometry, material, capacity)
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
    const tintMesh = new THREE.InstancedMesh(geometry, tintMaterial, capacity)
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
 * Writes a single page slot in-place.
 */
export function writeInstancedMeshSlot(
  meshEntries: InstancedMeshEntry[],
  slotIndex: number,
  placement: TilePlacement | null,
): void {
  for (const entry of meshEntries) {
    const {
      instancedMesh,
      tintMesh,
      buildStartAttr,
      buildDelayAttr,
      bakedLightDirAttr,
      bakedLightDirSecAttr,
      fogCellAttr,
      baseTransform,
    } = entry

    if (placement) {
      _euler.set(...placement.rotation)
      _quat.setFromEuler(_euler)
      _pos.set(...placement.position)
      _scale.set(1, 1, 1)
      _placeMat.compose(_pos, _quat, _scale)
      _instanceMat.multiplyMatrices(_placeMat, baseTransform)
      instancedMesh.setMatrixAt(slotIndex, _instanceMat)
      tintMesh.setMatrixAt(slotIndex, _instanceMat)

      buildStartAttr.array[slotIndex] = placement.buildAnimationStart ?? -1
      buildDelayAttr.array[slotIndex] = placement.buildAnimationDelay ?? 0

      const lightDirection = placement.bakedLightDirection
      bakedLightDirAttr.array[slotIndex * 3] = lightDirection?.[0] ?? 0
      bakedLightDirAttr.array[slotIndex * 3 + 1] = lightDirection?.[1] ?? 0
      bakedLightDirAttr.array[slotIndex * 3 + 2] = lightDirection?.[2] ?? 0

      const secondaryDirection = placement.bakedLightDirectionSecondary
      bakedLightDirSecAttr.array[slotIndex * 3] = secondaryDirection?.[0] ?? 0
      bakedLightDirSecAttr.array[slotIndex * 3 + 1] = secondaryDirection?.[1] ?? 0
      bakedLightDirSecAttr.array[slotIndex * 3 + 2] = secondaryDirection?.[2] ?? 0

      const fogCell = placement.fogCell
      fogCellAttr.array[slotIndex * 2] = fogCell?.[0] ?? 0
      fogCellAttr.array[slotIndex * 2 + 1] = fogCell?.[1] ?? 0
      continue
    }

    _pos.set(0, 0, 0)
    _quat.identity()
    _scale.set(0, 0, 0)
    _placeMat.compose(_pos, _quat, _scale)
    _instanceMat.copy(_placeMat)
    instancedMesh.setMatrixAt(slotIndex, _instanceMat)
    tintMesh.setMatrixAt(slotIndex, _instanceMat)
    buildStartAttr.array[slotIndex] = -1
    buildDelayAttr.array[slotIndex] = 0
    bakedLightDirAttr.array[slotIndex * 3] = 0
    bakedLightDirAttr.array[slotIndex * 3 + 1] = 0
    bakedLightDirAttr.array[slotIndex * 3 + 2] = 0
    bakedLightDirSecAttr.array[slotIndex * 3] = 0
    bakedLightDirSecAttr.array[slotIndex * 3 + 1] = 0
    bakedLightDirSecAttr.array[slotIndex * 3 + 2] = 0
    fogCellAttr.array[slotIndex * 2] = 0
    fogCellAttr.array[slotIndex * 2 + 1] = 0
  }
}

export function setInstancedMeshEntryCount(
  meshEntries: InstancedMeshEntry[],
  count: number,
) {
  meshEntries.forEach((entry) => {
    entry.instancedMesh.count = count
    entry.tintMesh.count = count
  })
}

export function applyInstancedMeshUpdateRanges(
  meshEntries: InstancedMeshEntry[],
  ranges: TileUploadRange[],
) {
  meshEntries.forEach((entry) => {
    resetUpdateRanges(entry.instancedMesh.instanceMatrix)
    resetUpdateRanges(entry.tintMesh.instanceMatrix)
    resetUpdateRanges(entry.buildStartAttr)
    resetUpdateRanges(entry.buildDelayAttr)
    resetUpdateRanges(entry.bakedLightDirAttr)
    resetUpdateRanges(entry.bakedLightDirSecAttr)
    resetUpdateRanges(entry.fogCellAttr)

    ranges.forEach((range) => {
      addUpdateRange(entry.instancedMesh.instanceMatrix, range.start * 16, range.count * 16)
      addUpdateRange(entry.tintMesh.instanceMatrix, range.start * 16, range.count * 16)
      addUpdateRange(entry.buildStartAttr, range.start, range.count)
      addUpdateRange(entry.buildDelayAttr, range.start, range.count)
      addUpdateRange(entry.bakedLightDirAttr, range.start * 3, range.count * 3)
      addUpdateRange(entry.bakedLightDirSecAttr, range.start * 3, range.count * 3)
      addUpdateRange(entry.fogCellAttr, range.start * 2, range.count * 2)
    })

    entry.instancedMesh.instanceMatrix.needsUpdate = true
    entry.tintMesh.instanceMatrix.needsUpdate = true
    entry.buildStartAttr.needsUpdate = true
    entry.buildDelayAttr.needsUpdate = true
    entry.bakedLightDirAttr.needsUpdate = true
    entry.bakedLightDirSecAttr.needsUpdate = true
    entry.fogCellAttr.needsUpdate = true
  })
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

function addUpdateRange(attribute: THREE.BufferAttribute, start: number, count: number) {
  attribute.addUpdateRange(start, count)
}

function resetUpdateRanges(attribute: THREE.BufferAttribute) {
  attribute.clearUpdateRanges()
}
