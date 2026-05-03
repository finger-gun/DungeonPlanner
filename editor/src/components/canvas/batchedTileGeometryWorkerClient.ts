import * as THREE from 'three'
import type { ContentPackModelTransform } from '../../content-packs/types'
import {
  buildMergedTileGeometryMeshes,
  createCompatibleMaterialClone,
  type BatchedTileGeometryMesh,
  type BatchedTilePlacement,
} from './batchedTileGeometry'
import {
  hydrateSerializedBufferGeometry,
  serializeBufferGeometry,
  getSerializedGeometryTransferables,
} from './batchedTileGeometrySerialization'
import type {
  BatchedTileWorkerGeometryResult,
  BatchedTileWorkerResponse,
  BatchedTileWorkerSourceMesh,
} from './batchedTileGeometryWorkerTypes'
import { getWebGpuCompatibleGeometryTemplate } from './webgpuGeometry'

type WorkerBuildInput = {
  bucketKey: string
  chunkKey: string
  sourceScene: THREE.Object3D
  placements: BatchedTilePlacement[]
  transform?: ContentPackModelTransform
  geometrySignature: string
}

type SourceRegistration = {
  sourceKey: string
  materialsByMeshKey: Map<string, THREE.Material>
}

export type BatchedTileWorkerBuildProduct = {
  result: BatchedTileWorkerGeometryResult
  materialsByMeshKey: Map<string, THREE.Material>
}

type PendingWorkerRequest = {
  resolve: (result: BatchedTileWorkerGeometryResult) => void
  reject: (error: Error) => void
}

let worker: Worker | null = null
let nextRequestId = 1
const pendingRequests = new Map<number, PendingWorkerRequest>()
const registeredSourceKeys = new Set<string>()
const sourceRegistrations = new WeakMap<THREE.Object3D, SourceRegistration>()
const disabledSourceScenes = new WeakSet<THREE.Object3D>()

export async function buildMergedTileGeometryMeshesOffThread({
  bucketKey,
  chunkKey,
  sourceScene,
  placements,
  transform,
  geometrySignature,
}: WorkerBuildInput): Promise<BatchedTileGeometryMesh[] | null> {
  const product = await requestMergedTileGeometryBuildOffThread({
    bucketKey,
    chunkKey,
    sourceScene,
    placements,
    transform,
    geometrySignature,
  })
  return product ? hydrateMergedTileGeometryWorkerProduct(product) : null
}

export async function requestMergedTileGeometryBuildOffThread({
  bucketKey,
  chunkKey,
  sourceScene,
  placements,
  transform,
  geometrySignature,
}: WorkerBuildInput): Promise<BatchedTileWorkerBuildProduct | null> {
  if (typeof Worker === 'undefined' || disabledSourceScenes.has(sourceScene)) {
    return null
  }

  const activeWorker = getOrCreateWorker()
  if (!activeWorker) {
    return null
  }

  const registration = registerSourceScene(activeWorker, sourceScene)
  if (!registration) {
    disabledSourceScenes.add(sourceScene)
    return null
  }

  const requestId = nextRequestId
  nextRequestId += 1
  const result = await new Promise<BatchedTileWorkerGeometryResult>((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject })
    activeWorker.postMessage({
      type: 'build',
      requestId,
      bucketKey,
      chunkKey,
      sourceKey: registration.sourceKey,
      placements: placements.map(toWorkerPlacement),
      transform,
      geometrySignature,
    })
  })

  return {
    result,
    materialsByMeshKey: registration.materialsByMeshKey,
  }
}

export function hydrateMergedTileGeometryWorkerProduct(
  product: BatchedTileWorkerBuildProduct,
): BatchedTileGeometryMesh[] {
  return product.result.meshes.map((mesh) => {
    const sourceMaterial = product.materialsByMeshKey.get(mesh.sourceMeshKey)
    if (!sourceMaterial) {
      throw new Error(`Missing source material for merged tile mesh "${mesh.sourceMeshKey}".`)
    }

    return {
      key: mesh.key,
      geometry: hydrateSerializedBufferGeometry(mesh.geometry),
      material: createCompatibleMaterialClone(sourceMaterial),
    }
  })
}

