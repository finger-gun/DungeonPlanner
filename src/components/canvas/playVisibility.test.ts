import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  buildPortalLookup,
  castVisibilityMaskRay,
  computeVisibilitySamples,
  computeVisibleCellKeys,
  getObjectVisibilityState,
  isVisiblePlayerOrigin,
} from './playVisibility'
import type { OpeningRecord, PaintedCells } from '../../store/useDungeonStore'
import { GRID_SIZE } from '../../hooks/useSnapToGrid'
import { registerObject, unregisterObject } from './objectRegistry'

function makeCells(entries: Array<{ cell: [number, number]; roomId?: string | null }>): PaintedCells {
  return Object.fromEntries(
    entries.map(({ cell, roomId = null }) => [
      `${cell[0]}:${cell[1]}`,
      { cell, layerId: 'default', roomId },
    ]),
  )
}

describe('computeVisibleCellKeys', () => {
  it('reveals cells in direct line of sight within range', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [2, 0], roomId: 'room-a' },
    ])

    expect(computeVisibleCellKeys(paintedCells, {}, [[0, 0]], 3)).toEqual(
      expect.arrayContaining(['0:0', '1:0', '2:0']),
    )
  })

  it('stops at closed room boundaries', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-b' },
    ])

    expect(computeVisibleCellKeys(paintedCells, {}, [[0, 0]], 3)).toEqual(['0:0'])
  })

  it('passes through opened walls', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-b' },
    ])

    const wallOpenings: Record<string, OpeningRecord> = {
      'open-1': {
        id: 'open-1',
        assetId: 'core.opening_door_wall_1',
        wallKey: '0:0:east',
        width: 1,
        flipped: false,
        layerId: 'default',
      },
    }

    expect(computeVisibleCellKeys(paintedCells, wallOpenings, [[0, 0]], 3)).toEqual(
      expect.arrayContaining(['0:0', '1:0']),
    )
  })

  it('shows the occluding cell but hides cells behind a blocking prop', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [2, 0], roomId: 'room-a' },
    ])

    const visible = computeVisibleCellKeys(paintedCells, {}, [[0, 0]], 3, ['1:0'])
    expect(visible).toContain('1:0')
    expect(visible).not.toContain('2:0')
  })

  it('blocks diagonal sight when an intermediate cell contains a LOS blocker', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [1, 1], roomId: 'room-a' },
    ])

    expect(computeVisibleCellKeys(paintedCells, {}, [[0, 0]], 3, ['1:0'])).not.toContain('1:1')
  })

  it('does not see diagonally through a closed corner', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-b' },
      { cell: [0, 1], roomId: 'room-c' },
      { cell: [1, 1], roomId: 'room-d' },
    ])

    expect(computeVisibleCellKeys(paintedCells, {}, [[0, 0]], 3)).not.toContain('1:1')
  })

  it('can see diagonally through a corner when both crossed walls are opened', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-b' },
      { cell: [0, 1], roomId: 'room-c' },
      { cell: [1, 1], roomId: 'room-d' },
    ])

    const wallOpenings: Record<string, OpeningRecord> = {
      east: {
        id: 'open-east',
        assetId: 'core.opening_door_wall_1',
        wallKey: '0:0:east',
        width: 1,
        flipped: false,
        layerId: 'default',
      },
      north: {
        id: 'open-north',
        assetId: 'core.opening_door_wall_1',
        wallKey: '0:0:north',
        width: 1,
        flipped: false,
        layerId: 'default',
      },
      eastOfNorth: {
        id: 'open-east-of-north',
        assetId: 'core.opening_door_wall_1',
        wallKey: '0:1:east',
        width: 1,
        flipped: false,
        layerId: 'default',
      },
      northOfEast: {
        id: 'open-north-of-east',
        assetId: 'core.opening_door_wall_1',
        wallKey: '1:0:north',
        width: 1,
        flipped: false,
        layerId: 'default',
      },
    }

    expect(computeVisibleCellKeys(paintedCells, wallOpenings, [[0, 0]], 3)).toContain('1:1')
  })

  it('merges visibility from multiple players', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [4, 0], roomId: 'room-b' },
      { cell: [5, 0], roomId: 'room-b' },
    ])

    expect(computeVisibleCellKeys(paintedCells, {}, [[0, 0], [4, 0]], 1)).toEqual(
      expect.arrayContaining(['0:0', '1:0', '4:0', '5:0']),
    )
  })

  it('can see through a blocker cell when the actual blocker mesh does not intersect the ray', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [2, 0], roomId: 'room-a' },
    ])

    const blockerId = 'blocker-miss'
    const blocker = new THREE.Group()
    blocker.position.set(0, 0, 0)
    blocker.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 1.4, 0.24),
        new THREE.MeshBasicMaterial(),
      ),
    )
    blocker.children[0]?.position.set(GRID_SIZE * 1.78, 0.7, GRID_SIZE * 0.88)
    registerObject(blockerId, blocker)

    try {
      const visible = computeVisibleCellKeys(
        paintedCells,
        {},
        [[0, 0]],
        3,
        ['1:0'],
        new Map([['1:0', [blockerId]]]),
      )

      expect(visible).toContain('2:0')
    } finally {
      unregisterObject(blockerId)
    }
  })

  it('stops at the blocker cell when the serialized blocker mesh intersects the ray', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [2, 0], roomId: 'room-a' },
    ])

    const blockerId = 'blocker-hit'
    const blocker = new THREE.Group()
    blocker.position.set(0, 0, 0)
    blocker.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 1.4, 0.28),
        new THREE.MeshBasicMaterial(),
      ),
    )
    blocker.children[0]?.position.set(GRID_SIZE * 1.5, 0.7, GRID_SIZE * 0.5)
    registerObject(blockerId, blocker)

    try {
      const visible = computeVisibleCellKeys(
        paintedCells,
        {},
        [[0, 0]],
        3,
        ['1:0'],
        new Map([['1:0', [blockerId]]]),
      )

      expect(visible).toContain('1:0')
      expect(visible).not.toContain('2:0')
    } finally {
      unregisterObject(blockerId)
    }
  })

  it('ignores blocker children marked to skip LOS raycasts', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [2, 0], roomId: 'room-a' },
    ])

    const blockerId = 'ignored-ring'
    const blocker = new THREE.Group()
    blocker.position.set(0, 0, 0)
    blocker.userData.ignoreLosRaycast = true

    const ringMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.02, 0.8),
      new THREE.MeshBasicMaterial(),
    )
    ringMesh.position.set(GRID_SIZE * 1.5, 0.38, GRID_SIZE * 0.5)
    ringMesh.userData.ignoreLosRaycast = true
    blocker.add(ringMesh)
    registerObject(blockerId, blocker)

    try {
      const visible = computeVisibleCellKeys(
        paintedCells,
        {},
        [[0, 0]],
        3,
        ['1:0'],
        new Map([['1:0', [blockerId]]]),
      )

      expect(visible).toContain('2:0')
    } finally {
      unregisterObject(blockerId)
    }
  })
})

