import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import {
  createRoomDraftFromStroke,
  getRoomDraftCenterWorldPosition,
} from '../../store/roomDraft'
import { RoomDraftOverlay } from './RoomDraftOverlay'

const invalidateMock = vi.hoisted(() => vi.fn())
const controlsMock = vi.hoisted(() => ({ enabled: true }))
const domElementMock = vi.hoisted(() => {
  const canvas = document.createElement('canvas')
  canvas.style.cursor = ''
  return canvas
})
const setRoomResizeHandleActiveMock = vi.hoisted(() => vi.fn())
const useDungeonStoreMock = vi.hoisted(() => (
  (selector: (state: { setRoomResizeHandleActive: typeof setRoomResizeHandleActiveMock }) => unknown) => selector({
    setRoomResizeHandleActive: setRoomResizeHandleActiveMock,
  })
))

vi.mock('@react-three/drei', () => ({
  Html: ({
    children,
    position,
    occlude,
    zIndexRange,
  }: {
    children: ReactNode
    position: [number, number, number]
    occlude?: boolean
    zIndexRange?: [number, number]
  }) => (
    <div
      data-testid="html-anchor"
      data-position={JSON.stringify(position)}
      data-occlude={String(occlude)}
      data-z-index-range={JSON.stringify(zIndexRange)}
    >
      {children}
    </div>
  ),
}))

vi.mock('@react-three/fiber', () => ({
  useThree: () => ({
    camera: {},
    controls: controlsMock,
    gl: { domElement: domElementMock },
    invalidate: invalidateMock,
  }),
}))

vi.mock('../../store/useDungeonStore', () => ({
  useDungeonStore: useDungeonStoreMock,
}))

describe('RoomDraftOverlay', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    controlsMock.enabled = true
    invalidateMock.mockReset()
    setRoomResizeHandleActiveMock.mockReset()
    domElementMock.style.cursor = ''
  })

  it('renders screen-space draft controls and commits on pointer down', () => {
    const draft = createRoomDraftFromStroke([1, 2], [3, 4])
    const onChange = vi.fn()
    const onCommit = vi.fn()
    const onCancel = vi.fn()

    render(
      <RoomDraftOverlay
        draft={draft}
        valid
        onChange={onChange}
        onCommit={onCommit}
        onCancel={onCancel}
      />,
    )

    const [centerX, , centerZ] = getRoomDraftCenterWorldPosition(draft)
    expect(screen.getByTestId('html-anchor')).toHaveAttribute(
      'data-position',
      JSON.stringify([centerX, 0.06, centerZ]),
    )
    expect(screen.getByTestId('html-anchor')).toHaveAttribute('data-occlude', 'false')
    expect(screen.getByTestId('html-anchor')).toHaveAttribute('data-z-index-range', JSON.stringify([120, 0]))
    expect(screen.getByTestId('room-draft-controls')).toHaveClass('-translate-x-1/2', 'translate-y-3')

    fireEvent.pointerDown(screen.getByLabelText('Commit draft room'))
    fireEvent.pointerDown(screen.getByLabelText('Cancel draft room'))

    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('keeps the commit control disabled for invalid drafts', () => {
    const draft = createRoomDraftFromStroke([1, 2], [3, 4])

    render(
      <RoomDraftOverlay
        draft={draft}
        valid={false}
        invalidTitle="Draft must remain one connected piece after clipping"
        onChange={vi.fn()}
        onCommit={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Commit draft room')).toBeDisabled()
    expect(screen.getByLabelText('Commit draft room')).toHaveAttribute(
      'title',
      'Draft must remain one connected piece after clipping',
    )
  })

  it('uses the delete action for existing room drafts', () => {
    const draft = createRoomDraftFromStroke([1, 2], [3, 4])
    const onDelete = vi.fn()
    const onCancel = vi.fn()

    render(
      <RoomDraftOverlay
        draft={draft}
        valid
        onChange={vi.fn()}
        onCommit={vi.fn()}
        onDelete={onDelete}
        onCancel={onCancel}
      />,
    )

    const deleteButton = screen.getByLabelText('Delete room')
    expect(deleteButton).toHaveAttribute('title', 'Delete room and contents')

    fireEvent.pointerDown(deleteButton)

    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('starts 3d handle drags without calling native preventDefault', () => {
    const draft = createRoomDraftFromStroke([1, 2], [3, 4])

    const { container } = render(
      <RoomDraftOverlay
        draft={draft}
        valid
        onChange={vi.fn()}
        onCommit={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    const edgeHandle = container.querySelector('mesh[key="north"]') ?? container.querySelectorAll('mesh')[1]
    expect(edgeHandle).toBeTruthy()

    const pointerDown = new PointerEvent('pointerdown', { bubbles: true, cancelable: true })
    const preventDefault = vi.spyOn(pointerDown, 'preventDefault')

    edgeHandle!.dispatchEvent(pointerDown)

    expect(preventDefault).not.toHaveBeenCalled()
    expect(setRoomResizeHandleActiveMock).toHaveBeenCalledWith(true)
  })
})
