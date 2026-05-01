import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as dungeonLightField from './dungeonLightField'
import { clearFloorLightComputeBridge, getFloorLightComputeBridgeEntry } from './gpu'
import { useBakedFloorLightField } from './useBakedFloorLightField'

const originalWorker = globalThis.Worker

describe('useBakedFloorLightField', () => {
  beforeEach(() => {
    dungeonLightField.clearBakedFloorLightFieldCache()
    clearFloorLightComputeBridge()
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
    clearFloorLightComputeBridge()
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
    expect(result.current.lightFieldTexture).not.toBeNull()
    expect(result.current.staticLightSources.map((lightSource) => lightSource.key)).toEqual(['torch'])
  })

  it('keeps the current lit field active while an async rebuild is pending', async () => {
    class FakeRebuildWorker {
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
      value: FakeRebuildWorker,
    })

    const initialInput = {
      floorId: 'floor-worker-rebuild-visible',
      floorCells: [[0, 0], [1, 0]] as [number, number][],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
    }
    const nextInput = {
      ...initialInput,
      staticLightSources: [createResolvedLightSource('torch', [3, 1.5, 1])],
    }

    const initialField = dungeonLightField.getOrBuildBakedFloorLightField(initialInput)
    const { result, rerender } = renderHook(
      ({ input }: { input: typeof initialInput }) => useBakedFloorLightField(input),
      {
        initialProps: { input: initialInput },
      },
    )

    await act(async () => {})

    expect(result.current).toBe(initialField)
    expect(result.current.lightFieldTexture).toBe(initialField.lightFieldTexture)

    rerender({ input: nextInput })

    await act(async () => {})

    expect(result.current).toBe(initialField)
    expect(result.current.lightFieldTexture).toBe(initialField.lightFieldTexture)
  })

  it('switches to a seeded pending field when the async rebuild changes light-field bounds', async () => {
    class FakeLayoutWorker {
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
      value: FakeLayoutWorker,
    })

    const initialInput = {
      floorId: 'floor-worker-layout-pending',
      floorCells: [[0, 0], [1, 0]] as [number, number][],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
    }
    const expandedInput = {
      ...initialInput,
      floorCells: [[0, 0], [1, 0], [2, 0]] as [number, number][],
    }

    const initialField = dungeonLightField.getOrBuildBakedFloorLightField(initialInput)
    const { result, rerender } = renderHook(
      ({ input }: { input: typeof initialInput }) => useBakedFloorLightField(input),
      {
        initialProps: { input: initialInput },
      },
    )

    await act(async () => {})

    expect(result.current).toBe(initialField)
    expect(result.current.bounds).toEqual({
      minCellX: 0,
      maxCellX: 1,
      minCellZ: 0,
      maxCellZ: 0,
    })

    rerender({ input: expandedInput })

    await act(async () => {})

    expect(result.current).not.toBe(initialField)
    expect(result.current.bounds).toEqual({
      minCellX: 0,
      maxCellX: 2,
      minCellZ: 0,
      maxCellZ: 0,
    })
    expect(result.current.lightFieldTexture).not.toBeNull()
    expect(result.current.previousSourceHash).toBe(initialField.sourceHash)
  })

  it('defers worker preparation until after the next frame when requested', async () => {
    const workerInstances: FakeDeferredWorker[] = []

    class FakeDeferredWorker {
      postMessage = vi.fn()
      private listeners = new Set<(event: MessageEvent<{ requestId: number, result: dungeonLightField.BakedFloorLightFieldWorkerResult }>) => void>()

      constructor() {
        workerInstances.push(this)
      }

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

      terminate() {
        this.listeners.clear()
      }
    }

    Object.defineProperty(globalThis, 'Worker', {
      configurable: true,
      writable: true,
      value: FakeDeferredWorker,
    })

    const frameQueue = new Map<number, FrameRequestCallback>()
    let nextFrameId = 1
    const originalRequestAnimationFrame = globalThis.requestAnimationFrame
    const originalCancelAnimationFrame = globalThis.cancelAnimationFrame
    globalThis.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      const frameId = nextFrameId
      nextFrameId += 1
      frameQueue.set(frameId, callback)
      return frameId
    })
    globalThis.cancelAnimationFrame = vi.fn((frameId: number) => {
      frameQueue.delete(frameId)
    })

    try {
      const initialInput = {
        floorId: 'floor-deferred-worker-build',
        floorCells: [[0, 0], [1, 0]] as [number, number][],
        staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
      }
      const nextInput = {
        ...initialInput,
        staticLightSources: [createResolvedLightSource('torch', [3, 1.5, 1])],
      }

      dungeonLightField.getOrBuildBakedFloorLightField(initialInput)

      const { rerender } = renderHook(
        ({ input }: { input: typeof initialInput }) =>
          useBakedFloorLightField(input, { deferPreparation: true }),
        {
          initialProps: { input: initialInput },
        },
      )

      await act(async () => {})

      expect(workerInstances).toHaveLength(1)
      expect(workerInstances[0]!.postMessage).not.toHaveBeenCalled()

      rerender({ input: nextInput })

      await act(async () => {})

      expect(workerInstances[0]!.postMessage).not.toHaveBeenCalled()

      const firstFrameId = [...frameQueue.keys()].sort((left, right) => left - right)[0]
      const firstFrame = typeof firstFrameId === 'number' ? frameQueue.get(firstFrameId) : null
      expect(firstFrame).toBeTypeOf('function')
      await act(async () => {
        if (typeof firstFrameId === 'number') {
          frameQueue.delete(firstFrameId)
        }
        firstFrame?.(0)
      })

      expect(workerInstances[0]!.postMessage).not.toHaveBeenCalled()

      const secondFrameId = [...frameQueue.keys()].sort((left, right) => left - right)[0]
      const secondFrame = typeof secondFrameId === 'number' ? frameQueue.get(secondFrameId) : null
      expect(secondFrame).toBeTypeOf('function')
      await act(async () => {
        if (typeof secondFrameId === 'number') {
          frameQueue.delete(secondFrameId)
        }
        secondFrame?.(16)
      })

      expect(workerInstances[0]!.postMessage).toHaveBeenCalledTimes(1)
    } finally {
      globalThis.requestAnimationFrame = originalRequestAnimationFrame
      globalThis.cancelAnimationFrame = originalCancelAnimationFrame
    }
  })

  it('dispatches the gpu compute prototype alongside worker rebuilds when a compute renderer is available', async () => {
    class FakeComputeWorker {
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
      value: FakeComputeWorker,
    })

    const compute = vi.fn()
    const renderer = { compute }
    const input = {
      floorId: 'floor-gpu-compute-prototype',
      floorCells: [[0, 0]] as [number, number][],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
    }

    renderHook(() => useBakedFloorLightField(input, { renderer, enableGpuComputePrototype: true }))

    await act(async () => {})

    expect(compute).toHaveBeenCalledTimes(1)
    expect(getFloorLightComputeBridgeEntry('floor-gpu-compute-prototype')).toMatchObject({
      floorId: 'floor-gpu-compute-prototype',
      status: 'dispatched',
    })
  })

  it('does not dispatch the gpu compute prototype by default even when a compute renderer is available', async () => {
    class FakeComputeWorker {
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
      value: FakeComputeWorker,
    })

    const compute = vi.fn()
    const renderer = { compute }
    const input = {
      floorId: 'floor-gpu-compute-disabled-by-default',
      floorCells: [[0, 0]] as [number, number][],
      staticLightSources: [createResolvedLightSource('torch', [1, 1.5, 1])],
    }

    renderHook(() => useBakedFloorLightField(input, { renderer }))

    await act(async () => {})

    expect(compute).not.toHaveBeenCalled()
    expect(getFloorLightComputeBridgeEntry('floor-gpu-compute-disabled-by-default')).toBeNull()
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
