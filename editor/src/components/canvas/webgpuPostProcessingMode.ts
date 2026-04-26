import type { CameraPreset } from '../../store/useDungeonStore'

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
