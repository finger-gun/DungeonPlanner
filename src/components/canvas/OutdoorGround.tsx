import { useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { GRID_SIZE, getCellKey, type GridCell } from '../../hooks/useSnapToGrid'
import { createStandardCompatibleMaterial } from '../../rendering/nodeMaterialUtils'
import {
  SteppedOutdoorTerrainAsset,
  type SteppedOutdoorTerrainAssetKey,
} from '../../content-packs/kaykit/terrain/steppedOutdoorTerrainAssets'
import {
  type OutdoorGroundTextureCells,
  type OutdoorGroundTextureType,
} from '../../store/useDungeonStore'
import {
  OUTDOOR_TERRAIN_WORLD_SIZE,
  type OutdoorTerrainHeightfield,
} from '../../store/outdoorTerrain'
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

const TERRAIN_TEXTURE_PATHS: Record<OutdoorGroundTextureType, string> = {
  'short-grass': '/textures/outdoor/short-grass/albedo.png',
  'dry-dirt': '/textures/outdoor/dry-dirt/albedo.png',
  'rough-stone': '/textures/outdoor/rough-stone/albedo.png',
  'wet-dirt': '/textures/outdoor/wet-dirt/albedo.png',
}

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

function configureMaskTexture(texture: THREE.CanvasTexture) {
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.flipY = false
  texture.needsUpdate = true
  return texture
}

function createCellMask(cells: GridCell[], value: 'filled' | 'holes') {
  const sourceCanvas = document.createElement('canvas')
  sourceCanvas.width = MASK_TEXTURE_SIZE
  sourceCanvas.height = MASK_TEXTURE_SIZE
  const sourceContext = sourceCanvas.getContext('2d')
  if (!sourceContext) {
    return configureMaskTexture(new THREE.CanvasTexture(sourceCanvas))
  }

  sourceContext.fillStyle = value === 'holes' ? '#ffffff' : '#000000'
  sourceContext.fillRect(0, 0, MASK_TEXTURE_SIZE, MASK_TEXTURE_SIZE)
  sourceContext.fillStyle = value === 'holes' ? '#000000' : '#ffffff'

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

  return configureMaskTexture(new THREE.CanvasTexture(sourceCanvas))
}

export function createTextureMask(
  cells: OutdoorGroundTextureCells,
  textureType: OutdoorGroundTextureType,
) {
  return createCellMask(
    Object.values(cells)
      .filter((record) => record.textureType === textureType)
      .map((record) => record.cell),
    'filled',
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
  const half = GRID_SIZE / 2

  if (direction === 'north') return [worldX, worldZ - half]
  if (direction === 'east') return [worldX + half, worldZ]
  if (direction === 'south') return [worldX, worldZ + half]
  if (direction === 'west') return [worldX - half, worldZ]
  if (direction === 'north-west') return [worldX - half, worldZ - half]
  if (direction === 'north-east') return [worldX + half, worldZ - half]
  if (direction === 'south-east') return [worldX + half, worldZ + half]
  return [worldX - half, worldZ + half]
}

export function OutdoorGround({
  outdoorBlend,
  outdoorGroundTextureCells,
  outdoorTerrainHeights,
}: {
  outdoorBlend: number
  outdoorGroundTextureCells?: OutdoorGroundTextureCells
  outdoorTerrainHeights: OutdoorTerrainHeightfield
}) {
  const groundTextureCells = useMemo(
    () => outdoorGroundTextureCells ?? {},
    [outdoorGroundTextureCells],
  )
  const textures = useTexture(TERRAIN_TEXTURE_PATHS)
  const defaultGrassColor = useMemo(
    () => new THREE.Color('#8fdc4f').lerp(new THREE.Color('#3a5d2f'), outdoorBlend * 0.45),
    [outdoorBlend],
  )
  const topGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE)
    geometry.rotateX(-Math.PI / 2)
    return geometry
  }, [])
  const baseGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(OUTDOOR_GROUND_SIZE, OUTDOOR_GROUND_SIZE)
    geometry.rotateX(-Math.PI / 2)
    return geometry
  }, [])

  const derivedTerrain = useMemo(
    () => buildSteppedOutdoorTerrain(outdoorTerrainHeights, groundTextureCells),
    [groundTextureCells, outdoorTerrainHeights],
  )

  const holeMask = useMemo(
    () => createCellMask(derivedTerrain.holeCells, 'holes'),
    [derivedTerrain.holeCells],
  )

  const baseMaterial = useMemo(
    () => createStandardCompatibleMaterial({
      map: textures['short-grass'],
      color: defaultGrassColor,
      alphaMap: holeMask,
      transparent: true,
      alphaTest: 0.5,
      roughness: 1,
      metalness: 0,
    }),
    [defaultGrassColor, holeMask, textures],
  )

  const topMaterials = useMemo(() => ({
    'short-grass': createStandardCompatibleMaterial({
      map: textures['short-grass'],
      color: defaultGrassColor,
      roughness: 1,
      metalness: 0,
    }),
    'dry-dirt': createStandardCompatibleMaterial({
      map: textures['dry-dirt'],
      roughness: 1,
      metalness: 0,
    }),
    'rough-stone': createStandardCompatibleMaterial({
      map: textures['rough-stone'],
      roughness: 1,
      metalness: 0,
    }),
    'wet-dirt': createStandardCompatibleMaterial({
      map: textures['wet-dirt'],
      roughness: 1,
      metalness: 0,
    }),
  }), [defaultGrassColor, textures])

  useEffect(() => {
    Object.values(textures).forEach(configureGroundTexture)
  }, [textures])
  useEffect(() => () => topGeometry.dispose(), [topGeometry])
  useEffect(() => () => baseGeometry.dispose(), [baseGeometry])
  useEffect(() => () => holeMask.dispose(), [holeMask])
  useEffect(() => () => baseMaterial.dispose(), [baseMaterial])
  useEffect(() => () => {
    Object.values(topMaterials).forEach((material) => material.dispose())
  }, [topMaterials])

  return (
    <group>
      <mesh geometry={baseGeometry} receiveShadow>
        <primitive object={baseMaterial} attach="material" />
      </mesh>

      {derivedTerrain.topSurfaces.map((surface) => {
        const [worldX, worldZ] = getCellWorldPosition(surface.cell)
        const textureType = surface.textureType ?? 'short-grass'
        return (
          <mesh
            key={`top-surface:${surface.cellKey}`}
            geometry={topGeometry}
            position={[worldX, surface.worldY + TOP_SURFACE_ELEVATION, worldZ]}
            receiveShadow
          >
            <primitive object={topMaterials[textureType]} attach="material" />
          </mesh>
        )
      })}

      {derivedTerrain.topEdges.map((edge) => {
        const [worldX, worldZ] = getCliffWorldPosition(edge.cell, edge.direction)
        return (
          <SteppedOutdoorTerrainAsset
            key={`top-edge:${edge.cellKey}:${edge.direction}:${edge.worldY}`}
            assetKey={TOP_EDGE_ASSET_KEYS[edge.direction as TerrainDirection]}
            position={[worldX, edge.worldY + TOP_SURFACE_ELEVATION, worldZ]}
          />
        )
      })}

      {derivedTerrain.topCorners.map((corner) => {
        const [worldX, worldZ] = getCliffWorldPosition(corner.cell, corner.direction)
        return (
          <SteppedOutdoorTerrainAsset
            key={`top-corner:${corner.cellKey}:${corner.direction}:${corner.worldY}`}
            assetKey={TOP_CORNER_ASSET_KEYS[corner.direction as TerrainCorner]}
            position={[worldX, corner.worldY + TOP_SURFACE_ELEVATION, worldZ]}
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
            key={`cliff-side:${segment.cellKey}:${segment.direction}:${segment.worldY}:${segment.tall}`}
            assetKey={assetKey}
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
            key={`cliff-corner:${segment.cellKey}:${segment.direction}:${segment.worldY}:${segment.tall}`}
            assetKey={assetKey}
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
