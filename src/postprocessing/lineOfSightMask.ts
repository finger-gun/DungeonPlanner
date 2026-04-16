/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fn, float, max, mix, pass, screenUV, step, vec4 } from 'three/tsl'
import type * as THREE from 'three'

export const EXPLORED_MEMORY_MASK_LAYER = 29
export const LINE_OF_SIGHT_MASK_LAYER = 30
const EXPLORED_BRIGHTNESS = 0.6
const DEPTH_EPSILON = 0.0005

export function geometryLayerMask(
  scene: THREE.Scene,
  maskCamera: THREE.Camera,
  sceneDepthTex: any,
): any {
  const maskPass = pass(scene as any, maskCamera as any) as any
  const depthTex = maskPass.getTextureNode('depth') as any
  const FAR = float(0.9999)

  return Fn(() => {
    const depth = depthTex.uv(screenUV as any).r
    const sceneDepth = sceneDepthTex.uv(screenUV as any).r
    const hasGeometry = float(1.0).sub(step(FAR, depth))
    const isFrontmost = step((depth as any).sub(float(DEPTH_EPSILON)), sceneDepth)
    const visible = hasGeometry.mul(isFrontmost)
    return vec4(float(0.0), float(0.0), float(0.0), visible)
  })()
}

export const applyLineOfSightMask = Fn(([base, visibleMask, exploredMask]: any[]) => {
  const exploredColor = (base.xyz as any).mul(float(EXPLORED_BRIGHTNESS))
  const rememberedColor = mix(float(0.0).xxx, exploredColor, exploredMask.w)
  const finalColor = mix(rememberedColor, base.xyz, visibleMask.w)
  const finalAlpha = (base.w as any).mul(max(visibleMask.w, exploredMask.w))
  return vec4(finalColor, finalAlpha)
})
