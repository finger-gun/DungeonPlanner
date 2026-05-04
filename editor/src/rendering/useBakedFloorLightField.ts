import { useCallback, useEffect, useRef, useState } from 'react'
import {
  applyBakedFloorLightFieldWorkerResult,
  createEmptyBakedFloorLightField,
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
  enabled?: boolean
  renderer?: unknown
  enableGpuComputePrototype?: boolean
  deferPreparation?: boolean
}

type PendingBakedFloorLightFieldBuild = {
  prepared: PreparedBakedFloorLightFieldBuild
  workerBuild: NonNullable<ReturnType<typeof prepareBakedFloorLightFieldWorkerBuild>>
  pendingField: BakedFloorLightField | null
}

export function useBakedFloorLightField(
  input: BakedFloorLightFieldBuildInput,
  options: UseBakedFloorLightFieldOptions = {},
): BakedFloorLightField {
  const {
    enabled = true,
    renderer = null,
    enableGpuComputePrototype = false,
    deferPreparation = false,
  } = options
  const [field, setField] = useState<BakedFloorLightField>(() => {
    if (!enabled) {
      return createEmptyBakedFloorLightField(input.floorId, input.chunkSize)
    }
    if (typeof Worker === 'undefined') {
      return getOrBuildBakedFloorLightField(input)
    }

    const prepared = prepareBakedFloorLightFieldBuild(input)
    const workerBuild = prepareBakedFloorLightFieldWorkerBuild(prepared)
    if (!workerBuild) {
      return getOrBuildBakedFloorLightField(input)
    }

    if (prepared.cachedField) {
      return prepared.cachedField
    }

    return createPendingBakedFloorLightField({
      prepared,
      layout: workerBuild.layout,
    })
  })
  // Always synced with the latest field — used inside async callbacks (worker handler,
  // deferred build) to access the current state without stale closures.
  const fieldRef = useRef(field)
  fieldRef.current = field
  const workerRef = useRef<Worker | null>(null)
  const requestIdRef = useRef(0)
  const pendingBuildRef = useRef<PendingBakedFloorLightFieldBuild | null>(null)
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
          console.error('Failed to dispatch floor light compute for floor', prototype.prepared.floorId, error)
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

      // Prefer the currently-bound field for texture reuse: the stream materials are
      // already sampling fieldRef.current's textures, so filling them in-place makes
      // the result immediately visible without any re-registration or repipeline.
      const textureReuseField = fieldRef.current ?? pendingBuild.pendingField
      const nextField = traceBuildPerf('lightfield-apply-worker-result', {
        floorId: pendingBuild.prepared.floorId,
      }, () => applyBakedFloorLightFieldWorkerResult({
        prepared: pendingBuild.prepared,
        layout: pendingBuild.workerBuild.layout,
        result: event.data.result,
        textureReuseField,
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
    if (!enabled) {
      pendingBuildRef.current = null
      queuedComputePrototypeRef.current = null
      computeDispatchPromiseRef.current = null
      const nextField = createEmptyBakedFloorLightField(input.floorId, input.chunkSize)
      setField((current) =>
        current.floorId === nextField.floorId
        && current.chunkSize === nextField.chunkSize
        && current.bounds === null
          ? current
          : nextField,
      )
      return
    }

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
        const usePendingField = shouldShowPendingBakedFloorLightField({
          cachedField,
          bounds: workerBuild.layout.bounds,
          useFlickerTextures: workerBuild.layout.flickerStaticLightSources.length > 0,
        })
        const reusablePendingField = (() => {
          if (!usePendingField) return null
          // Prefer the current state's field when it matches the source hash.
          // This is the field whose textures are already bound to stream materials,
          // so filling it in-place avoids any re-registration or repipeline churn.
          // This correctly handles React Strict Mode's double-invocation of the
          // useState initializer (which can create a mismatched initialPendingBuildRef)
          // and the effect cleanup/remount cycle (which clears pendingBuildRef).
          const currentField = fieldRef.current
          if (
            currentField.floorId === prepared.floorId
            && currentField.sourceHash === prepared.sourceHash
          ) {
            return currentField
          }
          // Fall back to pendingBuildRef when the current field is from a different state
          // (e.g. switching floors or editing a room while a build is in-flight).
          if (
            pendingBuildRef.current?.pendingField
            && pendingBuildRef.current.prepared.floorId === prepared.floorId
            && pendingBuildRef.current.prepared.sourceHash === prepared.sourceHash
          ) {
            return pendingBuildRef.current.pendingField
          }
          return null
        })()
        const pendingField = usePendingField
          ? reusablePendingField ?? createPendingBakedFloorLightField({
            prepared,
            layout: workerBuild.layout,
          })
          : null
        pendingBuildRef.current = {
          prepared,
          workerBuild,
          pendingField,
        }
        traceBuildPerf('lightfield-worker-dispatch', {
          floorId: input.floorId,
          usePendingField,
        }, () => {
          requestIdRef.current += 1
          if (pendingField) {
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
  }, [deferPreparation, enabled, enableGpuComputePrototype, flushQueuedCompute, input, renderer, scheduleBuildPreparation])

  return field
}
