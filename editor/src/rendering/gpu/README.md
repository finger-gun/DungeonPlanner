# GPU Floor Resource Management

This module provides a foundation for managing per-floor GPU resources in DungeonPlanner.

## Overview

The GPU resource layer provides bounded, per-floor GPU resources that mirror the authoritative CPU/Zustand dungeon state. It's designed as an additive foundation that can be extended with specific resource types (lights, walls, baked-light textures, etc.) while maintaining clean ownership and lifecycle semantics.

## Architecture

### Core Components

- **FloorGpuResourceManager**: Central manager for per-floor GPU resources with LRU eviction
- **FloorGpuResource**: Interface that all GPU resources must implement
- **FloorGpuResourceFactory**: Factory pattern for creating GPU resources
- **useFloorGpuResources**: React hook for scene integration

### Key Principles

1. **CPU state is authoritative**: Zustand/CPU dungeon state remains the source of truth
2. **GPU resources are derived mirrors**: They reflect CPU state, not replace it
3. **Per-floor isolation**: Resources are scoped to individual floors
4. **Explicit lifecycle**: Resources have clear creation, update, and disposal semantics
5. **LRU eviction**: Automatic cleanup of inactive floor resources (default: max 10 floors)

## Usage

### Basic Hook Usage

```tsx
import { useFloorGpuResources } from './rendering/gpu'
import { FloorLightsGpuResourceFactory } from './rendering/gpu'

function MySceneComponent() {
  const manager = useFloorGpuResources({ maxFloors: 10 })
  const activeFloorId = useDungeonStore(state => state.activeFloorId)
  
  // Register factory once during initialization
  useEffect(() => {
    const factory = new FloorLightsGpuResourceFactory(256)
    manager.registerFactory(factory)
    return () => manager.unregisterFactory('lights')
  }, [manager])
  
  // Get or create resource for active floor
  const lightsResource = manager.getOrCreateResource(activeFloorId, 'lights')
  
  // Use the resource
  if (lightsResource && !lightsResource.isDisposed()) {
    const lightData = lightsResource.getLightData()
    // Upload to GPU, use in shaders, etc.
  }
}
```

### Creating Custom Resources

1. Implement the `FloorGpuResource` interface:

```ts
import type { FloorGpuResource } from './rendering/gpu'
import type { FloorDirtyInfo } from '../store/floorDirtyDomains'

class MyCustomGpuResource implements FloorGpuResource {
  readonly type = 'custom' as const
  readonly floorId: string
  
  private _disposed = false
  private _data: YourDataType | null = null
  
  constructor(floorId: string) {
    this.floorId = floorId
    // Initialize GPU resources
  }
  
  dispose(): void {
    if (!this._disposed) {
      // Clean up GPU resources
      this._data = null
      this._disposed = true
    }
  }
  
  isDisposed(): boolean {
    return this._disposed
  }
  
  update(dirtyInfo: FloorDirtyInfo): boolean {
    if (this._disposed) return false
    
    // Check relevant dirty flags and update if needed
    // Return true if updated, false if no update was needed
    return true
  }
}
```

2. Create a factory:

```ts
import type { FloorGpuResourceFactory } from './rendering/gpu'

class MyCustomGpuResourceFactory implements FloorGpuResourceFactory<MyCustomGpuResource> {
  readonly resourceType = 'custom' as const
  
  create(floorId: string): MyCustomGpuResource {
    return new MyCustomGpuResource(floorId)
  }
}
```

3. Register with the manager:

```ts
const factory = new MyCustomGpuResourceFactory()
manager.registerFactory(factory)
```

## Resource Types

The following resource types are defined:

- `'lights'`: Per-floor light data (example implementation provided)
- `'walls'`: Wall geometry/data (placeholder for future)
- `'bakedLightTexture'`: Baked lighting textures (placeholder for future)
- `'occupancy'`: Occupancy grid data (placeholder for future)
- `'custom'`: Custom resource types

## LRU Eviction

The manager automatically evicts least recently used floors when the maximum number of floors is exceeded. The default limit is 10 floors, configurable via the `maxFloors` option.

Access order is updated when calling `getOrCreateResource()`, but not when calling `getResource()`.

## Integration Points

### Narrow Integration

The GPU resource layer is designed to be optionally used without disrupting existing rendering paths:

1. Use `useFloorGpuResources()` hook in components that need GPU resources
2. Register factories during component initialization
3. Resources automatically update when dirty state changes (if `autoUpdate: true`)
4. Resources automatically dispose on component unmount

### Dirty State Integration

Resources can implement the optional `update(dirtyInfo: FloorDirtyInfo)` method to sync with CPU state changes. The manager will automatically call this method when the active floor's dirty state changes.

## Testing

Comprehensive unit tests are provided in `FloorGpuResourceManager.test.ts`, covering:

- Factory registration and resource creation
- Resource lifecycle (creation, disposal, reuse)
- LRU eviction behavior
- Resource querying and statistics
- Dirty state updates

Run tests with:

```bash
pnpm run test -- FloorGpuResourceManager.test.ts
```

## Future Extensions

This foundation is designed to support future work on:

- GPU compute for light baking
- WebGPU-based visibility/occlusion
- Packed wall/tile geometry mirrors
- Custom shader integrations

## Files

- `FloorGpuResourceManager.ts`: Core manager implementation
- `FloorGpuResourceManager.test.ts`: Unit tests
- `FloorLightsGpuResource.ts`: Example concrete resource implementation
- `useFloorGpuResources.ts`: React hook for scene integration
- `index.ts`: Module exports
- `README.md`: This documentation
