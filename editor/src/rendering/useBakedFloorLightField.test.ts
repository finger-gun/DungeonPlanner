import { act, cleanup, renderHook } from '@testing-library/react'
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

  it('uses the worker-backed pending field for the first lit build when Worker is available', async () => {
    class FakeWorker {
      private listeners = new Set<(event: MessageEvent<{ requestId: number, result: dungeonLightField.BakedFloorLightFieldWorkerResult }>) => void>()

      addEventListener(
        type: string,
        listener: (event: MessageEvent<{ requestId: number, result: dungeonLightField.BakedFloorLightFieldWorkerResult }>) => void,
      ) {
        if (type === 'message') {
          this.listeners.add(listener)
        }
      }

      removeEventListener(
        type: string,
        listener: (event: MessageEvent<{ requestId: number, result: dungeonLightField.BakedFloorLightFieldWorkerResult }>) => void,
      ) {
        if (type === 'message') {
          this.listeners.delete(listener)
        }
      }

      postMessage() {}

      terminate() {
        this.listeners.clear()
      }
    }

    Object.defineProperty(globalThis, 'Worker', {
      configurable: true,
      writable: true,
      value: FakeWorker,
    })

    const getOrBuildSpy = vi.spyOn(dungeonLightField, 'getOrBuildBakedFloorLightField')
    const input = {
      floorId: 'floor-worker-first-build',
      floorCells: [[0, 0]] as [number, number][],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
    }

    const { result } = renderHook(() => useBakedFloorLightField(input))

    await act(async () => {})

    expect(getOrBuildSpy).not.toHaveBeenCalled()
    expect(result.current.bounds).toEqual({
      minCellX: 0,
      maxCellX: 0,
      minCellZ: 0,
      maxCellZ: 0,
    })
    expect(result.current.lightFieldTexture).toBeNull()
    expect(result.current.staticLightSources.map((lightSource) => lightSource.key)).toEqual(['torch'])
  })
})

function createResolvedLightSource(
  id: string,
  position: [number, number, number],
): dungeonLightField.ResolvedDungeonLightSource {
  return {
    key: id,
    object: {
      id,
      type: 'prop',
      assetId: 'dungeon.props_torch',
      position,
      rotation: [0, 0, 0],
      props: {},
      cell: [0, 0],
      cellKey: '0:0:floor',
      layerId: 'default',
    },
    light: {
      color: '#ff9944',
      intensity: 1.5,
      distance: 8,
      decay: 2,
    },
    position,
    linearColor: [1, 0.5583403896342679, 0.05780543019106723],
  }
}
