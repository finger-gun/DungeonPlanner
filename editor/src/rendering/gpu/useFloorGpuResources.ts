/**
 * React hook for managing per-floor GPU resources in the Scene.
 * 
 * This provides a narrow, additive integration point for the GPU resource
 * layer. It can be optionally used in components that need GPU resources
 * without disrupting existing rendering paths.
 */

import { useEffect, useMemo, useRef } from 'react'
import { FloorGpuResourceManager } from './FloorGpuResourceManager'
import { useDungeonStore } from '../../store/useDungeonStore'

export interface UseFloorGpuResourcesOptions {
  /**
   * Maximum number of floors to keep GPU resources for.
   * Default: 10
   */
  maxFloors?: number
  
  /**
   * Whether to automatically update resources on floor changes.
   * Default: true
   */
  autoUpdate?: boolean
}

/**
 * Hook to access the FloorGpuResourceManager for the current scene.
 * 
 * The manager persists across re-renders and automatically disposes
 * resources when the component unmounts.
 * 
 * Example usage:
 * ```tsx
 * const manager = useFloorGpuResources()
 * 
 * // Register a factory (typically once during initialization)
 * useEffect(() => {
 *   const factory = new FloorLightsGpuResourceFactory()
 *   manager.registerFactory(factory)
 *   return () => manager.unregisterFactory('lights')
 * }, [manager])
 * 
 * // Get or create a resource for the active floor
 * const lightsResource = manager.getOrCreateResource(activeFloorId, 'lights')
 * ```
 */
export function useFloorGpuResources(
  options: UseFloorGpuResourcesOptions = {}
): FloorGpuResourceManager {
  const { maxFloors = 10, autoUpdate = true } = options
  
  const managerRef = useRef<FloorGpuResourceManager | null>(null)
  
  if (!managerRef.current) {
    managerRef.current = new FloorGpuResourceManager({ maxFloors })
  }
  
  const manager = managerRef.current
  
  const activeFloorId = useDungeonStore((state) => state.activeFloorId)
  const floorDirtyDomains = useDungeonStore((state) => state.floorDirtyDomains)
  
  useEffect(() => {
    if (!autoUpdate || !manager) {
      return
    }
    
    const dirtyInfo = floorDirtyDomains[activeFloorId]
    if (dirtyInfo) {
      manager.updateFloorResources(activeFloorId, dirtyInfo)
    }
  }, [manager, activeFloorId, floorDirtyDomains, autoUpdate])
  
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.disposeAll()
        managerRef.current = null
      }
    }
  }, [])
  
  return manager
}

/**
 * Hook to get stats about GPU resource usage.
 * Useful for debugging and monitoring.
 */
export function useFloorGpuResourceStats(manager: FloorGpuResourceManager) {
  return useMemo(() => manager.getStats(), [manager])
}
