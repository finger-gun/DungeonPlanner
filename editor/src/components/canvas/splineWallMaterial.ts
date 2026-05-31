import { useEffect, useMemo } from 'react'
import { useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import type { WebGPURenderer } from 'three/webgpu'
import {
  Fn,
  If,
  Loop,
  color,
  float,
  materialRoughness,
  normalMap,
  normalLocal,
  parallaxUV,
  positionLocal,
  smoothstep,
  texture,
  uv,
  vec2,
} from 'three/tsl'
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
  displacement: THREE.Texture | null
  roughness: THREE.Texture | null
  metallic: THREE.Texture | null
  aoChannel: TextureChannel
  heightChannel: TextureChannel
  roughnessChannel: TextureChannel
}

export type SplineWallMaterialBundle = {
  side: THREE.Material
  top: THREE.Material
}

type ParallaxNodeMaterial = THREE.Material & {
  colorNode?: unknown
  normalNode?: unknown
  positionNode?: unknown
  castShadowPositionNode?: unknown
  roughnessNode?: unknown
  bumpMap?: THREE.Texture | null
  normalMap?: THREE.Texture | null
  roughnessMap?: THREE.Texture | null
}

type SupportedRenderer = THREE.WebGLRenderer | WebGPURenderer
export type TextureChannel = 'r' | 'g' | 'b' | 'a'

const WALL_MATERIAL_SET_CONTENT_PACK_ID = 'dungeon'
const KTX2_TRANSCODER_PATH = '/three/basis/'
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

