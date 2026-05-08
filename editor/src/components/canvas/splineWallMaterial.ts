import { useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import {
  getContentPackWallMaterialSetById,
  getDefaultContentPackWallMaterialSetId,
} from '../../content-packs/registry'
import type { ContentPackWallMaterialSet } from '../../content-packs/types'
import { createStandardCompatibleMaterial } from '../../rendering/nodeMaterialUtils'

export type SplineWallMaterialPreset = 'dungeon' | 'cave' | 'timber'

export type SplineWallPbrTextures = {
  albedo: THREE.Texture
  normal: THREE.Texture | null
  ao: THREE.Texture | null
  height: THREE.Texture | null
  roughness: THREE.Texture | null
  metallic: THREE.Texture | null
}

export type SplineWallMaterialBundle = {
  side: THREE.Material
  top: THREE.Material
}

const WALL_MATERIAL_SET_CONTENT_PACK_ID = 'dungeon'
const DEFAULT_DUNGEON_WALL_TINT = '#ffffff'
const DEFAULT_DUNGEON_WALL_ROUGHNESS = 0.92
const DEFAULT_DUNGEON_WALL_METALNESS = 0.03
const DEFAULT_DUNGEON_WALL_BUMP_SCALE = 0.18
const DEFAULT_DUNGEON_WALL_AO_INTENSITY = 1
const DEFAULT_DUNGEON_TOP_SURFACE_COLOR = '#394050'
const DEFAULT_DUNGEON_TOP_SURFACE_ROUGHNESS = 0.62
const DEFAULT_DUNGEON_TOP_SURFACE_METALNESS = 0.03
const CAVE_WALL_COLOR = '#55605b'
const TIMBER_WALL_COLOR = '#7c6148'

export function configureSplineWallTexture(texture: THREE.Texture, channel: 'color' | 'data') {
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = channel === 'color' ? THREE.SRGBColorSpace : THREE.NoColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

export function createSplineWallMaterial(
  preset: SplineWallMaterialPreset,
  textures: SplineWallPbrTextures,
  wallMaterialSet?: ContentPackWallMaterialSet,
) {
  switch (preset) {
    case 'dungeon': {
      const shading = wallMaterialSet?.shading
      return createStandardCompatibleMaterial({
        color: shading?.tintColor ?? DEFAULT_DUNGEON_WALL_TINT,
        map: textures.albedo,
        normalMap: textures.normal,
        aoMap: textures.ao,
        aoMapIntensity: textures.ao ? (shading?.aoMapIntensity ?? DEFAULT_DUNGEON_WALL_AO_INTENSITY) : 0,
        bumpMap: textures.height,
        bumpScale: textures.height ? (shading?.bumpScale ?? DEFAULT_DUNGEON_WALL_BUMP_SCALE) : 0,
        roughnessMap: textures.roughness,
        metalnessMap: textures.metallic,
        roughness: textures.roughness ? 1 : (shading?.roughness ?? DEFAULT_DUNGEON_WALL_ROUGHNESS),
        metalness: textures.metallic ? 1 : (shading?.metalness ?? DEFAULT_DUNGEON_WALL_METALNESS),
        side: THREE.DoubleSide,
      })
    }
    case 'cave':
      return createStandardCompatibleMaterial({
        color: CAVE_WALL_COLOR,
        roughness: 0.88,
        metalness: 0.04,
        side: THREE.DoubleSide,
      })
    case 'timber':
      return createStandardCompatibleMaterial({
        color: TIMBER_WALL_COLOR,
        roughness: 0.88,
        metalness: 0.04,
        side: THREE.DoubleSide,
      })
  }
}

export function createSplineWallTopMaterial(
  preset: SplineWallMaterialPreset,
  wallMaterialSet?: ContentPackWallMaterialSet,
) {
  switch (preset) {
    case 'dungeon': {
      const shading = wallMaterialSet?.shading
      return createStandardCompatibleMaterial({
        color: shading?.topSurfaceColor ?? DEFAULT_DUNGEON_TOP_SURFACE_COLOR,
        roughness: shading?.topSurfaceRoughness ?? DEFAULT_DUNGEON_TOP_SURFACE_ROUGHNESS,
        metalness: shading?.topSurfaceMetalness ?? DEFAULT_DUNGEON_TOP_SURFACE_METALNESS,
        side: THREE.DoubleSide,
      })
    }
    case 'cave':
      return createStandardCompatibleMaterial({
        color: CAVE_WALL_COLOR,
        roughness: 0.88,
        metalness: 0.04,
        side: THREE.DoubleSide,
      })
    case 'timber':
      return createStandardCompatibleMaterial({
        color: TIMBER_WALL_COLOR,
        roughness: 0.88,
        metalness: 0.04,
        side: THREE.DoubleSide,
      })
  }
}

export function resolveActiveSplineWallMaterialSet(
  wallMaterialSetId: string | null | undefined,
): ContentPackWallMaterialSet {
  const defaultWallMaterialSetId = getDefaultContentPackWallMaterialSetId(WALL_MATERIAL_SET_CONTENT_PACK_ID)
  const resolved =
    getContentPackWallMaterialSetById(WALL_MATERIAL_SET_CONTENT_PACK_ID, wallMaterialSetId)
    ?? getContentPackWallMaterialSetById(WALL_MATERIAL_SET_CONTENT_PACK_ID, defaultWallMaterialSetId)

  if (!resolved) {
    throw new Error('No dungeon wall material sets are registered.')
  }

  return resolved
}

function buildTextureUrlMap(wallMaterialSet: ContentPackWallMaterialSet) {
  return {
    albedo: wallMaterialSet.textures.albedoUrl,
    ...(wallMaterialSet.textures.normalUrl ? { normal: wallMaterialSet.textures.normalUrl } : {}),
    ...(wallMaterialSet.textures.aoUrl ? { ao: wallMaterialSet.textures.aoUrl } : {}),
    ...(wallMaterialSet.textures.heightUrl ? { height: wallMaterialSet.textures.heightUrl } : {}),
    ...(wallMaterialSet.textures.roughnessUrl ? { roughness: wallMaterialSet.textures.roughnessUrl } : {}),
    ...(wallMaterialSet.textures.metallicUrl ? { metallic: wallMaterialSet.textures.metallicUrl } : {}),
  }
}

export function useSplineWallMaterialLibrary(activeWallMaterialSetId: string | null | undefined) {
  const wallMaterialSet = useMemo(
    () => resolveActiveSplineWallMaterialSet(activeWallMaterialSetId),
    [activeWallMaterialSetId],
  )
  const textureUrlMap = useMemo(
    () => buildTextureUrlMap(wallMaterialSet),
    [wallMaterialSet],
  )
  const loadedTextures = useTexture(textureUrlMap) as Record<string, THREE.Texture>
  const textures = useMemo<SplineWallPbrTextures>(() => ({
    albedo: loadedTextures.albedo,
    normal: loadedTextures.normal ?? null,
    ao: loadedTextures.ao ?? null,
    height: loadedTextures.height ?? null,
    roughness: loadedTextures.roughness ?? null,
    metallic: loadedTextures.metallic ?? null,
  }), [loadedTextures])

  useEffect(() => {
    configureSplineWallTexture(textures.albedo, 'color')
    if (textures.normal) {
      configureSplineWallTexture(textures.normal, 'data')
    }
    if (textures.ao) {
      configureSplineWallTexture(textures.ao, 'data')
    }
    if (textures.height) {
      configureSplineWallTexture(textures.height, 'data')
    }
    if (textures.roughness) {
      configureSplineWallTexture(textures.roughness, 'data')
    }
    if (textures.metallic) {
      configureSplineWallTexture(textures.metallic, 'data')
    }
  }, [textures])

  const materials = useMemo<Record<SplineWallMaterialPreset, SplineWallMaterialBundle>>(() => ({
    dungeon: {
      side: createSplineWallMaterial('dungeon', textures, wallMaterialSet),
      top: createSplineWallTopMaterial('dungeon', wallMaterialSet),
    },
    cave: {
      side: createSplineWallMaterial('cave', textures),
      top: createSplineWallTopMaterial('cave'),
    },
    timber: {
      side: createSplineWallMaterial('timber', textures),
      top: createSplineWallTopMaterial('timber'),
    },
  }), [textures, wallMaterialSet])

  useEffect(() => () => {
    Object.values(materials).forEach(({ side, top }) => {
      side.dispose()
      top.dispose()
    })
  }, [materials])

  return materials
}
