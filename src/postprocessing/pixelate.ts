/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Fn,
  float,
  max,
  mix,
  screenSize,
  screenUV,
  step,
  vec2,
  vec4,
} from 'three/tsl'

export const DEFAULT_PIXELATION_SIZE = 6
export const DEFAULT_PIXELATION_DEPTH_EDGE_STRENGTH = 0.4

type PixelateOptions = {
  pixelSize?: number
  depthEdgeStrength?: number
}

/**
 * Applies a screen-space pixelation pass with single-pixel depth outlines.
 *
 * This mirrors the core look of Three's pixelation demo while staying fully in
 * the WebGPU/TSL post-processing pipeline already used by the app.
 */
export function pixelate(
  sceneColor: any,
  sceneDepth: any,
  opts: PixelateOptions = {},
): any {
  const pixelSize = float(opts.pixelSize ?? DEFAULT_PIXELATION_SIZE)
  const depthEdgeStrength = float(opts.depthEdgeStrength ?? DEFAULT_PIXELATION_DEPTH_EDGE_STRENGTH)

  return Fn(() => {
    const renderResolution = (screenSize as any).div(pixelSize).max(vec2(float(1), float(1)))
    const px = float(1).div(renderResolution.x)
    const py = float(1).div(renderResolution.y)
    const pixelUv = (screenUV as any)
      .mul(renderResolution)
      .floor()
      .add(float(0.5))
      .div(renderResolution)

    const color = sceneColor.sample(pixelUv)
    const depth = sceneDepth.sample(pixelUv).r
    const dR = sceneDepth.sample(pixelUv.add(vec2(px, float(0)))).r
    const dL = sceneDepth.sample(pixelUv.sub(vec2(px, float(0)))).r
    const dU = sceneDepth.sample(pixelUv.add(vec2(float(0), py))).r
    const dD = sceneDepth.sample(pixelUv.sub(vec2(float(0), py))).r

    const depthDiff = max(
      max(dR.sub(depth).max(0), dL.sub(depth).max(0)),
      max(dU.sub(depth).max(0), dD.sub(depth).max(0)),
    )
    const edge = step(float(0.015), depthDiff)
    const strength = mix(float(1), float(1).sub(depthEdgeStrength), edge)

    return vec4(color.rgb.mul(strength), color.a)
  })()
}
