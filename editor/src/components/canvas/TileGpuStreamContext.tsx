import { useEffect, useRef, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { TileGpuStream } from '../../rendering/gpu/TileGpuStream'
import { useDungeonStore } from '../../store/useDungeonStore'
import { getTileStreamUploadBudget } from './TileGpuStreamContextShared'
import { TileGpuStreamContext, useTileGpuStream } from './TileGpuStreamHooks'

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

export function TileGpuStreamMount({ mountId }: { mountId: string }) {
  const stream = useTileGpuStream()
  const group = stream.getMountGroup(mountId)
  return <primitive object={group} />
}
