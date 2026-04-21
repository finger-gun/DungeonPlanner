import * as THREE from 'three'
import type { MapMode } from '../../store/useDungeonStore'

export type EnvironmentLightingState = {
  ambientColor: THREE.Color
  keyColor: THREE.Color
  fillColor: THREE.Color
  skyColor: THREE.Color
  fogNear: number
  fogFar: number
  keyMultiplier: number
  fillMultiplier: number
}

export function getEnvironmentLightingState(mapMode: MapMode, timeOfDay: number): EnvironmentLightingState {
  const blend = clamp01(timeOfDay)

  if (mapMode === 'outdoor') {
    return {
      ambientColor: mapColor(blend, [
        [0, '#ffc89a'],
        [0.5, '#e8f5ff'],
        [1, '#5c74b3'],
      ]),
      keyColor: mapColor(blend, [
        [0, '#ffd7a6'],
        [0.5, '#fff2cc'],
        [1, '#9db4ff'],
      ]),
      fillColor: mapColor(blend, [
        [0, '#ff9f6e'],
        [0.5, '#9bd5ff'],
        [1, '#3f5ca8'],
      ]),
      skyColor: mapColor(blend, [
        [0, '#ff9f6e'],
        [0.5, '#76c8ff'],
        [1, '#09152c'],
      ]),
      fogNear: 34,
      fogFar: 92,
      keyMultiplier: mapNumber(blend, [
        [0, 1.3],
        [0.5, 2.2],
        [1, 0.35],
      ]),
      fillMultiplier: 0.7,
    }
  }

  return {
    ambientColor: mapColor(blend, [
      [0, '#f7c89a'],
      [0.5, '#ffe4c7'],
      [1, '#7483b8'],
    ]),
    keyColor: mapColor(blend, [
      [0, '#ffcb93'],
      [0.5, '#ffd29d'],
      [1, '#8ea5df'],
    ]),
    fillColor: mapColor(blend, [
      [0, '#b89f90'],
      [0.5, '#89dceb'],
      [1, '#41598f'],
    ]),
    skyColor: mapColor(blend, [
      [0, '#2a1f1a'],
      [0.5, '#120f0e'],
      [1, '#0a1020'],
    ]),
    fogNear: mapNumber(blend, [
      [0, 24],
      [0.5, 26],
      [1, 22],
    ]),
    fogFar: mapNumber(blend, [
      [0, 72],
      [0.5, 74],
      [1, 64],
    ]),
    keyMultiplier: mapNumber(blend, [
      [0, 1.5],
      [0.5, 2],
      [1, 0.75],
    ]),
    fillMultiplier: mapNumber(blend, [
      [0, 0.65],
      [0.5, 0.85],
      [1, 0.3],
    ]),
  }
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

function mapColor(time: number, keyframes: Array<[number, string]>) {
  if (keyframes.length === 0) {
    return new THREE.Color('#ffffff')
  }

  if (time <= keyframes[0]![0]) {
    return new THREE.Color(keyframes[0]![1])
  }

  for (let index = 1; index < keyframes.length; index += 1) {
    const [currentTime, currentColor] = keyframes[index]!
    const [previousTime, previousColor] = keyframes[index - 1]!
    if (time <= currentTime) {
      const alpha = (time - previousTime) / Math.max(currentTime - previousTime, Number.EPSILON)
      return new THREE.Color(previousColor).lerp(new THREE.Color(currentColor), alpha)
    }
  }

  return new THREE.Color(keyframes.at(-1)![1])
}

function mapNumber(time: number, keyframes: Array<[number, number]>) {
  if (keyframes.length === 0) {
    return 0
  }

  if (time <= keyframes[0]![0]) {
    return keyframes[0]![1]
  }

  for (let index = 1; index < keyframes.length; index += 1) {
    const [currentTime, currentValue] = keyframes[index]!
    const [previousTime, previousValue] = keyframes[index - 1]!
    if (time <= currentTime) {
      const alpha = (time - previousTime) / Math.max(currentTime - previousTime, Number.EPSILON)
      return THREE.MathUtils.lerp(previousValue, currentValue, alpha)
    }
  }

  return keyframes.at(-1)![1]
}
