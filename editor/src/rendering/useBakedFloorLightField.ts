import { useEffect, useMemo, useRef, useState } from 'react'
import {
  applyBakedFloorLightFieldWorkerResult,
  getOrBuildBakedFloorLightField,
  prepareBakedFloorLightFieldBuild,
  prepareBakedFloorLightFieldWorkerBuild,
  type BakedFloorLightField,
  type BakedFloorLightFieldBuildInput,
  type BakedFloorLightFieldWorkerResult,
} from './dungeonLightField'

export function useBakedFloorLightField(input: BakedFloorLightFieldBuildInput) {
  const prepared = useMemo(
    () => prepareBakedFloorLightFieldBuild(input),
    [input.chunkSize, input.floorCells, input.floorId, input.occlusionInput, input.staticLightSources],
  )
  const [field, setField] = useState<BakedFloorLightField>(() => getOrBuildBakedFloorLightField(input))
  const workerRef = useRef<Worker | null>(null)
  const requestIdRef = useRef(0)
  const pendingBuildRef = useRef<{
    prepared: typeof prepared
    workerBuild: NonNullable<ReturnType<typeof prepareBakedFloorLightFieldWorkerBuild>>
  } | null>(null)

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

      const nextField = applyBakedFloorLightFieldWorkerResult({
        prepared: pendingBuild.prepared,
        layout: pendingBuild.workerBuild.layout,
        result: event.data.result,
      })
      pendingBuildRef.current = null
      setField(nextField)
    }

    worker.addEventListener('message', handleMessage)
    return () => {
      worker.removeEventListener('message', handleMessage)
      worker.terminate()
      workerRef.current = null
      pendingBuildRef.current = null
    }
  }, [])

  useEffect(() => {
    const cachedField = prepared.cachedField
    if (!cachedField || cachedField.sourceHash === prepared.sourceHash) {
      const nextField = getOrBuildBakedFloorLightField(input)
      pendingBuildRef.current = null
      setField((current) => (current === nextField ? current : nextField))
      return
    }

    const workerBuild = prepareBakedFloorLightFieldWorkerBuild(prepared)
    if (!workerBuild || !workerRef.current) {
      const nextField = getOrBuildBakedFloorLightField(input)
      pendingBuildRef.current = null
      setField((current) => (current === nextField ? current : nextField))
      return
    }

    pendingBuildRef.current = {
      prepared,
      workerBuild,
    }
    requestIdRef.current += 1
    setField((current) => (current === cachedField ? current : cachedField))
    workerRef.current.postMessage({
      requestId: requestIdRef.current,
      input: workerBuild.workerInput,
    })
  }, [input, prepared])

  return field
}
