import { useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { GRID_SIZE } from '../../hooks/useSnapToGrid'
import {
  type OutdoorGroundTextureCells,
  type OutdoorGroundTextureType,
} from '../../store/useDungeonStore'
import {
  OUTDOOR_TERRAIN_SEGMENTS,
  OUTDOOR_TERRAIN_WORLD_SIZE,
  sampleOutdoorTerrainHeight,
  type OutdoorTerrainHeightfield,
} from '../../store/outdoorTerrain'

const OUTDOOR_GROUND_SIZE = OUTDOOR_TERRAIN_WORLD_SIZE
const OUTDOOR_GROUND_HALF_SIZE = OUTDOOR_GROUND_SIZE / 2
const MASK_TEXTURE_SIZE = 768
const MASK_BLUR_PX = 6
const TERRAIN_REPEAT = 36

const TERRAIN_TEXTURE_PATHS: Record<OutdoorGroundTextureType, string> = {
  'short-grass': '/textures/outdoor/short-grass/albedo.png',
  'dry-dirt': '/textures/outdoor/dry-dirt/albedo.png',
  'rough-stone': '/textures/outdoor/rough-stone/albedo.png',
  'wet-dirt': '/textures/outdoor/wet-dirt/albedo.png',
}

type OverlayTextureType = 'dry-dirt' | 'rough-stone' | 'wet-dirt'
const OVERLAY_TEXTURE_TYPES: OverlayTextureType[] = ['dry-dirt', 'rough-stone', 'wet-dirt']

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
  outdoorTerrainHeights,
}: {
  outdoorBlend: number
  outdoorGroundTextureCells?: OutdoorGroundTextureCells
  outdoorTerrainHeights: OutdoorTerrainHeightfield
}) {
  const groundTextureCells = outdoorGroundTextureCells ?? {}
  const textures = useTexture(TERRAIN_TEXTURE_PATHS)
  const terrainGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(
      OUTDOOR_GROUND_SIZE,
      OUTDOOR_GROUND_SIZE,
      OUTDOOR_TERRAIN_SEGMENTS,
      OUTDOOR_TERRAIN_SEGMENTS,
    )
    geometry.rotateX(-Math.PI / 2)

    const position = geometry.attributes.position
    for (let index = 0; index < position.count; index += 1) {
      const worldX = position.getX(index)
      const worldZ = position.getZ(index)
      position.setY(index, sampleOutdoorTerrainHeight(outdoorTerrainHeights, worldX, worldZ))
    }

    position.needsUpdate = true
    geometry.computeVertexNormals()
    return geometry
  }, [outdoorTerrainHeights])

  const maskTextures = useMemo<Record<OverlayTextureType, THREE.CanvasTexture>>(
    () => ({
      'dry-dirt': createTextureMask(groundTextureCells, 'dry-dirt'),
      'rough-stone': createTextureMask(groundTextureCells, 'rough-stone'),
      'wet-dirt': createTextureMask(groundTextureCells, 'wet-dirt'),
    }),
    [groundTextureCells],
  )

  useEffect(() => () => terrainGeometry.dispose(), [terrainGeometry])
  useEffect(() => () => {
    Object.values(maskTextures).forEach((texture) => texture.dispose())
  }, [maskTextures])

  useEffect(() => {
    Object.values(textures).forEach(configureGroundTexture)
  }, [textures])

  const groundColor = useMemo(
    () => new THREE.Color('#5f7f45').lerp(new THREE.Color('#2f3f2d'), outdoorBlend),
    [outdoorBlend],
  )

  return (
    <group>
      <mesh geometry={terrainGeometry} receiveShadow>
        <meshStandardMaterial
          map={textures['short-grass']}
          color={groundColor}
          roughness={1}
          metalness={0}
        />
      </mesh>
      {OVERLAY_TEXTURE_TYPES.map((textureType, index) => (
        <mesh
          key={textureType}
          geometry={terrainGeometry}
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
    </group>
  )
}
