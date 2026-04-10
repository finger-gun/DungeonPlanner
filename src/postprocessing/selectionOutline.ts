/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Per-object selection outline using Three.js `toonOutlinePass` (three/tsl).
 *
 * Selected objects must be on SELECTION_OUTLINE_LAYER. A clone of the main
 * camera with only that layer visible is passed to toonOutlinePass so only
 * the selected prop is outlined.
 *
 * Returns a TSL node that contains just the outline pixels (transparent
 * background). Composite over the main scene with alpha blending.
 */
import { toonOutlinePass, color, uniform, Fn, vec4, mix } from 'three/tsl'
import type * as THREE from 'three'

/** Three.js layer index reserved for the selection outline. */
export const SELECTION_OUTLINE_LAYER = 31

export type SelectionOutlineOptions = {
  /** Sky-blue default — can be any hex colour. */
  outlineColor?: number
  /** World-space thickness multiplier (default 0.012). */
  thickness?: number
}

export function selectionOutline(
  scene: THREE.Scene,
  /** The main render camera. We create a layer-filtered copy internally. */
  camera: THREE.Camera,
  opts: SelectionOutlineOptions = {},
): { node: any; syncCamera: (src: THREE.Camera) => void } {
  const { outlineColor = 0x7dd3fc, thickness = 0.012 } = opts

  // Clone the camera; we'll sync position/rotation/matrix each frame.
  const outlineCamera = (camera as any).clone() as THREE.Camera
  // Only render the selection layer
  ;(outlineCamera as any).layers.disableAll()
  ;(outlineCamera as any).layers.enable(SELECTION_OUTLINE_LAYER)

  const thicknessUniform = uniform(thickness)

  const outlineNode = toonOutlinePass(
    scene as any,
    outlineCamera as any,
    color(outlineColor) as any,
    thicknessUniform as any,
    1.0,
  )

  function syncCamera(src: THREE.Camera) {
    ;(outlineCamera as any).position.copy((src as any).position)
    ;(outlineCamera as any).quaternion.copy((src as any).quaternion)
    ;(outlineCamera as any).matrix.copy((src as any).matrix)
    ;(outlineCamera as any).matrixWorld.copy((src as any).matrixWorld)
    ;(outlineCamera as any).projectionMatrix.copy((src as any).projectionMatrix)
    ;(outlineCamera as any).projectionMatrixInverse.copy((src as any).projectionMatrixInverse)
  }

  return { node: outlineNode, syncCamera }
}

/**
 * Alpha-composite `overlay` (vec4) on top of `base` (vec4).
 * Uses the overlay's alpha channel to blend.
 */
export const alphaOver = Fn(([base, overlay]: any[]) => {
  return vec4(
    mix(base.xyz, overlay.xyz, overlay.w),
    base.w,
  )
})
