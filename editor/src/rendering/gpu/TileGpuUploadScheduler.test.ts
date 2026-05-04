import { describe, expect, it } from 'vitest'
import { TileGpuUploadScheduler, coalesceTileUploadRanges } from './TileGpuUploadScheduler'

describe('TileGpuUploadScheduler', () => {
  it('coalesces adjacent dirty ranges within a page', () => {
    expect(coalesceTileUploadRanges([
      { start: 0, count: 1 },
      { start: 1, count: 2 },
      { start: 4, count: 1 },
      { start: 7, count: 1 },
      { start: 7, count: 2 },
    ])).toEqual([
      { start: 0, count: 3 },
      { start: 4, count: 1 },
      { start: 7, count: 2 },
    ])
  })

  it('respects page and time budgets and leaves remaining uploads queued', () => {
    let now = 0
    const scheduler = new TileGpuUploadScheduler(() => now)
    scheduler.enqueueTilePageUpload('page-a', [{ start: 0, count: 1 }])
    scheduler.enqueueTilePageUpload('page-b', [{ start: 1, count: 1 }])
    scheduler.enqueueTilePageUpload('page-c', [{ start: 2, count: 1 }])

    const firstPass = scheduler.processTileUploadBudget({ maxMs: 10, maxPages: 2 })
    expect(firstPass.processedUploads.map((upload) => upload.pageKey)).toEqual(['page-a', 'page-b'])
    expect(firstPass.remainingPages).toBe(1)
    expect(scheduler.hasPendingTileUploads()).toBe(true)

    now = 20
    const secondPass = scheduler.processTileUploadBudget({ maxMs: 10, maxPages: 2 })
    expect(secondPass.processedUploads.map((upload) => upload.pageKey)).toEqual(['page-c'])
    expect(secondPass.remainingPages).toBe(0)
    expect(scheduler.hasPendingTileUploads()).toBe(false)
  })
})
