import type { TileUploadRange } from '../../components/canvas/instancedTileMesh'

export type TileUploadBudget = {
  maxMs?: number
  maxPages?: number
}

export type TilePageUpload = {
  pageKey: string
  dirtyRanges: TileUploadRange[]
}

export type TileUploadBudgetResult = {
  processedUploads: TilePageUpload[]
  processedPages: number
  remainingPages: number
}

export function coalesceTileUploadRanges(
  ranges: readonly TileUploadRange[],
): TileUploadRange[] {
  if (ranges.length === 0) {
    return []
  }

  const sorted = [...ranges]
    .filter((range) => range.count > 0)
    .sort((left, right) => left.start - right.start || left.count - right.count)

  if (sorted.length === 0) {
    return []
  }

  const merged: TileUploadRange[] = []
  let active = { ...sorted[0]! }
  for (let index = 1; index < sorted.length; index += 1) {
    const next = sorted[index]!
    const activeEnd = active.start + active.count
    if (next.start <= activeEnd) {
      active.count = Math.max(activeEnd, next.start + next.count) - active.start
      continue
    }

    merged.push(active)
    active = { ...next }
  }

  merged.push(active)
  return merged
}

export class TileGpuUploadScheduler {
  private readonly pendingUploads = new Map<string, TileUploadRange[]>()
  private readonly queue: string[] = []
  private readonly now: () => number

  constructor(now: () => number = () => performance.now()) {
    this.now = now
  }

  enqueueTilePageUpload(pageKey: string, dirtyRanges: readonly TileUploadRange[]) {
    const nextRanges = coalesceTileUploadRanges(dirtyRanges)
    if (nextRanges.length === 0) {
      return
    }

    const existing = this.pendingUploads.get(pageKey)
    this.pendingUploads.set(
      pageKey,
      coalesceTileUploadRanges([...(existing ?? []), ...nextRanges]),
    )

    if (!this.queue.includes(pageKey)) {
      this.queue.push(pageKey)
    }
  }

  processTileUploadBudget({
    maxMs = 2,
    maxPages = 2,
  }: TileUploadBudget = {}): TileUploadBudgetResult {
    const startedAt = this.now()
    const processedUploads: TilePageUpload[] = []

    while (
      this.queue.length > 0
      && processedUploads.length < maxPages
      && this.now() - startedAt < maxMs
    ) {
      const pageKey = this.queue.shift()
      if (!pageKey) {
        break
      }

      const dirtyRanges = this.pendingUploads.get(pageKey)
      if (!dirtyRanges) {
        continue
      }

      this.pendingUploads.delete(pageKey)
      processedUploads.push({
        pageKey,
        dirtyRanges,
      })
    }

    return {
      processedUploads,
      processedPages: processedUploads.length,
      remainingPages: this.queue.length,
    }
  }

  hasPendingTileUploads() {
    return this.queue.length > 0
  }

  getPendingPageKeys() {
    return [...this.queue]
  }

  clear() {
    this.pendingUploads.clear()
    this.queue.length = 0
  }
}
