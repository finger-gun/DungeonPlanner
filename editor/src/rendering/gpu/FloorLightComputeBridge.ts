import type { PreparedFloorLightComputePrototype } from './FloorLightComputePrototype'

/**
 * Cross-frame bridge for GPU compute job lifecycle tracking.
 *
 * The bridge is a module-level Map keyed by floorId. It tracks in-flight
 * GPU compute jobs across React render cycles, allowing the dispatch logic
 * in `useBakedFloorLightField` to be separated from the results consumer.
 *
 * State machine: queued → dispatched → failed
 * - queued: job prepared, waiting for next render frame to dispatch
 * - dispatched: compute submitted to GPU, awaiting result
 * - failed: dispatch threw or GPU returned an error
 */
export type FloorLightComputeBridgeStatus = 'queued' | 'dispatched' | 'failed'

export type FloorLightComputeBridgeEntry = {
  floorId: string
  sourceHash: string
  prototype: PreparedFloorLightComputePrototype
  status: FloorLightComputeBridgeStatus
  errorMessage: string | null
}

const floorLightComputeBridge = new Map<string, FloorLightComputeBridgeEntry>()

/** Clears all tracked floor light compute jobs. */
export function clearFloorLightComputeBridge() {
  floorLightComputeBridge.clear()
}

/** Removes bridge entries for floors that are no longer relevant to the current scene. */
export function pruneFloorLightComputeBridge(retainedFloorIds: Iterable<string>) {
  const retainedFloorIdSet = new Set(retainedFloorIds)
  for (const floorId of floorLightComputeBridge.keys()) {
    if (!retainedFloorIdSet.has(floorId)) {
      floorLightComputeBridge.delete(floorId)
    }
  }
}

/** Returns the tracked bridge entry for a floor, if one exists. */
export function getFloorLightComputeBridgeEntry(floorId: string) {
  return floorLightComputeBridge.get(floorId) ?? null
}

/** Stores a newly prepared prototype in the bridge so it can be dispatched on a later frame. */
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

/** Marks the current bridge entry as successfully submitted to the renderer. */
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

/** Records a dispatch failure for the current bridge entry without disturbing newer jobs. */
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
