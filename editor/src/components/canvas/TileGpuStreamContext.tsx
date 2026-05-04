import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { TileGpuStream, getTileGpuStreamMountId } from '../../rendering/gpu/TileGpuStream'
import { useDungeonStore } from '../../store/useDungeonStore'
import type { TileUploadBudget } from '../../rendering/gpu/TileGpuUploadScheduler'

const TileGpuStreamContext = createContext<TileGpuStream | null>(null)

export function getTileStreamUploadBudget(isInteractionActive: boolean): TileUploadBudget {
  return isInteractionActive
    ? { maxMs: 0.5, maxPages: 1 }
    : { maxMs: 2, maxPages: 1 }
}

export function TileGpuStreamProvider({ children }: { children: ReactNode }) {
  const invalidate = useThree((state) => state.invalidate)
  const isPaintingStrokeActive = useDungeonStore((state) => state.isPaintingStrokeActive)
  const isObjectDragActive = useDungeonStore((state) => state.isObjectDragActive)
  const isRoomResizeHandleActive = useDungeonStore((state) => state.isRoomResizeHandleActive)
  const streamRef = useRef<TileGpuStream | null>(null)

  if (!streamRef.current) {
    streamRef.current = new TileGpuStream({ invalidate })
  }

  const isInteractionActive =
    isPaintingStrokeActive
    || isObjectDragActive
    || isRoomResizeHandleActive

  useFrame(() => {
    const stream = streamRef.current
    if (!stream?.hasPendingTileUploads()) {
      return
    }

    stream.processTileUploadBudget(getTileStreamUploadBudget(isInteractionActive))
  })

  useEffect(() => () => {
    streamRef.current?.dispose()
    streamRef.current = null
  }, [])

  return (
    <TileGpuStreamContext.Provider value={streamRef.current}>
      {children}
    </TileGpuStreamContext.Provider>
  )
}

export function useTileGpuStream() {
  const stream = useContext(TileGpuStreamContext)
  if (!stream) {
    throw new Error('TileGpuStreamContext is missing a provider.')
  }
  return stream
}

export function useTileGpuStreamVersion() {
  const stream = useTileGpuStream()
  return useSyncExternalStore(stream.subscribe, stream.getVersion)
}

export function TileGpuStreamMount({ mountId }: { mountId: string }) {
  const stream = useTileGpuStream()
  const group = stream.getMountGroup(mountId)
  return <primitive object={group} />
}

export { getTileGpuStreamMountId }
