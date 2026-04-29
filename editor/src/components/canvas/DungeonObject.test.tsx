import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { useDungeonStore, type DungeonObjectRecord } from '../../store/useDungeonStore'
import type { PlayVisibility } from './playVisibility'
import { DungeonObject, PlayerSelectionRing } from './DungeonObject'

const contentPackInstanceMock = vi.fn((props: { disableBakedLight?: boolean; tint?: string }) => (
  <div
    data-testid="content-pack-instance"
    data-disable-baked-light={props.disableBakedLight ? 'true' : 'false'}
    data-tint={props.tint ?? ''}
  />
))
const projectedGroundDecalMock = vi.fn((_props: { size: number }) => null)

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
    pickedUpObject: null as { objectId: string } | null,
    objectScalePreviewOverrides: {} as Record<string, number>,
    objectRotationPreviewOverrides: {} as Record<string, [number, number, number]>,
    assetBrowser: { category: 'props' },
    generatedCharacters: {},
  }
  const store = ((selector: (state: typeof storeState) => unknown) => selector(storeState)) as
    ((selector: (state: typeof storeState) => unknown) => unknown) & { getState: () => typeof storeState }
  store.getState = () => storeState

  return {
    useDungeonStore: store,
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
  ProjectedGroundDecal: (props: { size: number }) => projectedGroundDecalMock(props),
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
    projectedGroundDecalMock.mockClear()
    const state = useDungeonStore.getState()
    state.pickedUpObject = null
    state.objectScalePreviewOverrides = {}
    state.objectRotationPreviewOverrides = {}
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

  it('passes tint overrides through to the rendered content pack instance', () => {
    render(
      <DungeonObject
        object={createObject({ props: { tintColor: '#22cc88' } })}
        visibility={visibility}
        sourceScopeKey="floor-1"
      />,
    )

    expect(screen.getByTestId('content-pack-instance')).toHaveAttribute('data-tint', '#22cc88')
  })

  it('hides the object while it is picked up for repositioning', () => {
    useDungeonStore.getState().pickedUpObject = {
      objectId: 'prop-1',
      type: 'prop',
      assetId: 'stateful-prop',
      props: {},
      floorRotationIndex: 0,
    }

    render(
      <DungeonObject
        object={createObject()}
        visibility={visibility}
        sourceScopeKey="floor-1"
      />,
    )

    expect(screen.queryByTestId('content-pack-instance')).toBeNull()
  })
})

describe('PlayerSelectionRing', () => {
  it('scales the selection decal for resized players', () => {
    render(<PlayerSelectionRing assetId={null} scale={1.5} />)

    expect(projectedGroundDecalMock).toHaveBeenCalledWith(
      expect.objectContaining({ size: 1.5 }),
    )
  })
})
