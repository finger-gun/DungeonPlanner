import { afterEach, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import {
  buildMergedTileGeometryMeshesOffThread,
  resetBatchedTileGeometryWorkerForTests,
} from './batchedTileGeometryWorkerClient'
import type { BatchedTilePlacement } from './batchedTileGeometry'
import type { BatchedTileWorkerResponse } from './batchedTileGeometryWorkerTypes'

class FakeWorker {
  static instances: FakeWorker[] = []

  messages: Array<{ message: unknown; transfer?: Transferable[] }> = []
  private messageListeners = new Set<(event: MessageEvent<BatchedTileWorkerResponse>) => void>()
  private errorListeners = new Set<(event: ErrorEvent) => void>()

  constructor() {
    FakeWorker.instances.push(this)
  }

  addEventListener(type: 'message' | 'error', listener: EventListener) {
    if (type === 'message') {
      this.messageListeners.add(listener as (event: MessageEvent<BatchedTileWorkerResponse>) => void)
    } else {
      this.errorListeners.add(listener as (event: ErrorEvent) => void)
    }
  }

  removeEventListener(type: 'message' | 'error', listener: EventListener) {
    if (type === 'message') {
      this.messageListeners.delete(listener as (event: MessageEvent<BatchedTileWorkerResponse>) => void)
    } else {
      this.errorListeners.delete(listener as (event: ErrorEvent) => void)
    }
  }

  postMessage(message: unknown, transfer?: Transferable[]) {
    this.messages.push({ message, transfer })
  }

  terminate() {}

  emitMessage(data: BatchedTileWorkerResponse) {
    this.messageListeners.forEach((listener) => listener({ data } as MessageEvent<BatchedTileWorkerResponse>))
  }
}

describe('batchedTileGeometryWorkerClient', () => {
  afterEach(() => {
    resetBatchedTileGeometryWorkerForTests()
    vi.unstubAllGlobals()
    FakeWorker.instances.length = 0
  })

  it('posts only cloneable placement data to the geometry worker', async () => {
    vi.stubGlobal('Worker', FakeWorker)
    const sourceScene = new THREE.Group()
    sourceScene.add(new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshStandardMaterial({ color: '#ffffff' }),
    ))
    const placement = {
      key: 'floor:0:0',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      bakedLightField: { nonCloneableTexture: new THREE.Texture() },
      visibility: 'visible',
    } as unknown as BatchedTilePlacement

    const buildPromise = buildMergedTileGeometryMeshesOffThread({
      bucketKey: 'bucket',
      chunkKey: '0:0',
      sourceScene,
      placements: [placement],
      geometrySignature: 'geometry',
    })

    const worker = FakeWorker.instances[0]!
    expect(worker.messages).toHaveLength(2)
    expect(worker.messages[1]!.message).toMatchObject({
      type: 'build',
      placements: [{
        key: 'floor:0:0',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
      }],
    })
    expect(JSON.stringify(worker.messages[1]!.message)).not.toContain('bakedLightField')

    worker.emitMessage({
      requestId: 1,
      result: {
        bucketKey: 'bucket',
        chunkKey: '0:0',
        geometrySignature: 'geometry',
        meshes: [],
      },
    })

    await expect(buildPromise).resolves.toEqual([])
  })
})
