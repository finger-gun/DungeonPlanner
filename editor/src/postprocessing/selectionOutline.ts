/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Per-object selection outline using depth-buffer edge detection (TSL).
 *
 * A cloned camera renders a lightweight selection-proxy scene to a depth texture.
 * Pixels that have geometry (depth < far)
 * AND have at least one cardinal neighbour that is background (depth ≈ 1.0)
 * are silhouette edges → drawn in the outline colour with alpha = 1.
 * All other pixels are transparent (alpha = 0), so alphaOver compositing
 * works correctly without overpainting the base scene.
 */
import { pass, screenUV, screenSize, float, vec2, vec4, step, max, mix, Fn } from 'three/tsl'
import type * as THREE from 'three'

/**
 * Returns a TSL node: outline colour at silhouette edges, transparent elsewhere.
 * @param outlineCamera - a camera cloned from the active view camera
 */
export function selectionOutline(
  scene: THREE.Scene,
  outlineCamera: THREE.Camera,
  outlineColor: [number, number, number] = [1, 0.15, 0.15],
): any {
  const selectionPass = pass(scene as any, outlineCamera as any) as any
  // Depth texture: 0 at near plane, ~1.0 at far plane (cleared to 1.0 where no geometry)
  const depthTex = selectionPass.getTextureNode('depth') as any

  const FAR = float(0.9999)

  return Fn(() => {
    const uv = screenUV as any
    const px = float(1.0).div((screenSize as any).x)
    const py = float(1.0).div((screenSize as any).y)

    const depth = depthTex.sample(uv).r
    const dR    = depthTex.sample(uv.add(vec2(px,        float(0)))).r
    const dL    = depthTex.sample(uv.sub(vec2(px,        float(0)))).r
    const dU    = depthTex.sample(uv.add(vec2(float(0),  py       ))).r
    const dD    = depthTex.sample(uv.sub(vec2(float(0),  py       ))).r

    // 1.0 if this pixel has geometry (depth below far), 0.0 otherwise
    const hasGeom = float(1.0).sub(step(FAR, depth))
    // 1.0 if any cardinal neighbour is background (depth ≥ far)
    const neighborIsBg = step(FAR, max(dR, max(dL, max(dU, dD))))

    const isEdge = hasGeom.mul(neighborIsBg)

    return vec4(float(outlineColor[0]), float(outlineColor[1]), float(outlineColor[2]), isEdge)
  })()
}

/**
 * Alpha-composite `overlay` (vec4) on top of `base` (vec4).
 * Uses the overlay's alpha to blend — pixels with alpha=0 are transparent.
 */
export const alphaOver = Fn(([base, overlay]: any[]) =>
  vec4(mix(base.xyz, overlay.xyz, overlay.w), base.w),
)
