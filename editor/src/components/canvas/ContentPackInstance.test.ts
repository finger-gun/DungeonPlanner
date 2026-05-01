import { describe, expect, it } from 'vitest'
import { buildPropDescriptorKey } from './ContentPackInstance'
import { shouldUseRuntimePropProbe } from './runtimePropProbeMode'

describe('buildPropDescriptorKey', () => {
  it('reuses component descriptor keys for equivalent prop objects with different key ordering', () => {
    const firstKey = buildPropDescriptorKey({
      assetId: 'generated.character',
      hasComponent: true,
      objectProps: {
        variant: 'hero',
        animation: {
          state: 'idle',
          frame: 3,
        },
        pose: 'front',
      },
      variant: 'prop',
      variantKey: 'default',
    })
    const secondKey = buildPropDescriptorKey({
      assetId: 'generated.character',
      hasComponent: true,
      objectProps: {
        pose: 'front',
        animation: {
          frame: 3,
          state: 'idle',
        },
        variant: 'hero',
      },
      variant: 'prop',
      variantKey: 'default',
    })

    expect(firstKey).toBe(secondKey)
  })

  it('keeps descriptor keys distinct when component prop content changes', () => {
    const firstKey = buildPropDescriptorKey({
      assetId: 'generated.character',
      hasComponent: true,
      objectProps: {
        pose: 'front',
        animation: {
          frame: 3,
          state: 'idle',
        },
      },
      variant: 'prop',
      variantKey: 'default',
    })
    const secondKey = buildPropDescriptorKey({
      assetId: 'generated.character',
      hasComponent: true,
      objectProps: {
        pose: 'front',
        animation: {
          frame: 4,
          state: 'idle',
        },
      },
      variant: 'prop',
      variantKey: 'default',
    })

    expect(firstKey).not.toBe(secondKey)
  })
})

describe('shouldUseRuntimePropProbe', () => {
  it('keeps runtime prop probes active in edit and play modes', () => {
    expect(shouldUseRuntimePropProbe({ tool: 'play' })).toBe(true)
    expect(shouldUseRuntimePropProbe({ tool: 'room' })).toBe(true)
    expect(shouldUseRuntimePropProbe({ tool: 'select' })).toBe(true)
    expect(shouldUseRuntimePropProbe({ tool: 'room', showPropProbeDebug: true })).toBe(true)
  })
})
