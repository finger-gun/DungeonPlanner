import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { BatchedTileEntries, type StaticTileEntry } from './BatchedTileEntries'
import * as tileAssetResolution from './tileAssetResolution'

const mocked = vi.hoisted(() => ({
  stream: {
    setSourceRegistration: vi.fn(),
    clearSourceRegistration: vi.fn(),
  },
}))

vi.mock('./TileGpuStreamContext', () => ({
  useTileGpuStream: () => mocked.stream,
}))

vi.mock('../../rendering/useGLTF', () => ({
  useGLTF: Object.assign(
    (assetUrls: string[] | string) => Array.isArray(assetUrls)
      ? assetUrls.map((assetUrl) => ({ scene: { uuid: `scene:${assetUrl}` } }))
      : { scene: { uuid: `scene:${assetUrls}` } },
    { preload: vi.fn() },
  ),
}))

vi.mock('./fogOfWar', () => ({
  useFogOfWarRuntime: () => null,
}))

vi.mock('../../store/useDungeonStore', () => {
  const state = {
    lightFlickerEnabled: false,
  }
  const store = ((selector: (storeState: typeof state) => unknown) => selector(state)) as
    ((selector: (storeState: typeof state) => unknown) => unknown) & { getState: () => typeof state }
  store.getState = () => state

  return {
    useDungeonStore: store,
  }
})

vi.mock('./ContentPackInstance', () => ({
  ContentPackInstance: () => null,
}))

describe('BatchedTileEntries registration lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(tileAssetResolution, 'resolveBatchedTileAsset').mockImplementation(() => ({
      assetUrl: '/assets/floor.glb',
      transformKey: 'default',
      receiveShadow: true,
    }))
  })

  afterEach(() => {
    cleanup()
  })

  it('updates source registrations in place without clearing during descriptor changes', () => {
    const { rerender, unmount } = render(
      <BatchedTileEntries
        entries={[createEntry()]}
        floorId="floor-1"
        mountId="mount-1"
        sourceId="static-floor"
      />,
    )

    expect(mocked.stream.setSourceRegistration).toHaveBeenCalledTimes(1)
    expect(mocked.stream.clearSourceRegistration).not.toHaveBeenCalled()

    rerender(
      <BatchedTileEntries
        entries={[createEntry({ position: [1, 0, 0] })]}
        floorId="floor-1"
        mountId="mount-1"
        sourceId="static-floor"
      />,
    )

    expect(mocked.stream.setSourceRegistration).toHaveBeenCalledTimes(2)
    expect(mocked.stream.clearSourceRegistration).not.toHaveBeenCalled()

    unmount()

    expect(mocked.stream.clearSourceRegistration).toHaveBeenCalledTimes(1)
    expect(mocked.stream.clearSourceRegistration).toHaveBeenCalledWith('mount-1', 'static-floor:0:0')
  })

  it('clears the previous registration when the source identity changes', () => {
    const { rerender } = render(
      <BatchedTileEntries
        entries={[createEntry()]}
        floorId="floor-1"
        mountId="mount-1"
        sourceId="static-floor"
      />,
    )

    rerender(
      <BatchedTileEntries
        entries={[createEntry()]}
        floorId="floor-1"
        mountId="mount-1"
        sourceId="transaction-floor"
        sourceKind="transaction"
        transactionId="tx-1"
      />,
    )

    expect(mocked.stream.clearSourceRegistration).toHaveBeenCalledTimes(1)
    expect(mocked.stream.clearSourceRegistration).toHaveBeenCalledWith('mount-1', 'static-floor:0:0')
    expect(mocked.stream.setSourceRegistration).toHaveBeenCalledTimes(2)
    expect(mocked.stream.setSourceRegistration).toHaveBeenLastCalledWith(
      'mount-1',
      'transaction-floor:0:0',
      expect.objectContaining({
        kind: 'transaction',
        transactionId: 'tx-1',
      }),
    )
  })
})

function createEntry(overrides: Partial<StaticTileEntry> = {}): StaticTileEntry {
  return {
    key: 'floor:0:0',
    assetId: 'floor-tile',
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    variant: 'floor',
    visibility: 'visible',
    ...overrides,
  }
}
