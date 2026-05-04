import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import DungeonPlannerTiledLightsNode from './TiledLightsNode'

describe('TiledLightsNode', () => {
  it('marks the packed light texture dirty only when light data changes', () => {
    const node = new (DungeonPlannerTiledLightsNode as unknown as new () => {
      setSize: (width: number, height: number) => void
      setLights: (lights: unknown[]) => void
      updateLightsTexture: () => void
      _lightsTexture: THREE.DataTexture
    })()

    node.setSize(64, 64)
    const lightTexture = node._lightsTexture
    const light = createPackedLight([1, 2, 3], [1, 0.5, 0.25], 1.5, 8, 2)
    const initialVersion = lightTexture.version

    node.setLights([light])
    node.updateLightsTexture()
    expect(lightTexture.version).toBe(initialVersion + 1)

    const stableVersion = lightTexture.version
    node.updateLightsTexture()
    expect(lightTexture.version).toBe(stableVersion)

    light.matrixWorld.setPosition(4, 2, 3)
    node.updateLightsTexture()
    expect(lightTexture.version).toBe(stableVersion + 1)
  })

  it('marks a recreated light texture dirty after resize', () => {
    const node = new (DungeonPlannerTiledLightsNode as unknown as new () => {
      setSize: (width: number, height: number) => void
      _lightsTexture: THREE.DataTexture
    })()

    node.setSize(32, 32)
    const firstTexture = node._lightsTexture

    node.setSize(96, 32)
    const secondTexture = node._lightsTexture

    expect(secondTexture).not.toBe(firstTexture)
    expect(secondTexture.version).toBeGreaterThan(0)
  })
})

function createPackedLight(
  position: readonly [number, number, number],
  color: readonly [number, number, number],
  intensity: number,
  distance: number,
  decay: number,
) {
  return {
    isPointLight: true,
    matrixWorld: new THREE.Matrix4().setPosition(...position),
    color: new THREE.Color(...color),
    intensity,
    distance,
    decay,
  }
}
