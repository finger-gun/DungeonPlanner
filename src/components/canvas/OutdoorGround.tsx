import { useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { GRID_SIZE, getCellKey, type GridCell } from '../../hooks/useSnapToGrid'
import { createStandardCompatibleMaterial } from '../../rendering/nodeMaterialUtils'
import {
  SteppedOutdoorTerrainAsset,
  type SteppedOutdoorTerrainAssetKey,
} from '../../content-packs/kaykit/terrain/steppedOutdoorTerrainAssets'
import type { OutdoorTerrainStyleCells } from '../../store/useDungeonStore'
import {
  OUTDOOR_TERRAIN_WORLD_SIZE,
  type OutdoorTerrainHeightfield,
} from '../../store/outdoorTerrain'
import {
  DEFAULT_OUTDOOR_TERRAIN_STYLE,
  OUTDOOR_TERRAIN_STYLES,
  type OutdoorTerrainStyle,
} from '../../store/outdoorTerrainStyles'
import {
  buildSteppedOutdoorTerrain,
  type TerrainCorner,
  type TerrainDirection,
} from './outdoorTerrainDerived'

const OUTDOOR_GROUND_SIZE = OUTDOOR_TERRAIN_WORLD_SIZE
const OUTDOOR_GROUND_HALF_SIZE = OUTDOOR_GROUND_SIZE / 2
const MASK_TEXTURE_SIZE = 768
const TERRAIN_REPEAT = 36
const TOP_SURFACE_ELEVATION = 0.01
const STYLE_OVERLAY_ELEVATION = 0.18
const STEPPED_TERRAIN_ROUGHNESS = 0.6000000238418579
// CSS blur radius for style overlay masks (~1 cell gradient transition)
const STYLE_OVERLAY_FEATHER_PX = 3

const STYLE_TEXTURE_URLS = Object.fromEntries(
  Object.entries(import.meta.glob('../../assets/models/forrest/*/forest_grass_patch.png', {
    eager: true,
    import: 'default',
  })).map(([key, url]) => {
    const match = key.match(/forrest\/(Color\d+)\/forest_grass_patch\.png$/)
    return [match?.[1] ?? key, url as string]
  }),
) as Record<string, string>

const TOP_EDGE_ASSET_KEYS: Record<TerrainDirection, SteppedOutdoorTerrainAssetKey> = {
  north: 'top-north',
  east: 'top-east',
  south: 'top-south',
  west: 'top-west',
}

const TOP_CORNER_ASSET_KEYS: Record<TerrainCorner, SteppedOutdoorTerrainAssetKey> = {
  'north-west': 'top-north-west',
  'north-east': 'top-north-east',
  'south-west': 'top-south-west',
  'south-east': 'top-south-east',
}

const CLIFF_SIDE_ASSET_KEYS: Record<TerrainDirection, SteppedOutdoorTerrainAssetKey> = {
  north: 'cliff-north',
  east: 'cliff-east',
  south: 'cliff-south',
  west: 'cliff-west',
}

const CLIFF_CORNER_ASSET_KEYS: Record<TerrainCorner, SteppedOutdoorTerrainAssetKey> = {
  'north-west': 'cliff-north-west',
  'north-east': 'cliff-north-east',
  'south-west': 'cliff-south-west',
  'south-east': 'cliff-south-east',
}

const CLIFF_TALL_SIDE_ASSET_KEYS: Record<TerrainDirection, SteppedOutdoorTerrainAssetKey> = {
  north: 'cliff-tall-north',
  east: 'cliff-tall-east',
  south: 'cliff-tall-south',
  west: 'cliff-tall-west',
}

const CLIFF_TALL_CORNER_ASSET_KEYS: Record<TerrainCorner, SteppedOutdoorTerrainAssetKey> = {
  'north-west': 'cliff-tall-north-west',
  'north-east': 'cliff-tall-north-east',
  'south-west': 'cliff-tall-south-west',
  'south-east': 'cliff-tall-south-east',
}

function configureGroundTexture(texture: THREE.Texture) {
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(TERRAIN_REPEAT, TERRAIN_REPEAT)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
}

export function makeTexturePixelsOpaque(data: Uint8ClampedArray | Uint8Array) {
  for (let index = 3; index < data.length; index += 4) {
    data[index] = 255
  }

  return data
}

function createOpaqueGroundTexture(texture: THREE.Texture) {
  const image = texture.image as HTMLImageElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas | undefined
  if (!image || typeof document === 'undefined') {
    return null
  }

  const width = 'width' in image ? image.width : 0
  const height = 'height' in image ? image.height : 0
  if (!width || !height) {
    return null
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    return null
  }

  context.drawImage(image as CanvasImageSource, 0, 0, width, height)
  const pixels = context.getImageData(0, 0, width, height)
  pixels.data.set(makeTexturePixelsOpaque(pixels.data))
  context.putImageData(pixels, 0, 0)

  return new THREE.CanvasTexture(canvas)
}

function configureMaskTexture(texture: THREE.CanvasTexture) {
  texture.flipY = false
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}

function createCellMask(cells: GridCell[], inverted = false, featherPx = 0) {
  const sourceCanvas = document.createElement('canvas')
  sourceCanvas.width = MASK_TEXTURE_SIZE
  sourceCanvas.height = MASK_TEXTURE_SIZE
  const sourceContext = sourceCanvas.getContext('2d')
  if (!sourceContext) {
    return configureMaskTexture(new THREE.CanvasTexture(sourceCanvas))
  }

  sourceContext.fillStyle = inverted ? '#ffffff' : '#000000'
  sourceContext.fillRect(0, 0, MASK_TEXTURE_SIZE, MASK_TEXTURE_SIZE)
  sourceContext.fillStyle = inverted ? '#000000' : '#ffffff'

  cells.forEach((cell) => {
    const minWorldX = cell[0] * GRID_SIZE
    const maxWorldX = minWorldX + GRID_SIZE
    const minWorldZ = cell[1] * GRID_SIZE
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

  if (featherPx <= 0) {
    return configureMaskTexture(new THREE.CanvasTexture(sourceCanvas))
  }

  const blurredCanvas = document.createElement('canvas')
  blurredCanvas.width = MASK_TEXTURE_SIZE
  blurredCanvas.height = MASK_TEXTURE_SIZE
  const blurredContext = blurredCanvas.getContext('2d')
  if (!blurredContext) {
    return configureMaskTexture(new THREE.CanvasTexture(sourceCanvas))
  }

  blurredContext.filter = `blur(${featherPx}px)`
  blurredContext.drawImage(sourceCanvas, 0, 0)

  return configureMaskTexture(new THREE.CanvasTexture(blurredCanvas))
}

export function getTerrainEdgeTransitionTransform(
  cell: GridCell,
  direction: TerrainDirection,
) {
  const [worldX, worldZ] = getCliffWorldPosition(cell, direction)

  if (direction === 'north') {
    return { position: [worldX, worldZ] as [number, number], rotationY: 0 }
  }

  if (direction === 'east') {
    return { position: [worldX, worldZ] as [number, number], rotationY: Math.PI / 2 }
  }

  if (direction === 'south') {
    return { position: [worldX, worldZ] as [number, number], rotationY: Math.PI }
  }

  return { position: [worldX, worldZ] as [number, number], rotationY: -Math.PI / 2 }
}

export function createTerrainStyleMask(cells: OutdoorTerrainStyleCells, terrainStyle: OutdoorTerrainStyle) {
  return createCellMask(
    Object.values(cells)
      .filter((record) => record.terrainStyle === terrainStyle)
      .map((record) => record.cell),
  )
}

function getCellWorldPosition(cell: GridCell): [number, number] {
  return [
    (cell[0] + 0.5) * GRID_SIZE,
    (cell[1] + 0.5) * GRID_SIZE,
  ]
}

function getCliffWorldPosition(
  cell: GridCell,
  direction: TerrainDirection | TerrainCorner,
): [number, number] {
  const [worldX, worldZ] = getCellWorldPosition(cell)
  const halfGrid = GRID_SIZE / 2

  switch (direction) {
    case 'north':
      return [worldX, worldZ - halfGrid]
    case 'east':
      return [worldX + halfGrid, worldZ]
    case 'south':
      return [worldX, worldZ + halfGrid]
    case 'west':
      return [worldX - halfGrid, worldZ]
    case 'north-west':
      return [worldX - halfGrid, worldZ - halfGrid]
    case 'north-east':
      return [worldX + halfGrid, worldZ - halfGrid]
    case 'south-west':
      return [worldX - halfGrid, worldZ + halfGrid]
    case 'south-east':
      return [worldX + halfGrid, worldZ + halfGrid]
  }
}

type OutdoorGroundProps = {
  outdoorTerrainStyleCells?: OutdoorTerrainStyleCells
  outdoorTerrainHeights: OutdoorTerrainHeightfield
  defaultOutdoorTerrainStyle?: OutdoorTerrainStyle
}

export function OutdoorGround({
  outdoorTerrainStyleCells,
  outdoorTerrainHeights,
  defaultOutdoorTerrainStyle = DEFAULT_OUTDOOR_TERRAIN_STYLE,
}: OutdoorGroundProps) {
  const styleCells = useMemo(
    () => outdoorTerrainStyleCells ?? {},
    [outdoorTerrainStyleCells],
  )
  const textureUrls = useMemo(
    () => Object.fromEntries(OUTDOOR_TERRAIN_STYLES.map((style) => [style, STYLE_TEXTURE_URLS[style]])) as Record<OutdoorTerrainStyle, string>,
    [],
  )
  const textures = useTexture(textureUrls) as Record<OutdoorTerrainStyle, THREE.Texture>
  const opaqueTextures = useMemo(
    () => Object.fromEntries(
      OUTDOOR_TERRAIN_STYLES.map((style) => [style, createOpaqueGroundTexture(textures[style]) ?? textures[style]]),
    ) as Record<OutdoorTerrainStyle, THREE.Texture>,
    [textures],
  )
  const baseGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(OUTDOOR_GROUND_SIZE, OUTDOOR_GROUND_SIZE)
    geometry.rotateX(-Math.PI / 2)
    return geometry
  }, [])

  const derivedTerrain = useMemo(
    () => buildSteppedOutdoorTerrain(outdoorTerrainHeights, styleCells, defaultOutdoorTerrainStyle),
    [defaultOutdoorTerrainStyle, outdoorTerrainHeights, styleCells],
  )
  const holeMask = useMemo(
    () => createCellMask(derivedTerrain.holeCells, true),
    [derivedTerrain.holeCells],
  )

  // Group cells by (terrainStyle, worldY) for full-map blurred overlays.
  // On ground level, only explicit (non-default) styles need overlays since the
  // base mesh provides the default color. On elevated terrain, ALL non-default
  // cells need overlays because the 3D models are rendered in the default style.
  const styleOverlays = useMemo(() => {
    const groups = new Map<string, { terrainStyle: OutdoorTerrainStyle; worldY: number; cells: GridCell[] }>()
    for (const surface of derivedTerrain.topSurfaces) {
      const needsOverlay = surface.explicitStyle || (surface.usesSteppedAsset && surface.terrainStyle !== defaultOutdoorTerrainStyle)
      if (!needsOverlay) continue
      const key = `${surface.terrainStyle}:${surface.worldY}`
      let group = groups.get(key)
      if (!group) {
        group = { terrainStyle: surface.terrainStyle, worldY: surface.worldY, cells: [] }
        groups.set(key, group)
      }
      group.cells.push(surface.cell)
    }
    return [...groups.values()].map((group) => {
      const mask = createCellMask(group.cells, false, STYLE_OVERLAY_FEATHER_PX)
      const material = createStandardCompatibleMaterial({
        map: opaqueTextures[group.terrainStyle],
        alphaMap: mask,
        transparent: true,
        depthWrite: false,
        roughness: STEPPED_TERRAIN_ROUGHNESS,
        metalness: 0,
      })
      return { ...group, mask, material }
    })
  }, [derivedTerrain.topSurfaces, defaultOutdoorTerrainStyle, opaqueTextures])

  const baseMaterial = useMemo(
    () => createStandardCompatibleMaterial({
      map: opaqueTextures[defaultOutdoorTerrainStyle],
      color: '#ffffff',
      alphaMap: holeMask,
      alphaTest: 0.5,
      roughness: STEPPED_TERRAIN_ROUGHNESS,
      metalness: 0,
    }),
    [defaultOutdoorTerrainStyle, holeMask, opaqueTextures],
  )

  useEffect(() => {
    Object.values(textures).forEach(configureGroundTexture)
  }, [textures])
  useEffect(() => {
    Object.values(opaqueTextures).forEach(configureGroundTexture)
  }, [opaqueTextures])
  useEffect(() => () => baseGeometry.dispose(), [baseGeometry])
  useEffect(() => () => holeMask.dispose(), [holeMask])
  useEffect(() => () => baseMaterial.dispose(), [baseMaterial])
  useEffect(() => () => {
    Object.values(opaqueTextures).forEach((texture) => {
      if (texture instanceof THREE.CanvasTexture) {
        texture.dispose()
      }
    })
  }, [opaqueTextures])
  useEffect(() => () => {
    styleOverlays.forEach(({ mask, material }) => {
      mask.dispose()
      material.dispose()
    })
  }, [styleOverlays])

  return (
    <group>
      <mesh geometry={baseGeometry} receiveShadow userData={{ outdoorTerrainSurface: true }}>
        <primitive object={baseMaterial} attach="material" />
      </mesh>

      {styleOverlays.map((overlay) => (
        <mesh
          key={`style-overlay:${overlay.terrainStyle}:${overlay.worldY}`}
          geometry={baseGeometry}
          position={[0, overlay.worldY + STYLE_OVERLAY_ELEVATION, 0]}
          receiveShadow={false}
          userData={{ outdoorTerrainSurface: true }}
        >
          <primitive object={overlay.material} attach="material" />
        </mesh>
      ))}

      {derivedTerrain.topSurfaces.map((surface) => {
        const [worldX, worldZ] = getCellWorldPosition(surface.cell)
        if (!surface.usesSteppedAsset) {
          return null
        }

        return (
          <SteppedOutdoorTerrainAsset
            key={`top-center:${surface.cellKey}:${surface.terrainStyle}:${surface.worldY}`}
            assetKey="top-center"
            terrainStyle={defaultOutdoorTerrainStyle}
            position={[worldX, surface.worldY - 0.02, worldZ]}
            userData={{ outdoorTerrainSurface: true, outdoorTerrainCell: surface.cell }}
          />
        )
      })}

      {derivedTerrain.topEdges.map((edge) => {
        const [worldX, worldZ] = getCliffWorldPosition(edge.cell, edge.direction)
        return (
          <SteppedOutdoorTerrainAsset
            key={`top-edge:${edge.cellKey}:${edge.direction}:${edge.worldY}:${edge.terrainStyle}`}
            assetKey={TOP_EDGE_ASSET_KEYS[edge.direction as TerrainDirection]}
            terrainStyle={edge.terrainStyle}
            position={[worldX, edge.worldY + TOP_SURFACE_ELEVATION, worldZ]}
            userData={{ outdoorTerrainSurface: true, outdoorTerrainCell: edge.cell }}
          />
        )
      })}

      {derivedTerrain.topCorners.map((corner) => {
        const [worldX, worldZ] = getCliffWorldPosition(corner.cell, corner.direction)
        return (
          <SteppedOutdoorTerrainAsset
            key={`top-corner:${corner.cellKey}:${corner.direction}:${corner.worldY}:${corner.terrainStyle}`}
            assetKey={TOP_CORNER_ASSET_KEYS[corner.direction as TerrainCorner]}
            terrainStyle={corner.terrainStyle}
            position={[worldX, corner.worldY + TOP_SURFACE_ELEVATION, worldZ]}
            userData={{ outdoorTerrainSurface: true, outdoorTerrainCell: corner.cell }}
          />
        )
      })}

      {derivedTerrain.cliffSides.map((segment) => {
        const [worldX, worldZ] = getCliffWorldPosition(segment.cell, segment.direction)
        const assetKey = segment.tall
          ? CLIFF_TALL_SIDE_ASSET_KEYS[segment.direction as TerrainDirection]
          : CLIFF_SIDE_ASSET_KEYS[segment.direction as TerrainDirection]
        return (
          <SteppedOutdoorTerrainAsset
            key={`cliff-side:${segment.cellKey}:${segment.direction}:${segment.worldY}:${segment.tall}:${segment.terrainStyle}`}
            assetKey={assetKey}
            terrainStyle={segment.terrainStyle}
            position={[worldX, segment.worldY, worldZ]}
          />
        )
      })}

      {derivedTerrain.cliffCorners.map((segment) => {
        const [worldX, worldZ] = getCliffWorldPosition(segment.cell, segment.direction)
        const assetKey = segment.tall
          ? CLIFF_TALL_CORNER_ASSET_KEYS[segment.direction as TerrainCorner]
          : CLIFF_CORNER_ASSET_KEYS[segment.direction as TerrainCorner]
        return (
          <SteppedOutdoorTerrainAsset
            key={`cliff-corner:${segment.cellKey}:${segment.direction}:${segment.worldY}:${segment.tall}:${segment.terrainStyle}`}
            assetKey={assetKey}
            terrainStyle={segment.terrainStyle}
            position={[worldX, segment.worldY, worldZ]}
          />
        )
      })}
    </group>
  )
}

export function getTerrainHoleCellKeys(outdoorTerrainHeights: OutdoorTerrainHeightfield) {
  return new Set(
    Object.values(outdoorTerrainHeights)
      .filter((record) => record.level < 0)
      .map((record) => getCellKey(record.cell)),
  )
}
