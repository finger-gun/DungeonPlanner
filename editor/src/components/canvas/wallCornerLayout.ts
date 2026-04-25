import { GRID_SIZE } from '../../hooks/useSnapToGrid'

export type WallCornerInstance = {
  key: string
  wallKeys: string[]
  position: [number, number, number]
  rotation: [number, number, number]
  objectProps?: Record<string, unknown>
}

type CornerHeading = 'east' | 'west' | 'north' | 'south'

const CORNER_ROTATION_BY_HEADINGS: Record<string, [number, number, number]> = {
  'south|west': [0, 0, 0],
  'north|west': [0, Math.PI / 2, 0],
  'east|north': [0, Math.PI, 0],
  'east|south': [0, -Math.PI / 2, 0],
}

export function deriveWallCornersFromSegments(
  wallSegments: Array<{ key: string }>,
): WallCornerInstance[] {
  const cornersByVertex = new Map<string, Array<{ heading: CornerHeading; wallKey: string }>>()

  wallSegments.forEach((segment) => {
    getWallCornerEndpoints(segment.key).forEach((endpoint) => {
      if (!cornersByVertex.has(endpoint.vertexKey)) {
        cornersByVertex.set(endpoint.vertexKey, [])
      }
      cornersByVertex.get(endpoint.vertexKey)!.push({
        heading: endpoint.heading,
        wallKey: segment.key,
      })
    })
  })

  const corners: WallCornerInstance[] = []

  cornersByVertex.forEach((entries, vertexKey) => {
    if (entries.length !== 2) {
      return
    }

    const headings = entries.map((entry) => entry.heading).sort().join('|')
    const rotation = CORNER_ROTATION_BY_HEADINGS[headings]
    if (!rotation) {
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
      wallKeys: entries.map((entry) => entry.wallKey),
      position: [vertexX * GRID_SIZE, 0, vertexZ * GRID_SIZE],
      rotation,
      objectProps: { kind: 'corner' },
    })
  })

  return corners
}

function getWallCornerEndpoints(wallKey: string): Array<{ vertexKey: string; heading: CornerHeading }> {
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
        { vertexKey: `${x}:${z + 1}`, heading: 'east' },
        { vertexKey: `${x + 1}:${z + 1}`, heading: 'west' },
      ]
    case 'south':
      return [
        { vertexKey: `${x}:${z}`, heading: 'east' },
        { vertexKey: `${x + 1}:${z}`, heading: 'west' },
      ]
    case 'east':
      return [
        { vertexKey: `${x + 1}:${z}`, heading: 'north' },
        { vertexKey: `${x + 1}:${z + 1}`, heading: 'south' },
      ]
    case 'west':
      return [
        { vertexKey: `${x}:${z}`, heading: 'north' },
        { vertexKey: `${x}:${z + 1}`, heading: 'south' },
      ]
    default:
      return []
  }
}
