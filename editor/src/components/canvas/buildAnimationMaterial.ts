import * as THREE from 'three'
import {
  attribute,
  float,
  max,
  materialOpacity,
  min,
  positionLocal,
  positionWorld,
  uniform,
  vec3,
} from 'three/tsl'
import {
  BUILD_ANIMATION_DEPTH,
  BUILD_ANIMATION_RISE_DURATION_MS,
  BUILD_ANIMATION_WARMUP_MS,
} from '../../store/buildAnimations'

// TSL node wrappers expose a wider fluent API at runtime than the current TypeScript surface.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShaderNodeLike = any

type BuildAnimationAwareMaterial = THREE.Material & {
  alphaTest?: number
  alphaTestNode?: unknown
  castShadowPositionNode?: unknown
  clipShadows?: boolean
  clippingPlanes?: THREE.Plane[] | null
  isNodeMaterial?: boolean
  needsUpdate?: boolean
  opacityNode?: unknown
  positionNode?: unknown
  userData: Record<string, unknown>
}

export type BelowGroundClipVariant = 'floor' | 'wall' | 'prop'

const buildAnimationTimeUniform = uniform(0)
const buildAnimationTimeScaleUniform = uniform(1)
const buildAnimationHoldBatchStartUniform = uniform(Number.MAX_SAFE_INTEGER)
const buildAnimationHoldReleaseUniform = uniform(0)
const BUILD_ANIMATION_SIGNATURE = [
  'batched-rise-v1',
  BUILD_ANIMATION_DEPTH,
  BUILD_ANIMATION_RISE_DURATION_MS,
  BUILD_ANIMATION_WARMUP_MS,
].join(':')
const BELOW_GROUND_CLIP_SIGNATURE = 'clip-below-ground-v1'
const DEFAULT_BELOW_GROUND_CLIP_MIN_Y = 0
const FLOOR_BELOW_GROUND_CLIP_MIN_Y = -1;
export function setBuildAnimationTime(
  elapsedMs: number,
  timeScale = 1,
  holdBatchStartMs = Number.MAX_SAFE_INTEGER,
  holdReleaseMs = elapsedMs,
) {
  buildAnimationTimeUniform.value = elapsedMs
  buildAnimationTimeScaleUniform.value = timeScale
  buildAnimationHoldBatchStartUniform.value = holdBatchStartMs
  buildAnimationHoldReleaseUniform.value = holdReleaseMs
}

export function getBelowGroundClipMinY(variant: BelowGroundClipVariant) {
  return variant === 'floor' ? FLOOR_BELOW_GROUND_CLIP_MIN_Y : DEFAULT_BELOW_GROUND_CLIP_MIN_Y
}

export function applyBelowGroundClipToMaterial(
  material: THREE.Material,
  enabled: boolean,
  clipMinY = DEFAULT_BELOW_GROUND_CLIP_MIN_Y,
) {
  const buildMaterial = material as BuildAnimationAwareMaterial
  const nextSignature = enabled ? `${BELOW_GROUND_CLIP_SIGNATURE}:${clipMinY}` : 'off'
  const previousSignature = buildMaterial.userData.buildAnimationClipSignature ?? null

  if (!Object.prototype.hasOwnProperty.call(buildMaterial.userData, 'buildAnimationBaseClippingPlanes')) {
    buildMaterial.userData.buildAnimationBaseClippingPlanes = buildMaterial.clippingPlanes ?? null
    buildMaterial.userData.buildAnimationBaseClipShadows = buildMaterial.clipShadows ?? false
    buildMaterial.userData.buildAnimationBaseOpacityNode = buildMaterial.opacityNode ?? null
    buildMaterial.userData.buildAnimationBaseAlphaTestNode = buildMaterial.alphaTestNode ?? null
  }

  if (buildMaterial.isNodeMaterial) {
    if (enabled) {
      const visibilityMask = positionWorld.y.greaterThanEqual(float(clipMinY)).select(float(1), float(0))
      const baseOpacityNode =
        (buildMaterial.userData.buildAnimationBaseOpacityNode as ShaderNodeLike | null | undefined) ?? materialOpacity
      const baseAlphaTestNode =
        (buildMaterial.userData.buildAnimationBaseAlphaTestNode as ShaderNodeLike | null | undefined)
        ?? float(buildMaterial.alphaTest ?? 0)
      buildMaterial.opacityNode = baseOpacityNode.mul(visibilityMask)
      buildMaterial.alphaTestNode = baseAlphaTestNode
    } else {
      buildMaterial.opacityNode =
        (buildMaterial.userData.buildAnimationBaseOpacityNode as ShaderNodeLike | null | undefined) ?? null
      buildMaterial.alphaTestNode =
        (buildMaterial.userData.buildAnimationBaseAlphaTestNode as ShaderNodeLike | null | undefined) ?? null
    }

    buildMaterial.clippingPlanes =
      (buildMaterial.userData.buildAnimationBaseClippingPlanes as THREE.Plane[] | null | undefined) ?? null
    buildMaterial.clipShadows = Boolean(buildMaterial.userData.buildAnimationBaseClipShadows)
  } else if (enabled) {
    buildMaterial.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 1, 0), -clipMinY)]
    buildMaterial.clipShadows = true
  } else {
    buildMaterial.clippingPlanes =
      (buildMaterial.userData.buildAnimationBaseClippingPlanes as THREE.Plane[] | null | undefined) ?? null
    buildMaterial.clipShadows = Boolean(buildMaterial.userData.buildAnimationBaseClipShadows)
  }

  buildMaterial.userData.buildAnimationClipSignature = nextSignature
  if (previousSignature !== nextSignature) {
    buildMaterial.needsUpdate = true
  }
}