function toWorkerPlacement(placement: BatchedTilePlacement): BatchedTilePlacement {
  return {
    key: placement.key,
    position: placement.position,
    rotation: placement.rotation,
    buildAnimationDelay: placement.buildAnimationDelay,
    buildAnimationStart: placement.buildAnimationStart,
    bakedLight: placement.bakedLight,
    bakedLightDirection: placement.bakedLightDirection,
    bakedLightDirectionSecondary: placement.bakedLightDirectionSecondary,
    fogCell: placement.fogCell,
  }
}

export function buildMergedTileGeometryMeshesOnMainThread(input: {
  sourceScene: THREE.Object3D
  placements: BatchedTilePlacement[]
  transform?: ContentPackModelTransform
}) {
  return buildMergedTileGeometryMeshes(input)
}

export function resetBatchedTileGeometryWorkerForTests() {
  worker?.terminate()
  worker = null
  pendingRequests.clear()
  registeredSourceKeys.clear()
  nextRequestId = 1
}

function getOrCreateWorker() {
  if (worker) {
    return worker
  }

  try {
    worker = new Worker(new URL('./batchedTileGeometry.worker.ts', import.meta.url), { type: 'module' })
  } catch (error) {
    console.error('Failed to create batched tile geometry worker.', error)
    worker = null
    return null
  }

  worker.addEventListener('message', handleWorkerMessage)
  worker.addEventListener('error', handleWorkerError)
  return worker
}

function handleWorkerMessage(event: MessageEvent<BatchedTileWorkerResponse>) {
  const pending = pendingRequests.get(event.data.requestId)
  if (!pending) {
    return
  }

  pendingRequests.delete(event.data.requestId)
  if (event.data.error) {
    pending.reject(new Error(event.data.error))
    return
  }
  if (!event.data.result) {
    pending.reject(new Error('Batched tile geometry worker returned no result.'))
    return
  }

  pending.resolve(event.data.result)
}

function handleWorkerError(event: ErrorEvent) {
  console.error('Batched tile geometry worker failed.', event.error ?? event.message)
  pendingRequests.forEach((pending) => {
    pending.reject(event.error instanceof Error ? event.error : new Error(event.message))
  })
  pendingRequests.clear()
  registeredSourceKeys.clear()
  worker?.removeEventListener('message', handleWorkerMessage)
  worker?.removeEventListener('error', handleWorkerError)
  worker?.terminate()
  worker = null
}

function registerSourceScene(activeWorker: Worker, sourceScene: THREE.Object3D): SourceRegistration | null {
  const cached = sourceRegistrations.get(sourceScene)
  if (cached && registeredSourceKeys.has(cached.sourceKey)) {
    return cached
  }

  const registration = extractSourceRegistration(sourceScene)
  if (!registration || registration.meshes.length === 0) {
    return null
  }

  sourceRegistrations.set(sourceScene, {
    sourceKey: registration.sourceKey,
    materialsByMeshKey: registration.materialsByMeshKey,
  })
  registeredSourceKeys.add(registration.sourceKey)
  activeWorker.postMessage({
    type: 'register-source',
    sourceKey: registration.sourceKey,
    meshes: registration.meshes,
  }, registration.transferables)

  return {
    sourceKey: registration.sourceKey,
    materialsByMeshKey: registration.materialsByMeshKey,
  }
}

function extractSourceRegistration(sourceScene: THREE.Object3D) {
  sourceScene.updateWorldMatrix(true, true)
  const sourceKey = sourceScene.uuid
  const meshes: BatchedTileWorkerSourceMesh[] = []
  const materialsByMeshKey = new Map<string, THREE.Material>()
  const transferables: Transferable[] = []
  let meshIndex = 0

  sourceScene.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.geometry || !(child.material instanceof THREE.Material)) {
      return
    }

    const key = `${meshIndex}:${child.uuid}`
    meshIndex += 1
    const geometry = serializeBufferGeometry(getWebGpuCompatibleGeometryTemplate(child.geometry))
    meshes.push({
      key,
      geometry,
      matrixWorld: child.matrixWorld.toArray(),
    })
    getSerializedGeometryTransferables(geometry).forEach((transferable) => transferables.push(transferable))
    materialsByMeshKey.set(key, child.material)
  })

  return {
    sourceKey,
    meshes,
    materialsByMeshKey,
    transferables,
  }
}
