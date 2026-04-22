import type { CameraPreset } from '../../store/useDungeonStore'

export function shouldApplyWebGpuLensBlur({
  activeCameraMode,
  lensEnabled,
}: {
  activeCameraMode: CameraPreset
  lensEnabled: boolean
}) {
  return lensEnabled && activeCameraMode === 'perspective'
}
