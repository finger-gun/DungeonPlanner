import { describe, expect, it } from 'vitest'
import { ForwardPlusLightRegistry } from './forwardPlusLightRegistry'

describe('ForwardPlusLightRegistry', () => {
  it('publishes stable light proxies for renderer-owned groups', () => {
    const registry = new ForwardPlusLightRegistry()

    registry.setGroupLights('torches', [{
      key: 'torch-1',
      position: [1, 2, 3],
      color: '#ffaa33',
      intensity: 2,
      distance: 6,
      decay: 2,
    }])

    const [light] = registry.getLights()
    expect(light.matrixWorld.elements[12]).toBe(1)
    expect(light.matrixWorld.elements[13]).toBe(2)
    expect(light.matrixWorld.elements[14]).toBe(3)
    expect(light.intensity).toBe(2)
    expect(light.distance).toBe(6)
  })

  it('does not bump the version for identical updates', () => {
    const registry = new ForwardPlusLightRegistry()

    registry.setGroupLights('torches', [{
      key: 'torch-1',
      position: [1, 2, 3],
      color: '#ffaa33',
      intensity: 2,
      distance: 6,
      decay: 2,
    }])

    const version = registry.getVersion()
    registry.setGroupLights('torches', [{
      key: 'torch-1',
      position: [1, 2, 3],
      color: '#ffaa33',
      intensity: 2,
      distance: 6,
      decay: 2,
    }])

    expect(registry.getVersion()).toBe(version)
  })

  it('aggregates multiple groups and clears them independently', () => {
    const registry = new ForwardPlusLightRegistry()

    registry.setGroupLights('floor-a', [{
      key: 'torch-1',
      position: [1, 2, 3],
      color: '#ffaa33',
      intensity: 2,
      distance: 6,
      decay: 2,
    }])
    registry.setGroupLights('floor-b', [{
      key: 'torch-2',
      position: [4, 5, 6],
      color: '#66aaff',
      intensity: 1,
      distance: 4,
      decay: 2,
    }])

    expect(registry.getLights()).toHaveLength(2)

    registry.clearGroup('floor-a')

    const [light] = registry.getLights()
    expect(registry.getLights()).toHaveLength(1)
    expect(light.matrixWorld.elements[12]).toBe(4)
    expect(light.matrixWorld.elements[13]).toBe(5)
    expect(light.matrixWorld.elements[14]).toBe(6)
  })
})
