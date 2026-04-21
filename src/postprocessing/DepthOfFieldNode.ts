// @ts-nocheck
import {
  HalfFloatType,
  NodeMaterial,
  NodeUpdateType,
  QuadMesh,
  RedFormat,
  RenderTarget,
  RendererUtils,
  TempNode,
  Vector2,
} from 'three/webgpu'
import {
  convertToTexture,
  float,
  Fn,
  max,
  min,
  mix,
  nodeObject,
  smoothstep,
  step,
  texture,
  uniform,
  uniformArray,
  uv,
  vec2,
  vec4,
} from 'three/tsl'

const quadMesh = new QuadMesh()
let rendererState

class DungeonPlannerDepthOfFieldNode extends TempNode {
  static get type() {
    return 'DungeonPlannerDepthOfFieldNode'
  }

  constructor(textureNode, viewZNode, focusDistanceNode, focalLengthNode, bokehScaleNode) {
    super('vec4')

    this.textureNode = textureNode
    this.viewZNode = viewZNode
    this.focusDistanceNode = focusDistanceNode
    this.focalLengthNode = focalLengthNode
    this.bokehScaleNode = bokehScaleNode
    this._invSize = uniform(new Vector2())

    // Two separate single-target RTs — avoids property()/outputStruct which requires
    // an active TSL build stack that isn't present in the nested-render context.
    this._CoCNearRT = new RenderTarget(1, 1, { depthBuffer: false, type: HalfFloatType, format: RedFormat })
    this._CoCNearRT.texture.name = 'DepthOfField.NearField'

    this._CoCFarRT = new RenderTarget(1, 1, { depthBuffer: false, type: HalfFloatType, format: RedFormat })
    this._CoCFarRT.texture.name = 'DepthOfField.FarField'

    this._CoCBlurredRT = new RenderTarget(1, 1, { depthBuffer: false, type: HalfFloatType, format: RedFormat })
    this._CoCBlurredRT.texture.name = 'DepthOfField.NearFieldBlurred'

    this._blur64RT = new RenderTarget(1, 1, { depthBuffer: false, type: HalfFloatType })
    this._blur64RT.texture.name = 'DepthOfField.Blur64'

    this._blur16NearRT = new RenderTarget(1, 1, { depthBuffer: false, type: HalfFloatType })
    this._blur16NearRT.texture.name = 'DepthOfField.Blur16Near'

    this._blur16FarRT = new RenderTarget(1, 1, { depthBuffer: false, type: HalfFloatType })
    this._blur16FarRT.texture.name = 'DepthOfField.Blur16Far'

    this._compositeRT = new RenderTarget(1, 1, { depthBuffer: false, type: HalfFloatType })
    this._compositeRT.texture.name = 'DepthOfField.Composite'

    this._CoCNearMaterial = new NodeMaterial()
    this._CoCFarMaterial = new NodeMaterial()
    this._CoCBlurredMaterial = new NodeMaterial()
    this._blur64Material = new NodeMaterial()
    this._blur16Material = new NodeMaterial()
    this._compositeMaterial = new NodeMaterial()

    this._textureNode = texture(this._compositeRT.texture)
    this._CoCTextureNode = texture(this._CoCNearRT.texture)
    this._blur64TextureNode = texture(this._blur64RT.texture)
    this._blur16NearTextureNode = texture(this._blur16NearRT.texture)
    this._blur16FarTextureNode = texture(this._blur16FarRT.texture)

    this.updateBeforeType = NodeUpdateType.FRAME
  }

  setSize(width, height) {
    this._invSize.value.set(1 / width, 1 / height)
    this._CoCNearRT.setSize(width, height)
    this._CoCFarRT.setSize(width, height)
    this._compositeRT.setSize(width, height)

    const halfResX = Math.round(width / 2)
    const halfResY = Math.round(height / 2)

    this._CoCBlurredRT.setSize(halfResX, halfResY)
    this._blur64RT.setSize(halfResX, halfResY)
    this._blur16NearRT.setSize(halfResX, halfResY)
    this._blur16FarRT.setSize(halfResX, halfResY)
  }

  getTextureNode() {
    return this._textureNode
  }

