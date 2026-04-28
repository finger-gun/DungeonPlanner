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
  texture,
  vec2,
  vec3,
} from 'three/tsl'
import type { BakedFloorLightField } from '../../rendering/dungeonLightField'
import { GRID_SIZE } from '../../hooks/useSnapToGrid'

type BakedLightAwareMaterial = THREE.Material & {
  isNodeMaterial?: boolean
  colorNode?: unknown
  emissiveNode?: unknown
  emissive?: THREE.Color
}

export function applyBakedLightToMaterial(
  material: THREE.Material,
  options: {
    useLightAttribute: boolean
    useDirectionAttribute?: boolean
    useSecondaryDirectionAttribute?: boolean
    useTopSurfaceMask?: boolean
    lightField?: BakedFloorLightField | null
  } | null,
) {
  const bakedMaterial = material as BakedLightAwareMaterial
  if (!bakedMaterial.isNodeMaterial) {
    return
  }

  const nextSignature = options?.useLightAttribute
      ? [
        'attribute',
        options.useDirectionAttribute
          ? options.useSecondaryDirectionAttribute ? 'double-directed' : 'directed'
          : options.useTopSurfaceMask ? 'top-only' : 'all-faces',
        options.lightField?.sourceHash ?? 'no-field',
      ].join(':')
    : 'off'
  const previousSignature = bakedMaterial.userData.bakedLightSignature ?? null

  if (options?.useLightAttribute) {
    if (!Object.prototype.hasOwnProperty.call(bakedMaterial.userData, 'bakedLightBaseColorNode')) {
      bakedMaterial.userData.bakedLightBaseColorNode = bakedMaterial.colorNode ?? null
      bakedMaterial.userData.bakedLightBaseEmissiveNode = bakedMaterial.emissiveNode ?? null
    }

    const bakedLight = options.lightField?.lightFieldTexture
      ? buildSmoothedBakedLightNode(options.lightField)
      : vec3(attribute('bakedLight', 'vec3') as never)
    const directionalFaceFactor = options.useDirectionAttribute
      ? options.useSecondaryDirectionAttribute
        ? max(
          saturate(dot(
            normalWorld,
            vec3(attribute('bakedLightDirection', 'vec3') as never),
          )),
          saturate(dot(
            normalWorld,
            vec3(attribute('bakedLightDirectionSecondary', 'vec3') as never),
          )),
        )
        : saturate(dot(
          normalWorld,
          vec3(attribute('bakedLightDirection', 'vec3') as never),
        ))
      : float(1)
    const topSurfaceFactor = options.useTopSurfaceMask
      ? saturate(normalWorld.y)
      : float(1)
    const faceFactor = directionalFaceFactor.mul(topSurfaceFactor as never)
    const effectiveBakedLight = bakedLight.mul(faceFactor as never)
    const baseColor = vec3((bakedMaterial.userData.bakedLightBaseColorNode ?? materialColor) as never)
    const baseEmissive = vec3(
      (bakedMaterial.userData.bakedLightBaseEmissiveNode
        ?? vec3(
          bakedMaterial.emissive?.r ?? 0,
          bakedMaterial.emissive?.g ?? 0,
          bakedMaterial.emissive?.b ?? 0,
        )) as never,
    )
    const albedoBoost = vec3(1, 1, 1).add(effectiveBakedLight.mul(float(0.55)) as never)

    bakedMaterial.colorNode = baseColor.mul(albedoBoost as never)
    bakedMaterial.emissiveNode = baseEmissive.add(effectiveBakedLight.mul(float(0.25)) as never)
  } else if (Object.prototype.hasOwnProperty.call(bakedMaterial.userData, 'bakedLightBaseColorNode')) {
    bakedMaterial.colorNode = bakedMaterial.userData.bakedLightBaseColorNode
    bakedMaterial.emissiveNode = bakedMaterial.userData.bakedLightBaseEmissiveNode ?? null
  }

  bakedMaterial.userData.bakedLightSignature = nextSignature
  if (previousSignature !== nextSignature) {
    bakedMaterial.needsUpdate = true
  }
}

function buildSmoothedBakedLightNode(lightField: BakedFloorLightField) {
  if (!lightField.lightFieldTexture || !lightField.bounds) {
    return vec3(0, 0, 0)
  }

  const textureWidth = Math.max(lightField.lightFieldTextureSize.width, 1)
  const textureHeight = Math.max(lightField.lightFieldTextureSize.height, 1)
  const widthCells = Math.max(lightField.lightFieldGridSize.widthCells, 1)
  const heightCells = Math.max(lightField.lightFieldGridSize.heightCells, 1)
  const minCorner = vec2(lightField.bounds.minCellX, lightField.bounds.minCellZ)
  const gridPosition = positionWorld.xz.div(float(GRID_SIZE)).sub(minCorner)
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
    return texture(lightField.lightFieldTexture!, sampleUv).rgb
  }

  const c00 = sampleCorner(0, 0)
  const c10 = sampleCorner(1, 0)
  const c01 = sampleCorner(0, 1)
  const c11 = sampleCorner(1, 1)
  const horizontalBottom = mix(c00, c10, blend.x)
  const horizontalTop = mix(c01, c11, blend.x)
  return vec3(mix(horizontalBottom, horizontalTop, blend.y) as never)
}
