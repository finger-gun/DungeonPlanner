import * as THREE from 'three'
import {
  attribute,
  dot,
  float,
  floor,
  fract,
  materialColor,
  max,
  min,
  mix,
  normalWorld,
  normalWorldGeometry,
  positionWorld,
  saturate,
  sin,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl'
import type { BakedFloorLightField, BakedLightFieldTexture } from '../../rendering/dungeonLightField'
import type { PropBakedLightProbe } from '../../rendering/dungeonLightField'
import { GRID_SIZE } from '../../hooks/useSnapToGrid'
import { buildBakedLightFieldPipelineSignature } from './batchDescriptors'
import {
  BILLBOARD_BAKED_LIGHT_RESPONSE,
  type BakedLightResponseProfile,
  PROP_DIRECTIONAL_FACE_MINIMUM,
  PROP_DIRECTIONAL_FACE_THRESHOLD,
  PROP_DIRECTIONAL_LIGHT_BASELINE,
  PROP_BAKED_LIGHT_RESPONSE,
  SURFACE_BAKED_LIGHT_RESPONSE,
} from '../../rendering/bakedLightResponse'

type BakedLightAwareMaterial = THREE.Material & {
  isNodeMaterial?: boolean
  colorNode?: unknown
  emissiveNode?: unknown
  color?: THREE.Color
  emissive?: THREE.Color
  map?: THREE.Texture | null
  aoMap?: THREE.Texture | null
  normalMap?: THREE.Texture | null
  bumpMap?: THREE.Texture | null
  roughnessMap?: THREE.Texture | null
  metalnessMap?: THREE.Texture | null
  transparent?: boolean
  userData: Record<string, unknown>
}

type SurfaceBakedLightOptions = {
  useLightAttribute: boolean
  useDirectionAttribute?: boolean
  useSecondaryDirectionAttribute?: boolean
  useDirectionalFaceMask?: boolean
  useDirectionalSampleOffset?: boolean
  useTopSurfaceMask?: boolean
  useFieldCellOcclusionCap?: boolean
  useFlicker?: boolean
  lightField?: BakedFloorLightField | null
  light?: readonly [number, number, number]
  lightDirection?: readonly [number, number, number]
  lightDirectionalStrength?: number
  direction?: readonly [number, number, number]
  directionSecondary?: readonly [number, number, number]
}

type PropBakedLightOptions = {
  lightField?: BakedFloorLightField | null
  probe?: PropBakedLightProbe | null
  fieldLightWeight?: number
  suppressTopSurfaceLight?: boolean
}

// TSL node wrappers use a shared fluent API that is wider than the public TypeScript surface.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShaderNodeLike = any

type PropBakedLightUniformState = {
  baseLight: ShaderNodeLike
  topLight: ShaderNodeLike
  baseY: ShaderNodeLike
  topY: ShaderNodeLike
  lightDirection: ShaderNodeLike
  directionalStrength: ShaderNodeLike
  probeEnabled: ShaderNodeLike
}

type SurfaceBakedLightUniformState = {
  light: ShaderNodeLike
  lightDirection: ShaderNodeLike
  directionalStrength: ShaderNodeLike
  probeEnabled: ShaderNodeLike
}

const bakedLightFlickerTimeUniform = uniform(0)
const BAKED_FLICKER_SIGNATURE_VERSION = 'multi-basis-v2'
const PROP_BAKED_UNIFORM_SIGNATURE_VERSION = 'probe-uniforms-v1'
const SURFACE_BAKED_UNIFORM_SIGNATURE_VERSION = 'surface-probe-uniforms-v1'
const ZERO_SURFACE_BAKED_LIGHT = [0, 0, 0] as const
const DEFAULT_SURFACE_BAKED_LIGHT_DIRECTION = [0, 1, 0] as const
const BAKED_ALBEDO_EMISSIVE_SCALE = 0
const SURFACE_BAKED_MAPPED_ALBEDO_BOOST_SCALE = 1
const SURFACE_BAKED_MAPPED_EMISSIVE_BOOST_SCALE = 1
const SURFACE_BAKED_MAPPED_DIRECTIONAL_DIFFUSE_SCALE = 0.26
const SURFACE_BAKED_MAPPED_DIRECTIONAL_DIFFUSE_BASELINE = 0.28
const SURFACE_BAKED_FIELD_CELL_OCCLUSION_CAP_SCALE = 2.25
const SURFACE_BAKED_SIGNATURE_VERSION = [
  SURFACE_BAKED_LIGHT_RESPONSE.contrastFloor,
  SURFACE_BAKED_LIGHT_RESPONSE.contrastRange,
  SURFACE_BAKED_LIGHT_RESPONSE.minIntensityScale,
  SURFACE_BAKED_LIGHT_RESPONSE.maxDesaturation,
  SURFACE_BAKED_LIGHT_RESPONSE.albedoBoost,
  SURFACE_BAKED_LIGHT_RESPONSE.emissiveBoost,
  BAKED_ALBEDO_EMISSIVE_SCALE,
  SURFACE_BAKED_MAPPED_ALBEDO_BOOST_SCALE,
  SURFACE_BAKED_MAPPED_EMISSIVE_BOOST_SCALE,
  SURFACE_BAKED_MAPPED_DIRECTIONAL_DIFFUSE_SCALE,
  SURFACE_BAKED_MAPPED_DIRECTIONAL_DIFFUSE_BASELINE,
  SURFACE_BAKED_FIELD_CELL_OCCLUSION_CAP_SCALE,
  BAKED_FLICKER_SIGNATURE_VERSION,
].join(',')
const PROP_BAKED_SIGNATURE_VERSION = [
  PROP_BAKED_LIGHT_RESPONSE.contrastFloor,
  PROP_BAKED_LIGHT_RESPONSE.contrastRange,
  PROP_BAKED_LIGHT_RESPONSE.minIntensityScale,
  PROP_BAKED_LIGHT_RESPONSE.maxDesaturation,
  PROP_BAKED_LIGHT_RESPONSE.albedoBoost,
  PROP_BAKED_LIGHT_RESPONSE.emissiveBoost,
  BAKED_ALBEDO_EMISSIVE_SCALE,
].join(',')
const BILLBOARD_BAKED_SIGNATURE_VERSION = [
  BILLBOARD_BAKED_LIGHT_RESPONSE.contrastFloor,
  BILLBOARD_BAKED_LIGHT_RESPONSE.contrastRange,
  BILLBOARD_BAKED_LIGHT_RESPONSE.minIntensityScale,
  BILLBOARD_BAKED_LIGHT_RESPONSE.maxDesaturation,
  BILLBOARD_BAKED_LIGHT_RESPONSE.albedoBoost,
  BILLBOARD_BAKED_LIGHT_RESPONSE.emissiveBoost,
  BAKED_ALBEDO_EMISSIVE_SCALE,
].join(',')

export function setBakedLightFlickerTime(elapsedTime: number) {
  bakedLightFlickerTimeUniform.value = elapsedTime
}

export function applyBakedLightToMaterial(
  material: THREE.Material,
  options: SurfaceBakedLightOptions | null,
) {
  const bakedMaterial = material as BakedLightAwareMaterial
  if (!bakedMaterial.isNodeMaterial) {
    return
  }

  const hasMappedPbrSurface = hasSurfaceTextureMaps(bakedMaterial)
  const surfaceLightSourceMode = options?.lightField?.lightFieldTexture
    ? 'field'
    : options?.light
      ? 'uniform-light'
      : 'instanced-light'
  const hasSurfaceProbeDirection = Boolean(options?.lightDirection)
  const nextSignature = options?.useLightAttribute
      ? [
        'attribute',
        hasMappedPbrSurface ? 'mapped-pbr-surface' : 'flat-surface',
        options.useDirectionAttribute
          ? options.direction
            ? [
              options.useSecondaryDirectionAttribute ? 'double-directed-constant' : 'directed-constant',
              options.direction.join(','),
              options.directionSecondary?.join(',') ?? 'none',
              options.useDirectionalFaceMask === false ? 'no-face-mask' : 'face-mask',
              options.useDirectionalSampleOffset === false ? 'no-sample-offset' : 'sample-offset',
            ].join(':')
            : [
              options.useSecondaryDirectionAttribute ? 'double-directed' : 'directed',
              options.useDirectionalFaceMask === false ? 'no-face-mask' : 'face-mask',
              options.useDirectionalSampleOffset === false ? 'no-sample-offset' : 'sample-offset',
            ].join(':')
          : options.useTopSurfaceMask ? 'top-only' : 'all-faces',
        options.useFlicker ? 'flicker' : 'steady',
        options.useFieldCellOcclusionCap ? 'cell-occlusion-cap' : 'no-cell-occlusion-cap',
        surfaceLightSourceMode === 'field'
          ? buildBakedLightFieldPipelineSignature(options.lightField)
          : surfaceLightSourceMode,
        hasSurfaceProbeDirection ? SURFACE_BAKED_UNIFORM_SIGNATURE_VERSION : 'no-probe-direction',
        SURFACE_BAKED_SIGNATURE_VERSION,
      ].join(':')
    : 'off'
  const previousSignature = bakedMaterial.userData.bakedLightSignature ?? null
  const shouldRebuildNodeGraph = previousSignature !== nextSignature

  if (options?.useLightAttribute) {
    if (!Object.prototype.hasOwnProperty.call(bakedMaterial.userData, 'bakedLightBaseColorNode')) {
      bakedMaterial.userData.bakedLightBaseColorNode = bakedMaterial.colorNode ?? null
      bakedMaterial.userData.bakedLightBaseEmissiveNode = bakedMaterial.emissiveNode ?? null
    }

    const surfaceUniformState = getOrCreateSurfaceBakedLightUniformState(bakedMaterial)
    updateSurfaceBakedLightUniformState(surfaceUniformState, options)

    if (shouldRebuildNodeGraph) {
      const usesWallTextureSampling = Boolean(
        options.useDirectionAttribute
        && options.useDirectionalSampleOffset !== false
        && options.lightField?.lightFieldTexture,
      )
      const bakedSampleOffset = usesWallTextureSampling
        ? buildWallInteriorSampleOffsetNode({
          useSecondaryDirection: Boolean(options.useSecondaryDirectionAttribute),
          direction: options.direction,
          directionSecondary: options.directionSecondary,
        })
        : null
      const bakedLight = options.lightField?.lightFieldTexture
        ? buildFieldBakedLightNode({
          lightField: options.lightField,
          sampleOffsetWorldXZ: bakedSampleOffset,
          useFieldCellOcclusionCap: Boolean(options.useFieldCellOcclusionCap),
          options,
          surfaceUniformState,
        })
        : options.light
          ? vec3(surfaceUniformState.light as never)
          : vec3(attribute('bakedLight', 'vec3') as never)
      const bakedFlicker = options.useFlicker && options.lightField?.flickerLightFieldTextures.some((texture) => texture)
        ? buildSmoothedBakedFlickerNode(options.lightField, bakedSampleOffset)
        : vec3(0, 0, 0)
      const directionalFaceAlignment = options.useDirectionAttribute
        ? options.useSecondaryDirectionAttribute
          ? max(
            saturate(dot(
              normalWorldGeometry,
              buildSurfaceDirectionNode(options.direction, 'bakedLightDirection'),
            )),
            saturate(dot(
              normalWorldGeometry,
              buildSurfaceDirectionNode(options.directionSecondary, 'bakedLightDirectionSecondary'),
            )),
          )
          : saturate(dot(
            normalWorldGeometry,
            buildSurfaceDirectionNode(options.direction, 'bakedLightDirection'),
          ))
        : float(1)
      const directionalFaceFactor = options.useDirectionAttribute && options.useDirectionalFaceMask !== false
        ? buildDirectionalFaceWeightNode(directionalFaceAlignment, 0.06, 0)
        : float(1)
      const topSurfaceFactor = options.useTopSurfaceMask
        ? saturate(normalWorldGeometry.y)
        : float(1)
      const faceFactor = directionalFaceFactor.mul(topSurfaceFactor as never)
      const probeDirectionalAlignment = hasSurfaceProbeDirection
        ? saturate(dot(
            normalWorldGeometry,
            vec3(surfaceUniformState.lightDirection as never),
          ))
        : float(1)
      const probeDirectionalFactor = hasSurfaceProbeDirection
        ? mix(
            float(1),
            buildPropDirectionalLightFactorNode(
              probeDirectionalAlignment,
              surfaceUniformState.directionalStrength,
            ),
            float(surfaceUniformState.probeEnabled),
          )
        : float(1)
      const effectiveBakedLight = buildShapedBakedLightNode(
        bakedLight
        .add(bakedFlicker as never)
        .mul(faceFactor.mul(probeDirectionalFactor as never) as never),
        SURFACE_BAKED_LIGHT_RESPONSE,
      )
      const baseColor = buildSurfaceBaseColorNode(bakedMaterial)
      const baseEmissive = vec3(
        (bakedMaterial.userData.bakedLightBaseEmissiveNode
          ?? vec3(
            bakedMaterial.emissive?.r ?? 0,
            bakedMaterial.emissive?.g ?? 0,
            bakedMaterial.emissive?.b ?? 0,
          )) as never,
      )
      const albedoBoostScale = hasMappedPbrSurface
        ? SURFACE_BAKED_LIGHT_RESPONSE.albedoBoost * SURFACE_BAKED_MAPPED_ALBEDO_BOOST_SCALE
        : SURFACE_BAKED_LIGHT_RESPONSE.albedoBoost
      const emissiveBoostScale = hasMappedPbrSurface
        ? SURFACE_BAKED_LIGHT_RESPONSE.emissiveBoost * SURFACE_BAKED_MAPPED_EMISSIVE_BOOST_SCALE
        : SURFACE_BAKED_LIGHT_RESPONSE.emissiveBoost
      const albedoBoost = vec3(1, 1, 1).add(
        effectiveBakedLight.mul(float(albedoBoostScale)) as never,
      )
      const albedoEmissiveAssist = baseColor.mul(
        effectiveBakedLight.mul(float(BAKED_ALBEDO_EMISSIVE_SCALE)) as never,
      )
      const mappedDirectionalDiffuseAssist = hasMappedPbrSurface
        ? baseColor.mul(
            effectiveBakedLight.mul(
              buildMappedSurfaceDirectionalDiffuseFactorNode({
                hasSurfaceProbeDirection,
                options,
                surfaceUniformState,
              }).mul(float(SURFACE_BAKED_MAPPED_DIRECTIONAL_DIFFUSE_SCALE)) as never,
            ) as never,
          )
        : vec3(0, 0, 0)

      bakedMaterial.colorNode = baseColor.mul(albedoBoost as never)
      bakedMaterial.emissiveNode = baseEmissive.add(
        albedoEmissiveAssist.add(
          mappedDirectionalDiffuseAssist.add(
            effectiveBakedLight.mul(float(emissiveBoostScale)) as never,
          ) as never,
        ) as never,
      )
    }
  } else if (Object.prototype.hasOwnProperty.call(bakedMaterial.userData, 'bakedLightBaseColorNode')) {
    bakedMaterial.colorNode = bakedMaterial.userData.bakedLightBaseColorNode
    bakedMaterial.emissiveNode = bakedMaterial.userData.bakedLightBaseEmissiveNode ?? null
  }

  bakedMaterial.userData.bakedLightSignature = nextSignature
  if (previousSignature !== nextSignature) {
    bakedMaterial.needsUpdate = true
  }
}

export function applyBakedLightToObject(
  object: THREE.Object3D,
  options: SurfaceBakedLightOptions | null,
) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return
    }

    if (Array.isArray(child.material)) {
      child.material.forEach((material) => applyBakedLightToMaterial(material, options))
      return
    }

    if (child.material instanceof THREE.Material) {
      applyBakedLightToMaterial(child.material, options)
    }
  })
}

