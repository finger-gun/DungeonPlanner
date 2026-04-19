import { describe, expect, it } from 'vitest'
import { createPlayDragState, updatePlayDragState } from './playDrag'

describe('playDrag terrain support', () => {
  it('anchors drag state to sculpted outdoor terrain heights', () => {
    const outdoorTerrainHeights = {
      '0:0': { cell: [0, 0] as [number, number], height: 1.5 },
    }

    const dragState = createPlayDragState({
      id: 'player-1',
      assetId: 'generated.player.test',
      rotation: [0, 0, 0],
      position: [1, 0, 1],
      cell: [0, 0],
    }, undefined, outdoorTerrainHeights)

    expect(dragState.positionY).toBe(1.5)
    expect(dragState.position).toEqual([1, 1.5, 1])
  })

  it('updates dragged positions to the target sculpted cell height', () => {
    const outdoorTerrainHeights = {
      '1:0': { cell: [1, 0] as [number, number], height: 0.75 },
    }

    const dragState = updatePlayDragState({
      objectId: 'player-1',
      assetId: 'generated.player.test',
      rotation: [0, 0, 0],
      positionY: 0,
      cell: [0, 0],
      position: [1, 0, 1],
      displayPosition: [1, 0.24, 1],
      grabOffset: [0, 0],
      valid: true,
      animationState: 'holding',
    }, {
      x: 3,
      y: 0,
      z: 1,
    }, true, undefined, outdoorTerrainHeights)

    expect(dragState.cell).toEqual([1, 0])
    expect(dragState.positionY).toBe(0.75)
    expect(dragState.position).toEqual([3, 0.75, 1])
  })
})
