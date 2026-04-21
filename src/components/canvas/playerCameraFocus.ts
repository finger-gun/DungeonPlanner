import * as THREE from 'three'
import { getGeneratedCharacterScale } from '../../generated-characters/rendering'
import { DEFAULT_GENERATED_CHARACTER_SIZE, type GeneratedCharacterRecord } from '../../generated-characters/types'

const BASE_PLAYER_CAMERA_FOCUS_HEIGHT = 1.045

export function easePlayerCameraFocusProgress(progress: number) {
  if (progress <= 0) {
    return 0
  }

  if (progress >= 1) {
    return 1
  }

  return THREE.MathUtils.smootherstep(progress, 0, 1)
}

export function getPlayerCameraFocusPoint(
  position: readonly [number, number, number],
  character: Pick<GeneratedCharacterRecord, 'size'> | null = null,
) {
  const scale = getGeneratedCharacterScale(character?.size ?? DEFAULT_GENERATED_CHARACTER_SIZE)

  return {
    x: position[0],
    y: position[1] + (BASE_PLAYER_CAMERA_FOCUS_HEIGHT * scale),
    z: position[2],
  }
}