describe('castVisibilityMaskRay', () => {
  it('passes straight through a doorway portal', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-b' },
    ])

    const wallOpenings: Record<string, OpeningRecord> = {
      'open-1': {
        id: 'open-1',
        assetId: 'core.opening_door_wall_1',
        wallKey: '0:0:east',
        width: 1,
        flipped: false,
        layerId: 'default',
      },
    }

    const point = castVisibilityMaskRay([0, 0], 0, paintedCells, wallOpenings, 3)
    expect(point[0]).toBeGreaterThan(2.5)
  })

  it('clips rays that hit the closed part of a door wall', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-b' },
    ])

    const wallOpenings: Record<string, OpeningRecord> = {
      'open-1': {
        id: 'open-1',
        assetId: 'core.opening_door_wall_1',
        wallKey: '0:0:east',
        width: 1,
        flipped: false,
        layerId: 'default',
      },
    }

    const point = castVisibilityMaskRay([0, 0], Math.PI / 4, paintedCells, wallOpenings, 3)
    expect(point[0]).toBeLessThan(2.05)
  })

  it('treats open passages as full-width LOS portals', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-b' },
      { cell: [2, 0], roomId: 'room-c' },
      { cell: [1, 1], roomId: 'room-b' },
      { cell: [2, 1], roomId: 'room-c' },
    ])

    const wallOpenings: Record<string, OpeningRecord> = {
      'open-passage': {
        id: 'open-passage',
        assetId: null,
        wallKey: '0:0:east',
        width: 1,
        flipped: false,
        layerId: 'default',
      },
    }

    const point = castVisibilityMaskRay([0, 0], 0.67, paintedCells, wallOpenings, 3)
    expect(point[0]).toBeGreaterThan(2.3)
  })
})