export function applyPropBakedLightToMaterial(
  material: THREE.Material,
  options: PropBakedLightOptions | null,
) {
  const bakedMaterial = material as BakedLightAwareMaterial
  if (!bakedMaterial.isNodeMaterial) {
    return
  }

  const lightField = options?.lightField ?? null
  const probe = options?.probe ?? null
  const fieldLightWeight = Math.max(0, options?.fieldLightWeight ?? 1)
  const suppressTopSurfaceLight = options?.suppressTopSurfaceLight ?? false
  const isBillboardSurface = bakedMaterial.userData.bakedLightMode === 'billboard'
  const hasFieldLighting = Boolean(lightField?.lightFieldTexture) && fieldLightWeight > 0
  const hasPropLighting = hasFieldLighting || Boolean(probe)
  const nextSignature = hasPropLighting
    ? [
      hasFieldLighting ? buildBakedLightFieldPipelineSignature(lightField) : 'no-field',
      `field-weight:${fieldLightWeight.toFixed(3)}`,
      suppressTopSurfaceLight ? 'no-top-light' : 'all-faces',
      PROP_BAKED_UNIFORM_SIGNATURE_VERSION,
      isBillboardSurface ? BILLBOARD_BAKED_SIGNATURE_VERSION : PROP_BAKED_SIGNATURE_VERSION,
    ].join(':')
    : 'off'
  const previousSignature = bakedMaterial.userData.propBakedLightSignature ?? null

  if (hasPropLighting) {
    if (!Object.prototype.hasOwnProperty.call(bakedMaterial.userData, 'propBakedLightBaseColorNode')) {
      bakedMaterial.userData.propBakedLightBaseColorNode = bakedMaterial.colorNode ?? null
      bakedMaterial.userData.propBakedLightBaseEmissiveNode = bakedMaterial.emissiveNode ?? null
    }

    const probeUniformState = getOrCreatePropBakedLightUniformState(bakedMaterial)
    updatePropBakedLightUniformState(probeUniformState, probe)

    if (previousSignature !== nextSignature) {
      const baseColor = isBillboardSurface
        ? buildBillboardBaseColorNode(bakedMaterial)
        : vec3((bakedMaterial.userData.propBakedLightBaseColorNode ?? materialColor) as never)
      const baseEmissive = vec3(
        (bakedMaterial.userData.propBakedLightBaseEmissiveNode
          ?? vec3(
            bakedMaterial.emissive?.r ?? 0,
            bakedMaterial.emissive?.g ?? 0,
            bakedMaterial.emissive?.b ?? 0,
          )) as never,
      )
      const responseProfile = isBillboardSurface ? BILLBOARD_BAKED_LIGHT_RESPONSE : PROP_BAKED_LIGHT_RESPONSE
      const probeSpan = max(probeUniformState.topY.sub(probeUniformState.baseY), float(0.001))
      const probeBlend = saturate(positionWorld.y.sub(probeUniformState.baseY).div(probeSpan))
      const probeHeightLight = buildShapedBakedLightNode(mix(
        vec3(probeUniformState.baseLight as never),
        vec3(probeUniformState.topLight as never),
        probeBlend,
      ), responseProfile)
      const sampledFieldLight = hasFieldLighting
        ? buildShapedBakedLightNode(
          buildSmoothedBakedLightNode(lightField as BakedFloorLightField),
          responseProfile,
        ).mul(float(fieldLightWeight) as never)
        : vec3(0, 0, 0)
      const combinedProbeLight = mix(
        sampledFieldLight,
        sampledFieldLight.add(probeHeightLight as never),
        float(probeUniformState.probeEnabled),
      )
      const directionalFaceAlignment = saturate(dot(
        normalWorld,
        vec3(probeUniformState.lightDirection as never),
      ))
      const propLightFactor = isBillboardSurface
        ? float(1)
        : mix(
            float(1),
            buildPropDirectionalLightFactorNode(
            directionalFaceAlignment,
            probeUniformState.directionalStrength,
            ),
            float(probeUniformState.probeEnabled),
          )
      const topSurfaceFactor = suppressTopSurfaceLight
        ? float(1).sub(saturate(normalWorld.y) as never)
        : float(1)
      const propLight = combinedProbeLight.mul(propLightFactor.mul(topSurfaceFactor as never) as never)
      const albedoBoost = vec3(1, 1, 1).add(
        propLight.mul(float(
          isBillboardSurface
            ? BILLBOARD_BAKED_LIGHT_RESPONSE.albedoBoost
            : PROP_BAKED_LIGHT_RESPONSE.albedoBoost,
        )) as never,
      )
      const litAlbedoEmissive = baseColor.mul(
        propLight.mul(float(BAKED_ALBEDO_EMISSIVE_SCALE)) as never,
      )

      bakedMaterial.colorNode = baseColor.mul(albedoBoost as never)
      bakedMaterial.emissiveNode = baseEmissive.add(
        litAlbedoEmissive.add(
          propLight.mul(float(
            isBillboardSurface
              ? BILLBOARD_BAKED_LIGHT_RESPONSE.emissiveBoost
              : PROP_BAKED_LIGHT_RESPONSE.emissiveBoost,
          )) as never,
        ) as never,
      )
    }
  } else if (Object.prototype.hasOwnProperty.call(bakedMaterial.userData, 'propBakedLightBaseColorNode')) {
    bakedMaterial.colorNode = bakedMaterial.userData.propBakedLightBaseColorNode
    bakedMaterial.emissiveNode = bakedMaterial.userData.propBakedLightBaseEmissiveNode ?? null
  }

  bakedMaterial.userData.propBakedLightSignature = nextSignature
  if (previousSignature !== nextSignature) {
    bakedMaterial.needsUpdate = true
  }
}

