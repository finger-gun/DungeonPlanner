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
  mix, smoothstep, abs, vec2, float,
  Fn, Loop, property, vec4, uniform,
} from 'three/tsl'
import type * as THREE from 'three'

type TSLNode = ReturnType<typeof uniform>

export type TiltShiftOptions = {
  focusCenter: TSLNode  // 0–1 screen-Y of focus band centre
  focusRange: TSLNode   // half-width of sharp zone
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

  const blurWeight = Fn(() => {
    const uv = screenUV as any
    return smoothstep(
      opts.focusRange as any,
      (opts.focusRange as any).add(float(0.2)),
      abs((uv.y as any).sub(opts.focusCenter as any)),
    )
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
