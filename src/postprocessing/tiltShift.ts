/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Fn,
  pass,
  mix,
  screenUV,
  step,
  uniform,
} from 'three/tsl'
import { dof } from 'three/addons/tsl/display/DepthOfFieldNode.js'
import type * as THREE from 'three'

type TSLNode = ReturnType<typeof uniform>
export { depthFocusRangeFromFocalLength } from './tiltShiftMath'

export type TiltShiftOptions = {
  focusDistance: TSLNode // autofocus target distance along the camera center ray
  nearFocusRange: TSLNode // foreground blur falloff distance in world units
  farFocusRange: TSLNode  // background blur falloff distance in world units
  blurRadius: TSLNode // artistic bokeh size multiplier
}

export function tiltShift(
  scene: THREE.Scene,
  camera: THREE.Camera,
  opts: TiltShiftOptions,
): any {
  const scenePass = pass(scene as any, camera as any) as any
  const sceneColor = scenePass.getTextureNode() as any
  const sceneViewZ = scenePass.getViewZNode() as any
  const currentDistance = sceneViewZ.negate()
  const signedDistanceFromFocus = currentDistance.sub(opts.focusDistance as any)
  const nearMask = step(signedDistanceFromFocus, 0)
  const farMask = step(0, signedDistanceFromFocus)

  const nearField = dof(
    sceneColor,
    sceneViewZ,
    opts.focusDistance as any,
    opts.nearFocusRange as any,
    opts.blurRadius as any,
  ) as any
  const farField = dof(
    sceneColor,
    sceneViewZ,
    opts.focusDistance as any,
    opts.farFocusRange as any,
    opts.blurRadius as any,
  ) as any

  return Fn(() => {
    const sharp = sceneColor.sample(screenUV as any)
    const withFar = mix(sharp as any, farField as any, farMask)
    return mix(withFar as any, nearField as any, nearMask)
  })()
}