export function applyPropBakedLightToObject(
  object: THREE.Object3D,
  options: PropBakedLightOptions | null,
) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return
    }

    if (Array.isArray(child.material)) {
      child.material.forEach((material) => applyPropBakedLightToMaterial(material, options))
      return
    }

    if (child.material instanceof THREE.Material) {
      applyPropBakedLightToMaterial(child.material, options)
    }
  })
}

function buildSmoothedBakedLightNode(
  lightField: BakedFloorLightField,
  sampleOffsetWorldXZ: ShaderNodeLike | null = null,
) {
  return vec3(buildSmoothedBakedTextureSampleNode(lightField.lightFieldTexture, lightField, sampleOffsetWorldXZ).rgb as never)
}

function buildFieldBakedLightNode({
  lightField,
  sampleOffsetWorldXZ,
  useFieldCellOcclusionCap,
  options,
  surfaceUniformState,
}: {
  lightField: BakedFloorLightField
  sampleOffsetWorldXZ: ShaderNodeLike | null
  useFieldCellOcclusionCap: boolean
  options: SurfaceBakedLightOptions
  surfaceUniformState: SurfaceBakedLightUniformState
}) {
  const smoothedLight = buildSmoothedBakedLightNode(lightField, sampleOffsetWorldXZ)
  if (!useFieldCellOcclusionCap) {
    return smoothedLight
  }

  const cellLight = options.light
    ? vec3(surfaceUniformState.light as never)
    : vec3(attribute('bakedLight', 'vec3') as never)
  const cellVisibilityCap = cellLight.mul(float(SURFACE_BAKED_FIELD_CELL_OCCLUSION_CAP_SCALE))
  return vec3(min(smoothedLight, cellVisibilityCap) as never)
}

