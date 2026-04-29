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
import { SELECTION_OUTLINE_IGNORE_USER_DATA } from '../postprocessing/selectionOutlineConfig'

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
  bakedLightMode = 'prop',
  mirrorX = false,
  excludeFromSelectionOutline = false,
  position,
  rotation,
  castShadow = true,
  receiveShadow = true,
}: {
  cardWidth: number
  cardHeight: number
  texture: THREE.Texture
  alphaTexture?: THREE.Texture | null
  bakedLightMode?: 'prop' | 'billboard'
  mirrorX?: boolean
  excludeFromSelectionOutline?: boolean
  position: [number, number, number]
  rotation?: [number, number, number]
  castShadow?: boolean
  receiveShadow?: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const surfaceTexture = texture
  const surfaceAlphaTexture = alphaTexture
  const depthMaterial = useMemo(() => {
    const material = new THREE.MeshDepthMaterial()
    material.depthPacking = THREE.RGBADepthPacking
    material.alphaMap = surfaceAlphaTexture ?? surfaceTexture
    material.alphaTest = 0.03
    return material
  }, [surfaceAlphaTexture, surfaceTexture])
  const geometry = useMemo(
    () => createGeneratedStandeeCardSurfaceGeometry(cardWidth, cardHeight, mirrorX),
    [cardHeight, cardWidth, mirrorX],
  )
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
  surfaceMaterial.userData.bakedLightMode = bakedLightMode

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

  useLayoutEffect(() => () => geometry.dispose(), [geometry])
  useLayoutEffect(() => () => depthMaterial.dispose(), [depthMaterial])
  useLayoutEffect(() => () => surfaceMaterial.dispose(), [surfaceMaterial])

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      userData={excludeFromSelectionOutline ? { [SELECTION_OUTLINE_IGNORE_USER_DATA]: true } : undefined}
    >
      <primitive object={geometry} attach="geometry" />
      <primitive object={surfaceMaterial} attach="material" />
    </mesh>
  )
}

export function createGeneratedStandeeCardSurfaceGeometry(
  cardWidth: number,
  cardHeight: number,
  mirrorX = false,
) {
  const geometry = new THREE.PlaneGeometry(cardWidth, cardHeight)
  if (!mirrorX) {
    return geometry
  }

  const uv = geometry.getAttribute('uv') as THREE.BufferAttribute
  for (let index = 0; index < uv.count; index += 1) {
    uv.setX(index, 1 - uv.getX(index))
  }
  uv.needsUpdate = true
  return geometry
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
