/**
 * GPU Resource Management Layer
 * 
 * This module provides a foundation for per-floor GPU resource management.
 * 
 * ## Architecture
 * 
 * - **FloorGpuResourceManager**: Core manager for per-floor GPU resources with LRU eviction
 * - **FloorGpuResource**: Interface for GPU resources (lights, walls, textures, etc.)
 * - **FloorGpuResourceFactory**: Factory pattern for creating GPU resources
 * - **useFloorGpuResources**: React hook for scene integration
 * 
 * ## Key Principles
 * 
 * 1. **CPU state is authoritative**: Zustand/CPU dungeon state remains the source of truth
 * 2. **GPU resources are derived mirrors**: They reflect CPU state, not replace it
 * 3. **Per-floor isolation**: Resources are scoped to individual floors
 * 4. **Explicit lifecycle**: Resources have clear creation, update, and disposal semantics
 * 5. **LRU eviction**: Automatic cleanup of inactive floor resources
 * 
 * ## Usage Example
 * 
 * In a Scene component:
 * 1. Use the useFloorGpuResources hook to get a manager instance
 * 2. Register factories during initialization
 * 3. Get or create resources for the active floor
 * 4. Use resources in rendering or compute
 * 
 * ## Extending with New Resource Types
 * 
 * 1. Implement FloorGpuResource interface with type, dispose, isDisposed, and optional update
 * 2. Create a factory class implementing FloorGpuResourceFactory
 * 3. Register the factory with the manager
 */

export {
  FloorGpuResourceManager,
  type FloorGpuResource,
  type FloorGpuResourceFactory,
  type FloorGpuResourceType,
  type FloorGpuResourceManagerOptions,
} from './FloorGpuResourceManager'

export {
  FloorLightsGpuResource,
  FloorLightsGpuResourceFactory,
  type FloorLightData,
} from './FloorLightsGpuResource'

export {
  clearFloorLightComputeBridge,
  getFloorLightComputeBridgeEntry,
  markFloorLightComputePrototypeDispatched,
  markFloorLightComputePrototypeFailed,
  pruneFloorLightComputeBridge,
  setQueuedFloorLightComputePrototype,
  type FloorLightComputeBridgeEntry,
  type FloorLightComputeBridgeStatus,
} from './FloorLightComputeBridge'

export {
  canDispatchFloorLightComputePrototype,
  dispatchFloorLightComputePrototype,
  type FloorLightComputeRenderer,
} from './FloorLightComputeRuntime'

export {
  DEFAULT_FLOOR_WALL_TILE_MIRROR_CHUNK_SIZE,
  FLOOR_INNER_WALL_MIRROR_STRIDE,
  FLOOR_OPENING_MIRROR_STRIDE,
  FLOOR_TILE_MIRROR_STRIDE,
  packFloorWallTileMirrorPrototype,
  type FloorWallTileMirrorPrototypeInput,
  type FloorWallTileMirrorPrototypePackedJob,
} from './FloorWallTileMirrorPrototype'

export {
  createFloorLightComputePrototypeDispatch,
  DEFAULT_FLOOR_LIGHT_COMPUTE_MAX_LIGHTS,
  DEFAULT_FLOOR_LIGHT_COMPUTE_WORKGROUP_SIZE,
  FLOOR_LIGHT_COMPUTE_CELL_STRIDE,
  FLOOR_LIGHT_COMPUTE_CONFIG_VECTORS,
  FLOOR_LIGHT_COMPUTE_LIGHT_VECTORS_PER_LIGHT,
  getFloorLightComputePrototypeTransferables,
  packFloorLightComputePrototype,
  prepareFloorLightComputePrototype,
  prepareFloorLightComputePrototypeFromBuild,
  type FloorLightComputePrototypeBuffer,
  type FloorLightComputePrototypeDispatch,
  type FloorLightComputePrototypeOptions,
  type FloorLightComputePrototypePackedBuffers,
  type FloorLightComputePrototypePackedJob,
  type FloorLightComputePrototypePackInput,
  type PreparedFloorLightComputePrototype,
} from './FloorLightComputePrototype'

export {
  TileGpuStream,
  getTileGpuStreamMountId,
  type TilePageStatus,
  type TileStreamTransactionStatus,
  type TileUploadProgress,
  type TileStreamPreviewMode,
  type TileStreamAssetContext,
  type ResolvedTileStreamGroup,
} from './TileGpuStream'

export {
  TileGpuUploadScheduler,
  coalesceTileUploadRanges,
  type TileUploadBudget,
  type TilePageUpload,
  type TileUploadBudgetResult,
} from './TileGpuUploadScheduler'

export {
  useFloorGpuResources,
  useFloorGpuResourceStats,
  type UseFloorGpuResourcesOptions,
} from './useFloorGpuResources'
