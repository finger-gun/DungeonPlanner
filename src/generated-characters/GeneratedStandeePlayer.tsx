import { useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { ContentPackComponentProps } from '../content-packs/types'
import type { GeneratedCharacterRecord } from './types'
import {
  GENERATED_CHARACTER_BASE_RADIUS,
  getGeneratedCharacterScale,
} from './rendering'

const BASE_RADIUS = GENERATED_CHARACTER_BASE_RADIUS
const BASE_HEIGHT = 0.08
const CARD_HEIGHT = 1.85
const CARD_THICKNESS = 0.032
const CARD_FACE_OFFSET = CARD_THICKNESS * 0.5
const CARD_Y_OFFSET = BASE_HEIGHT + (CARD_HEIGHT * 0.5) + 0.04
const CARD_DEPTH_LAYERS = [-0.012, -0.008, -0.004, 0, 0.004, 0.008, 0.012] as const

export function GeneratedStandeePlayer({
  character,
  ...props
}: ContentPackComponentProps & { character: GeneratedCharacterRecord }) {
  const texture = useTexture(character.processedImageUrl ?? '')
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  const characterScale = getGeneratedCharacterScale(character.size)

  const alphaTexture = useMemo(() => {
    const source = texture.image
    if (!source || typeof source !== 'object' || typeof document === 'undefined') {
      return null
    }

    const sourceWithDimensions = source as {
      naturalWidth?: number
      naturalHeight?: number
      videoWidth?: number
      videoHeight?: number
      width?: number
      height?: number
    } & CanvasImageSource

    const width = typeof sourceWithDimensions.naturalWidth === 'number'
      ? sourceWithDimensions.naturalWidth
      : typeof sourceWithDimensions.videoWidth === 'number'
        ? sourceWithDimensions.videoWidth
        : typeof sourceWithDimensions.width === 'number'
          ? sourceWithDimensions.width
          : 0
    const height = typeof sourceWithDimensions.naturalHeight === 'number'
      ? sourceWithDimensions.naturalHeight
      : typeof sourceWithDimensions.videoHeight === 'number'
        ? sourceWithDimensions.videoHeight
        : typeof sourceWithDimensions.height === 'number'
          ? sourceWithDimensions.height
          : 0

    if (width <= 0 || height <= 0) {
      return null
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) {
      return null
    }

    context.drawImage(sourceWithDimensions, 0, 0, width, height)
    const imageData = context.getImageData(0, 0, width, height)
    const { data } = imageData
    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3]
      data[index] = alpha
      data[index + 1] = alpha
      data[index + 2] = alpha
      data[index + 3] = 255
    }
    context.putImageData(imageData, 0, 0)

    const nextAlphaTexture = new THREE.CanvasTexture(canvas)
    nextAlphaTexture.wrapS = THREE.ClampToEdgeWrapping
    nextAlphaTexture.wrapT = THREE.ClampToEdgeWrapping
    nextAlphaTexture.flipY = texture.flipY
    nextAlphaTexture.minFilter = texture.minFilter
    nextAlphaTexture.magFilter = texture.magFilter
    nextAlphaTexture.colorSpace = THREE.NoColorSpace
    nextAlphaTexture.needsUpdate = true
    return nextAlphaTexture
  }, [texture])

  useEffect(() => () => {
    alphaTexture?.dispose()
  }, [alphaTexture])

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
            key={offset}
            position={[0, 0, offset]}
            castShadow
            receiveShadow
          >
            <planeGeometry args={[cardWidth, cardHeight]} />
            <meshStandardMaterial
              color="#f7f2e7"
              alphaMap={alphaTexture ?? undefined}
              transparent
              alphaTest={0.1}
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
            alphaTest={0.08}
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
            alphaTest={0.08}
            side={THREE.FrontSide}
            roughness={0.8}
            metalness={0}
          />
        </mesh>
      </group>
    </group>
  )
}