describe('computeVisibilitySamples', () => {
  it('normalizes doorway edge angles before sorting around the east-facing seam', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-b' },
    ])

    const wallOpenings: Record<string, OpeningRecord> = {
      eastDoor: {
        id: 'east-door',
        assetId: 'core.opening_door_wall_1',
        wallKey: '0:0:east',
        width: 1,
        flipped: false,
        layerId: 'default',
      },
    }

    const samples = computeVisibilitySamples(
      [0, 0],
      paintedCells,
      buildPortalLookup(wallOpenings),
      new Set(),
      4,
    )

    expect(samples.length).toBeGreaterThan(0)
    samples.forEach((sample) => {
      expect(sample.angle).toBeGreaterThanOrEqual(0)
      expect(sample.angle).toBeLessThan(Math.PI * 2)
    })

    for (let index = 1; index < samples.length; index += 1) {
      expect(samples[index - 1]!.angle).toBeLessThanOrEqual(samples[index]!.angle)
    }
  })
})

describe('isVisiblePlayerOrigin', () => {
  it('uses the snapped cell coordinates instead of the occupancy key suffix', () => {
    const paintedCells = makeCells([{ cell: [0, 0], roomId: 'room-a' }])

    expect(
      isVisiblePlayerOrigin(
        {
          id: 'player-1',
          type: 'player',
          assetId: 'generated.player.test',
          position: [1, 0, 1],
          rotation: [0, 0, 0],
          cell: [0, 0],
          cellKey: '0:0:floor',
          layerId: 'default',
          props: {},
        },
        paintedCells,
        { default: { id: 'default', name: 'Default', visible: true, locked: false } },
        {},
      ),
    ).toBe(true)
  })

  it('does not treat generated NPCs as line-of-sight origins', () => {
    const paintedCells = makeCells([{ cell: [0, 0], roomId: 'room-a' }])

    expect(
      isVisiblePlayerOrigin(
        {
          id: 'npc-1',
          type: 'player',
          assetId: 'generated.player.npc',
          position: [1, 0, 1],
          rotation: [0, 0, 0],
          cell: [0, 0],
          cellKey: '0:0:floor',
          layerId: 'default',
          props: {},
        },
        paintedCells,
        { default: { id: 'default', name: 'Default', visible: true, locked: false } },
        {
          'generated.player.npc': {
            assetId: 'generated.player.npc',
            storageId: 'npc-storage',
            name: 'Goblin',
            kind: 'npc',
            prompt: 'goblin',
            model: 'x/z-image-turbo',
            size: 'M',
            originalImageUrl: 'data:image/png;base64,test',
            processedImageUrl: 'data:image/png;base64,test',
            thumbnailUrl: 'data:image/png;base64,test',
            width: 256,
            height: 512,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        },
      ),
    ).toBe(false)
  })
})

describe('getObjectVisibilityState', () => {
  it('hides generated NPCs when their cell is only explored', () => {
    expect(
      getObjectVisibilityState(
        {
          id: 'npc-1',
          type: 'player',
          assetId: 'generated.player.npc',
          position: [1, 0, 1],
          rotation: [0, 0, 0],
          cell: [0, 0],
          cellKey: '0:0:floor',
          layerId: 'default',
          props: {},
        },
        () => 'explored',
        {
          'generated.player.npc': {
            assetId: 'generated.player.npc',
            storageId: 'npc-storage',
            name: 'Goblin',
            kind: 'npc',
            prompt: 'goblin',
            model: 'x/z-image-turbo',
            size: 'M',
            originalImageUrl: 'data:image/png;base64,test',
            processedImageUrl: 'data:image/png;base64,test',
            thumbnailUrl: 'data:image/png;base64,test',
            width: 256,
            height: 512,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        },
      ),
    ).toBe('hidden')
  })

  it('keeps players visible according to the cell visibility state', () => {
    expect(
      getObjectVisibilityState(
        {
          id: 'player-1',
          type: 'player',
          assetId: 'generated.player.pc',
          position: [1, 0, 1],
          rotation: [0, 0, 0],
          cell: [0, 0],
          cellKey: '0:0:floor',
          layerId: 'default',
          props: {},
        },
        () => 'explored',
        {
          'generated.player.pc': {
            assetId: 'generated.player.pc',
            storageId: 'pc-storage',
            name: 'Hero',
            kind: 'player',
            prompt: 'hero',
            model: 'x/z-image-turbo',
            size: 'M',
            originalImageUrl: 'data:image/png;base64,test',
            processedImageUrl: 'data:image/png;base64,test',
            thumbnailUrl: 'data:image/png;base64,test',
            width: 256,
            height: 512,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        },
      ),
    ).toBe('explored')
  })

})
