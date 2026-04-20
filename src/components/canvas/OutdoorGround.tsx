import { useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { GRID_SIZE, getCellKey } from '../../hooks/useSnapToGrid'
import {
  type OutdoorGroundTextureCells,
  type OutdoorGroundTextureType,
} from '../../store/useDungeonStore'
import {
  OUTDOOR_TERRAIN_SEGMENTS,
  OUTDOOR_TERRAIN_WORLD_SIZE,
  getOutdoorTerrainCellHeight,
  type OutdoorTerrainHeightfield,
} from '../../store/outdoorTerrain'

const OUTDOOR_GROUND_SIZE = OUTDOOR_TERRAIN_WORLD_SIZE
const OUTDOOR_GROUND_HALF_SIZE = OUTDOOR_GROUND_SIZE / 2
const MASK_TEXTURE_SIZE = 768
const MASK_BLUR_PX = 6
const TERRAIN_REPEAT = 36
const SIDE_BLEND_BAND_HEIGHT = GRID_SIZE * 0.45
const OUTDOOR_GROUND_FACE_EPSILON = 0.0001
const OUTDOOR_MIN_CELL = -OUTDOOR_TERRAIN_SEGMENTS / 2
const OUTDOOR_MAX_CELL_EXCLUSIVE = OUTDOOR_MIN_CELL + OUTDOOR_TERRAIN_SEGMENTS

const TERRAIN_TEXTURE_PATHS: Record<OutdoorGroundTextureType, string> = {
  'short-grass': '/textures/outdoor/short-grass/albedo.png',
  'dry-dirt': '/textures/outdoor/dry-dirt/albedo.png',
  'rough-stone': '/textures/outdoor/rough-stone/albedo.png',
  'wet-dirt': '/textures/outdoor/wet-dirt/albedo.png',
}

type OverlayTextureType = OutdoorGroundTextureType
const OVERLAY_TEXTURE_TYPES: OverlayTextureType[] = ['short-grass', 'dry-dirt', 'rough-stone', 'wet-dirt']

type FaceTextureResolution = {
  sideTexture: OutdoorGroundTextureType
  blendTopTexture: OutdoorGroundTextureType | null
}

export function resolveOutdoorFaceTextures(topTexture: OutdoorGroundTextureType): FaceTextureResolution {
  if (topTexture === 'short-grass') {
    return {
      sideTexture: 'wet-dirt',
      blendTopTexture: 'short-grass',
    }
  }
  return {
    sideTexture: topTexture,
    blendTopTexture: null,
  }
}

function getTopTextureType(
  cells: OutdoorGroundTextureCells,
  cellX: number,
  cellZ: number,
  defaultTextureType: OutdoorGroundTextureType,
): OutdoorGroundTextureType {
  return cells[getCellKey([cellX, cellZ])]?.textureType ?? defaultTextureType
}

function configureGroundTexture(texture: THREE.Texture) {
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(TERRAIN_REPEAT, TERRAIN_REPEAT)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
}

function configureMaskTexture(texture: THREE.CanvasTexture) {
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.flipY = true
  texture.needsUpdate = true
  return texture
}

function createGeometryFromBuffers(buffers: { positions: number[]; uvs: number[] }) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(buffers.positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(buffers.uvs, 2))
  geometry.computeVertexNormals()
  return geometry
}

function appendQuad(
  buffers: { positions: number[]; uvs: number[] },
  corners: [[number, number, number], [number, number, number], [number, number, number], [number, number, number]],
  uv: [[number, number], [number, number], [number, number], [number, number]],
) {
  const [a, b, c, d] = corners
  const [ua, ub, uc, ud] = uv

  buffers.positions.push(...a, ...b, ...c, ...a, ...c, ...d)
  buffers.uvs.push(...ua, ...ub, ...uc, ...ua, ...uc, ...ud)
}

function getTopUv(worldX: number, worldZ: number): [number, number] {
  return [
    (worldX + OUTDOOR_GROUND_HALF_SIZE) / OUTDOOR_GROUND_SIZE,
    (worldZ + OUTDOOR_GROUND_HALF_SIZE) / OUTDOOR_GROUND_SIZE,
  ]
}

function getSideUv(horizontalWorld: number, height: number): [number, number] {
  return [
    (horizontalWorld + OUTDOOR_GROUND_HALF_SIZE) / OUTDOOR_GROUND_SIZE,
    (height + OUTDOOR_GROUND_HALF_SIZE) / OUTDOOR_GROUND_SIZE,
  ]
}