  updateBefore(frame) {
    const { renderer } = frame
    const map = this.textureNode.value

    this.setSize(map.image.width, map.image.height)

    rendererState = RendererUtils.resetRendererState(renderer, rendererState)
    renderer.setClearColor(0x000000, 0)

    // Near CoC pass — fragmentNode returns vec4 directly, no property()/outputStruct needed
    quadMesh.material = this._CoCNearMaterial
    renderer.setRenderTarget(this._CoCNearRT)
    quadMesh.name = 'DoF [ CoC Near ]'
    quadMesh.render(renderer)

    // Far CoC pass
    quadMesh.material = this._CoCFarMaterial
    renderer.setRenderTarget(this._CoCFarRT)
    quadMesh.name = 'DoF [ CoC Far ]'
    quadMesh.render(renderer)

    // Blur near CoC
    this._CoCTextureNode.value = this._CoCNearRT.texture
    quadMesh.material = this._CoCBlurredMaterial
    renderer.setRenderTarget(this._CoCBlurredRT)
    quadMesh.name = 'DoF [ CoC Blur ]'
    quadMesh.render(renderer)

    // Blur64 near (use blurred near CoC to drive sample radius)
    this._CoCTextureNode.value = this._CoCBlurredRT.texture
    quadMesh.material = this._blur64Material
    renderer.setRenderTarget(this._blur64RT)
    quadMesh.name = 'DoF [ Blur64 Near ]'
    quadMesh.render(renderer)

    quadMesh.material = this._blur16Material
    renderer.setRenderTarget(this._blur16NearRT)
    quadMesh.name = 'DoF [ Blur16 Near ]'
    quadMesh.render(renderer)

    // Blur64 far (use raw far CoC)
    this._CoCTextureNode.value = this._CoCFarRT.texture
    quadMesh.material = this._blur64Material
    renderer.setRenderTarget(this._blur64RT)
    quadMesh.name = 'DoF [ Blur64 Far ]'
    quadMesh.render(renderer)

    quadMesh.material = this._blur16Material
    renderer.setRenderTarget(this._blur16FarRT)
    quadMesh.name = 'DoF [ Blur16 Far ]'
    quadMesh.render(renderer)

    quadMesh.material = this._compositeMaterial
    renderer.setRenderTarget(this._compositeRT)
    quadMesh.name = 'DoF [ Composite ]'
    quadMesh.render(renderer)

    RendererUtils.restoreRendererState(renderer, rendererState)
  }

