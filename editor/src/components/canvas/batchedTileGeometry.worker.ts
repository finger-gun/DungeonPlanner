import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { ContentPackModelTransform } from '../../content-packs/types'
import {
  hydrateSerializedBufferGeometry,
  serializeBufferGeometry,
  getSerializedGeometryTransferables,
} from './batchedTileGeometrySerialization'
import type {
  BatchedTileWorkerGeometryMesh,
  BatchedTileWorkerRequest,
  BatchedTileWorkerResponse,
  BatchedTileWorkerSourceMesh,
} from './batchedTileGeometryWorkerTypes'
import type { BatchedTilePlacement } from './batchedTileGeometry'
import { createWebGpuCompatibleGeometry } from './webgpuGeometry'

type RuntimeSourceMesh = {
  key: string
  geometry: THREE.BufferGeometry
  matrixWorld: THREE.Matrix4
}

type WorkerScope = {
  addEventListener: (type: 'message', listener: (event: MessageEvent<unknown>) => void) => void
  postMessage: (message: unknown, transfer?: Transferable[]) => void
}

const workerScope = self as unknown as WorkerScope
const sourceMeshCache = new Map<string, RuntimeSourceMesh[]>()

// Module-level scratch objects to avoid per-placement allocations in hot paths.
const _placementMat4 = new THREE.Matrix4()
const _transformMat4 = new THREE.Matrix4()
const _posVec3 = new THREE.Vector3()
const _scaleVec3 = new THREE.Vector3()
const _rotQuat = new THREE.Quaternion()
const _rotEuler = new THREE.Euler()

workerScope.addEventListener('message', (event) => {
  const message = event.data as BatchedTileWorkerRequest
  if (message.type === 'register-source') {
    registerSourceMeshes(message.sourceKey, message.meshes)
    return
  }

  try {
    const meshes = buildMergedTileGeometryMeshesInWorker({
      sourceMeshes: sourceMeshCache.get(message.sourceKey) ?? [],
      placements: message.placements,
      transform: message.transform,
    })
    const result = {
      bucketKey: message.bucketKey,
      chunkKey: message.chunkKey,
      geometrySignature: message.geometrySignature,
      meshes,
    }
    const transferables = meshes.flatMap((mesh) => getSerializedGeometryTransferables(mesh.geometry))
    workerScope.postMessage({
      requestId: message.requestId,
      result,
    } satisfies BatchedTileWorkerResponse, transferables)
  } catch (error) {
    workerScope.postMessage({
      requestId: message.requestId,
      error: error instanceof Error ? error.message : String(error),
    } satisfies BatchedTileWorkerResponse)
  }
})

function registerSourceMeshes(sourceKey: string, meshes: BatchedTileWorkerSourceMesh[]) {
  const previousMeshes = sourceMeshCache.get(sourceKey)
  previousMeshes?.forEach((mesh) => mesh.geometry.dispose())

  sourceMeshCache.set(sourceKey, meshes.map((mesh) => ({
    key: mesh.key,
    geometry: hydrateSerializedBufferGeometry(mesh.geometry),
    matrixWorld: new THREE.Matrix4().fromArray(mesh.matrixWorld),
  })))
}

function buildMergedTileGeometryMeshesInWorker({
  sourceMeshes,
  placements,
  transform,
}: {
  sourceMeshes: RuntimeSourceMesh[]
  placements: BatchedTilePlacement[]
  transform?: ContentPackModelTransform
}) {
  const mergedMeshes: BatchedTileWorkerGeometryMesh[] = []
  if (placements.length === 0 || sourceMeshes.length === 0) {
    return mergedMeshes
  }

  const transformMatrix = getTransformMatrix(transform)
  sourceMeshes.forEach((sourceMesh) => {
    const geometries: THREE.BufferGeometry[] = []
    placements.forEach((placement) => {
      const geometry = createWebGpuCompatibleGeometry(
        sourceMesh.geometry,
        getPlacementMatrix(placement).multiply(transformMatrix).multiply(sourceMesh.matrixWorld),
      )
      // Always write animation attributes so every bucket uses the same GPU pipeline.
      // Non-animated tiles use -1 as a sentinel; the TSL shader treats buildStart < 0 as inactive.
      geometry.setAttribute(
        'buildAnimationStart',
        createRepeatedScalarAttribute(
          geometry.getAttribute('position').count,
          placement.buildAnimationStart ?? -1,
        ),
      )
      geometry.setAttribute(
        'buildAnimationDelay',
        createRepeatedScalarAttribute(
          geometry.getAttribute('position').count,
          placement.buildAnimationDelay ?? 0,
        ),
      )
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
      key: sourceMesh.key,
      sourceMeshKey: sourceMesh.key,
      geometry: serializeBufferGeometry(mergedGeometry),
    })
    mergedGeometry.dispose()
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

function createRepeatedScalarAttribute(count: number, value: number) {
  const array = new Float32Array(count)
  array.fill(value)
  return new THREE.Float32BufferAttribute(array, 1)
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

function getPlacementMatrix(placement: BatchedTilePlacement) {
  _rotEuler.set(...placement.rotation)
  _rotQuat.setFromEuler(_rotEuler)
  _posVec3.set(...placement.position)
  _scaleVec3.set(1, 1, 1)
  return _placementMat4.compose(_posVec3, _rotQuat, _scaleVec3)
}

function getTransformMatrix(transform?: ContentPackModelTransform) {
  const scale = resolveScale(transform?.scale)
  const pos = transform?.position ?? [0, 0, 0] as const
  const rot = transform?.rotation ?? [0, 0, 0] as const
  _rotEuler.set(...rot)
  _rotQuat.setFromEuler(_rotEuler)
  _posVec3.set(...pos)
  _scaleVec3.set(...scale)
  return _transformMat4.compose(_posVec3, _rotQuat, _scaleVec3)
}

function resolveScale(scale?: ContentPackModelTransform['scale']): [number, number, number] {
  if (typeof scale === 'number') {
    return [scale, scale, scale]
  }

  return scale ? [scale[0], scale[1], scale[2]] : [1, 1, 1]
}