function getSideBlendUv(horizontalWorld: number, verticalBlendT: number): [number, number] {
  return [
    (horizontalWorld + OUTDOOR_GROUND_HALF_SIZE) / OUTDOOR_GROUND_SIZE,
    verticalBlendT,
  ]
}

function createSideBlendAlphaTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 256
  const context = canvas.getContext('2d')
  if (!context) {
    return configureMaskTexture(new THREE.CanvasTexture(canvas))
  }

  const gradient = context.createLinearGradient(0, canvas.height, 0, 0)
  gradient.addColorStop(0, '#000000')
  gradient.addColorStop(0.2, '#121212')
  gradient.addColorStop(0.55, '#545454')
  gradient.addColorStop(0.82, '#d0d0d0')
  gradient.addColorStop(1, '#ffffff')
  context.fillStyle = gradient
  context.fillRect(0, 0, canvas.width, canvas.height)
  return configureMaskTexture(new THREE.CanvasTexture(canvas))
}

function createOutdoorTerrainGeometries(
  outdoorTerrainHeights: OutdoorTerrainHeightfield,
  outdoorGroundTextureCells: OutdoorGroundTextureCells,
  outdoorDefaultGroundTexture: OutdoorGroundTextureType,
) {
  const topBuffers = { positions: [] as number[], uvs: [] as number[] }
  const sideBuffersByTexture: Record<OutdoorGroundTextureType, { positions: number[]; uvs: number[] }> = {
    'short-grass': { positions: [], uvs: [] },
    'dry-dirt': { positions: [], uvs: [] },
    'rough-stone': { positions: [], uvs: [] },
    'wet-dirt': { positions: [], uvs: [] },
  }
  const grassBlendBuffers = { positions: [] as number[], uvs: [] as number[] }

  for (let cellX = OUTDOOR_MIN_CELL; cellX < OUTDOOR_MAX_CELL_EXCLUSIVE; cellX += 1) {
    for (let cellZ = OUTDOOR_MIN_CELL; cellZ < OUTDOOR_MAX_CELL_EXCLUSIVE; cellZ += 1) {
      const currentHeight = getOutdoorTerrainCellHeight(outdoorTerrainHeights, [cellX, cellZ])
      const topTexture = getTopTextureType(
        outdoorGroundTextureCells,
        cellX,
        cellZ,
        outdoorDefaultGroundTexture,
      )
      const faceTexture = resolveOutdoorFaceTextures(topTexture)
      const x0 = cellX * GRID_SIZE
      const x1 = x0 + GRID_SIZE
      const z0 = cellZ * GRID_SIZE
      const z1 = z0 + GRID_SIZE

      appendQuad(
        topBuffers,
        [
          [x0, currentHeight, z0],
          [x0, currentHeight, z1],
          [x1, currentHeight, z1],
          [x1, currentHeight, z0],
        ],
        [
          getTopUv(x0, z0),
          getTopUv(x0, z1),
          getTopUv(x1, z1),
          getTopUv(x1, z0),
        ],
      )

      const sideEdges: Array<{
        neighborCell: [number, number]
        horizontalStart: number
        horizontalEnd: number
        corners: (bottom: number, top: number) => [[number, number, number], [number, number, number], [number, number, number], [number, number, number]]
      }> = [
        {
          neighborCell: [cellX - 1, cellZ],
          horizontalStart: z1,
          horizontalEnd: z0,
          corners: (bottom, top) => [
            [x0, bottom, z1],
            [x0, bottom, z0],
            [x0, top, z0],
            [x0, top, z1],
          ],
        },
        {
          neighborCell: [cellX + 1, cellZ],
          horizontalStart: z0,
          horizontalEnd: z1,
          corners: (bottom, top) => [
            [x1, bottom, z0],
            [x1, bottom, z1],
            [x1, top, z1],
            [x1, top, z0],
          ],
        },
        {
          neighborCell: [cellX, cellZ - 1],
          horizontalStart: x0,
          horizontalEnd: x1,
          corners: (bottom, top) => [
            [x0, bottom, z0],
            [x1, bottom, z0],
            [x1, top, z0],
            [x0, top, z0],
          ],
        },
        {
          neighborCell: [cellX, cellZ + 1],
          horizontalStart: x1,
          horizontalEnd: x0,
          corners: (bottom, top) => [
            [x1, bottom, z1],
            [x0, bottom, z1],
            [x0, top, z1],
            [x1, top, z1],
          ],
        },
      ]

      sideEdges.forEach((edge) => {
        const neighborHeight = getOutdoorTerrainCellHeight(outdoorTerrainHeights, edge.neighborCell)
        if (currentHeight <= neighborHeight + OUTDOOR_GROUND_FACE_EPSILON) {
          return
        }

        appendQuad(
          sideBuffersByTexture[faceTexture.sideTexture],
          edge.corners(neighborHeight, currentHeight),
          [
            getSideUv(edge.horizontalStart, neighborHeight),
            getSideUv(edge.horizontalEnd, neighborHeight),
            getSideUv(edge.horizontalEnd, currentHeight),
            getSideUv(edge.horizontalStart, currentHeight),
          ],
        )

        if (!faceTexture.blendTopTexture) {
          return
        }

        const blendBottom = Math.max(neighborHeight, currentHeight - SIDE_BLEND_BAND_HEIGHT)
        if (currentHeight - blendBottom <= OUTDOOR_GROUND_FACE_EPSILON) {
          return
        }

        appendQuad(
          grassBlendBuffers,
          edge.corners(blendBottom, currentHeight),
          [
            getSideBlendUv(edge.horizontalStart, 0),
            getSideBlendUv(edge.horizontalEnd, 0),
            getSideBlendUv(edge.horizontalEnd, 1),
            getSideBlendUv(edge.horizontalStart, 1),
          ],
        )
      })
    }
  }

  return {
    topGeometry: createGeometryFromBuffers(topBuffers),
    sideGeometries: {
      'short-grass': createGeometryFromBuffers(sideBuffersByTexture['short-grass']),
      'dry-dirt': createGeometryFromBuffers(sideBuffersByTexture['dry-dirt']),
      'rough-stone': createGeometryFromBuffers(sideBuffersByTexture['rough-stone']),
      'wet-dirt': createGeometryFromBuffers(sideBuffersByTexture['wet-dirt']),
    },
    grassBlendGeometry: createGeometryFromBuffers(grassBlendBuffers),
  }
}

