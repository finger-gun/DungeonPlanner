import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ConnectsTo, ContentPackAsset, PropConnector } from './types'
import {
  resetContentPackDeprecationWarningsForTest,
  warnIfUsesDeprecatedConnectsTo,
} from './deprecations'

function createTestAsset(
  id: string,
  connectsTo?: PropConnector | ConnectsTo | ConnectsTo[],
): ContentPackAsset {
  return {
    id,
    slug: id,
    name: id,
    category: 'prop',
    Component: (() => null) as ContentPackAsset['Component'],
    metadata: connectsTo ? { connectsTo } : {},
  }
}

describe('warnIfUsesDeprecatedConnectsTo', () => {
  afterEach(() => {
    resetContentPackDeprecationWarningsForTest()
    vi.restoreAllMocks()
  })

  it('warns once per asset id when connectsTo is present', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const asset = createTestAsset('deprecated.asset', 'WALL')

    warnIfUsesDeprecatedConnectsTo(asset)
    warnIfUsesDeprecatedConnectsTo(asset)

    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('deprecated.asset'),
    )
  })

  it('does not warn when an asset already uses connectors only', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    warnIfUsesDeprecatedConnectsTo({
      ...createTestAsset('connector.asset'),
      metadata: {
        connectors: [{ type: 'FLOOR', point: [0, 0, 0] }],
      },
    })

    expect(warnSpy).not.toHaveBeenCalled()
  })
})