function buildSmoothedBakedFlickerNode(
  lightField: BakedFloorLightField,
  sampleOffsetWorldXZ: ShaderNodeLike | null = null,
) {
  const flickerTextures = lightField.flickerLightFieldTextures
  if (!flickerTextures[0] || !flickerTextures[1] || !flickerTextures[2]) {
    return vec3(0, 0, 0)
  }

  const band0Signal = sin(bakedLightFlickerTimeUniform.mul(float(8.9)).add(float(0.4))).mul(float(0.38))
    .add(sin(bakedLightFlickerTimeUniform.mul(float(13.7)).add(float(2.1))).mul(float(0.24)))
    .add(sin(bakedLightFlickerTimeUniform.mul(float(21.4)).add(float(4.7))).mul(float(0.14)))
  const band1Signal = sin(bakedLightFlickerTimeUniform.mul(float(9.8)).add(float(1.7))).mul(float(0.34))
    .add(sin(bakedLightFlickerTimeUniform.mul(float(15.9)).add(float(0.6))).mul(float(0.22)))
    .add(sin(bakedLightFlickerTimeUniform.mul(float(24.5)).add(float(3.0))).mul(float(0.12)))
  const band2Signal = sin(bakedLightFlickerTimeUniform.mul(float(7.7)).add(float(2.8))).mul(float(0.32))
    .add(sin(bakedLightFlickerTimeUniform.mul(float(18.4)).add(float(1.2))).mul(float(0.2)))
    .add(sin(bakedLightFlickerTimeUniform.mul(float(29.1)).add(float(5.3))).mul(float(0.1)))
  const band0Sample = buildSmoothedBakedTextureSampleNode(flickerTextures[0], lightField, sampleOffsetWorldXZ).rgb
  const band1Sample = buildSmoothedBakedTextureSampleNode(flickerTextures[1], lightField, sampleOffsetWorldXZ).rgb
  const band2Sample = buildSmoothedBakedTextureSampleNode(flickerTextures[2], lightField, sampleOffsetWorldXZ).rgb

  return vec3(
    band0Sample.mul(band0Signal)
      .add(band1Sample.mul(band1Signal))
      .add(band2Sample.mul(band2Signal)) as never,
  )
}

