import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  GENERATED_CHARACTER_BASE_HEIGHT,
  GENERATED_CHARACTER_BASE_RADIUS,
  getGeneratedStandeeBasePalette,
  getGeneratedStandeeSupportWidth,
} from './rendering'
import type { GeneratedCharacterKind } from './types'
import {
  acquireGeneratedCharacterStandeeGeometry,
  releaseGeneratedCharacterStandeeGeometry,
} from './generatedStandeeGeometry'
import { createStandardCompatibleMaterial } from '../rendering/nodeMaterialUtils'

export function GeneratedStandeeBaseMesh({
  cardWidth,
  kind,
  castShadow = true,
  receiveShadow = true,
}: {
  cardWidth: number
  kind: GeneratedCharacterKind
  castShadow?: boolean
  receiveShadow?: boolean
}) {
  const palette = getGeneratedStandeeBasePalette(kind)
  const baseMaterial = useMemo(
    () => createStandardCompatibleMaterial({
      color: palette.baseColor,
      roughness: 0.86,
      metalness: 0.08,
    }),
    [palette.baseColor],
  )
  const supportMaterial = useMemo(
    () => createStandardCompatibleMaterial({
      color: palette.supportColor,
      roughness: 0.72,
      metalness: 0.02,
    }),
    [palette.supportColor],
  )

  useEffect(() => () => baseMaterial.dispose(), [baseMaterial])
  useEffect(() => () => supportMaterial.dispose(), [supportMaterial])

  return (
    <>
      <mesh position={[0, GENERATED_CHARACTER_BASE_HEIGHT * 0.5, 0]} castShadow={castShadow} receiveShadow={receiveShadow}>
        <cylinderGeometry args={[GENERATED_CHARACTER_BASE_RADIUS, GENERATED_CHARACTER_BASE_RADIUS * 1.06, GENERATED_CHARACTER_BASE_HEIGHT, 48]} />
        <primitive object={baseMaterial} attach="material" />
      </mesh>
      <mesh position={[0, GENERATED_CHARACTER_BASE_HEIGHT + 0.035, 0]} castShadow={castShadow} receiveShadow={receiveShadow}>
        <boxGeometry args={[getGeneratedStandeeSupportWidth(cardWidth), 0.07, 0.05]} />
        <primitive object={supportMaterial} attach="material" />
      </mesh>
    </>
  )
}

export function GeneratedStandeeCardSurfaceMesh({
  cardWidth,
  cardHeight,
  texture,
  alphaTexture,
  mirrorX = false,
  position,
  rotation,
  castShadow = true,
  receiveShadow = true,
}: {
  cardWidth: number
  cardHeight: number
  texture: THREE.Texture
  alphaTexture?: THREE.Texture | null
  mirrorX?: boolean
  position: [number, number, number]
  rotation?: [number, number, number]
  castShadow?: boolean
  receiveShadow?: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const surfaceTexture = useMemo(
    () => mirrorX ? createMirroredStandeeSurfaceTexture(texture) : texture,
    [mirrorX, texture],
  )
  const surfaceAlphaTexture = useMemo(
    () => alphaTexture && mirrorX ? createMirroredStandeeSurfaceTexture(alphaTexture) : alphaTexture,
    [alphaTexture, mirrorX],
  )
  const depthMaterial = useMemo(() => {
    const material = new THREE.MeshDepthMaterial()
    material.depthPacking = THREE.RGBADepthPacking
    material.alphaMap = surfaceAlphaTexture ?? surfaceTexture
    material.alphaTest = 0.03
    return material
  }, [surfaceAlphaTexture, surfaceTexture])
  const surfaceMaterial = useMemo(
    () => createStandardCompatibleMaterial({
      map: surfaceTexture,
      alphaMap: surfaceAlphaTexture ?? undefined,
      transparent: true,
      alphaTest: 0.03,
      side: THREE.FrontSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      roughness: 0.8,
      metalness: 0,
    }),
    [surfaceAlphaTexture, surfaceTexture],
  )

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) {
      return
    }
    mesh.customDepthMaterial = depthMaterial
    return () => {
      if (mesh.customDepthMaterial === depthMaterial) {
        mesh.customDepthMaterial = undefined
      }
    }
  }, [depthMaterial])

  useLayoutEffect(() => () => {
    if (surfaceTexture !== texture) {
      surfaceTexture.dispose()
    }
  }, [surfaceTexture, texture])

  useLayoutEffect(() => () => {
    if (surfaceAlphaTexture && surfaceAlphaTexture !== alphaTexture) {
      surfaceAlphaTexture.dispose()
    }
  }, [alphaTexture, surfaceAlphaTexture])

  useLayoutEffect(() => () => depthMaterial.dispose(), [depthMaterial])
  useLayoutEffect(() => () => surfaceMaterial.dispose(), [surfaceMaterial])

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      <planeGeometry args={[cardWidth, cardHeight]} />
      <primitive object={surfaceMaterial} attach="material" />
    </mesh>
  )
}

function createMirroredStandeeSurfaceTexture(source: THREE.Texture) {
  const mirroredTexture = source.clone()
  mirroredTexture.wrapS = THREE.ClampToEdgeWrapping
  mirroredTexture.wrapT = THREE.ClampToEdgeWrapping
  mirroredTexture.colorSpace = source.colorSpace
  mirroredTexture.flipY = source.flipY
  mirroredTexture.minFilter = source.minFilter
  mirroredTexture.magFilter = source.magFilter
  mirroredTexture.generateMipmaps = source.generateMipmaps
  mirroredTexture.anisotropy = source.anisotropy
  mirroredTexture.offset.set(1, 0)
  mirroredTexture.repeat.set(-1, 1)
  mirroredTexture.needsUpdate = true
  return mirroredTexture
}

export function GeneratedStandeeSilhouetteMesh({
  cacheKey,
  cardWidth,
  cardHeight,
  depth,
  alphaTexture,
  castShadow = true,
  receiveShadow = true,
}: {
  cacheKey: string
  cardWidth: number
  cardHeight: number
  depth: number
  alphaTexture: THREE.Texture
  castShadow?: boolean
  receiveShadow?: boolean
}) {
  const geometry = useMemo(
    () => acquireGeneratedCharacterStandeeGeometry(cacheKey, alphaTexture, cardWidth, cardHeight, depth),
    [alphaTexture, cacheKey, cardHeight, cardWidth, depth],
  )
  const material = useMemo(
    () => createStandardCompatibleMaterial({
      color: '#f7f2e7',
      roughness: 0.9,
      metalness: 0.02,
    }),
    [],
  )

  useEffect(() => () => {
    releaseGeneratedCharacterStandeeGeometry(cacheKey)
  }, [cacheKey])
  useEffect(() => () => material.dispose(), [material])

  return (
    <mesh geometry={geometry} castShadow={castShadow} receiveShadow={receiveShadow}>
      <primitive object={material} attach="material" />
    </mesh>
  )
}
