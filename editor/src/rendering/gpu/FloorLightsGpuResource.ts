/**
 * Example concrete GPU resource implementation for floor lights.
 * 
 * This demonstrates how the FloorGpuResourceManager foundation can be extended
 * with specific resource types. This is a placeholder implementation that can
 * be expanded when integrating with actual WebGPU compute or light systems.
 */

import type { FloorDirtyInfo } from '../../store/floorDirtyDomains'
import type { FloorGpuResource, FloorGpuResourceFactory } from './FloorGpuResourceManager'

export interface FloorLightData {
  position: Float32Array
  color: Float32Array
  intensity: Float32Array
  radius: Float32Array
  count: number
}

/**
 * GPU resource for per-floor packed light data.
 * Mirrors CPU light state for GPU compute/rendering.
 */
export class FloorLightsGpuResource implements FloorGpuResource {
  readonly type = 'lights' as const
  readonly floorId: string
  
  private _disposed = false
  private _lightData: FloorLightData | null = null
  private _lastLightingVersion = -1
  private _maxLights: number
  
  constructor(floorId: string, maxLights: number = 256) {
    this.floorId = floorId
    this._maxLights = maxLights
    this._lightData = {
      position: new Float32Array(maxLights * 3),
      color: new Float32Array(maxLights * 3),
      intensity: new Float32Array(maxLights),
      radius: new Float32Array(maxLights),
      count: 0,
    }
  }
  
  dispose(): void {
    if (!this._disposed) {
      this._lightData = null
      this._disposed = true
    }
  }
  
  isDisposed(): boolean {
    return this._disposed
  }
  
  /**
   * Update light data based on dirty state.
   * Returns true if lights were updated, false if no update was needed.
   */
  update(dirtyInfo: FloorDirtyInfo): boolean {
    if (this._disposed) {
      return false
    }
    
    if (dirtyInfo.lightingVersion === this._lastLightingVersion) {
      return false
    }
    
    this._lastLightingVersion = dirtyInfo.lightingVersion
    
    return true
  }
  
  /**
   * Get the current light data for GPU upload.
   */
  getLightData(): FloorLightData | null {
    if (this._disposed) {
      return null
    }
    return this._lightData
  }
  
  /**
   * Get the maximum number of lights this resource can hold.
   */
  getMaxLights(): number {
    return this._maxLights
  }
}

/**
 * Factory for creating FloorLightsGpuResource instances.
 */
export class FloorLightsGpuResourceFactory implements FloorGpuResourceFactory<FloorLightsGpuResource> {
  readonly resourceType = 'lights' as const
  
  private _maxLights: number
  
  constructor(maxLights: number = 256) {
    this._maxLights = maxLights
  }
  
  create(floorId: string): FloorLightsGpuResource {
    return new FloorLightsGpuResource(floorId, this._maxLights)
  }
}
