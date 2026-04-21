import { useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { ContentPackComponentProps } from '../content-packs/types'
import type { GeneratedCharacterRecord } from './types'
import {
  GENERATED_CHARACTER_BASE_RADIUS,
  getGeneratedCharacterScale,
} from './rendering'
import {
  acquireGeneratedCharacterAlphaTexture,
  releaseGeneratedCharacterAlphaTexture,
} from './alphaTextureCache'

const BASE_RADIUS = GENERATED_CHARACTER_BASE_RADIUS
const BASE_HEIGHT = 0.08
const CARD_HEIGHT = 1.85
const CARD_THICKNESS = 0.056
const CARD_FACE_OFFSET = CARD_THICKNESS * 0.5
const CARD_Y_OFFSET = BASE_HEIGHT + (CARD_HEIGHT * 0.5) + 0.04
const CARD_DEPTH_LAYERS = [-0.024, -0.02, -0.016, -0.012, -0.008, -0.004, 0, 0.004, 0.008, 0.012, 0.016, 0.02, 0.024] as const

export function GeneratedStandeePlayer({
  character,
  ...props
}: ContentPackComponentProps & { character: GeneratedCharacterRecord }) {
  const texture = useTexture(character.processedImageUrl ?? '')
  const alphaTextureCacheKey = `${character.assetId}:${character.updatedAt}:${character.processedImageUrl ?? ''}`
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  const characterScale = getGeneratedCharacterScale(character.size)

  const alphaTexture = useMemo(
    () => acquireGeneratedCharacterAlphaTexture(alphaTextureCacheKey, texture),
    [alphaTextureCacheKey, texture],
  )

  useEffect(() => () => {
    releaseGeneratedCharacterAlphaTexture(alphaTextureCacheKey)
  }, [alphaTextureCacheKey])

  const { cardWidth, cardHeight } = useMemo(() => {
    const aspect =
      character.width && character.height && character.height > 0
        ? character.width / character.height
        : 0.7
    return {
      cardWidth: Math.max(0.72, CARD_HEIGHT * aspect),
      cardHeight: CARD_HEIGHT,
    }
  }, [character.height, character.width])

  return (
    <group scale={characterScale} {...props}>
      <mesh position={[0, BASE_HEIGHT * 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[BASE_RADIUS, BASE_RADIUS * 1.06, BASE_HEIGHT, 48]} />
        <meshStandardMaterial color="#44342d" roughness={0.86} metalness={0.08} />
      </mesh>
      <mesh position={[0, BASE_HEIGHT + 0.035, 0]} castShadow receiveShadow>
        <boxGeometry args={[Math.min(cardWidth * 0.6, 0.58), 0.07, 0.05]} />
        <meshStandardMaterial color="#f3efe6" roughness={0.72} metalness={0.02} />
      </mesh>

      <group position={[0, CARD_Y_OFFSET, 0]}>
        {CARD_DEPTH_LAYERS.map((offset) => (
          <mesh
            key={`front-${offset}`}
            position={[0, 0, offset]}
            castShadow
            receiveShadow
          >
            <planeGeometry args={[cardWidth, cardHeight]} />
            <meshStandardMaterial
              color="#f7f2e7"
              alphaMap={alphaTexture ?? undefined}
              transparent={false}
              alphaTest={0.03}
              side={THREE.FrontSide}
              roughness={0.92}
              metalness={0}
            />
          </mesh>
        ))}
        {CARD_DEPTH_LAYERS.map((offset) => (
          <mesh
            key={`back-${offset}`}
            position={[0, 0, -offset]}
            rotation={[0, Math.PI, 0]}
            castShadow
            receiveShadow
          >
            <planeGeometry args={[cardWidth, cardHeight]} />
            <meshStandardMaterial
              color="#f7f2e7"
              alphaMap={alphaTexture ?? undefined}
              transparent={false}
              alphaTest={0.03}
              side={THREE.FrontSide}
              roughness={0.92}
              metalness={0}
            />
          </mesh>
        ))}

        <mesh position={[0, 0, CARD_FACE_OFFSET]} castShadow receiveShadow>
          <planeGeometry args={[cardWidth, cardHeight]} />
          <meshStandardMaterial
            map={texture}
            transparent
            alphaTest={0.03}
            side={THREE.FrontSide}
            roughness={0.8}
            metalness={0}
          />
        </mesh>

        <mesh
          position={[0, 0, -CARD_FACE_OFFSET]}
          rotation={[0, Math.PI, 0]}
          castShadow
          receiveShadow
        >
          <planeGeometry args={[cardWidth, cardHeight]} />
          <meshStandardMaterial
            map={texture}
            transparent
            alphaTest={0.03}
            side={THREE.FrontSide}
            roughness={0.8}
            metalness={0}
          />
        </mesh>
      </group>
    </group>
  )
}
