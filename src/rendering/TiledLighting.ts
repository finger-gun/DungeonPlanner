// @ts-nocheck
import { Lighting } from 'three/webgpu'
import DungeonPlannerTiledLightsNode from './TiledLightsNode'

export class TiledLighting extends Lighting {
  constructor(maxLights = 1024, tileSize = 32) {
    super()
    this.maxLights = maxLights
    this.tileSize = tileSize
  }

  override createNode(lights = []) {
    return new DungeonPlannerTiledLightsNode(this.maxLights, this.tileSize).setLights(lights)
  }
}

export default TiledLighting
