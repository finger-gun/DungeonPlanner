import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import type { DungeonObjectRecord } from '../../store/useDungeonStore'
import type { PlayVisibility } from './playVisibility'
import { DungeonObject } from './DungeonObject'

const contentPackInstanceMock = vi.fn((props: { disableBakedLight?: boolean }) => (
  <div
    data-testid="content-pack-instance"
    data-disable-baked-light={props.disableBakedLight ? 'true' : 'false'}
  />
))

vi.mock('./ContentPackInstance', () => ({
  ContentPackInstance: (props: { disableBakedLight?: boolean }) => contentPackInstanceMock(props),
}))

vi.mock('../../content-packs/registry', () => ({
  getContentPackAssetById: (assetId: string | null) => {
    if (assetId === 'stateful-prop') {
      return {
        getPlayModeNextProps: () => ({ open: true }),
      }
    }
    return null
  },
}))

vi.mock('../../store/useDungeonStore', () => {
  const storeState = {
    selection: null,
    selectObject: vi.fn(),
    removeObject: vi.fn(),
    setObjectProps: vi.fn(),
    tool: 'select',
    assetBrowser: { category: 'props' },
    generatedCharacters: {},
  }

  return {
    useDungeonStore: (selector: (state: typeof storeState) => unknown) => selector(storeState),
  }
})

vi.mock('./objectRegistry', () => ({
  registerObject: vi.fn(),
  unregisterObject: vi.fn(),
}))

vi.mock('./objectSourceRegistry', () => ({
  registerObjectSources: vi.fn(),
  unregisterObjectSources: vi.fn(),
}))

vi.mock('./openPassageInteraction', () => ({
  shouldAllowObjectContextDelete: () => true,
}))

vi.mock('./ProjectedGroundDecal', () => ({
  ProjectedGroundDecal: () => null,
}))

vi.mock('../../generated-characters/rendering', () => ({
  getGeneratedCharacterIndicatorSize: () => 1,
  getGeneratedCharacterScale: () => 1,
}))

const visibility: PlayVisibility = {
  active: false,
  visibleCellKeys: [],
  playerOrigins: [],
  getObjectVisibility: () => 'visible' as const,
  getCellVisibility: () => 'visible',
  getWallVisibility: () => 'visible',
}

function createObject(overrides: Partial<DungeonObjectRecord> = {}): DungeonObjectRecord {
  return {
    id: 'prop-1',
    type: 'prop',
    assetId: 'stateful-prop',
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    props: {},
    cellKey: '0:0',
    ...overrides,
  } as DungeonObjectRecord
}

describe('DungeonObject baked light suspension', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    contentPackInstanceMock.mockClear()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('temporarily disables baked prop lighting after a stateful prop changes state', () => {
    const { rerender } = render(
      <DungeonObject
        object={createObject()}
        visibility={visibility}
        sourceScopeKey="floor-1"
      />,
    )

    expect(screen.getByTestId('content-pack-instance')).toHaveAttribute('data-disable-baked-light', 'false')

    rerender(
      <DungeonObject
        object={createObject({ props: { open: true } })}
        visibility={visibility}
        sourceScopeKey="floor-1"
      />,
    )

    expect(screen.getByTestId('content-pack-instance')).toHaveAttribute('data-disable-baked-light', 'true')

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(screen.getByTestId('content-pack-instance')).toHaveAttribute('data-disable-baked-light', 'false')
  })

  it('keeps baked prop lighting enabled for non-stateful props', () => {
    const { rerender } = render(
      <DungeonObject
        object={createObject({ assetId: 'plain-prop' })}
        visibility={visibility}
        sourceScopeKey="floor-1"
      />,
    )

    rerender(
      <DungeonObject
        object={createObject({ assetId: 'plain-prop', props: { color: 'red' } })}
        visibility={visibility}
        sourceScopeKey="floor-1"
      />,
    )

    expect(screen.getByTestId('content-pack-instance')).toHaveAttribute('data-disable-baked-light', 'false')
  })
})
