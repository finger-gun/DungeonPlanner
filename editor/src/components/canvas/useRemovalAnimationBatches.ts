import { useCallback, useEffect, useRef, useState } from 'react'
import { getBuildAnimationPlaybackDurationMs } from '../../store/buildAnimations'
import { WALL_EXTRA_DELAY_MS } from './DungeonRoomShared'
import type { StaticTileEntry } from './tileEntries'

export const REMOVAL_ANIMATION_CLEANUP_BUFFER_MS = 32

export type RemovalAnimationBatch = {
  id: string
  floorId: string
  entries: StaticTileEntry[]
}

export function useRemovalAnimationBatches() {
  const [removalAnimationBatches, setRemovalAnimationBatches] = useState<RemovalAnimationBatch[]>([])
  const removalAnimationTimeoutsRef = useRef<Map<string, number>>(new Map())

  useEffect(() => () => {
    removalAnimationTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId)
    })
    removalAnimationTimeoutsRef.current.clear()
  }, [])

  const queueRemovalAnimationBatch = useCallback((
    entries: StaticTileEntry[],
    floorId: string,
    maxExtraDelay = WALL_EXTRA_DELAY_MS,
  ) => {
    if (entries.length === 0) {
      return
    }

    const batchId = `removal:${performance.now()}:${Math.random().toString(36).slice(2, 8)}`
    setRemovalAnimationBatches((current) => [...current, {
      id: batchId,
      floorId,
      entries,
    }])

    const timeoutId = window.setTimeout(() => {
      removalAnimationTimeoutsRef.current.delete(batchId)
      setRemovalAnimationBatches((current) => current.filter((batch) => batch.id !== batchId))
    }, getRemovalAnimationDurationMs(maxExtraDelay))

    removalAnimationTimeoutsRef.current.set(batchId, timeoutId)
  }, [])

  return {
    removalAnimationBatches,
    queueRemovalAnimationBatch,
  }
}

export function getRemovalAnimationDurationMs(maxExtraDelay = WALL_EXTRA_DELAY_MS) {
  return getBuildAnimationPlaybackDurationMs(maxExtraDelay) + REMOVAL_ANIMATION_CLEANUP_BUFFER_MS
}
