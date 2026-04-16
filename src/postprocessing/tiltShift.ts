/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tilt-shift depth of field — custom TSL implementation.
 * Imports only from 'three/tsl' (a proper package export).
 *
 * Sampling: use scenePass.getTextureNode() (not convertToTexture) and
 * sample via .uv(offsetUV) — wrapping a TextureNode inside texture() is wrong.
 */
import {
  pass, screenUV, screenSize,
  mix, smoothstep, abs, vec2, float, linearDepth, min, step,
  Fn, Loop, property, vec4, uniform,
} from 'three/tsl'
import type * as THREE from 'three'
import { TILT_SHIFT_FOCUS_SAMPLE_XS } from './tiltShiftMath'

type TSLNode = ReturnType<typeof uniform>
export { depthFocusRangeFromFocalLength, TILT_SHIFT_FOCUS_SAMPLE_XS } from './tiltShiftMath'

export type TiltShiftOptions = {
  focusCenter: TSLNode  // 0–1 screen-Y used to sample the focus line
  focusRange: TSLNode   // linear-depth tolerance around the sampled focus depth
  blurRadius: TSLNode   // max blur in pixels
}

export function tiltShift(
  scene: THREE.Scene,
  camera: THREE.Camera,
  opts: TiltShiftOptions,
): any {
  // pass() returns a PassNode; getTextureNode() gives a samplable TextureNode.
  const scenePass = pass(scene as any, camera as any) as any
  const sceneColor = scenePass.getTextureNode() as any
  const sceneDepth = scenePass.getTextureNode('depth') as any

  const bandBlurWeight = Fn(() => {
    const uv = screenUV as any
    return smoothstep(
      opts.focusRange as any,
      (opts.focusRange as any).add(float(0.12)),
      abs((uv.y as any).sub(opts.focusCenter as any)),
    )
  })

  const focusDepth = Fn(() => {
    const focusY = opts.focusCenter as any
    const depthLeft = linearDepth(sceneDepth.uv(vec2(float(TILT_SHIFT_FOCUS_SAMPLE_XS[0]), focusY)).r)
    const depthCenter = linearDepth(sceneDepth.uv(vec2(float(TILT_SHIFT_FOCUS_SAMPLE_XS[1]), focusY)).r)
    const depthRight = linearDepth(sceneDepth.uv(vec2(float(TILT_SHIFT_FOCUS_SAMPLE_XS[2]), focusY)).r)

    return min(depthLeft, min(depthCenter, depthRight))
  })

  const blurWeight = Fn(() => {
    const uv = screenUV as any
    const currentDepth = linearDepth(sceneDepth.uv(uv).r)
    const focusDepthValue = focusDepth()
    const depthWeight = smoothstep(
      opts.focusRange as any,
      (opts.focusRange as any).add(float(0.08)),
      abs((currentDepth as any).sub(focusDepthValue)),
    )
    const focusHasGeometry = float(1.0).sub(step(float(0.9995), focusDepthValue))

    return mix(bandBlurWeight(), depthWeight, focusHasGeometry)
  })

  // Separable 7-tap box blur along a single axis (stepVec = per-pixel offset vector).
  const blur1D = Fn(([stepVec]: any[]) => {
    const uv = screenUV as any
    const acc = property('vec4', 'blur1DAcc')
    acc.assign(vec4(0, 0, 0, 0))
    Loop(7, ({ i }: any) => {
      const offset = (i as any).sub(3).toFloat()
      const sampleUV = uv.add((stepVec as any).mul(offset))
      // TextureNode must be sampled with .uv(), not via the texture() helper.
      acc.addAssign(sceneColor.uv(sampleUV).mul(float(1.0 / 7.0)))
    })
    return acc
  })

  const hBlur = Fn(() => {
    const w = blurWeight()
    const pxSize = float(1).div((screenSize as any).x)
    const stepX = (w as any).mul(opts.blurRadius as any).mul(pxSize)
    return blur1D(vec2(stepX as any, float(0)))
  })

  const vBlur = Fn(() => {
    const w = blurWeight()
    const pySize = float(1).div((screenSize as any).y)
    const stepY = (w as any).mul(opts.blurRadius as any).mul(pySize)
    return blur1D(vec2(float(0), stepY as any))
  })

  const output = Fn(() => {
    const sharp = sceneColor.uv(screenUV as any)
    const blurred = (hBlur() as any).add(vBlur() as any).mul(float(0.5))
    const w = blurWeight()
    return mix(sharp as any, blurred, w as any)
  })

  return output()
}
