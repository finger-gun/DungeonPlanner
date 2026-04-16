import { describe, expect, it } from 'vitest'
import { createPlayDragState, updatePlayDragState } from './playDrag'

describe('playDrag', () => {
  it('keeps the grabbed player under the cursor while snapping the drop target', () => {
    const drag = createPlayDragState({
      id: 'player-1',
      assetId: 'generated.player.test',
      rotation: [0, 0, 0],
      position: [1, 0, 1],
      cell: [0, 0],
    }, { x: 0.2, y: 0, z: 0.4 })

    const updated = updatePlayDragState(drag, { x: 2.4, y: 0, z: 3.1 }, true)

    expect(updated.displayPosition).toEqual([3.2, 0.24, 3.7])
    expect(updated.cell).toEqual([1, 1])
    expect(updated.position).toEqual([3, 0, 3])
    expect(updated.valid).toBe(true)
  })

  it('starts the dragged player slightly lifted above the floor', () => {
    const drag = createPlayDragState({
      id: 'player-1',
      assetId: 'generated.player.test',
      rotation: [0, 0, 0],
      position: [1, 0, 1],
      cell: [0, 0],
    })

    expect(drag.displayPosition).toEqual([1, 0.24, 1])
    expect(drag.position).toEqual([1, 0, 1])
  })

  it('marks the dragged player invalid when the target cell is blocked', () => {
    const drag = createPlayDragState({
      id: 'player-1',
      assetId: 'generated.player.test',
      rotation: [0, 0, 0],
      position: [1, 0, 1],
      cell: [0, 0],
    })

    const occupied = updatePlayDragState(drag, { x: 2.1, y: 0, z: 2.1 }, true, 'player-2')
    const unpainted = updatePlayDragState(drag, { x: 2.1, y: 0, z: 2.1 }, false)

    expect(occupied.valid).toBe(false)
    expect(unpainted.valid).toBe(false)
  })
})
