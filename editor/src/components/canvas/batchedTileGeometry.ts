import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { ContentPackModelTransform } from '../../content-packs/types'
import { cloneMaterialWithNodeCompatibility } from '../../rendering/nodeMaterialUtils'
import { createWebGpuCompatibleGeometry } from './webgpuGeometry'

export type BatchedTilePlacement = {
  key: string
  position: readonly [number, number, number]
  rotation: readonly [number, number, number]
  bakedLight?: readonly [number, number, number]
  bakedLightDirection?: readonly [number, number, number]
  bakedLightDirectionSecondary?: readonly [number, number, number]
  fogCell?: readonly [number, number]
}

export type BatchedTileGeometryMesh = {
  key: string
  geometry: THREE.BufferGeometry
  material: THREE.Material
}

export function buildMergedTileGeometryMeshes({
  sourceScene,
  placements,
  transform,
}: {
  sourceScene: THREE.Object3D
  placements: BatchedTilePlacement[]
  transform?: ContentPackModelTransform
}) {
  const mergedMeshes: BatchedTileGeometryMesh[] = []
  if (placements.length === 0) {
    return mergedMeshes
  }

  const transformMatrix = getTransformMatrix(transform)
  sourceScene.updateWorldMatrix(true, true)

  const sourceMeshes = Array.from(iterateBatchableMeshes(sourceScene))
  sourceMeshes.forEach(({ material, mesh: sourceMesh }, meshIndex) => {
    const geometries: THREE.BufferGeometry[] = []
    placements.forEach((placement) => {
      const geometry = createWebGpuCompatibleGeometry(
        sourceMesh.geometry,
        getPlacementMatrix(placement).multiply(transformMatrix).multiply(sourceMesh.matrixWorld),
      )
      if (placement.bakedLight) {
        geometry.setAttribute(
          'bakedLight',
          createRepeatedVector3Attribute(geometry.getAttribute('position').count, placement.bakedLight),
        )
      }
      if (placement.bakedLightDirection) {
        geometry.setAttribute(
          'bakedLightDirection',
          createRepeatedVector3Attribute(geometry.getAttribute('position').count, placement.bakedLightDirection),
        )
      }
      if (placement.bakedLightDirectionSecondary) {
        geometry.setAttribute(
          'bakedLightDirectionSecondary',
          createRepeatedVector3Attribute(
            geometry.getAttribute('position').count,
            placement.bakedLightDirectionSecondary,
          ),
        )
      }
      if (placement.fogCell) {
        geometry.setAttribute(
          'fogCell',
          createRepeatedVector2Attribute(geometry.getAttribute('position').count, placement.fogCell),
        )
      }
      geometries.push(geometry)
    })

    const mergedGeometry = mergeGeometries(geometries, false)
    geometries.forEach((geometry) => geometry.dispose())
    if (!mergedGeometry) {
      return
    }

      mergedMeshes.push({
        key: `${meshIndex}:${sourceMesh.uuid}`,
        geometry: mergedGeometry,
        material: cloneMaterialWithNodeCompatibility(material),
      })
    })

  return mergedMeshes
}

function createRepeatedVector2Attribute(count: number, value: readonly [number, number]) {
  const array = new Float32Array(count * 2)
  for (let index = 0; index < count; index += 1) {
    array[index * 2] = value[0]
    array[index * 2 + 1] = value[1]
  }

  return new THREE.Float32BufferAttribute(array, 2)
}

function createRepeatedVector3Attribute(count: number, value: readonly [number, number, number]) {
  const array = new Float32Array(count * 3)
  for (let index = 0; index < count; index += 1) {
    array[index * 3] = value[0]
    array[index * 3 + 1] = value[1]
    array[index * 3 + 2] = value[2]
  }

  return new THREE.Float32BufferAttribute(array, 3)
}

function * iterateBatchableMeshes(root: THREE.Object3D) {
  const meshes: Array<{ mesh: THREE.Mesh, material: THREE.Material }> = []
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.geometry) {
      return
    }

    if (child.material instanceof THREE.Material) {
      meshes.push({ mesh: child, material: child.material })
    }
  })
  yield * meshes
}

function getPlacementMatrix(placement: BatchedTilePlacement) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(...placement.position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...placement.rotation)),
    new THREE.Vector3(1, 1, 1),
  )
}

function getTransformMatrix(transform?: ContentPackModelTransform) {
  const scale = resolveScale(transform?.scale)
  return new THREE.Matrix4().compose(
    new THREE.Vector3(...(transform?.position ?? [0, 0, 0])),
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(...(transform?.rotation ?? [0, 0, 0])),
    ),
    new THREE.Vector3(...scale),
  )
}

function resolveScale(scale?: ContentPackModelTransform['scale']): [number, number, number] {
  if (typeof scale === 'number') {
    return [scale, scale, scale]
  }

  return scale ? [scale[0], scale[1], scale[2]] : [1, 1, 1]
}
