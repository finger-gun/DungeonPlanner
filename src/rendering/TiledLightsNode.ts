// @ts-nocheck
import {
  DataTexture,
  FloatType,
  LightsNode,
  NodeUpdateType,
  RGBAFormat,
  Vector2,
  Vector3,
} from 'three/webgpu'
import {
  attributeArray,
  Break,
  directPointLight,
  float,
  Fn,
  If,
  instanceIndex,
  int,
  ivec2,
  ivec4,
  Loop,
  nodeProxy,
  positionView,
  Return,
  screenCoordinate,
  textureLoad,
  uniform,
  vec2,
} from 'three/tsl'

export const circleIntersectsAABB = Fn(([circleCenter, radius, minBounds, maxBounds]) => {
  const closestX = minBounds.x.max(circleCenter.x.min(maxBounds.x))
  const closestY = minBounds.y.max(circleCenter.y.min(maxBounds.y))
  const distX = circleCenter.x.sub(closestX)
  const distY = circleCenter.y.sub(closestY)
  const distSquared = distX.mul(distX).add(distY.mul(distY))

  return distSquared.lessThanEqual(radius.mul(radius))
}).setLayout({
  name: 'circleIntersectsAABB',
  type: 'bool',
  inputs: [
    { name: 'circleCenter', type: 'vec2' },
    { name: 'radius', type: 'float' },
    { name: 'minBounds', type: 'vec2' },
    { name: 'maxBounds', type: 'vec2' },
  ],
})

const vector3Scratch = new Vector3()
const sizeScratch = new Vector2()

class DungeonPlannerTiledLightsNode extends LightsNode {
  static override get type() {
    return 'DungeonPlannerTiledLightsNode'
  }

  constructor(maxLights = 1024, tileSize = 32) {
    super()

    this.materialLights = []
    this.tiledLights = []
    this.maxLights = maxLights
    this.tileSize = tileSize
    this._bufferSize = null
    this._lightIndexes = null
    this._screenTileIndex = null
    this._compute = null
    this._lightsTexture = null
    this._lightsCount = uniform(0, 'int')
    this._tileLightCount = 8
    this._screenSize = uniform(new Vector2())
    this._cameraProjectionMatrix = uniform('mat4')
    this._cameraViewMatrix = uniform('mat4')
    this.updateBeforeType = NodeUpdateType.RENDER
  }

  override customCacheKey() {
    return this._compute.getCacheKey() + super.customCacheKey()
  }

  updateLightsTexture() {
    const lightsTexture = this._lightsTexture
    const data = lightsTexture.image.data
    const lineSize = lightsTexture.image.width * 4

    this._lightsCount.value = this.tiledLights.length

    for (let index = 0; index < this.tiledLights.length; index += 1) {
      const light = this.tiledLights[index]

      vector3Scratch.setFromMatrixPosition(light.matrixWorld)

      const offset = index * 4
      data[offset + 0] = vector3Scratch.x
      data[offset + 1] = vector3Scratch.y
      data[offset + 2] = vector3Scratch.z
      data[offset + 3] = light.distance

      data[lineSize + offset + 0] = light.color.r * light.intensity
      data[lineSize + offset + 1] = light.color.g * light.intensity
      data[lineSize + offset + 2] = light.color.b * light.intensity
      data[lineSize + offset + 3] = light.decay
    }

    lightsTexture.needsUpdate = true
  }

  override updateBefore(frame) {
    const { renderer, camera } = frame

    this.updateProgram(renderer)
    this.updateLightsTexture(camera)

    this._cameraProjectionMatrix.value = camera.projectionMatrix
    this._cameraViewMatrix.value = camera.matrixWorldInverse

    renderer.getDrawingBufferSize(sizeScratch)
    this._screenSize.value.copy(sizeScratch)

    renderer.compute(this._compute)
    return true
  }

  override setLights(lights) {
    let materialIndex = 0
    let tiledIndex = 0

    for (const light of lights) {
      if (light.isPointLight === true) {
        this.tiledLights[tiledIndex] = light
        tiledIndex += 1
      } else {
        this.materialLights[materialIndex] = light
        materialIndex += 1
      }
    }

    this.materialLights.length = materialIndex
    this.tiledLights.length = tiledIndex

    return super.setLights(this.materialLights)
  }

  getBlock(block = 0) {
    return this._lightIndexes.element(this._screenTileIndex.mul(int(2).add(int(block))))
  }

  getTile(element) {
    element = int(element)

    const stride = int(4)
    const tileOffset = element.div(stride)
    const tileIndex = this._screenTileIndex.mul(int(2)).add(tileOffset)

    return this._lightIndexes.element(tileIndex).element(element.mod(stride))
  }

  getLightData(index) {
    index = int(index)

    const dataA = textureLoad(this._lightsTexture, ivec2(index, 0))
    const dataB = textureLoad(this._lightsTexture, ivec2(index, 1))

    const position = dataA.xyz
    const viewPosition = this._cameraViewMatrix.mul(position)
    const distance = dataA.w
    const color = dataB.rgb
    const decay = dataB.w

    return { position, viewPosition, distance, color, decay }
  }

