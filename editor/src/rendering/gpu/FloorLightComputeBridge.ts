import type { PreparedFloorLightComputePrototype } from './FloorLightComputePrototype'

export type FloorLightComputeBridgeStatus = 'queued' | 'dispatched' | 'failed'

export type FloorLightComputeBridgeEntry = {
  floorId: string
  sourceHash: string
  prototype: PreparedFloorLightComputePrototype
  status: FloorLightComputeBridgeStatus
  errorMessage: string | null
}

const floorLightComputeBridge = new Map<string, FloorLightComputeBridgeEntry>()

export function clearFloorLightComputeBridge() {
  floorLightComputeBridge.clear()
}

export function pruneFloorLightComputeBridge(retainedFloorIds: Iterable<string>) {
  const retainedFloorIdSet = new Set(retainedFloorIds)
  for (const floorId of floorLightComputeBridge.keys()) {
    if (!retainedFloorIdSet.has(floorId)) {
      floorLightComputeBridge.delete(floorId)
    }
  }
}

export function getFloorLightComputeBridgeEntry(floorId: string) {
  return floorLightComputeBridge.get(floorId) ?? null
}

export function setQueuedFloorLightComputePrototype(
  prototype: PreparedFloorLightComputePrototype,
) {
  floorLightComputeBridge.set(prototype.prepared.floorId, {
    floorId: prototype.prepared.floorId,
    sourceHash: prototype.packed.sourceHash,
    prototype,
    status: 'queued',
    errorMessage: null,
  })
}

export function markFloorLightComputePrototypeDispatched(
  floorId: string,
  sourceHash: string,
) {
  const existing = floorLightComputeBridge.get(floorId)
  if (!existing || existing.sourceHash !== sourceHash) {
    return
  }

  floorLightComputeBridge.set(floorId, {
    ...existing,
    status: 'dispatched',
    errorMessage: null,
  })
}

export function markFloorLightComputePrototypeFailed(
  floorId: string,
  sourceHash: string,
  error: unknown,
) {
  const existing = floorLightComputeBridge.get(floorId)
  if (!existing || existing.sourceHash !== sourceHash) {
    return
  }

  floorLightComputeBridge.set(floorId, {
    ...existing,
    status: 'failed',
    errorMessage: error instanceof Error ? error.message : String(error),
  })
}