function buildSmoothedBakedTextureSampleNode(
  lightTexture: BakedLightFieldTexture | null,
  lightField: BakedFloorLightField,
  sampleOffsetWorldXZ: ShaderNodeLike | null = null,
) {
  if (lightField.gpuChunks && lightTexture instanceof THREE.DataArrayTexture) {
    return buildSmoothedChunkedBakedTextureSampleNode(lightTexture, lightField, sampleOffsetWorldXZ)
  }

  if (!lightTexture || !lightField.bounds) {
    return vec4(0, 0, 0, 0)
  }

  const textureWidth = Math.max(lightField.lightFieldTextureSize.width, 1)
  const textureHeight = Math.max(lightField.lightFieldTextureSize.height, 1)
  const widthCells = Math.max(lightField.lightFieldGridSize.widthCells, 1)
  const heightCells = Math.max(lightField.lightFieldGridSize.heightCells, 1)
  const minCorner = vec2(lightField.bounds.minCellX, lightField.bounds.minCellZ)
  const sampleWorldXZ = sampleOffsetWorldXZ
    ? positionWorld.xz.add(sampleOffsetWorldXZ)
    : positionWorld.xz
  const gridPosition = sampleWorldXZ.div(float(GRID_SIZE)).sub(minCorner)
  const cellOrigin = floor(gridPosition)
  const blend = fract(gridPosition)

  const sampleCorner = (offsetX: number, offsetY: number) => {
    const cornerGridPosition = vec2(
      cellOrigin.x.add(float(offsetX)),
      cellOrigin.y.add(float(offsetY)),
    )
    const sampleCornerPosition = vec2(
      saturate(cornerGridPosition.x.div(float(widthCells))).mul(float(widthCells)),
      saturate(cornerGridPosition.y.div(float(heightCells))).mul(float(heightCells)),
    )
    const sampleUv = vec2(
      sampleCornerPosition.x.add(float(0.5)).div(float(textureWidth)),
      sampleCornerPosition.y.add(float(0.5)).div(float(textureHeight)),
    )
    const inBounds = cornerGridPosition.x.greaterThanEqual(float(0))
      .and(cornerGridPosition.y.greaterThanEqual(float(0)))
      .and(cornerGridPosition.x.lessThanEqual(float(widthCells)))
      .and(cornerGridPosition.y.lessThanEqual(float(heightCells)))
    return vec4(inBounds.select(texture(lightTexture, sampleUv), vec4(0, 0, 0, 0)) as never)
  }

  const c00 = sampleCorner(0, 0)
  const c10 = sampleCorner(1, 0)
  const c01 = sampleCorner(0, 1)
  const c11 = sampleCorner(1, 1)
  const horizontalBottom = mix(c00, c10, blend.x)
  const horizontalTop = mix(c01, c11, blend.x)
  return vec4(mix(horizontalBottom, horizontalTop, blend.y) as never)
}

