import { DepthStencilFormat, FloatType, UnsignedInt248Type } from 'three'
import type { CameraPreset, DungeonTool } from '../../store/useDungeonStore'

export const WEBGPU_SCENE_PASS_OPTIONS = Object.freeze({
  stencilBuffer: true,
})

export function applyWebGpuScenePassStencilSupport(
  scenePass: {
    renderTarget?: {
      stencilBuffer?: boolean
      depthTexture?: {
        format?: number
        type?: number
      } | null
    } | null
  },
  reversedDepthBuffer: boolean,
) {
  const renderTarget = scenePass.renderTarget
  const depthTexture = renderTarget?.depthTexture
  if (!renderTarget || !depthTexture) {
    return
  }

  renderTarget.stencilBuffer = true
  depthTexture.format = DepthStencilFormat
  depthTexture.type = reversedDepthBuffer ? FloatType : UnsignedInt248Type
}

export function shouldApplyWebGpuLensBlur({
  activeCameraMode: _activeCameraMode,
  lensEnabled,
}: {
  activeCameraMode: CameraPreset
  lensEnabled: boolean
}) {
  return lensEnabled
}

export function getWebGpuPostProcessingPipeline({
  activeCameraMode,
  lensEnabled,
  pixelateEnabled,
}: {
  activeCameraMode: CameraPreset
  lensEnabled: boolean
  pixelateEnabled: boolean
}) {
  return {
    applyBlur: shouldApplyWebGpuLensBlur({ activeCameraMode, lensEnabled }),
    applyPixelate: pixelateEnabled,
  }
}

export function shouldEnableActiveFloorPostProcessing({
  activeCameraMode,
  lensEnabled,
  pixelateEnabled,
  tool,
  selection: _selection,
}: {
  activeCameraMode: CameraPreset
  lensEnabled: boolean
  pixelateEnabled: boolean
  tool: DungeonTool
  selection: string | null
}) {
  const { applyBlur, applyPixelate } = getWebGpuPostProcessingPipeline({
    activeCameraMode,
    lensEnabled,
    pixelateEnabled,
  })

  return applyBlur || applyPixelate || tool === 'select'
}
