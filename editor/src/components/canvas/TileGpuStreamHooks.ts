import { createContext, useContext, useSyncExternalStore } from 'react'
import { TileGpuStream } from '../../rendering/gpu/TileGpuStream'

export const TileGpuStreamContext = createContext<TileGpuStream | null>(null)

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