function buildSmoothedChunkedBakedTextureSampleNode(
  lightTexture: THREE.DataArrayTexture,
  lightField: BakedFloorLightField,
  sampleOffsetWorldXZ: ShaderNodeLike | null = null,
) {
  const gpuChunks = lightField.gpuChunks
  if (!gpuChunks?.lookupTexture || !gpuChunks.lookupBounds) {
    return vec4(0, 0, 0, 0)
  }

  const lookupTexture = gpuChunks.lookupTexture
  const layerTextureWidth = Math.max(gpuChunks.textureSize.width, 1)
  const layerTextureHeight = Math.max(gpuChunks.textureSize.height, 1)
  const widthCells = Math.max(gpuChunks.gridSize.widthCells, 1)
  const heightCells = Math.max(gpuChunks.gridSize.heightCells, 1)
  const lookupWidth = Math.max(gpuChunks.lookupSize.width, 1)
  const lookupHeight = Math.max(gpuChunks.lookupSize.height, 1)
  const lookupWidthSpan = Math.max(lookupWidth - 1, 1)
  const lookupHeightSpan = Math.max(lookupHeight - 1, 1)
  const minChunk = vec2(gpuChunks.lookupBounds.minChunkX, gpuChunks.lookupBounds.minChunkZ)
  const sampleWorldXZ = sampleOffsetWorldXZ
    ? positionWorld.xz.add(sampleOffsetWorldXZ)
    : positionWorld.xz
  const sampleGridPosition = sampleWorldXZ.div(float(GRID_SIZE))
  const sampleChunkCoordinate = floor(sampleGridPosition.div(float(lightField.chunkSize)))
  const localGridPosition = sampleGridPosition.sub(sampleChunkCoordinate.mul(float(lightField.chunkSize)))
  const cellOrigin = floor(localGridPosition)
  const blend = fract(localGridPosition)
  const worldCellOrigin = sampleChunkCoordinate.mul(float(lightField.chunkSize)).add(cellOrigin)

  const sampleCorner = (offsetX: number, offsetY: number) => {
    const worldCornerGridPosition = vec2(
      worldCellOrigin.x.add(float(offsetX)),
      worldCellOrigin.y.add(float(offsetY)),
    )
    const cornerChunkCoordinate = floor(worldCornerGridPosition.div(float(lightField.chunkSize)))
    const clampedChunkOffset = vec2(
      saturate(cornerChunkCoordinate.x.sub(minChunk.x).div(float(lookupWidthSpan))).mul(float(lookupWidthSpan)),
      saturate(cornerChunkCoordinate.y.sub(minChunk.y).div(float(lookupHeightSpan))).mul(float(lookupHeightSpan)),
    )
    const lookupUv = vec2(
      clampedChunkOffset.x.add(float(0.5)).div(float(lookupWidth)),
      clampedChunkOffset.y.add(float(0.5)).div(float(lookupHeight)),
    )
    const inLookupBounds = cornerChunkCoordinate.x.greaterThanEqual(minChunk.x)
      .and(cornerChunkCoordinate.y.greaterThanEqual(minChunk.y))
      .and(cornerChunkCoordinate.x.lessThanEqual(minChunk.x.add(float(lookupWidthSpan))))
      .and(cornerChunkCoordinate.y.lessThanEqual(minChunk.y.add(float(lookupHeightSpan))))
    const layerValue = texture(lookupTexture, lookupUv).r
    const layerMask = saturate(layerValue).mul(inLookupBounds.select(float(1), float(0)) as never)
    const layerIndex = max(layerValue.sub(float(1)), float(0))
    const clampedChunkCoordinate = minChunk.add(clampedChunkOffset)
    const localCornerGridPosition = worldCornerGridPosition.sub(clampedChunkCoordinate.mul(float(lightField.chunkSize)))
    const sampleCornerPosition = vec2(
      saturate(localCornerGridPosition.x.div(float(widthCells))).mul(float(widthCells)),
      saturate(localCornerGridPosition.y.div(float(heightCells))).mul(float(heightCells)),
    )
    const sampleUv = vec2(
      sampleCornerPosition.x.add(float(0.5)).div(float(layerTextureWidth)),
      sampleCornerPosition.y.add(float(0.5)).div(float(layerTextureHeight)),
    )
    const textureNode = texture(lightTexture) as ShaderNodeLike
    return textureNode.sample(sampleUv).depth(layerIndex).mul(layerMask)
  }

  const c00 = sampleCorner(0, 0)
  const c10 = sampleCorner(1, 0)
  const c01 = sampleCorner(0, 1)
  const c11 = sampleCorner(1, 1)
  const horizontalBottom = mix(c00, c10, blend.x)
  const horizontalTop = mix(c01, c11, blend.x)
  return vec4(mix(horizontalBottom, horizontalTop, blend.y) as never)
}

