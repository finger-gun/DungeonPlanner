import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import type { WebGPURenderer } from 'three/webgpu'
import type { ContentPackAsset, ContentPackComponentProps } from '../../types'
import { GRID_SIZE } from '../../../hooks/useSnapToGrid'
import {
  createStandardCompatibleMaterial,
  type CompatibleNodeMaterial,
} from '../../../rendering/nodeMaterialUtils'
import { applyRoomFloorMaskToMaterial } from '../../../components/canvas/roomFloorMaskMaterial'

type SupportedRenderer = THREE.WebGLRenderer | WebGPURenderer

const KTX2_TRANSCODER_PATH = '/three/basis/'

class FloorTextureLoader extends THREE.Loader<THREE.Texture> {
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
      return this.ktx2Loader.load(url, (texture) => onLoad?.(texture), onProgress, onError)
    }

    return this.textureLoader.load(
      url,
      onLoad as ((texture: THREE.Texture) => void) | undefined,
      onProgress,
      onError,
    )
  }
}

function configureFloorTexture(
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

function useFloorTextureMap(textureUrlMap: Record<string, string>) {
  const gl = useThree((state) => state.gl) as SupportedRenderer
  const loadedTextureList = useLoader(
    FloorTextureLoader,
    Object.values(textureUrlMap),
    (loader) => loader.setRenderer(gl),
  ) as THREE.Texture[]

  return useMemo(() => {
    const mapped: Record<string, THREE.Texture> = {}
    Object.keys(textureUrlMap).forEach((key, index) => {
      const texture = loadedTextureList[index]
      if (texture) {
        mapped[key] = texture
      }
    })
    return mapped
  }, [loadedTextureList, textureUrlMap])
}

export type GeneratedFloorMaterialDefinition = {
  id: string
  slug: string
  name: string
  thumbnailPath: string
  textures: {
    albedoPath: string
    normalPath?: string
    heightPath?: string
    packedOrmHeightPath?: string
    roughnessPath?: string
  }
  shading?: {
    tintColor?: string
    roughness?: number
    metalness?: number
    bumpScale?: number
  }
}

export function createGeneratedFloorMaterialAsset(
  definition: GeneratedFloorMaterialDefinition,
): ContentPackAsset {
  const FloorComponent = createGeneratedFloorMaterialComponent(definition)

  return {
    id: definition.id,
    slug: definition.slug,
    name: definition.name,
    category: 'floor',
    thumbnailUrl: definition.thumbnailPath,
    Component: FloorComponent,
    metadata: {
      tileSpan: { gridWidth: 1, gridHeight: 1 },
      browserCategory: 'surfaces',
      browserSubcategory: 'floors',
      floorRenderMode: 'textured-surface',
      castShadow: false,
      receiveShadow: true,
    },
  }
}

function createGeneratedFloorMaterialComponent(
  definition: GeneratedFloorMaterialDefinition,
) {
  function GeneratedFloorMaterial(props: ContentPackComponentProps) {
    const tintColor = definition.shading?.tintColor ?? '#ffffff'
    const bumpScale = definition.shading?.bumpScale ?? 0.12
    const roughness = definition.shading?.roughness ?? 0.94
    const metalness = definition.shading?.metalness ?? 0.02
    const textures = useFloorTextureMap({
      albedo: definition.textures.albedoPath,
      ...(definition.textures.normalPath ? { normal: definition.textures.normalPath } : {}),
      ...(definition.textures.heightPath ? { height: definition.textures.heightPath } : {}),
      ...(definition.textures.packedOrmHeightPath ? { packedOrmHeight: definition.textures.packedOrmHeightPath } : {}),
      ...(definition.textures.roughnessPath ? { roughness: definition.textures.roughnessPath } : {}),
    })
    const geometry = useMemo(() => {
      const plane = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE)
      plane.rotateX(-Math.PI / 2)
      return plane
    }, [])
    const heightTexture = textures.height ?? textures.packedOrmHeight ?? null
    const roughnessTexture = textures.roughness ?? textures.packedOrmHeight ?? null
    const materialRef = useRef<CompatibleNodeMaterial | null>(null)
    if (!materialRef.current) {
      materialRef.current = createStandardCompatibleMaterial({
        color: tintColor,
        bumpScale,
        roughness,
        metalness,
        side: THREE.DoubleSide,
      }) as CompatibleNodeMaterial
    }
    const material = materialRef.current

    useLayoutEffect(() => {
      material.color.set(tintColor)
      material.map = textures.albedo
      material.normalMap = textures.normal ?? null
      material.bumpMap = heightTexture
      material.bumpScale = heightTexture ? bumpScale : 0
      material.roughnessMap = roughnessTexture
      material.roughness = roughnessTexture ? 1 : roughness
      material.metalness = metalness
      applyRoomFloorMaskToMaterial(material, props.roomFloorMaskRuntime ?? null)
      material.needsUpdate = true
    }, [
      bumpScale,
      heightTexture,
      metalness,
      material,
      props.roomFloorMaskRuntime,
      roughness,
      roughnessTexture,
      tintColor,
      textures.albedo,
      textures.normal,
    ])

    useEffect(() => {
      configureFloorTexture(textures.albedo, 'color')
      if (textures.normal) {
        configureFloorTexture(textures.normal, 'data')
      }
      if (textures.height) {
        configureFloorTexture(textures.height, 'data')
      }
      if (textures.packedOrmHeight) {
        configureFloorTexture(textures.packedOrmHeight, 'data')
      }
      if (textures.roughness) {
        configureFloorTexture(textures.roughness, 'data')
      }
    }, [textures.albedo, textures.height, textures.normal, textures.packedOrmHeight, textures.roughness])

    useLayoutEffect(() => () => geometry.dispose(), [geometry])
    useLayoutEffect(() => () => material.dispose(), [material])

    return (
      <group {...props}>
        <mesh geometry={geometry} receiveShadow>
          <primitive object={material} attach="material" />
        </mesh>
      </group>
    )
  }

  GeneratedFloorMaterial.displayName = `GeneratedFloorMaterial(${definition.id})`
  return GeneratedFloorMaterial
}
