import { useCallback, useEffect, useRef, useState } from 'react'
import {
  applyBakedFloorLightFieldWorkerResult,
  createPendingBakedFloorLightField,
  getOrBuildBakedFloorLightField,
  prepareBakedFloorLightFieldBuild,
  prepareBakedFloorLightFieldWorkerBuild,
  shouldShowPendingBakedFloorLightField,
  type BakedFloorLightField,
  type BakedFloorLightFieldBuildInput,
  type BakedFloorLightFieldWorkerResult,
  type PreparedBakedFloorLightFieldBuild,
} from './dungeonLightField'
import {
  canDispatchFloorLightComputePrototype,
  markFloorLightComputePrototypeDispatched,
  markFloorLightComputePrototypeFailed,
  dispatchFloorLightComputePrototype,
  prepareFloorLightComputePrototypeFromBuild,
  setQueuedFloorLightComputePrototype,
  type PreparedFloorLightComputePrototype,
} from './gpu'
import { startBuildPerfSpan, traceBuildPerf } from '../performance/runtimeBuildTrace'

type UseBakedFloorLightFieldOptions = {
  renderer?: unknown
  enableGpuComputePrototype?: boolean
  deferPreparation?: boolean
}

export function useBakedFloorLightField(
  input: BakedFloorLightFieldBuildInput,
  options: UseBakedFloorLightFieldOptions = {},
) {
  const { renderer = null, enableGpuComputePrototype = false, deferPreparation = false } = options
  const [field, setField] = useState<BakedFloorLightField>(() => {
    if (typeof Worker === 'undefined') {
      return getOrBuildBakedFloorLightField(input)
    }

    const prepared = prepareBakedFloorLightFieldBuild(input)
    const workerBuild = prepareBakedFloorLightFieldWorkerBuild(prepared)
    if (!workerBuild) {
      return getOrBuildBakedFloorLightField(input)
    }

    return prepared.cachedField ?? createPendingBakedFloorLightField({
      prepared,
      layout: workerBuild.layout,
    })
  })
  const workerRef = useRef<Worker | null>(null)
  const requestIdRef = useRef(0)
  const pendingBuildRef = useRef<{
    prepared: PreparedBakedFloorLightFieldBuild
    workerBuild: NonNullable<ReturnType<typeof prepareBakedFloorLightFieldWorkerBuild>>
  } | null>(null)
  const queuedComputePrototypeRef = useRef<PreparedFloorLightComputePrototype | null>(null)
  const computeDispatchPromiseRef = useRef<Promise<void> | null>(null)
  const lastDispatchedComputeSourceHashRef = useRef<string | null>(null)

  const flushQueuedCompute = useCallback(() => {
    if (
      !enableGpuComputePrototype
      || !renderer
      || !canDispatchFloorLightComputePrototype(renderer)
      || computeDispatchPromiseRef.current
    ) {
      return
    }

    const prototype = queuedComputePrototypeRef.current
    if (!prototype) {
      return
    }

    queuedComputePrototypeRef.current = null
    const sourceHash = prototype.packed.sourceHash
    if (sourceHash === lastDispatchedComputeSourceHashRef.current) {
      flushQueuedCompute()
      return
    }

    const endComputeTrace = startBuildPerfSpan('lightfield-compute-dispatch', {
      floorId: prototype.prepared.floorId,
    })
    computeDispatchPromiseRef.current = dispatchFloorLightComputePrototype(renderer, prototype)
      .then(
        () => {
          lastDispatchedComputeSourceHashRef.current = sourceHash
          markFloorLightComputePrototypeDispatched(prototype.prepared.floorId, sourceHash)
        },
        (error) => {
          markFloorLightComputePrototypeFailed(prototype.prepared.floorId, sourceHash, error)
          console.error('Failed to dispatch floor light compute prototype.', error)
        },
      )
      .finally(() => {
        endComputeTrace()
        computeDispatchPromiseRef.current = null
        flushQueuedCompute()
      })
  }, [enableGpuComputePrototype, renderer])

  const scheduleBuildPreparationAfterFrames = useCallback((callback: () => void) => {
    if (typeof requestAnimationFrame !== 'function' || typeof cancelAnimationFrame !== 'function') {
      const timeoutId = globalThis.setTimeout(callback, 0)
      return () => globalThis.clearTimeout(timeoutId)
    }

    let secondFrameId = 0
    const firstFrameId = requestAnimationFrame(() => {
      secondFrameId = requestAnimationFrame(callback)
    })

    return () => {
      cancelAnimationFrame(firstFrameId)
      if (secondFrameId) {
        cancelAnimationFrame(secondFrameId)
      }
    }
  }, [])

  const scheduleBuildPreparation = useCallback((callback: () => void) => {
    const requestIdle = (globalThis as typeof globalThis & {
      requestIdleCallback?: (cb: () => void, options?: { timeout?: number }) => number
      cancelIdleCallback?: (id: number) => void
    }).requestIdleCallback
    const cancelIdle = (globalThis as typeof globalThis & {
      requestIdleCallback?: (cb: () => void, options?: { timeout?: number }) => number
      cancelIdleCallback?: (id: number) => void
    }).cancelIdleCallback

    if (typeof requestIdle === 'function' && typeof cancelIdle === 'function') {
      const cleanupRef = { current: () => {} }
      const firstFrameCancel = scheduleBuildPreparationAfterFrames(() => {
        const idleCallbackId = requestIdle(callback, { timeout: 120 })
        cleanupRef.current = () => cancelIdle(idleCallbackId)
      })
      return () => {
        firstFrameCancel()
        cleanupRef.current()
      }
    }

    return scheduleBuildPreparationAfterFrames(callback)
  }, [scheduleBuildPreparationAfterFrames])

  useEffect(() => {
    if (typeof Worker === 'undefined') {
      return
    }

    const worker = new Worker(new URL('./dungeonLightField.worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker

    function handleMessage(event: MessageEvent<{ requestId: number, result: BakedFloorLightFieldWorkerResult }>) {
      if (event.data.requestId !== requestIdRef.current) {
        return
      }
      const pendingBuild = pendingBuildRef.current
      if (!pendingBuild) {
        return
      }
      if (pendingBuild.workerBuild.workerInput.sourceHash !== event.data.result.sourceHash) {
        return
      }

      const nextField = traceBuildPerf('lightfield-apply-worker-result', {
        floorId: pendingBuild.prepared.floorId,
      }, () => applyBakedFloorLightFieldWorkerResult({
        prepared: pendingBuild.prepared,
        layout: pendingBuild.workerBuild.layout,
        result: event.data.result,
      }))
      pendingBuildRef.current = null
      setField(nextField)
    }

    worker.addEventListener('message', handleMessage)
    return () => {
      worker.removeEventListener('message', handleMessage)
      worker.terminate()
      workerRef.current = null
      pendingBuildRef.current = null
      queuedComputePrototypeRef.current = null
      computeDispatchPromiseRef.current = null
    }
  }, [])

  useEffect(() => {
    if (typeof Worker === 'undefined') {
      const nextField = getOrBuildBakedFloorLightField(input)
      pendingBuildRef.current = null
      setField((current) => (current === nextField ? current : nextField))
      return
    }

    let cancelled = false
    const runBuild = () => {
      if (cancelled) {
        return
      }

      const prepared = traceBuildPerf('lightfield-prepare-build', {
        floorId: input.floorId,
        deferPreparation,
      }, () => prepareBakedFloorLightFieldBuild(input))
      const cachedField = prepared.cachedField
      if (cachedField?.sourceHash === prepared.sourceHash) {
        pendingBuildRef.current = null
        setField((current) => (current === cachedField ? current : cachedField))
        return
      }

      const workerBuild = traceBuildPerf('lightfield-worker-build', {
        floorId: input.floorId,
      }, () => prepareBakedFloorLightFieldWorkerBuild(prepared))
      if (workerBuild && workerRef.current) {
        pendingBuildRef.current = {
          prepared,
          workerBuild,
        }
        traceBuildPerf('lightfield-worker-dispatch', {
          floorId: input.floorId,
          usePendingField: shouldShowPendingBakedFloorLightField({
            cachedField,
            bounds: workerBuild.layout.bounds,
            useFlickerTextures: workerBuild.layout.flickerStaticLightSources.length > 0,
          }),
        }, () => {
          requestIdRef.current += 1
          if (shouldShowPendingBakedFloorLightField({
            cachedField,
            bounds: workerBuild.layout.bounds,
            useFlickerTextures: workerBuild.layout.flickerStaticLightSources.length > 0,
          })) {
            const pendingField = createPendingBakedFloorLightField({
              prepared,
              layout: workerBuild.layout,
            })
            setField((current) => (current === pendingField ? current : pendingField))
          }
          workerRef.current?.postMessage({
            requestId: requestIdRef.current,
            input: workerBuild.workerInput,
          })
          if (enableGpuComputePrototype && renderer && canDispatchFloorLightComputePrototype(renderer)) {
            const computePrototype = prepareFloorLightComputePrototypeFromBuild(prepared, workerBuild)
            if (computePrototype) {
              queuedComputePrototypeRef.current = computePrototype
              setQueuedFloorLightComputePrototype(computePrototype)
              flushQueuedCompute()
            }
          }
        })
        return
      }

      const nextField = traceBuildPerf('lightfield-sync-build', {
        floorId: input.floorId,
      }, () => getOrBuildBakedFloorLightField(input))
      pendingBuildRef.current = null
      setField((current) => (current === nextField ? current : nextField))
    }

    if (deferPreparation) {
      const cancelScheduledBuild = scheduleBuildPreparation(runBuild)
      return () => {
        cancelled = true
        cancelScheduledBuild()
      }
    }

    runBuild()
    return () => {
      cancelled = true
    }
  }, [deferPreparation, enableGpuComputePrototype, flushQueuedCompute, input, renderer, scheduleBuildPreparation])

  return field
}
