/**
 * FloorGpuResourceManager — Per-floor GPU resource lifecycle management
 * 
 * This manager provides a bounded, per-floor GPU resource layer that mirrors
 * authoritative CPU/Zustand dungeon state. It is designed to be extended with
 * specific resource types (lights, walls, baked-light textures, etc.) while
 * maintaining clean ownership and lifecycle semantics.
 * 
 * Key principles:
 * - Zustand/CPU state remains the source of truth
 * - GPU resources are derived mirrors, not canonical state
 * - Per-floor resource isolation with explicit lifecycle
 * - Narrow integration points for future compute/light work
 */

import type { FloorDirtyInfo } from '../../store/floorDirtyDomains'

export type FloorGpuResourceType = 
  | 'lights'
  | 'walls'
  | 'bakedLightTexture'
  | 'occupancy'
  | 'custom'

export interface FloorGpuResource {
  readonly type: FloorGpuResourceType
  readonly floorId: string
  
  /**
   * Dispose GPU resources. Must be idempotent (safe to call multiple times).
   */
  dispose(): void
  
  /**
   * Check if this resource has been disposed.
   */
  isDisposed(): boolean
  
  /**
   * Update the resource based on dirty state changes.
   * Returns true if the resource was actually updated, false if no update was needed.
   */
  update?(dirtyInfo: FloorDirtyInfo): boolean
}

export interface FloorGpuResourceFactory<T extends FloorGpuResource = FloorGpuResource> {
  readonly resourceType: FloorGpuResourceType
  
  /**
   * Create a new GPU resource for the given floor.
   */
  create(floorId: string): T
}

export interface FloorGpuResourceManagerOptions {
  /**
   * Maximum number of floors to keep GPU resources for.
   * When exceeded, least recently used floors are evicted.
   * Default: 10
   */
  maxFloors?: number
}

/**
 * Manages per-floor GPU resources with automatic lifecycle and LRU eviction.
 */
export class FloorGpuResourceManager {
  private readonly floorResources = new Map<string, Map<FloorGpuResourceType, FloorGpuResource>>()
  private readonly factories = new Map<FloorGpuResourceType, FloorGpuResourceFactory>()
  private readonly accessOrder: string[] = []
  private readonly maxFloors: number
  
  constructor(options: FloorGpuResourceManagerOptions = {}) {
    this.maxFloors = options.maxFloors ?? 10
  }
  
  /**
   * Register a factory for creating GPU resources of a specific type.
   */
  registerFactory(factory: FloorGpuResourceFactory): void {
    if (this.factories.has(factory.resourceType)) {
      throw new Error(`Factory for resource type "${factory.resourceType}" is already registered`)
    }
    this.factories.set(factory.resourceType, factory)
  }
  
  /**
   * Unregister a factory. Does not dispose existing resources.
   */
  unregisterFactory(resourceType: FloorGpuResourceType): void {
    this.factories.delete(resourceType)
  }
  
  /**
   * Get or create a GPU resource for a floor.
   * Updates LRU access tracking.
   */
  getOrCreateResource<T extends FloorGpuResource>(
    floorId: string,
    resourceType: FloorGpuResourceType,
  ): T | null {
    this.updateAccessOrder(floorId)
    
    let floorResourceMap = this.floorResources.get(floorId)
    
    if (!floorResourceMap) {
      floorResourceMap = new Map()
      this.floorResources.set(floorId, floorResourceMap)
      this.enforceMaxFloors()
    }
    
    let resource = floorResourceMap.get(resourceType)
    
    if (!resource) {
      const factory = this.factories.get(resourceType)
      if (!factory) {
        return null
      }
      
      resource = factory.create(floorId)
      floorResourceMap.set(resourceType, resource)
    }
    
    return resource as T
  }
  
  /**
   * Get an existing GPU resource without creating it.
   * Does not update LRU access tracking.
   */
  getResource<T extends FloorGpuResource>(
    floorId: string,
    resourceType: FloorGpuResourceType,
  ): T | null {
    const floorResourceMap = this.floorResources.get(floorId)
    if (!floorResourceMap) {
      return null
    }
    
    const resource = floorResourceMap.get(resourceType)
    return resource ? (resource as T) : null
  }
  
  /**
   * Check if a floor has any GPU resources allocated.
   */
  hasFloor(floorId: string): boolean {
    return this.floorResources.has(floorId)
  }
  
  /**
   * Get all resource types allocated for a floor.
   */
  getFloorResourceTypes(floorId: string): FloorGpuResourceType[] {
    const floorResourceMap = this.floorResources.get(floorId)
    return floorResourceMap ? Array.from(floorResourceMap.keys()) : []
  }
  
  /**
   * Dispose and remove all resources for a specific floor.
   */
  disposeFloor(floorId: string): void {
    const floorResourceMap = this.floorResources.get(floorId)
    
    if (floorResourceMap) {
      for (const resource of floorResourceMap.values()) {
        resource.dispose()
      }
      floorResourceMap.clear()
      this.floorResources.delete(floorId)
    }
    
    const accessIndex = this.accessOrder.indexOf(floorId)
    if (accessIndex !== -1) {
      this.accessOrder.splice(accessIndex, 1)
    }
  }
  
  /**
   * Dispose a specific resource type for a floor.
   */
  disposeResource(floorId: string, resourceType: FloorGpuResourceType): void {
    const floorResourceMap = this.floorResources.get(floorId)
    
    if (floorResourceMap) {
      const resource = floorResourceMap.get(resourceType)
      if (resource) {
        resource.dispose()
        floorResourceMap.delete(resourceType)
        
        if (floorResourceMap.size === 0) {
          this.floorResources.delete(floorId)
          const accessIndex = this.accessOrder.indexOf(floorId)
          if (accessIndex !== -1) {
            this.accessOrder.splice(accessIndex, 1)
          }
        }
      }
    }
  }
  
  /**
   * Update resources for a floor based on dirty state.
   * Only updates resources that have an update() method.
   */
  updateFloorResources(floorId: string, dirtyInfo: FloorDirtyInfo): void {
    const floorResourceMap = this.floorResources.get(floorId)
    
    if (floorResourceMap) {
      for (const resource of floorResourceMap.values()) {
        if (resource.update && !resource.isDisposed()) {
          resource.update(dirtyInfo)
        }
      }
    }
  }
  
  /**
   * Dispose and remove all GPU resources.
   */
  disposeAll(): void {
    for (const floorId of Array.from(this.floorResources.keys())) {
      this.disposeFloor(floorId)
    }
    this.accessOrder.length = 0
  }
  
  /**
   * Get statistics about resource usage.
   */
  getStats() {
    let totalResources = 0
    const floorCounts = new Map<string, number>()
    
    for (const [floorId, resourceMap] of this.floorResources.entries()) {
      const count = resourceMap.size
      floorCounts.set(floorId, count)
      totalResources += count
    }
    
    return {
      floorCount: this.floorResources.size,
      totalResources,
      maxFloors: this.maxFloors,
      floorCounts,
      accessOrder: [...this.accessOrder],
    }
  }
  
  private updateAccessOrder(floorId: string): void {
    const existingIndex = this.accessOrder.indexOf(floorId)
    
    if (existingIndex !== -1) {
      this.accessOrder.splice(existingIndex, 1)
    }
    
    this.accessOrder.push(floorId)
  }
  
  private enforceMaxFloors(): void {
    while (this.floorResources.size > this.maxFloors && this.accessOrder.length > 0) {
      const lruFloorId = this.accessOrder[0]
      if (lruFloorId) {
        this.disposeFloor(lruFloorId)
      }
    }
  }
}