export function createTextureMask(
  cells: OutdoorGroundTextureCells,
  textureType: OutdoorGroundTextureType,
): THREE.CanvasTexture {
  const sourceCanvas = document.createElement('canvas')
  sourceCanvas.width = MASK_TEXTURE_SIZE
  sourceCanvas.height = MASK_TEXTURE_SIZE
  const sourceContext = sourceCanvas.getContext('2d')
  if (!sourceContext) {
    return configureMaskTexture(new THREE.CanvasTexture(sourceCanvas))
  }

  sourceContext.fillStyle = '#000000'
  sourceContext.fillRect(0, 0, MASK_TEXTURE_SIZE, MASK_TEXTURE_SIZE)
  sourceContext.fillStyle = '#ffffff'

  Object.values(cells).forEach((record) => {
    if (record.textureType !== textureType) {
      return
    }

    const minWorldX = record.cell[0] * GRID_SIZE
    const maxWorldX = minWorldX + GRID_SIZE
    const minWorldZ = record.cell[1] * GRID_SIZE
    const maxWorldZ = minWorldZ + GRID_SIZE

    const minU = (minWorldX + OUTDOOR_GROUND_HALF_SIZE) / OUTDOOR_GROUND_SIZE
    const maxU = (maxWorldX + OUTDOOR_GROUND_HALF_SIZE) / OUTDOOR_GROUND_SIZE
    const minV = (minWorldZ + OUTDOOR_GROUND_HALF_SIZE) / OUTDOOR_GROUND_SIZE
    const maxV = (maxWorldZ + OUTDOOR_GROUND_HALF_SIZE) / OUTDOOR_GROUND_SIZE

    const x = Math.floor(minU * MASK_TEXTURE_SIZE)
    const y = Math.floor((1 - maxV) * MASK_TEXTURE_SIZE)
    const width = Math.ceil((maxU - minU) * MASK_TEXTURE_SIZE)
    const height = Math.ceil((maxV - minV) * MASK_TEXTURE_SIZE)

    sourceContext.fillRect(x, y, width, height)
  })

  const blurredCanvas = document.createElement('canvas')
  blurredCanvas.width = MASK_TEXTURE_SIZE
  blurredCanvas.height = MASK_TEXTURE_SIZE
  const blurredContext = blurredCanvas.getContext('2d')
  if (!blurredContext) {
    return configureMaskTexture(new THREE.CanvasTexture(sourceCanvas))
  }

  blurredContext.fillStyle = '#000000'
  blurredContext.fillRect(0, 0, MASK_TEXTURE_SIZE, MASK_TEXTURE_SIZE)
  blurredContext.filter = `blur(${MASK_BLUR_PX}px)`
  blurredContext.drawImage(sourceCanvas, 0, 0)
  blurredContext.filter = 'none'

  return configureMaskTexture(new THREE.CanvasTexture(blurredCanvas))
}