  setup(builder) {
    const kernels = this._generateKernels()

    // Near CoC — pure vec4 return, no property()/assign() needed
    const cocNear = Fn(() => {
      const signedDist = this.viewZNode.negate().sub(this.focusDistanceNode)
      const cocValue = smoothstep(float(0), this.focalLengthNode, signedDist.abs())
      const near = step(signedDist, float(0)).mul(cocValue)
      return vec4(near, near, near, near)
    })

    this._CoCNearMaterial.fragmentNode = cocNear().context(builder.getSharedContext())
    this._CoCNearMaterial.needsUpdate = true

    // Far CoC — same pattern, opposite sign gate
    const cocFar = Fn(() => {
      const signedDist = this.viewZNode.negate().sub(this.focusDistanceNode)
      const cocValue = smoothstep(float(0), this.focalLengthNode, signedDist.abs())
      const far = step(float(0), signedDist).mul(cocValue)
      return vec4(far, far, far, far)
    })

    this._CoCFarMaterial.fragmentNode = cocFar().context(builder.getSharedContext())
    this._CoCFarMaterial.needsUpdate = true

    this._CoCBlurredMaterial.colorNode = Fn(() => {
      const uvNode = uv()
      const px = this._invSize.x.mul(2)
      const py = this._invSize.y.mul(2)

      const center = this._CoCTextureNode.sample(uvNode).r.mul(4)
      const horizontal = this._CoCTextureNode.sample(uvNode.add(vec2(px, float(0)))).r.mul(2)
        .add(this._CoCTextureNode.sample(uvNode.sub(vec2(px, float(0)))).r.mul(2))
      const vertical = this._CoCTextureNode.sample(uvNode.add(vec2(float(0), py))).r.mul(2)
        .add(this._CoCTextureNode.sample(uvNode.sub(vec2(float(0), py))).r.mul(2))
      const diagonals = this._CoCTextureNode.sample(uvNode.add(vec2(px, py))).r
        .add(this._CoCTextureNode.sample(uvNode.add(vec2(px.negate(), py))).r)
        .add(this._CoCTextureNode.sample(uvNode.add(vec2(px, py.negate()))).r)
        .add(this._CoCTextureNode.sample(uvNode.sub(vec2(px, py))).r)

      const blurred = center.add(horizontal).add(vertical).add(diagonals).div(16)
      return vec4(blurred, blurred, blurred, 1)
    })().context(builder.getSharedContext())
    this._CoCBlurredMaterial.needsUpdate = true

    // Build blur passes as pure expression chains — no Loop/addAssign/assign.
    // Loop + assign inside a nested Fn context loses the parent TSL currentStack
    // when TiledLightsNode is active. Building as a folded JS expression tree
    // avoids any assign operation and has no stack dependency.
    const bokeh64 = uniformArray(kernels.points64)
    const blur64 = Fn(() => {
      const uvNode = uv()
      const cocValue = this._CoCTextureNode.sample(uvNode).r
      const sampleStep = this._invSize.mul(this.bokehScaleNode).mul(cocValue)

      // Fold 64 samples into a sum using pure node expressions (no accumulator variable)
      let acc = this.textureNode.sample(uvNode.add(sampleStep.mul(bokeh64.element(0)))).rgb
      for (let i = 1; i < 64; i++) {
        acc = acc.add(this.textureNode.sample(uvNode.add(sampleStep.mul(bokeh64.element(i)))).rgb)
      }

      return vec4(acc.div(float(64)), cocValue)
    })

    this._blur64Material.fragmentNode = blur64().context(builder.getSharedContext())
    this._blur64Material.needsUpdate = true

    const bokeh16 = uniformArray(kernels.points16)
    const blur16 = Fn(() => {
      const uvNode = uv()
      const col = this._blur64TextureNode.sample(uvNode)
      const cocValue = col.a
      const sampleStep = this._invSize.mul(this.bokehScaleNode).mul(cocValue)

      // Fold 16 samples into a max chain using pure node expressions
      let maxVal = col.rgb
      for (let i = 0; i < 16; i++) {
        const sUV = uvNode.add(sampleStep.mul(bokeh16.element(i)))
        maxVal = max(maxVal, this._blur64TextureNode.sample(sUV).rgb)
      }

      return vec4(maxVal, cocValue)
    })

    this._blur16Material.fragmentNode = blur16().context(builder.getSharedContext())
    this._blur16Material.needsUpdate = true

    const composite = Fn(() => {
      const uvNode = uv()
      const near = this._blur16NearTextureNode.sample(uvNode)
      const far = this._blur16FarTextureNode.sample(uvNode)
      const beauty = this.textureNode.sample(uvNode)

      const blendNear = min(near.a, 0.5).mul(2)
      const blendFar = min(far.a, 0.5).mul(2)
      const withFar = mix(beauty.rgb, far.rgb, blendFar)

      return vec4(mix(withFar, near.rgb, blendNear), 1)
    })

    this._compositeMaterial.fragmentNode = composite().context(builder.getSharedContext())
    this._compositeMaterial.needsUpdate = true

    return this._textureNode
  }

  _generateKernels() {
    const GOLDEN_ANGLE = 2.39996323
    const SAMPLES = 80
    const points64 = []
    const points16 = []
    let idx64 = 0
    let idx16 = 0

    for (let i = 0; i < SAMPLES; i += 1) {
      const theta = i * GOLDEN_ANGLE
      const r = Math.sqrt(i) / Math.sqrt(SAMPLES)
      const p = new Vector2(r * Math.cos(theta), r * Math.sin(theta))

      if (i % 5 === 0) {
        points16[idx16] = p
        idx16 += 1
      } else {
        points64[idx64] = p
        idx64 += 1
      }
    }

    return { points16, points64 }
  }

  dispose() {
    this._CoCNearRT.dispose()
    this._CoCFarRT.dispose()
    this._CoCBlurredRT.dispose()
    this._blur64RT.dispose()
    this._blur16NearRT.dispose()
    this._blur16FarRT.dispose()
    this._compositeRT.dispose()

    this._CoCNearMaterial.dispose()
    this._CoCFarMaterial.dispose()
    this._CoCBlurredMaterial.dispose()
    this._blur64Material.dispose()
    this._blur16Material.dispose()
    this._compositeMaterial.dispose()
  }
}

export default DungeonPlannerDepthOfFieldNode
export const dof = (node, viewZNode, focusDistance = 1, focalLength = 1, bokehScale = 1) =>
  new DungeonPlannerDepthOfFieldNode(
    convertToTexture(node),
    nodeObject(viewZNode),
    nodeObject(focusDistance),
    nodeObject(focalLength),
    nodeObject(bokehScale),
  )
