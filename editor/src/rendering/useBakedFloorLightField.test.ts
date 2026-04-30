import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as dungeonLightField from './dungeonLightField'
import { useBakedFloorLightField } from './useBakedFloorLightField'

const originalWorker = globalThis.Worker

describe('useBakedFloorLightField', () => {
  beforeEach(() => {
    dungeonLightField.clearBakedFloorLightFieldCache()
    Object.defineProperty(globalThis, 'Worker', {
      configurable: true,
      writable: true,
      value: undefined,
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    dungeonLightField.clearBakedFloorLightFieldCache()
    if (originalWorker) {
      Object.defineProperty(globalThis, 'Worker', {
        configurable: true,
        writable: true,
        value: originalWorker,
      })
      return
    }
    delete (globalThis as { Worker?: typeof Worker }).Worker
  })

  it('rebuilds the baked field when the build input changes', () => {
    const getOrBuildSpy = vi.spyOn(dungeonLightField, 'getOrBuildBakedFloorLightField')
    const initialInput = {
      floorId: 'floor-deferred',
      floorCells: [[0, 0]] as [number, number][],
      staticLightSources: [],
    }
    const expandedInput = {
      ...initialInput,
      floorCells: [[0, 0], [1, 0]] as [number, number][],
    }

    const { result, rerender } = renderHook(
      ({ input }: { input: typeof initialInput }) =>
        useBakedFloorLightField(input),
      {
        initialProps: {
          input: initialInput,
        },
      },
    )

    const initialBuildCalls = getOrBuildSpy.mock.calls.length
    expect(initialBuildCalls).toBeGreaterThan(0)
    expect(result.current.bounds).toEqual({
      minCellX: 0,
      maxCellX: 0,
      minCellZ: 0,
      maxCellZ: 0,
    })

    rerender({
      input: expandedInput,
    })

    expect(getOrBuildSpy.mock.calls.length).toBe(initialBuildCalls + 1)
    expect(result.current.bounds).toEqual({
      minCellX: 0,
      maxCellX: 1,
      minCellZ: 0,
      maxCellZ: 0,
    })
  })
})
