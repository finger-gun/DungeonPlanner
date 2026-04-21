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
})
