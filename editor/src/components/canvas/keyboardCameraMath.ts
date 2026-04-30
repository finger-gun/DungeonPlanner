const PAN_SPEED = 0.006
const ROTATE_SPEED = 0.025
const KEYBOARD_REFERENCE_FPS = 60
const MAX_KEYBOARD_FRAME_SCALE = 2

export function getKeyboardFrameScale(deltaSeconds: number) {
  return Math.min(Math.max(deltaSeconds, 0) * KEYBOARD_REFERENCE_FPS, MAX_KEYBOARD_FRAME_SCALE)
}

export function getKeyboardPanAmount(distance: number, deltaSeconds: number) {
  return distance * PAN_SPEED * getKeyboardFrameScale(deltaSeconds)
}

export function getKeyboardRotateAmount(deltaSeconds: number) {
  return ROTATE_SPEED * getKeyboardFrameScale(deltaSeconds)
}