export function configureSplineWallTexture(
  texture: THREE.Texture,
  channel: 'color' | 'data',
  verticalWrap: 'repeat' | 'clamp' = 'repeat',
) {
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = verticalWrap === 'clamp' ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping
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
      const bumpTexture = textures.height && textures.heightChannel === 'r' ? textures.height : null
      const material = createStandardCompatibleMaterial({
        color: shading?.tintColor ?? DEFAULT_DUNGEON_WALL_TINT,
        map: textures.albedo,
        normalMap: textures.normal,
        aoMap: textures.ao,
        aoMapIntensity: textures.ao ? (shading?.aoMapIntensity ?? DEFAULT_DUNGEON_WALL_AO_INTENSITY) : 0,
        bumpMap: bumpTexture,
        bumpScale: bumpTexture ? (shading?.bumpScale ?? DEFAULT_DUNGEON_WALL_BUMP_SCALE) : 0,
        roughnessMap: textures.roughness,
        metalnessMap: textures.metallic,
        roughness: textures.roughness ? 1 : (shading?.roughness ?? DEFAULT_DUNGEON_WALL_ROUGHNESS),
        metalness: textures.metallic ? 1 : (shading?.metalness ?? DEFAULT_DUNGEON_WALL_METALNESS),
        side: THREE.DoubleSide,
      })
      applySplineWallParallaxNodes(material, textures, wallMaterialSet)
      applySplineWallDisplacementNodes(material, textures, wallMaterialSet)
      return material
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

export function applySplineWallParallaxNodes(
  material: THREE.Material,
  textures: SplineWallPbrTextures,
  wallMaterialSet?: Pick<ContentPackWallMaterialSet, 'shading' | 'uv'>,
) {
  const shading = wallMaterialSet?.shading
  const parallaxScale = shading?.parallaxScale ?? 0
  if (!textures.height || parallaxScale <= 0) {
    return
  }

  const parallaxSteps = Math.max(1, Math.min(16, Math.round(shading?.parallaxSteps ?? 8)))
  const clampVerticalParallax = wallMaterialSet?.uv?.verticalWrap === 'clamp'
  const parallaxedUv = createParallaxOcclusionUv(
    textures.height,
    textures.heightChannel,
    parallaxScale,
    parallaxSteps,
    shading?.parallaxInvert === true,
    clampVerticalParallax,
  )
  const nodeMaterial = material as ParallaxNodeMaterial

  nodeMaterial.colorNode = texture(textures.albedo).sample(parallaxedUv).rgb.mul(
    color(shading?.tintColor ?? DEFAULT_DUNGEON_WALL_TINT),
  )

  if (textures.normal) {
    nodeMaterial.normalNode = normalMap(
      texture(textures.normal).sample(parallaxedUv).rgb,
      vec2(1, 1),
    )
    nodeMaterial.normalMap = null
  }

  if (textures.roughness) {
    nodeMaterial.roughnessNode = sampleTextureChannel(
      texture(textures.roughness).sample(parallaxedUv),
      textures.roughnessChannel,
    )
    nodeMaterial.roughnessMap = null
  } else if (typeof shading?.roughness === 'number') {
    nodeMaterial.roughnessNode = float(shading.roughness)
  } else {
    nodeMaterial.roughnessNode = materialRoughness
  }

  nodeMaterial.bumpMap = null
  material.userData = {
    ...material.userData,
    splineWallParallax: {
      scale: parallaxScale,
      steps: parallaxSteps,
      inverted: shading?.parallaxInvert === true,
      edgeFade: clampVerticalParallax,
      edgePadding: clampVerticalParallax ? 0.015 : 0,
    },
  }
  material.needsUpdate = true
}

export function applySplineWallDisplacementNodes(
  material: THREE.Material,
  textures: SplineWallPbrTextures,
  wallMaterialSet?: Pick<ContentPackWallMaterialSet, 'shading'>,
) {
  const shading = wallMaterialSet?.shading
  const displacementScale = shading?.displacementScale ?? 0
  const displacementTexture = textures.displacement ?? textures.height
  if (!displacementTexture || displacementScale <= 0) {
    return
  }

  const displacementBias = shading?.displacementBias ?? 0
  const sampledHeight = texture(displacementTexture).sample(uv()).r
  const displacement = sampledHeight.mul(float(displacementScale)).add(float(displacementBias))
  const displacedPosition = positionLocal.add(normalLocal.normalize().mul(displacement))
  const nodeMaterial = material as ParallaxNodeMaterial

  nodeMaterial.positionNode = displacedPosition
  nodeMaterial.castShadowPositionNode = displacedPosition
  material.userData = {
    ...material.userData,
    splineWallDisplacement: {
      scale: displacementScale,
      bias: displacementBias,
    },
  }
  material.needsUpdate = true
}

function createParallaxOcclusionUv(
  heightTexture: THREE.Texture,
  heightChannel: TextureChannel,
  scale: number,
  steps: number,
  invertHeight: boolean,
  clampVerticalEdges: boolean,
) {
  return Fn(() => {
    const baseUv = uv()
    const edgeFade = clampVerticalEdges
      ? smoothstep(float(0.03), float(0.12), baseUv.y)
        .mul(smoothstep(float(0.03), float(0.12), float(1).sub(baseUv.y)))
      : float(1)
    const parallaxLimitUv = vec2(parallaxUV(baseUv, vec2(float(scale).mul(edgeFade))) as never)
    const parallaxDelta = parallaxLimitUv.sub(baseUv).div(float(steps))
    const layerStep = float(1 / steps)
    const currentUv = vec2(baseUv).toVar()
    const currentLayerDepth = float(0).toVar()

    Loop(steps, () => {
      const rawHeight = sampleTextureChannel(texture(heightTexture).sample(currentUv), heightChannel)
      const sampledHeight = invertHeight ? float(1).sub(rawHeight) : rawHeight
      If(currentLayerDepth.lessThan(sampledHeight), () => {
        currentUv.addAssign(parallaxDelta)
        if (clampVerticalEdges) {
          currentUv.assign(vec2(currentUv.x, currentUv.y.max(float(0.015)).min(float(0.985))))
        }
        currentLayerDepth.addAssign(layerStep)
      })
    })

    return currentUv
  })()
}

type TextureChannelSample = {
  r: ReturnType<typeof float>
  g: ReturnType<typeof float>
  b: ReturnType<typeof float>
  a: ReturnType<typeof float>
}

function sampleTextureChannel(sample: TextureChannelSample, channel: TextureChannel) {
  switch (channel) {
    case 'g':
      return sample.g
    case 'b':
      return sample.b
    case 'a':
      return sample.a
    case 'r':
    default:
      return sample.r
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
    ...(wallMaterialSet.textures.packedOrmHeightUrl ? { packedOrmHeight: wallMaterialSet.textures.packedOrmHeightUrl } : {}),
    ...(wallMaterialSet.textures.displacementUrl ? { displacement: wallMaterialSet.textures.displacementUrl } : {}),
    ...(wallMaterialSet.textures.roughnessUrl ? { roughness: wallMaterialSet.textures.roughnessUrl } : {}),
    ...(wallMaterialSet.textures.metallicUrl ? { metallic: wallMaterialSet.textures.metallicUrl } : {}),
  }
}

class WallTextureLoader extends THREE.Loader<THREE.Texture> {
  private textureLoader = new THREE.TextureLoader(this.manager)
  private ktx2Loader = new KTX2Loader(this.manager).setTranscoderPath(KTX2_TRANSCODER_PATH)
  private renderer: SupportedRenderer | null = null

  setRenderer(renderer: SupportedRenderer) {
    if (this.renderer !== renderer) {
      this.renderer = renderer
      this.ktx2Loader.detectSupport(renderer)
    }
    return this
  }

  load(
    url: string,
    onLoad?: (data: THREE.Texture) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ) {
    const loader = url.split('?')[0]?.toLowerCase().endsWith('.ktx2')
      ? this.ktx2Loader
      : this.textureLoader
    if (loader === this.ktx2Loader) {
      return this.ktx2Loader.load(
        url,
        (texture) => onLoad?.(texture),
        onProgress,
        onError,
      )
    }

    return this.textureLoader.load(
      url,
      onLoad as ((texture: THREE.Texture) => void) | undefined,
      onProgress,
      onError,
    )
  }
}

function remapLoadedTextures(
  textureUrlMap: Record<string, string>,
  loadedTextures: THREE.Texture[],
) {
  const mapped: Record<string, THREE.Texture> = {}
  Object.keys(textureUrlMap).forEach((key, index) => {
    const texture = loadedTextures[index]
    if (texture) {
      mapped[key] = texture
    }
  })
  return mapped
}

export function useWallMaterialTextureMap(textureUrlMap: Record<string, string>) {
  const gl = useThree((state) => state.gl) as SupportedRenderer
  const loadedTextureList = useLoader(
    WallTextureLoader,
    Object.values(textureUrlMap),
    (loader) => loader.setRenderer(gl),
  ) as THREE.Texture[]

  return useMemo(
    () => remapLoadedTextures(textureUrlMap, loadedTextureList),
    [textureUrlMap, loadedTextureList],
  )
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
  const loadedTextures = useWallMaterialTextureMap(textureUrlMap)
  const textures = useMemo<SplineWallPbrTextures>(() => ({
    albedo: loadedTextures.albedo,
    normal: loadedTextures.normal ?? null,
    ao: loadedTextures.ao ?? loadedTextures.packedOrmHeight ?? null,
    height: loadedTextures.height ?? loadedTextures.packedOrmHeight ?? null,
    displacement: loadedTextures.displacement ?? null,
    roughness: loadedTextures.roughness ?? loadedTextures.packedOrmHeight ?? null,
    metallic: loadedTextures.metallic ?? null,
    aoChannel: loadedTextures.ao ? 'r' : 'r',
    heightChannel: loadedTextures.height ? 'r' : loadedTextures.packedOrmHeight ? 'b' : 'r',
    roughnessChannel: loadedTextures.roughness ? 'g' : loadedTextures.packedOrmHeight ? 'g' : 'g',
  }), [loadedTextures])

  useEffect(() => {
    const verticalWrap = wallMaterialSet.uv?.verticalWrap ?? 'repeat'
    configureSplineWallTexture(textures.albedo, 'color', verticalWrap)
    if (textures.normal) {
      configureSplineWallTexture(textures.normal, 'data', verticalWrap)
    }
    if (textures.ao) {
      configureSplineWallTexture(textures.ao, 'data', verticalWrap)
    }
    if (textures.height) {
      configureSplineWallTexture(textures.height, 'data', verticalWrap)
    }
    if (textures.displacement) {
      configureSplineWallTexture(textures.displacement, 'data', verticalWrap)
    }
    if (textures.roughness) {
      configureSplineWallTexture(textures.roughness, 'data', verticalWrap)
    }
    if (textures.metallic) {
      configureSplineWallTexture(textures.metallic, 'data', verticalWrap)
    }
  }, [textures, wallMaterialSet.uv?.verticalWrap])

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