function buildWallInteriorSampleOffsetNode({
  useSecondaryDirection,
  direction,
  directionSecondary,
}: {
  useSecondaryDirection: boolean
  direction?: readonly [number, number, number]
  directionSecondary?: readonly [number, number, number]
}) {
  const primaryDirection = buildSurfaceDirectionNode(direction, 'bakedLightDirection')
  if (!useSecondaryDirection) {
    return vec2(primaryDirection.x, primaryDirection.z).mul(float(GRID_SIZE * 0.28))
  }

  const secondaryDirection = buildSurfaceDirectionNode(directionSecondary, 'bakedLightDirectionSecondary')
  const primaryWeight = saturate(dot(normalWorld, primaryDirection))
  const secondaryWeight = saturate(dot(normalWorld, secondaryDirection))
  const chosenDirection = vec2(
    primaryDirection.x.mul(primaryWeight).add(secondaryDirection.x.mul(secondaryWeight)),
    primaryDirection.z.mul(primaryWeight).add(secondaryDirection.z.mul(secondaryWeight)),
  )
  return chosenDirection.mul(float(GRID_SIZE * 0.28))
}

function buildSurfaceDirectionNode(
  direction: readonly [number, number, number] | undefined,
  attributeName: 'bakedLightDirection' | 'bakedLightDirectionSecondary',
) {
  return direction
    ? vec3(direction[0], direction[1], direction[2])
    : vec3(attribute(attributeName, 'vec3') as never)
}

function buildMappedSurfaceDirectionalDiffuseFactorNode({
  hasSurfaceProbeDirection,
  options,
  surfaceUniformState,
}: {
  hasSurfaceProbeDirection: boolean
  options: SurfaceBakedLightOptions
  surfaceUniformState: SurfaceBakedLightUniformState
}) {
  const alignment = buildMappedSurfaceDirectionalDiffuseAlignmentNode({
    hasSurfaceProbeDirection,
    options,
    surfaceUniformState,
  })
  const baselineFactor = mix(
    float(SURFACE_BAKED_MAPPED_DIRECTIONAL_DIFFUSE_BASELINE),
    float(1),
    alignment,
  )

  return hasSurfaceProbeDirection
    ? mix(
        baselineFactor,
        buildPropDirectionalLightFactorNode(
          alignment,
          surfaceUniformState.directionalStrength,
        ),
        float(surfaceUniformState.probeEnabled),
      )
    : baselineFactor
}

function buildMappedSurfaceDirectionalDiffuseAlignmentNode({
  hasSurfaceProbeDirection,
  options,
  surfaceUniformState,
}: {
  hasSurfaceProbeDirection: boolean
  options: SurfaceBakedLightOptions
  surfaceUniformState: SurfaceBakedLightUniformState
}) {
  if (hasSurfaceProbeDirection) {
    return saturate(dot(
      normalWorld,
      vec3(surfaceUniformState.lightDirection as never),
    ))
  }

  if (options.useDirectionAttribute) {
    if (options.useSecondaryDirectionAttribute) {
      return max(
        saturate(dot(
          normalWorld,
          buildSurfaceDirectionNode(options.direction, 'bakedLightDirection'),
        )),
        saturate(dot(
          normalWorld,
          buildSurfaceDirectionNode(options.directionSecondary, 'bakedLightDirectionSecondary'),
        )),
      )
    }

    return saturate(dot(
      normalWorld,
      buildSurfaceDirectionNode(options.direction, 'bakedLightDirection'),
    ))
  }

  return options.useTopSurfaceMask
    ? saturate(normalWorld.y)
    : float(1)
}

function buildBakedLightLuminanceNode(lightNode: ReturnType<typeof vec3>) {
  return dot(lightNode, vec3(0.2126, 0.7152, 0.0722))
}

function buildShapedBakedLightNode(
  lightNode: ShaderNodeLike,
  profile: BakedLightResponseProfile,
) {
  const luminance = buildBakedLightLuminanceNode(lightNode)
  const contrastGate = saturate(
    luminance.sub(float(profile.contrastFloor)).div(float(profile.contrastRange)),
  )
  const curvedGate = contrastGate.mul(contrastGate)
  const intensityScale = mix(float(profile.minIntensityScale), float(1), curvedGate)
  const tonedLight = lightNode.mul(intensityScale as never)
  const desaturation = float(profile.maxDesaturation).mul(float(1).sub(contrastGate) as never)
  const neutralLight = vec3(luminance, luminance, luminance)
  return vec3(mix(neutralLight, tonedLight, float(1).sub(desaturation) as never) as never)
}

