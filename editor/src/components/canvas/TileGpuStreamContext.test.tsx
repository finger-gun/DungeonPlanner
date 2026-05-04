import { describe, expect, it } from 'vitest'
import { getTileStreamUploadBudget } from './TileGpuStreamContext'

describe('getTileStreamUploadBudget', () => {
  it('uses a smaller upload budget while editing interactions are active', () => {
    expect(getTileStreamUploadBudget(true)).toEqual({
      maxMs: 0.5,
      maxPages: 1,
    })
  })

  it('keeps a single-page upload cadence when the scene is idle', () => {
    expect(getTileStreamUploadBudget(false)).toEqual({
      maxMs: 2,
      maxPages: 1,
    })
  })
})
