import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  clearBuildTraceEntries,
  recordBuildPerfDuration,
  useBuildTraceEntries,
} from './runtimeBuildTrace'
import { useDungeonStore } from '../store/useDungeonStore'

describe('recordBuildPerfDuration', () => {
  beforeEach(() => {
    clearBuildTraceEntries()
    performance.clearMarks()
    performance.clearMeasures()
    useDungeonStore.getState().setBuildPerformanceTracingEnabled(false)
  })

  afterEach(() => {
    clearBuildTraceEntries()
    performance.clearMarks()
    performance.clearMeasures()
    useDungeonStore.getState().setBuildPerformanceTracingEnabled(false)
  })

  it('records a measured span when tracing is enabled', () => {
    const { result } = renderHook(() => useBuildTraceEntries())

    act(() => {
      useDungeonStore.getState().setBuildPerformanceTracingEnabled(true)
    })

    const startTime = performance.now()
    act(() => {
      recordBuildPerfDuration('slow-placement-raycast', { hits: 7 }, startTime, 18)
    })

    expect(result.current).toHaveLength(1)
    expect(result.current[0]).toMatchObject({
      name: 'dp:slow-placement-raycast',
      duration: 18,
      detail: expect.objectContaining({ hits: 7 }),
    })
    expect(performance.getEntriesByName('dp:slow-placement-raycast')).toHaveLength(1)
  })

  it('skips measured spans when tracing is disabled', () => {
    const { result } = renderHook(() => useBuildTraceEntries())

    act(() => {
      recordBuildPerfDuration('slow-placement-raycast', { hits: 7 }, performance.now(), 18)
    })

    expect(result.current).toHaveLength(0)
    expect(performance.getEntriesByName('dp:slow-placement-raycast')).toHaveLength(0)
  })
})