function buildDirectionalFaceWeightNode(
  alignmentNode: ShaderNodeLike,
  threshold: number,
  minimum: number,
) {
  const gated = saturate(
    alignmentNode.sub(float(threshold)).div(float(Math.max(1 - threshold, Number.EPSILON))),
  )
  return mix(float(minimum), float(1), gated.mul(gated))
}

function buildPropDirectionalLightFactorNode(
  alignmentNode: ShaderNodeLike,
  directionalStrengthNode: ShaderNodeLike,
) {
  const faceWeight = buildDirectionalFaceWeightNode(
    alignmentNode,
    PROP_DIRECTIONAL_FACE_THRESHOLD,
    PROP_DIRECTIONAL_FACE_MINIMUM,
  )
  return mix(float(PROP_DIRECTIONAL_LIGHT_BASELINE), faceWeight, saturate(directionalStrengthNode))
}

function getOrCreatePropBakedLightUniformState(
  material: BakedLightAwareMaterial,
): PropBakedLightUniformState {
  const existing = material.userData.propBakedLightUniformState as PropBakedLightUniformState | undefined
  if (existing) {
    return existing
  }

  const uniformState: PropBakedLightUniformState = {
    baseLight: uniform(new THREE.Vector3(0, 0, 0)),
    topLight: uniform(new THREE.Vector3(0, 0, 0)),
    baseY: uniform(0),
    topY: uniform(1),
    lightDirection: uniform(new THREE.Vector3(0, 1, 0)),
    directionalStrength: uniform(0),
    probeEnabled: uniform(0),
  }
  material.userData.propBakedLightUniformState = uniformState
  return uniformState
}

function updatePropBakedLightUniformState(
  uniformState: PropBakedLightUniformState,
  probe: PropBakedLightProbe | null,
) {
  if (!probe) {
    uniformState.baseLight.value.set(0, 0, 0)
    uniformState.topLight.value.set(0, 0, 0)
    uniformState.baseY.value = 0
    uniformState.topY.value = 1
    uniformState.lightDirection.value.set(0, 1, 0)
    uniformState.directionalStrength.value = 0
    uniformState.probeEnabled.value = 0
    return
  }

  uniformState.baseLight.value.set(...probe.baseLight)
  uniformState.topLight.value.set(...probe.topLight)
  uniformState.baseY.value = probe.baseY
  uniformState.topY.value = probe.topY
  uniformState.lightDirection.value.set(...probe.lightDirection)
  uniformState.directionalStrength.value = probe.directionalStrength
  uniformState.probeEnabled.value = 1
}

function getOrCreateSurfaceBakedLightUniformState(
  material: BakedLightAwareMaterial,
): SurfaceBakedLightUniformState {
  const existing = material.userData.surfaceBakedLightUniformState as SurfaceBakedLightUniformState | undefined
  if (existing) {
    return existing
  }

  const uniformState: SurfaceBakedLightUniformState = {
    light: uniform(new THREE.Vector3(0, 0, 0)),
    lightDirection: uniform(new THREE.Vector3(0, 1, 0)),
    directionalStrength: uniform(0),
    probeEnabled: uniform(0),
  }
  material.userData.surfaceBakedLightUniformState = uniformState
  return uniformState
}

function updateSurfaceBakedLightUniformState(
  uniformState: SurfaceBakedLightUniformState,
  options: SurfaceBakedLightOptions,
) {
  const directionalStrength = options.lightDirectionalStrength ?? 0
  uniformState.light.value.set(...(options.light ?? ZERO_SURFACE_BAKED_LIGHT))
  uniformState.lightDirection.value.set(...(options.lightDirection ?? DEFAULT_SURFACE_BAKED_LIGHT_DIRECTION))
  uniformState.directionalStrength.value = directionalStrength
  uniformState.probeEnabled.value = options.lightDirection && directionalStrength > 1e-4 ? 1 : 0
}

function buildSurfaceBaseColorNode(material: BakedLightAwareMaterial) {
  const storedBaseColorNode = material.userData.bakedLightBaseColorNode
  if (storedBaseColorNode) {
    return vec3(storedBaseColorNode as never)
  }

  return buildMappedMaterialColorNode(material)
}

function buildMappedMaterialColorNode(material: BakedLightAwareMaterial) {
  const tint = vec3(
    material.color?.r ?? 1,
    material.color?.g ?? 1,
    material.color?.b ?? 1,
  )
  if (!material.map) {
    return tint
  }

  return vec3(texture(material.map, uv()).rgb.mul(tint as never) as never)
}

function buildBillboardBaseColorNode(material: BakedLightAwareMaterial) {
  const storedBaseColorNode = material.userData.propBakedLightBaseColorNode
  if (storedBaseColorNode) {
    return vec3(storedBaseColorNode as never)
  }

  return buildMappedMaterialColorNode(material)
}

function hasSurfaceTextureMaps(material: BakedLightAwareMaterial) {
  return Boolean(
    material.map
    || material.aoMap
    || material.normalMap
    || material.bumpMap
    || material.roughnessMap
    || material.metalnessMap,
  )
}
