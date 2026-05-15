import * as THREE from 'three'

const DOOR_ANIMATION_EPSILON = 0.001

export function advanceDoorAngle(currentAngle: number, targetAngle: number, delta: number, speed: number) {
  const nextAngle = THREE.MathUtils.damp(currentAngle, targetAngle, speed, delta)
  const settled = Math.abs(targetAngle - nextAngle) <= DOOR_ANIMATION_EPSILON

  return {
    nextAngle: settled ? targetAngle : nextAngle,
    needsInvalidate: !settled,
  }
}
