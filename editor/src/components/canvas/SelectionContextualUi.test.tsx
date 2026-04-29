import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SelectionContextualUi } from './SelectionContextualUi'

const controlsMock = vi.hoisted(() => ({ enabled: true }))
const invalidateMock = vi.hoisted(() => vi.fn())
const storeState = vi.hoisted(() => ({
  tool: 'select',
  selection: 'object-1' as string | null,
  isObjectDragActive: false,
  pickedUpObject: null as { objectId: string } | null,
  placedObjects: {
    'object-1': {
      id: 'object-1',
      type: 'prop',
      assetId: 'prop-asset',
      position: [2, 0, 4] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      localRotation: null as [number, number, number] | null,
      localPosition: null as [number, number, number] | null,
      parentObjectId: null as string | null,
      props: {},
      cell: [0, 0] as [number, number],
      cellKey: '0:0:floor',
      supportCellKey: '0:0',
      layerId: 'default',
    },
  } as Record<string, unknown>,
  setObjectProps: vi.fn(),
  repositionObject: vi.fn(),
  removeSelectedObject: vi.fn(),
  setObjectScalePreview: vi.fn(),
  setObjectRotationPreview: vi.fn(),
  setObjectDragActive: vi.fn(),
  setObjectMoveDragPointer: vi.fn(),
  pickUpObject: vi.fn(() => true),
}))

const getRegisteredObjectMock = vi.hoisted(() => vi.fn((_id: string) => null))
const useDungeonStoreMock = vi.hoisted(() => {
  const store = ((selector: (state: typeof storeState) => unknown) => selector(storeState)) as
    ((selector: (state: typeof storeState) => unknown) => unknown) & { getState: () => typeof storeState }
  store.getState = () => storeState
  return store
})

vi.mock('@react-three/drei', () => ({
  Html: ({
    children,
    position,
    occlude,
  }: {
    children: ReactNode
    position: [number, number, number]
    occlude?: boolean
  }) => (
    <div
      data-testid="html-anchor"
      data-position={JSON.stringify(position)}
      data-occlude={String(occlude)}
    >
      {children}
    </div>
  ),
}))

vi.mock('@react-three/fiber', () => ({
  useThree: () => ({
    controls: controlsMock,
    invalidate: invalidateMock,
  }),
}))

vi.mock('../../store/useDungeonStore', () => ({
  useDungeonStore: useDungeonStoreMock,
}))

vi.mock('./objectRegistry', () => ({
  getRegisteredObject: (id: string) => getRegisteredObjectMock(id),
  useObjectRegistryVersion: () => 1,
}))

