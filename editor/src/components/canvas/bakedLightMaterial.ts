import * as THREE from 'three'
import {
  attribute,
  dot,
  float,
  floor,
  fract,
  materialColor,
  max,
  mix,
  normalWorld,
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
import type { BakedFloorLightField } from '../../rendering/dungeonLightField'
import type { PropBakedLightProbe } from '../../rendering/dungeonLightField'
import { GRID_SIZE } from '../../hooks/useSnapToGrid'
import {
  BILLBOARD_BAKED_LIGHT_RESPONSE,
  type BakedLightResponseProfile,
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
  transparent?: boolean
  userData: Record<string, unknown>
}

type SurfaceBakedLightOptions = {
  useLightAttribute: boolean
  useDirectionAttribute?: boolean
  useSecondaryDirectionAttribute?: boolean
  useTopSurfaceMask?: boolean
  useFlicker?: boolean
  lightField?: BakedFloorLightField | null
  direction?: readonly [number, number, number]
  directionSecondary?: readonly [number, number, number]
}

type PropBakedLightOptions = {
  lightField?: BakedFloorLightField | null
  probe?: PropBakedLightProbe | null
}

const bakedLightFlickerTimeUniform = uniform(0)
const BAKED_FLICKER_SIGNATURE_VERSION = 'multi-basis-v2'
const SURFACE_BAKED_ALBEDO_EMISSIVE_SCALE = 0.9
const PROP_BAKED_ALBEDO_EMISSIVE_SCALE = 1.15
const BILLBOARD_BAKED_ALBEDO_EMISSIVE_SCALE = 1.8
const SURFACE_BAKED_SIGNATURE_VERSION = [
  SURFACE_BAKED_LIGHT_RESPONSE.contrastFloor,
  SURFACE_BAKED_LIGHT_RESPONSE.contrastRange,
  SURFACE_BAKED_LIGHT_RESPONSE.minIntensityScale,
  SURFACE_BAKED_LIGHT_RESPONSE.maxDesaturation,
  SURFACE_BAKED_LIGHT_RESPONSE.albedoBoost,
  SURFACE_BAKED_LIGHT_RESPONSE.emissiveBoost,
  SURFACE_BAKED_ALBEDO_EMISSIVE_SCALE,
  BAKED_FLICKER_SIGNATURE_VERSION,
].join(',')
const PROP_BAKED_SIGNATURE_VERSION = [
  PROP_BAKED_LIGHT_RESPONSE.contrastFloor,
  PROP_BAKED_LIGHT_RESPONSE.contrastRange,
  PROP_BAKED_LIGHT_RESPONSE.minIntensityScale,
  PROP_BAKED_LIGHT_RESPONSE.maxDesaturation,
  PROP_BAKED_LIGHT_RESPONSE.albedoBoost,
  PROP_BAKED_LIGHT_RESPONSE.emissiveBoost,
  PROP_BAKED_ALBEDO_EMISSIVE_SCALE,
].join(',')
const BILLBOARD_BAKED_SIGNATURE_VERSION = [
  BILLBOARD_BAKED_LIGHT_RESPONSE.contrastFloor,
  BILLBOARD_BAKED_LIGHT_RESPONSE.contrastRange,
  BILLBOARD_BAKED_LIGHT_RESPONSE.minIntensityScale,
  BILLBOARD_BAKED_LIGHT_RESPONSE.maxDesaturation,
  BILLBOARD_BAKED_LIGHT_RESPONSE.albedoBoost,
  BILLBOARD_BAKED_LIGHT_RESPONSE.emissiveBoost,
  BILLBOARD_BAKED_ALBEDO_EMISSIVE_SCALE,
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

  const nextSignature = options?.useLightAttribute
      ? [
        'attribute',
        options.useDirectionAttribute
          ? options.direction
            ? [
              options.useSecondaryDirectionAttribute ? 'double-directed-constant' : 'directed-constant',
              options.direction.join(','),
              options.directionSecondary?.join(',') ?? 'none',
            ].join(':')
            : options.useSecondaryDirectionAttribute ? 'double-directed' : 'directed'
          : options.useTopSurfaceMask ? 'top-only' : 'all-faces',
        options.useFlicker ? 'flicker' : 'steady',
        options.lightField?.lightFieldTexture?.uuid ?? 'no-field',
        SURFACE_BAKED_SIGNATURE_VERSION,
      ].join(':')
    : 'off'
  const previousSignature = bakedMaterial.userData.bakedLightSignature ?? null

  if (options?.useLightAttribute) {
    if (!Object.prototype.hasOwnProperty.call(bakedMaterial.userData, 'bakedLightBaseColorNode')) {
      bakedMaterial.userData.bakedLightBaseColorNode = bakedMaterial.colorNode ?? null
      bakedMaterial.userData.bakedLightBaseEmissiveNode = bakedMaterial.emissiveNode ?? null
    }

    const usesWallTextureSampling = Boolean(options.useDirectionAttribute && options.lightField?.lightFieldTexture)
    const bakedSampleOffset = usesWallTextureSampling
      ? buildWallInteriorSampleOffsetNode({
        useSecondaryDirection: Boolean(options.useSecondaryDirectionAttribute),
        direction: options.direction,
        directionSecondary: options.directionSecondary,
      })
      : null
    const bakedLight = options.lightField?.lightFieldTexture
      ? buildSmoothedBakedLightNode(options.lightField, bakedSampleOffset)
      : vec3(attribute('bakedLight', 'vec3') as never)
    const bakedFlicker = options.useFlicker && options.lightField?.flickerLightFieldTextures.some((texture) => texture)
      ? buildSmoothedBakedFlickerNode(options.lightField, bakedSampleOffset)
      : vec3(0, 0, 0)
    const directionalFaceAlignment = options.useDirectionAttribute
      ? options.useSecondaryDirectionAttribute
        ? max(
          saturate(dot(
            normalWorld,
            buildSurfaceDirectionNode(options.direction, 'bakedLightDirection'),
          )),
          saturate(dot(
            normalWorld,
            buildSurfaceDirectionNode(options.directionSecondary, 'bakedLightDirectionSecondary'),
          )),
        )
        : saturate(dot(
          normalWorld,
          buildSurfaceDirectionNode(options.direction, 'bakedLightDirection'),
        ))
      : float(1)
    const directionalFaceFactor = options.useDirectionAttribute
      ? buildDirectionalFaceWeightNode(directionalFaceAlignment, 0.18, 0)
      : float(1)
    const topSurfaceFactor = options.useTopSurfaceMask
      ? saturate(normalWorld.y)
      : float(1)
    const faceFactor = directionalFaceFactor.mul(topSurfaceFactor as never)
    const effectiveBakedLight = buildShapedBakedLightNode(
      bakedLight
      .add(bakedFlicker as never)
      .mul(faceFactor as never),
      SURFACE_BAKED_LIGHT_RESPONSE,
    )
    const baseColor = vec3((bakedMaterial.userData.bakedLightBaseColorNode ?? materialColor) as never)
    const baseEmissive = vec3(
      (bakedMaterial.userData.bakedLightBaseEmissiveNode
        ?? vec3(
          bakedMaterial.emissive?.r ?? 0,
          bakedMaterial.emissive?.g ?? 0,
          bakedMaterial.emissive?.b ?? 0,
        )) as never,
    )
    const albedoBoost = vec3(1, 1, 1).add(
      effectiveBakedLight.mul(float(SURFACE_BAKED_LIGHT_RESPONSE.albedoBoost)) as never,
    )
    const litAlbedoEmissive = baseColor.mul(
      effectiveBakedLight.mul(float(SURFACE_BAKED_ALBEDO_EMISSIVE_SCALE)) as never,
    )

    bakedMaterial.colorNode = baseColor.mul(albedoBoost as never)
    bakedMaterial.emissiveNode = baseEmissive.add(
      litAlbedoEmissive.add(
        effectiveBakedLight.mul(float(SURFACE_BAKED_LIGHT_RESPONSE.emissiveBoost)) as never,
      ) as never,
    )
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
  const isBillboardSurface = bakedMaterial.userData.bakedLightMode === 'billboard'
  const hasFieldLighting = Boolean(lightField?.lightFieldTexture)
  const hasPropLighting = hasFieldLighting || Boolean(probe)
  const nextSignature = hasPropLighting
    ? [
      hasFieldLighting ? lightField?.lightFieldTexture?.uuid ?? 'field' : 'no-field',
      probe ? probe.baseLight.join(',') : 'no-probe-base',
      probe ? probe.topLight.join(',') : 'no-probe-top',
      probe ? probe.baseY.toFixed(3) : 'no-probe-base-y',
      probe ? probe.topY.toFixed(3) : 'no-probe-top-y',
      probe ? probe.lightDirection.join(',') : 'no-probe-direction',
      probe ? probe.directionalStrength.toFixed(3) : 'no-probe-strength',
      isBillboardSurface ? BILLBOARD_BAKED_SIGNATURE_VERSION : PROP_BAKED_SIGNATURE_VERSION,
    ].join(':')
    : 'off'
  const previousSignature = bakedMaterial.userData.propBakedLightSignature ?? null

  if (hasPropLighting) {
    if (!Object.prototype.hasOwnProperty.call(bakedMaterial.userData, 'propBakedLightBaseColorNode')) {
      bakedMaterial.userData.propBakedLightBaseColorNode = bakedMaterial.colorNode ?? null
      bakedMaterial.userData.propBakedLightBaseEmissiveNode = bakedMaterial.emissiveNode ?? null
    }

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
    const probeSpan = probe ? Math.max(probe.topY - probe.baseY, 0.001) : 1
    const probeBlend = probe
      ? saturate(positionWorld.y.sub(float(probe.baseY)).div(float(probeSpan)))
      : float(0)
    const probeHeightLight = probe
      ? buildShapedBakedLightNode(mix(
        vec3(probe.baseLight[0], probe.baseLight[1], probe.baseLight[2]),
        vec3(probe.topLight[0], probe.topLight[1], probe.topLight[2]),
        probeBlend,
      ), responseProfile)
      : vec3(0, 0, 0)
    const sampledFieldLight = hasFieldLighting
      ? buildShapedBakedLightNode(
        buildSmoothedBakedLightNode(lightField as BakedFloorLightField),
        responseProfile,
      )
      : probeHeightLight
    const directionalFaceAlignment = probe
      ? saturate(dot(
        normalWorld,
        vec3(probe.lightDirection[0], probe.lightDirection[1], probe.lightDirection[2]),
      ))
      : float(1)
    const propLightFactor = isBillboardSurface
      ? float(1)
      : probe
        ? buildPropDirectionalLightFactorNode(
          directionalFaceAlignment,
          probe.directionalStrength,
        )
        : float(1)
    const propLight = sampledFieldLight.mul(propLightFactor as never)
    const albedoBoost = vec3(1, 1, 1).add(
      propLight.mul(float(
        isBillboardSurface
          ? BILLBOARD_BAKED_LIGHT_RESPONSE.albedoBoost
          : PROP_BAKED_LIGHT_RESPONSE.albedoBoost,
      )) as never,
    )
    const litAlbedoEmissiveScale = isBillboardSurface
      ? BILLBOARD_BAKED_ALBEDO_EMISSIVE_SCALE
      : PROP_BAKED_ALBEDO_EMISSIVE_SCALE
    const litAlbedoEmissive = baseColor.mul(
      propLight.mul(float(litAlbedoEmissiveScale)) as never,
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
  sampleOffsetWorldXZ: any = null,
) {
  return vec3(buildSmoothedBakedTextureSampleNode(lightField.lightFieldTexture, lightField, sampleOffsetWorldXZ).rgb as never)
}

function buildSmoothedBakedFlickerNode(
  lightField: BakedFloorLightField,
  sampleOffsetWorldXZ: any = null,
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
  lightTexture: THREE.DataTexture | null,
  lightField: BakedFloorLightField,
  sampleOffsetWorldXZ: any = null,
) {
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
  const clampedGridPosition = vec2(
    saturate(gridPosition.x.div(float(widthCells))).mul(float(widthCells)),
    saturate(gridPosition.y.div(float(heightCells))).mul(float(heightCells)),
  )
  const cellOrigin = floor(clampedGridPosition)
  const blend = fract(clampedGridPosition)

  const sampleCorner = (offsetX: number, offsetY: number) => {
    const sampleCornerPosition = vec2(
      saturate(cellOrigin.x.add(float(offsetX)).div(float(widthCells))).mul(float(widthCells)),
      saturate(cellOrigin.y.add(float(offsetY)).div(float(heightCells))).mul(float(heightCells)),
    )
    const sampleUv = vec2(
      sampleCornerPosition.x.add(float(0.5)).div(float(textureWidth)),
      sampleCornerPosition.y.add(float(0.5)).div(float(textureHeight)),
    )
    return texture(lightTexture, sampleUv)
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

function buildBakedLightLuminanceNode(lightNode: ReturnType<typeof vec3>) {
  return dot(lightNode, vec3(0.2126, 0.7152, 0.0722))
}

function buildShapedBakedLightNode(
  lightNode: any,
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
  alignmentNode: any,
  threshold: number,
  minimum: number,
) {
  const gated = saturate(
    alignmentNode.sub(float(threshold)).div(float(Math.max(1 - threshold, Number.EPSILON))),
  )
  return mix(float(minimum), float(1), gated.mul(gated))
}

function buildPropDirectionalLightFactorNode(
  alignmentNode: any,
  directionalStrength: number,
) {
  const faceWeight = buildDirectionalFaceWeightNode(alignmentNode, 0.04, 0.7)
  return mix(float(0.8), faceWeight, float(Math.max(0, Math.min(1, directionalStrength))))
}

function buildBillboardBaseColorNode(material: BakedLightAwareMaterial) {
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
