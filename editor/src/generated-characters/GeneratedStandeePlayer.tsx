import { useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { ContentPackComponentProps } from '../content-packs/types'
import type { GeneratedCharacterRecord } from './types'
import {
  GENERATED_CHARACTER_CARD_SURFACE_OFFSET,
  GENERATED_CHARACTER_CARD_THICKNESS,
  GENERATED_CHARACTER_CARD_Y_OFFSET,
  getGeneratedCharacterScale,
  getGeneratedStandeeCardDimensions,
} from './rendering'
import {
  acquireGeneratedCharacterAlphaTexture,
  releaseGeneratedCharacterAlphaTexture,
} from './alphaTextureCache'
import {
  GeneratedStandeeBaseMesh,
  GeneratedStandeeCardSurfaceMesh,
  GeneratedStandeeSilhouetteMesh,
} from './GeneratedStandeeMeshes'

const FALLBACK_ALPHA_MASK_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg=='

export function GeneratedStandeePlayer({
  character,
  ...props
}: ContentPackComponentProps & { character: GeneratedCharacterRecord }) {
  const portraitTexture = useTexture(character.processedImageUrl ?? '')
  const persistedAlphaTexture = useTexture(character.alphaMaskUrl ?? FALLBACK_ALPHA_MASK_DATA_URL)
  const alphaTextureCacheKey = `${character.assetId}:${character.updatedAt}:${character.processedImageUrl ?? ''}`
  portraitTexture.colorSpace = THREE.SRGBColorSpace
  portraitTexture.anisotropy = 8
  portraitTexture.wrapS = THREE.ClampToEdgeWrapping
  portraitTexture.wrapT = THREE.ClampToEdgeWrapping
  persistedAlphaTexture.colorSpace = THREE.NoColorSpace
  persistedAlphaTexture.wrapS = THREE.ClampToEdgeWrapping
  persistedAlphaTexture.wrapT = THREE.ClampToEdgeWrapping
  persistedAlphaTexture.flipY = portraitTexture.flipY
  persistedAlphaTexture.minFilter = portraitTexture.minFilter
  persistedAlphaTexture.magFilter = portraitTexture.magFilter
  const characterScale = getGeneratedCharacterScale(character.size)

  const legacyAlphaTexture = useMemo(
    () => character.alphaMaskUrl
      ? null
      : acquireGeneratedCharacterAlphaTexture(alphaTextureCacheKey, portraitTexture),
    [character.alphaMaskUrl, alphaTextureCacheKey, portraitTexture],
  )
  const alphaTexture = useMemo(
    () => character.alphaMaskUrl ? persistedAlphaTexture : legacyAlphaTexture,
    [character.alphaMaskUrl, legacyAlphaTexture, persistedAlphaTexture],
  )

  useEffect(() => () => {
    if (!character.alphaMaskUrl) {
      releaseGeneratedCharacterAlphaTexture(alphaTextureCacheKey)
    }
  }, [character.alphaMaskUrl, alphaTextureCacheKey])

  const { cardWidth, cardHeight } = useMemo(
    () => getGeneratedStandeeCardDimensions(character.width, character.height),
    [character.height, character.width],
  )

  return (
    <group scale={characterScale} {...props}>
      <GeneratedStandeeBaseMesh cardWidth={cardWidth} kind={character.kind} />

      <group position={[0, GENERATED_CHARACTER_CARD_Y_OFFSET, 0]}>
        {alphaTexture && (
          <GeneratedStandeeSilhouetteMesh
            cacheKey={`${alphaTextureCacheKey}:${cardWidth}:${cardHeight}`}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            depth={GENERATED_CHARACTER_CARD_THICKNESS}
            alphaTexture={alphaTexture}
          />
        )}
        <GeneratedStandeeCardSurfaceMesh
          cardWidth={cardWidth}
          cardHeight={cardHeight}
          texture={portraitTexture}
          alphaTexture={alphaTexture}
          excludeFromSelectionOutline
          position={[0, 0, GENERATED_CHARACTER_CARD_SURFACE_OFFSET]}
          castShadow={false}
        />
        <GeneratedStandeeCardSurfaceMesh
          cardWidth={cardWidth}
          cardHeight={cardHeight}
          texture={portraitTexture}
          alphaTexture={alphaTexture}
          excludeFromSelectionOutline
          position={[0, 0, -GENERATED_CHARACTER_CARD_SURFACE_OFFSET]}
          rotation={[0, Math.PI, 0]}
          castShadow={false}
        />
      </group>
    </group>
  )
}
