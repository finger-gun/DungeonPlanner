/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  convertToTexture,
  mix,
  screenUV,
  step,
  uniform,
} from 'three/tsl'
import { dof } from './DepthOfFieldNode'

type TSLNode = ReturnType<typeof uniform>
export { depthFocusRangeFromFocalLength } from './tiltShiftMath'

export type TiltShiftOptions = {
  focusDistance: TSLNode // autofocus target distance along the camera center ray
  nearFocusRange: TSLNode // foreground blur falloff distance in world units
  farFocusRange: TSLNode  // background blur falloff distance in world units
  blurRadius: TSLNode // artistic bokeh size multiplier
}

/**
 * Applies a tilt-shift depth-of-field effect to an already-rendered scene pass.
 *
 * Accepts the scene color and view-Z nodes from an existing PassNode rather than
 * creating its own pass(scene, camera) internally. This avoids a duplicate scene
 * render — the caller (WebGPUPostProcessing) owns the single PassNode that the
 * whole pipeline shares, which prevents simultaneous shader compilation contention
 * when point lights are in the scene.
 */
export function tiltShift(
  sceneColor: any,
  sceneViewZ: any,
  opts: TiltShiftOptions,
): any {
  const colorTexture = convertToTexture(sceneColor)
  const currentDistance = sceneViewZ.negate()
  const signedDistanceFromFocus = currentDistance.sub(opts.focusDistance as any)
  const sharp = colorTexture.sample(screenUV as any)
  const nearMask = step(
    signedDistanceFromFocus,
    0,
  )
  const farMask = step(
    0,
    signedDistanceFromFocus,
  )
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

  return mix(mix(sharp as any, farField as any, farMask), nearField as any, nearMask)
}
