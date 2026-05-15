import { GRID_SIZE } from '../../hooks/useSnapToGrid'

export type WallCornerInstance = {
  key: string
  wallKeys: string[]
  position: [number, number, number]
  rotation: [number, number, number]
  objectProps?: Record<string, unknown>
}

type CornerAxis = 'horizontal' | 'vertical'

export function deriveWallCornersFromSegments(
  wallSegments: Array<{ key: string }>,
): WallCornerInstance[] {
  const cornersByVertex = new Map<string, Array<{ axis: CornerAxis; wallKey: string }>>()

  wallSegments.forEach((segment) => {
    getWallCornerEndpoints(segment.key).forEach((endpoint) => {
      if (!cornersByVertex.has(endpoint.vertexKey)) {
        cornersByVertex.set(endpoint.vertexKey, [])
      }
      cornersByVertex.get(endpoint.vertexKey)!.push({
        axis: endpoint.axis,
        wallKey: segment.key,
      })
    })
  })

  const corners: WallCornerInstance[] = []

  cornersByVertex.forEach((entries, vertexKey) => {
    const hasHorizontal = entries.some((entry) => entry.axis === 'horizontal')
    const hasVertical = entries.some((entry) => entry.axis === 'vertical')
    if (!hasHorizontal || !hasVertical) {
      return
    }

    const [vertexXText, vertexZText] = vertexKey.split(':')
    const vertexX = Number.parseInt(vertexXText ?? '', 10)
    const vertexZ = Number.parseInt(vertexZText ?? '', 10)
    if (Number.isNaN(vertexX) || Number.isNaN(vertexZ)) {
      return
    }

    corners.push({
      key: `${vertexKey}:corner`,
      wallKeys: [...new Set(entries.map((entry) => entry.wallKey))],
      position: [vertexX * GRID_SIZE, 0, vertexZ * GRID_SIZE],
      rotation: [0, 0, 0],
    })
  })

  return corners
}

function getWallCornerEndpoints(wallKey: string): Array<{ vertexKey: string; axis: CornerAxis }> {
  const parts = wallKey.split(':')
  if (parts.length !== 3) {
    return []
  }

  const x = Number.parseInt(parts[0] ?? '', 10)
  const z = Number.parseInt(parts[1] ?? '', 10)
  const direction = parts[2]
  if (Number.isNaN(x) || Number.isNaN(z)) {
    return []
  }

  switch (direction) {
    case 'north':
      return [
        { vertexKey: `${x}:${z + 1}`, axis: 'horizontal' },
        { vertexKey: `${x + 1}:${z + 1}`, axis: 'horizontal' },
      ]
    case 'south':
      return [
        { vertexKey: `${x}:${z}`, axis: 'horizontal' },
        { vertexKey: `${x + 1}:${z}`, axis: 'horizontal' },
      ]
    case 'east':
      return [
        { vertexKey: `${x + 1}:${z}`, axis: 'vertical' },
        { vertexKey: `${x + 1}:${z + 1}`, axis: 'vertical' },
      ]
    case 'west':
      return [
        { vertexKey: `${x}:${z}`, axis: 'vertical' },
        { vertexKey: `${x}:${z + 1}`, axis: 'vertical' },
      ]
    default:
      return []
  }
}
