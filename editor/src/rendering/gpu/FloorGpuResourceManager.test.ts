import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  FloorGpuResourceManager,
  type FloorGpuResource,
  type FloorGpuResourceFactory,
  type FloorGpuResourceType,
} from './FloorGpuResourceManager'
import { createFloorDirtyInfo } from '../../store/floorDirtyDomains'

class MockGpuResource implements FloorGpuResource {
  readonly type: FloorGpuResourceType
  readonly floorId: string
  
  private _disposed = false
  
  constructor(type: FloorGpuResourceType, floorId: string) {
    this.type = type
    this.floorId = floorId
  }
  
  dispose(): void {
    this._disposed = true
  }
  
  isDisposed(): boolean {
    return this._disposed
  }
  
  update = vi.fn(() => true)
}

class MockResourceFactory implements FloorGpuResourceFactory<MockGpuResource> {
  readonly resourceType: FloorGpuResourceType
  createFn = vi.fn((floorId: string) => new MockGpuResource(this.resourceType, floorId))
  
  constructor(resourceType: FloorGpuResourceType) {
    this.resourceType = resourceType
  }
  
  create(floorId: string): MockGpuResource {
    return this.createFn(floorId)
  }
}

describe('FloorGpuResourceManager', () => {
  let manager: FloorGpuResourceManager
  let lightsFactory: MockResourceFactory
  let wallsFactory: MockResourceFactory
  
  beforeEach(() => {
    manager = new FloorGpuResourceManager()
    lightsFactory = new MockResourceFactory('lights')
    wallsFactory = new MockResourceFactory('walls')
  })
  
  describe('factory registration', () => {
    it('registers and uses factories to create resources', () => {
      manager.registerFactory(lightsFactory)
      
      const resource = manager.getOrCreateResource('floor-1', 'lights')
      
      expect(resource).toBeTruthy()
      expect(resource?.floorId).toBe('floor-1')
      expect(resource?.type).toBe('lights')
      expect(lightsFactory.createFn).toHaveBeenCalledWith('floor-1')
    })
    
    it('throws when registering duplicate factory type', () => {
      manager.registerFactory(lightsFactory)
      const duplicateFactory = new MockResourceFactory('lights')
      
      expect(() => manager.registerFactory(duplicateFactory)).toThrow(
        'Factory for resource type "lights" is already registered'
      )
    })
    
    it('allows unregistering factories', () => {
      manager.registerFactory(lightsFactory)
      manager.unregisterFactory('lights')
      
      const resource = manager.getOrCreateResource('floor-1', 'lights')
      
      expect(resource).toBeNull()
    })
  })
  
  describe('resource lifecycle', () => {
    it('returns same resource instance for same floor and type', () => {
      manager.registerFactory(lightsFactory)
      
      const resource1 = manager.getOrCreateResource('floor-1', 'lights')
      const resource2 = manager.getOrCreateResource('floor-1', 'lights')
      
      expect(resource1).toBe(resource2)
      expect(lightsFactory.createFn).toHaveBeenCalledTimes(1)
    })
    
    it('creates different resources for different floors', () => {
      manager.registerFactory(lightsFactory)
      
      const resource1 = manager.getOrCreateResource('floor-1', 'lights')
      const resource2 = manager.getOrCreateResource('floor-2', 'lights')
      
      expect(resource1).not.toBe(resource2)
      expect(resource1?.floorId).toBe('floor-1')
      expect(resource2?.floorId).toBe('floor-2')
      expect(lightsFactory.createFn).toHaveBeenCalledTimes(2)
    })
    
    it('creates different resources for different types', () => {
      manager.registerFactory(lightsFactory)
      manager.registerFactory(wallsFactory)
      
      const lights = manager.getOrCreateResource('floor-1', 'lights')
      const walls = manager.getOrCreateResource('floor-1', 'walls')
      
      expect(lights).not.toBe(walls)
      expect(lights?.type).toBe('lights')
      expect(walls?.type).toBe('walls')
    })
    
    it('returns null for unknown resource types', () => {
      const resource = manager.getOrCreateResource('floor-1', 'lights')
      
      expect(resource).toBeNull()
    })
  })
  
  describe('resource querying', () => {
    it('checks if floor has resources', () => {
      manager.registerFactory(lightsFactory)
      
      expect(manager.hasFloor('floor-1')).toBe(false)
      
      manager.getOrCreateResource('floor-1', 'lights')
      
      expect(manager.hasFloor('floor-1')).toBe(true)
    })
    
    it('gets resource without creating', () => {
      manager.registerFactory(lightsFactory)
      
      const nonExistent = manager.getResource('floor-1', 'lights')
      expect(nonExistent).toBeNull()
      expect(lightsFactory.createFn).not.toHaveBeenCalled()
      
      manager.getOrCreateResource('floor-1', 'lights')
      
      const existing = manager.getResource('floor-1', 'lights')
      expect(existing).toBeTruthy()
      expect(lightsFactory.createFn).toHaveBeenCalledTimes(1)
    })
    
    it('lists resource types for a floor', () => {
      manager.registerFactory(lightsFactory)
      manager.registerFactory(wallsFactory)
      
      expect(manager.getFloorResourceTypes('floor-1')).toEqual([])
      
      manager.getOrCreateResource('floor-1', 'lights')
      expect(manager.getFloorResourceTypes('floor-1')).toEqual(['lights'])
      
      manager.getOrCreateResource('floor-1', 'walls')
      expect(manager.getFloorResourceTypes('floor-1')).toEqual(['lights', 'walls'])
    })
  })
  
  describe('resource disposal', () => {
    it('disposes specific resource', () => {
      manager.registerFactory(lightsFactory)
      
      const resource = manager.getOrCreateResource('floor-1', 'lights')
      expect(resource?.isDisposed()).toBe(false)
      
      manager.disposeResource('floor-1', 'lights')
      
      expect(resource?.isDisposed()).toBe(true)
      expect(manager.getResource('floor-1', 'lights')).toBeNull()
    })
    
    it('disposes all resources for a floor', () => {
      manager.registerFactory(lightsFactory)
      manager.registerFactory(wallsFactory)
      
      const lights = manager.getOrCreateResource('floor-1', 'lights')
      const walls = manager.getOrCreateResource('floor-1', 'walls')
      
      manager.disposeFloor('floor-1')
      
      expect(lights?.isDisposed()).toBe(true)
      expect(walls?.isDisposed()).toBe(true)
      expect(manager.hasFloor('floor-1')).toBe(false)
    })
    
    it('disposes all resources', () => {
      manager.registerFactory(lightsFactory)
      
      const resource1 = manager.getOrCreateResource('floor-1', 'lights')
      const resource2 = manager.getOrCreateResource('floor-2', 'lights')
      
      manager.disposeAll()
      
      expect(resource1?.isDisposed()).toBe(true)
      expect(resource2?.isDisposed()).toBe(true)
      expect(manager.hasFloor('floor-1')).toBe(false)
      expect(manager.hasFloor('floor-2')).toBe(false)
    })
    
    it('handles disposing non-existent resources gracefully', () => {
      expect(() => manager.disposeFloor('non-existent')).not.toThrow()
      expect(() => manager.disposeResource('non-existent', 'lights')).not.toThrow()
    })
  })
  
  describe('LRU eviction', () => {
    it('evicts least recently used floors when max is exceeded', () => {
      manager = new FloorGpuResourceManager({ maxFloors: 2 })
      manager.registerFactory(lightsFactory)
      
      const resource1 = manager.getOrCreateResource('floor-1', 'lights')
      const resource2 = manager.getOrCreateResource('floor-2', 'lights')
      const resource3 = manager.getOrCreateResource('floor-3', 'lights')
      
      expect(resource1?.isDisposed()).toBe(true)
      expect(resource2?.isDisposed()).toBe(false)
      expect(resource3?.isDisposed()).toBe(false)
      expect(manager.hasFloor('floor-1')).toBe(false)
      expect(manager.hasFloor('floor-2')).toBe(true)
      expect(manager.hasFloor('floor-3')).toBe(true)
    })
    
    it('updates access order when getting resources', () => {
      manager = new FloorGpuResourceManager({ maxFloors: 2 })
      manager.registerFactory(lightsFactory)
      
      const resource1 = manager.getOrCreateResource('floor-1', 'lights')
      const resource2 = manager.getOrCreateResource('floor-2', 'lights')
      
      manager.getOrCreateResource('floor-1', 'lights')
      
      const resource3 = manager.getOrCreateResource('floor-3', 'lights')
      
      expect(resource1?.isDisposed()).toBe(false)
      expect(resource2?.isDisposed()).toBe(true)
      expect(resource3?.isDisposed()).toBe(false)
      expect(manager.hasFloor('floor-1')).toBe(true)
      expect(manager.hasFloor('floor-2')).toBe(false)
      expect(manager.hasFloor('floor-3')).toBe(true)
    })
    
    it('getResource does not update LRU order', () => {
      manager = new FloorGpuResourceManager({ maxFloors: 2 })
      manager.registerFactory(lightsFactory)
      
      const resource1 = manager.getOrCreateResource('floor-1', 'lights')
      const resource2 = manager.getOrCreateResource('floor-2', 'lights')
      
      manager.getResource('floor-1', 'lights')
      
      const resource3 = manager.getOrCreateResource('floor-3', 'lights')
      
      expect(resource1?.isDisposed()).toBe(true)
      expect(resource2?.isDisposed()).toBe(false)
      expect(resource3?.isDisposed()).toBe(false)
    })
  })
  
  describe('resource updates', () => {
    it('calls update on resources with dirty info', () => {
      manager.registerFactory(lightsFactory)
      
      const resource = manager.getOrCreateResource('floor-1', 'lights')
      const dirtyInfo = createFloorDirtyInfo()
      dirtyInfo.lightingVersion = 5
      
      manager.updateFloorResources('floor-1', dirtyInfo)
      
      expect(resource?.update).toHaveBeenCalledWith(dirtyInfo)
    })
    
    it('skips disposed resources', () => {
      manager.registerFactory(lightsFactory)
      
      const resource = manager.getOrCreateResource('floor-1', 'lights')
      resource?.dispose()
      
      const dirtyInfo = createFloorDirtyInfo()
      manager.updateFloorResources('floor-1', dirtyInfo)
      
      expect(resource?.update).not.toHaveBeenCalled()
    })
    
    it('handles floors with no resources', () => {
      const dirtyInfo = createFloorDirtyInfo()
      
      expect(() => manager.updateFloorResources('non-existent', dirtyInfo)).not.toThrow()
    })
  })
  
  describe('statistics', () => {
    it('provides resource usage stats', () => {
      manager.registerFactory(lightsFactory)
      manager.registerFactory(wallsFactory)
      
      manager.getOrCreateResource('floor-1', 'lights')
      manager.getOrCreateResource('floor-1', 'walls')
      manager.getOrCreateResource('floor-2', 'lights')
      
      const stats = manager.getStats()
      
      expect(stats.floorCount).toBe(2)
      expect(stats.totalResources).toBe(3)
      expect(stats.maxFloors).toBe(10)
      expect(stats.floorCounts.get('floor-1')).toBe(2)
      expect(stats.floorCounts.get('floor-2')).toBe(1)
      expect(stats.accessOrder).toEqual(['floor-1', 'floor-2'])
    })
  })
})