export function OutdoorGround({
  outdoorBlend,
  outdoorGroundTextureCells,
  outdoorDefaultGroundTexture,
  outdoorTerrainHeights,
}: {
  outdoorBlend: number
  outdoorGroundTextureCells?: OutdoorGroundTextureCells
  outdoorDefaultGroundTexture: OutdoorGroundTextureType
  outdoorTerrainHeights: OutdoorTerrainHeightfield
}) {
  const groundTextureCells = outdoorGroundTextureCells ?? {}
  const textures = useTexture(TERRAIN_TEXTURE_PATHS)
  const {
    topGeometry,
    sideGeometries,
    grassBlendGeometry,
  } = useMemo(
    () => createOutdoorTerrainGeometries(
      outdoorTerrainHeights,
      groundTextureCells,
      outdoorDefaultGroundTexture,
    ),
    [groundTextureCells, outdoorDefaultGroundTexture, outdoorTerrainHeights],
  )

  const maskTextures = useMemo<Record<OverlayTextureType, THREE.CanvasTexture>>(
    () => ({
      'short-grass': createTextureMask(groundTextureCells, 'short-grass'),
      'dry-dirt': createTextureMask(groundTextureCells, 'dry-dirt'),
      'rough-stone': createTextureMask(groundTextureCells, 'rough-stone'),
      'wet-dirt': createTextureMask(groundTextureCells, 'wet-dirt'),
    }),
    [groundTextureCells],
  )
  const sideBlendAlphaTexture = useMemo(() => createSideBlendAlphaTexture(), [])

  useEffect(
    () => () => {
      topGeometry.dispose()
      sideGeometries['short-grass'].dispose()
      sideGeometries['dry-dirt'].dispose()
      sideGeometries['rough-stone'].dispose()
      sideGeometries['wet-dirt'].dispose()
      grassBlendGeometry.dispose()
    },
    [grassBlendGeometry, sideGeometries, topGeometry],
  )

  useEffect(
    () => () => {
      Object.values(maskTextures).forEach((texture) => texture.dispose())
      sideBlendAlphaTexture.dispose()
    },
    [maskTextures, sideBlendAlphaTexture],
  )

  useEffect(() => {
    Object.values(textures).forEach(configureGroundTexture)
  }, [textures])

  const groundColor = useMemo(
    () => new THREE.Color('#5f7f45').lerp(new THREE.Color('#2f3f2d'), outdoorBlend),
    [outdoorBlend],
  )
  const grassSideBlendColor = useMemo(() => new THREE.Color('#6d7d49'), [])

  return (
    <group>
      <mesh geometry={topGeometry} receiveShadow>
        <meshStandardMaterial
          map={textures[outdoorDefaultGroundTexture]}
          color={groundColor}
          roughness={1}
          metalness={0}
        />
      </mesh>
      {OVERLAY_TEXTURE_TYPES.map((textureType, index) => (
        <mesh
          key={textureType}
          geometry={topGeometry}
          receiveShadow
          renderOrder={index + 1}
        >
          <meshStandardMaterial
          map={textures[textureType]}
          alphaMap={maskTextures[textureType]}
          transparent
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-1 - index}
            polygonOffsetUnits={-1}
            roughness={1}
            metalness={0}
          />
        </mesh>
      ))}

      <mesh geometry={sideGeometries['dry-dirt']} receiveShadow>
        <meshStandardMaterial map={textures['dry-dirt']} roughness={1} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={sideGeometries['rough-stone']} receiveShadow>
        <meshStandardMaterial map={textures['rough-stone']} roughness={1} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={sideGeometries['wet-dirt']} receiveShadow>
        <meshStandardMaterial map={textures['wet-dirt']} roughness={1} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={sideGeometries['short-grass']} receiveShadow>
        <meshStandardMaterial map={textures['short-grass']} roughness={1} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={grassBlendGeometry} receiveShadow renderOrder={5}>
        <meshStandardMaterial
          map={textures['short-grass']}
          color={grassSideBlendColor}
          alphaMap={sideBlendAlphaTexture}
          roughness={1}
          metalness={0}
          side={THREE.DoubleSide}
          transparent
          opacity={0.9}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-3}
          polygonOffsetUnits={-1}
        />
      </mesh>
    </group>
  )
}