describe('SelectionContextualUi', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    controlsMock.enabled = true
    invalidateMock.mockClear()
    storeState.tool = 'select'
    storeState.selection = 'object-1'
    storeState.isObjectDragActive = false
    storeState.pickedUpObject = null
    storeState.placedObjects = {
      'object-1': {
        id: 'object-1',
        type: 'prop',
        assetId: 'prop-asset',
        position: [2, 0, 4],
        rotation: [0, 0, 0],
        localRotation: null,
        localPosition: null,
        parentObjectId: null,
        props: {},
        cell: [0, 0],
        cellKey: '0:0:floor',
        supportCellKey: '0:0',
        layerId: 'default',
      },
    }
    storeState.setObjectProps.mockReset()
    storeState.repositionObject.mockReset()
    storeState.removeSelectedObject.mockReset()
    storeState.setObjectScalePreview.mockReset()
    storeState.setObjectRotationPreview.mockReset()
    storeState.setObjectDragActive.mockReset()
    storeState.setObjectMoveDragPointer.mockReset()
    storeState.pickUpObject.mockReset()
    storeState.pickUpObject.mockReturnValue(true)
    getRegisteredObjectMock.mockReturnValue(null)
  })

  it('renders the lowered icon controls for a selected object in select mode', () => {
    render(<SelectionContextualUi />)

    expect(screen.getByTestId('selection-contextual-ui')).toHaveClass('-translate-x-1/2', 'translate-y-3')
    expect(screen.getByLabelText('Scale selected object')).toBeInTheDocument()
    expect(screen.getByLabelText('Rotate selected object')).toBeInTheDocument()
    expect(screen.getByLabelText('Move selected object')).toBeInTheDocument()
    expect(screen.getByLabelText('Delete selected object')).toBeInTheDocument()
    expect(screen.getByTestId('html-anchor')).toHaveAttribute('data-position', JSON.stringify([2, 0.28, 4]))
    expect(screen.getByTestId('html-anchor')).toHaveAttribute('data-occlude', 'false')
  })

  it('starts a scale drag that previews and commits instance scale changes', () => {
    render(<SelectionContextualUi />)

    fireEvent.pointerDown(screen.getByLabelText('Scale selected object'), {
      button: 0,
      clientX: 100,
      clientY: 100,
    })

    expect(storeState.setObjectScalePreview).toHaveBeenNthCalledWith(1, 'object-1', 1)
    expect(storeState.setObjectDragActive).toHaveBeenNthCalledWith(1, true)
    expect(controlsMock.enabled).toBe(false)

    fireEvent.pointerMove(window, {
      clientX: 140,
      clientY: 100,
    })

    expect(storeState.setObjectScalePreview).toHaveBeenLastCalledWith('object-1', 1.32)

    fireEvent.pointerUp(window)

    expect(storeState.setObjectProps).toHaveBeenCalledWith(
      'object-1',
      expect.objectContaining({ instanceScale: 1.32 }),
    )
    expect(storeState.setObjectScalePreview).toHaveBeenLastCalledWith('object-1', null)
    expect(storeState.setObjectRotationPreview).toHaveBeenLastCalledWith('object-1', null)
    expect(storeState.setObjectDragActive).toHaveBeenLastCalledWith(false)
    expect(controlsMock.enabled).toBe(true)
  })

  it('starts a rotation drag that previews and commits object rotation', () => {
    render(<SelectionContextualUi />)

    fireEvent.pointerDown(screen.getByLabelText('Rotate selected object'), {
      button: 0,
      clientX: 100,
      clientY: 100,
    })

    expect(storeState.setObjectRotationPreview).toHaveBeenNthCalledWith(1, 'object-1', [0, 0, 0])
    expect(storeState.setObjectDragActive).toHaveBeenNthCalledWith(1, true)
    expect(controlsMock.enabled).toBe(false)

    fireEvent.pointerMove(window, {
      clientX: 140,
      clientY: 100,
    })

    expect(storeState.setObjectRotationPreview).toHaveBeenLastCalledWith('object-1', [0, 0.6, 0])

    fireEvent.pointerUp(window)

    expect(storeState.repositionObject).toHaveBeenCalledWith(
      'object-1',
      expect.objectContaining({
        rotation: [0, 0.6, 0],
        localRotation: null,
      }),
    )
    expect(storeState.setObjectRotationPreview).toHaveBeenLastCalledWith('object-1', null)
    expect(storeState.setObjectScalePreview).toHaveBeenLastCalledWith('object-1', null)
    expect(storeState.setObjectDragActive).toHaveBeenLastCalledWith(false)
    expect(controlsMock.enabled).toBe(true)
  })

  it('starts a held move drag from the move button', () => {
    render(<SelectionContextualUi />)

    fireEvent.pointerDown(screen.getByLabelText('Move selected object'), {
      button: 0,
      clientX: 120,
      clientY: 140,
    })

    expect(storeState.pickUpObject).toHaveBeenCalledWith('object-1')
    expect(storeState.setObjectMoveDragPointer).toHaveBeenCalledWith({
      clientX: 120,
      clientY: 140,
    })
    expect(storeState.setObjectDragActive).toHaveBeenCalledWith(true)
    expect(controlsMock.enabled).toBe(false)

    fireEvent.pointerMove(window, {
      clientX: 168,
      clientY: 182,
    })

    expect(storeState.setObjectMoveDragPointer).toHaveBeenLastCalledWith({
      clientX: 168,
      clientY: 182,
    })
  })

  it('deletes the selected object from the trash button', () => {
    render(<SelectionContextualUi />)

    fireEvent.pointerDown(screen.getByLabelText('Delete selected object'), {
      button: 0,
    })

    expect(storeState.removeSelectedObject).toHaveBeenCalled()
  })

  it('hides the overlay when the selection is not a placed object', () => {
    storeState.selection = 'opening-1'

    render(<SelectionContextualUi />)

    expect(screen.queryByTestId('html-anchor')).toBeNull()
  })
})