  override setupLights(builder, lightNodes) {
    this.updateProgram(builder.renderer)

    const lightingModel = builder.context.reflectedLight
    lightingModel.directDiffuse.toStack()
    lightingModel.directSpecular.toStack()

    super.setupLights(builder, lightNodes)

    Fn(() => {
      Loop(this._tileLightCount, ({ i }) => {
        const lightIndex = this.getTile(i)

        If(lightIndex.equal(int(0)), () => {
          Break()
        })

        const { color, decay, viewPosition, distance } = this.getLightData(lightIndex.sub(1))

        builder.lightsNode.setupDirectLight(builder, this, directPointLight({
          color,
          lightVector: viewPosition.sub(positionView),
          cutoffDistance: distance,
          decayExponent: decay,
        }))
      })
    }, 'void')()
  }

  getBufferFitSize(value) {
    const multiple = this.tileSize

    return Math.ceil(value / multiple) * multiple
  }

  setSize(width, height) {
    width = this.getBufferFitSize(width)
    height = this.getBufferFitSize(height)

    if (!this._bufferSize || this._bufferSize.width !== width || this._bufferSize.height !== height) {
      this.create(width, height)
    }

    return this
  }

  updateProgram(renderer) {
    renderer.getDrawingBufferSize(sizeScratch)

    const width = this.getBufferFitSize(sizeScratch.width)
    const height = this.getBufferFitSize(sizeScratch.height)

    if (this._bufferSize === null) {
      this.create(width, height)
    } else if (this._bufferSize.width !== width || this._bufferSize.height !== height) {
      this.create(width, height)
    }
  }

  create(width, height) {
    const { tileSize, maxLights } = this

    const bufferSize = new Vector2(width, height)
    const lineSize = Math.floor(bufferSize.width / tileSize)
    const count = Math.floor((bufferSize.width * bufferSize.height) / tileSize)

    const lightsData = new Float32Array(maxLights * 4 * 2)
    const lightsTexture = new DataTexture(lightsData, lightsData.length / 8, 2, RGBAFormat, FloatType)

    const lightIndexesArray = new Int32Array(count * 4 * 2)
    const lightIndexes = attributeArray(lightIndexesArray, 'ivec4').setName('lightIndexes')

    const getBlock = (index) => {
      const tileIndex = instanceIndex.mul(int(2)).add(int(index))
      return lightIndexes.element(tileIndex)
    }

    const getTile = (elementIndex) => {
      elementIndex = int(elementIndex)

      const stride = int(4)
      const tileOffset = elementIndex.div(stride)
      const tileIndex = instanceIndex.mul(int(2)).add(tileOffset)

      return lightIndexes.element(tileIndex).element(elementIndex.mod(stride))
    }

    const compute = Fn(() => {
      const tiledBufferSize = bufferSize.clone().divideScalar(tileSize).floor()

      const tileScreen = vec2(
        instanceIndex.mod(tiledBufferSize.width),
        instanceIndex.div(tiledBufferSize.width),
      ).mul(tileSize).div(this._screenSize)

      const blockSize = float(tileSize).div(this._screenSize)
      const minBounds = tileScreen
      const maxBounds = minBounds.add(blockSize)

      const index = int(0).toVar()

      getBlock(0).assign(ivec4(0))
      getBlock(1).assign(ivec4(0))

      Loop(this.maxLights, ({ i }) => {
        If(index.greaterThanEqual(this._tileLightCount).or(int(i).greaterThanEqual(int(this._lightsCount))), () => {
          Return()
        })

        const { viewPosition, distance } = this.getLightData(i)
        const projectedPosition = this._cameraProjectionMatrix.mul(viewPosition)
        const ndc = projectedPosition.div(projectedPosition.w)
        const screenPosition = ndc.xy.mul(0.5).add(0.5).flipY()

        const distanceFromCamera = viewPosition.z
        const pointRadius = distance.div(distanceFromCamera)

        If(circleIntersectsAABB(screenPosition, pointRadius, minBounds, maxBounds), () => {
          getTile(index).assign(i.add(int(1)))
          index.addAssign(int(1))
        })
      })
    })().compute(count).setName('Update Tiled Lights')

    const screenTile = screenCoordinate.div(tileSize).floor().toVar()
    const screenTileIndex = screenTile.x.add(screenTile.y.mul(lineSize))

    this._bufferSize = bufferSize
    this._lightIndexes = lightIndexes
    this._screenTileIndex = screenTileIndex
    this._compute = compute
    this._lightsTexture = lightsTexture
  }

  override get hasLights() {
    return super.hasLights || this.tiledLights.length > 0
  }
}

export default DungeonPlannerTiledLightsNode
export const tiledLights = nodeProxy(DungeonPlannerTiledLightsNode)
