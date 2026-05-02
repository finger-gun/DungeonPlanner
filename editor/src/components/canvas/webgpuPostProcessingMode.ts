import type { CameraPreset, DungeonTool } from '../../store/useDungeonStore'

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