export function applyBelowGroundClipToObject(
  object: THREE.Object3D,
  enabled: boolean,
  clipMinY = DEFAULT_BELOW_GROUND_CLIP_MIN_Y,
) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return
    }

    if (Array.isArray(child.material)) {
      child.material.forEach((material) => applyBelowGroundClipToMaterial(material, enabled, clipMinY))
    } else if (child.material instanceof THREE.Material) {
      applyBelowGroundClipToMaterial(child.material, enabled, clipMinY)
    }

    if (child.customDepthMaterial instanceof THREE.Material) {
      applyBelowGroundClipToMaterial(child.customDepthMaterial, enabled, clipMinY)
    }

    if (child.customDistanceMaterial instanceof THREE.Material) {
      applyBelowGroundClipToMaterial(child.customDistanceMaterial, enabled, clipMinY)
    }
  })
}

export function applyBuildAnimationToMaterial(
  material: THREE.Material,
  enabled: boolean,
  clipMinY = DEFAULT_BELOW_GROUND_CLIP_MIN_Y,
) {
  applyBelowGroundClipToMaterial(material, enabled, clipMinY)
  const buildMaterial = material as BuildAnimationAwareMaterial
  if (!buildMaterial.isNodeMaterial) {
    return
  }

  const nextSignature = enabled ? BUILD_ANIMATION_SIGNATURE : 'off'
  const previousSignature = buildMaterial.userData.buildAnimationSignature ?? null

  if (enabled) {
    if (!Object.prototype.hasOwnProperty.call(buildMaterial.userData, 'buildAnimationBasePositionNode')) {
      buildMaterial.userData.buildAnimationBasePositionNode = buildMaterial.positionNode ?? null
      buildMaterial.userData.buildAnimationBaseCastShadowPositionNode = buildMaterial.castShadowPositionNode ?? null
    }

    const buildStart = attribute('buildAnimationStart', 'float') as ShaderNodeLike
    const buildDelay = attribute('buildAnimationDelay', 'float') as ShaderNodeLike
    const hasBuildAnimation = buildStart.greaterThanEqual(float(0))
    const holdApplies = buildStart.greaterThanEqual(buildAnimationHoldBatchStartUniform)
    const holdDuration = holdApplies.select(
      max(buildAnimationHoldReleaseUniform.sub(buildStart), float(0)),
      float(0),
    )
    const elapsed = max(
      buildAnimationTimeUniform
        .sub(buildStart)
        .sub(float(BUILD_ANIMATION_WARMUP_MS))
        .sub(holdDuration)
        .div(buildAnimationTimeScaleUniform)
        .sub(buildDelay),
      float(0),
    )
    const progress = min(
      elapsed.div(float(BUILD_ANIMATION_RISE_DURATION_MS)),
      float(1),
    )
    const remaining = float(1).sub(progress)
    const riseOffset = float(-BUILD_ANIMATION_DEPTH).mul(
      remaining.mul(remaining).mul(remaining),
    )
    const offsetY = hasBuildAnimation.select(riseOffset, float(0))
    const animatedPosition = positionLocal.add(vec3(0, offsetY, 0))

    buildMaterial.positionNode = animatedPosition
    buildMaterial.castShadowPositionNode = animatedPosition
  } else if (Object.prototype.hasOwnProperty.call(buildMaterial.userData, 'buildAnimationBasePositionNode')) {
    buildMaterial.positionNode = buildMaterial.userData.buildAnimationBasePositionNode ?? null
    buildMaterial.castShadowPositionNode =
      buildMaterial.userData.buildAnimationBaseCastShadowPositionNode ?? null
  }

  buildMaterial.userData.buildAnimationSignature = nextSignature
  if (previousSignature !== nextSignature) {
    buildMaterial.needsUpdate = true
  }
}
