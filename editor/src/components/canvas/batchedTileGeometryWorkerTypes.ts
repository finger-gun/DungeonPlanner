import type { ContentPackModelTransform } from '../../content-packs/types'
import type { BatchedTilePlacement } from './batchedTileGeometry'

export type SerializedGeometryArray =
  | Float32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Int8Array
  | Int16Array
  | Int32Array

export type SerializedGeometryAttribute = {
  name: string
  array: SerializedGeometryArray
  itemSize: number
  normalized: boolean
}

export type SerializedGeometryIndex = {
  array: Uint16Array | Uint32Array
}

export type SerializedGeometry = {
  attributes: SerializedGeometryAttribute[]
  index: SerializedGeometryIndex | null
}

export type BatchedTileWorkerSourceMesh = {
  key: string
  geometry: SerializedGeometry
  matrixWorld: readonly number[]
}

export type RegisterBatchedTileWorkerSourceMessage = {
  type: 'register-source'
  sourceKey: string
  meshes: BatchedTileWorkerSourceMesh[]
}

export type BuildBatchedTileWorkerGeometryMessage = {
  type: 'build'
  requestId: number
  bucketKey: string
  chunkKey: string
  sourceKey: string
  placements: BatchedTilePlacement[]
  transform?: ContentPackModelTransform
  geometrySignature: string
}

export type BatchedTileWorkerRequest =
  | RegisterBatchedTileWorkerSourceMessage
  | BuildBatchedTileWorkerGeometryMessage

export type BatchedTileWorkerGeometryMesh = {
  key: string
  sourceMeshKey: string
  geometry: SerializedGeometry
}

export type BatchedTileWorkerGeometryResult = {
  bucketKey: string
  chunkKey: string
  geometrySignature: string
  meshes: BatchedTileWorkerGeometryMesh[]
}

export type BatchedTileWorkerResponse = {
  requestId: number
  result?: BatchedTileWorkerGeometryResult
  error?: string
}
