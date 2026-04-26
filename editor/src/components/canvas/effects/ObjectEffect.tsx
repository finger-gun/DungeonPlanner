import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ContentPackEffect } from '../../../content-packs/types'
import { buildParticleEmitters, type ParticleEmitterDefinition, type ParticleLayerDefinition, type ParticleSeed } from './presets'

const matrixObject = new THREE.Object3D()
const colorScratch = new THREE.Color()
const colorEndScratch = new THREE.Color()
const emitterColorScratch = new THREE.Color()
const flameCoreScratch = new THREE.Color('#fff4d6')
export const SHARED_PARTICLE_GEOMETRY = new THREE.PlaneGeometry(1, 1)
export const sharedMaterialCache = new Map<number, THREE.MeshBasicMaterial>()

export function ObjectEffect({
  effect,
  effectKey,
}: {
  effect: ContentPackEffect
  effectKey: string
}) {
  const emitters = useMemo(
    () => buildParticleEmitters(effect, effectKey),
    [effect, effectKey],
  )

  return (
    <group>
      {emitters.map((emitter) => (
        <ParticleEmitter key={emitter.key} emitter={emitter} />
      ))}
    </group>
  )
}

export function FireEffectPreloader() {
  return (
    <group position={[0, -1000, 0]}>
      <ObjectEffect
        effect={{
          preset: 'fire',
          emitters: [{ offset: [0, 0, 0], scale: 0.01, intensity: 0.0001 }],
        }}
        effectKey="prewarm:fire"
      />
    </group>
  )
}

function ParticleEmitter({ emitter }: { emitter: ParticleEmitterDefinition }) {
  return (
    <group position={emitter.offset}>
      {emitter.layers.map((layer, index) => (
        <ParticleLayer
          key={`${emitter.key}:${index}`}
          layer={layer}
          effectKey={`${emitter.key}:${index}`}
          emitterScale={emitter.scale}
          emitterIntensity={emitter.intensity}
          emitterColor={emitter.color}
        />
      ))}
    </group>
  )
}

function ParticleLayer({
  layer,
  effectKey,
  emitterScale,
  emitterIntensity,
  emitterColor,
}: {
  layer: ParticleLayerDefinition
  effectKey: string
  emitterScale: number
  emitterIntensity: number
  emitterColor?: string
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { camera } = useThree()
  const material = useMemo(() => getSharedParticleMaterial(layer.opacity), [layer.opacity])
  const seeds = useMemo(() => createParticleSeeds(effectKey, layer), [effectKey, layer])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh?.instanceMatrix) {
      return
    }

    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    if (mesh.instanceColor) {
      mesh.instanceColor.setUsage(THREE.DynamicDrawUsage)
    }
  }, [])

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) {
      return
    }

    const elapsed = clock.elapsedTime
    for (let index = 0; index < seeds.length; index += 1) {
      const seed = seeds[index]
      const life = (elapsed * seed.speed + seed.basePhase) % 1
      const fade = Math.sin(life * Math.PI) ** 1.35
      const inverseLife = 1 - life

      const horizontalScale = emitterScale * seed.size
      const verticalStretch = 1.15 + life * 0.9
      const size = THREE.MathUtils.lerp(layer.size[0], layer.size[1], life) * fade * horizontalScale
      const height = life * layer.height * emitterScale * seed.height
      const sway = inverseLife * layer.drift * emitterScale * seed.sway
      const spiral = elapsed * 0.9 + seed.wobblePhase
      const x =
        Math.cos(seed.radialAngle + spiral * 0.7) * seed.radialOffset * layer.spread * emitterScale +
        Math.sin(spiral * 1.4) * sway
      const z =
        Math.sin(seed.radialAngle + spiral * 0.9) * seed.radialOffset * layer.spread * emitterScale +
        Math.cos(spiral * 1.2) * sway

      matrixObject.position.set(x, height, z)
      matrixObject.quaternion.copy(camera.quaternion)
      matrixObject.scale.set(size, size * verticalStretch, size)
      matrixObject.updateMatrix()
      mesh.setMatrixAt(index, matrixObject.matrix)

      colorScratch.set(layer.colorStart)
      colorEndScratch.set(layer.colorEnd)
      if (emitterColor) {
        emitterColorScratch.set(emitterColor)
        colorScratch.copy(emitterColorScratch).lerp(flameCoreScratch, 0.18 * (1 - life))
        colorEndScratch.copy(emitterColorScratch).multiplyScalar(0.72)
      }
      colorScratch.lerp(colorEndScratch, life)
      colorScratch.multiplyScalar((0.75 + fade * 0.85) * emitterIntensity)
      mesh.setColorAt(index, colorScratch)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true
    }
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[SHARED_PARTICLE_GEOMETRY, material, layer.count]}
      frustumCulled={false}
      renderOrder={12}
    />
  )
}

export function getSharedParticleMaterial(opacity: number) {
  const materialKey = Math.round(opacity * 1000)
  const cachedMaterial = sharedMaterialCache.get(materialKey)
  if (cachedMaterial) {
    return cachedMaterial
  }

  const material = new THREE.MeshBasicMaterial({
    map: getSharedSoftParticleTexture(),
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  })
  sharedMaterialCache.set(materialKey, material)
  return material
}

let sharedSoftParticleTexture: THREE.CanvasTexture | null | undefined

function getSharedSoftParticleTexture() {
  if (sharedSoftParticleTexture !== undefined) {
    return sharedSoftParticleTexture ?? undefined
  }

  if (typeof document === 'undefined') {
    sharedSoftParticleTexture = null
    return undefined
  }

  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const context = canvas.getContext('2d')
  if (!context) {
    sharedSoftParticleTexture = null
    return undefined
  }

  const gradient = context.createRadialGradient(32, 24, 4, 32, 32, 30)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.3, 'rgba(255,240,180,0.95)')
  gradient.addColorStop(0.7, 'rgba(255,120,20,0.45)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')

  context.clearRect(0, 0, 64, 64)
  context.fillStyle = gradient
  context.fillRect(0, 0, 64, 64)

  sharedSoftParticleTexture = new THREE.CanvasTexture(canvas)
  sharedSoftParticleTexture.needsUpdate = true
  return sharedSoftParticleTexture
}

export function createParticleSeeds(effectKey: string, layer: ParticleLayerDefinition) {
  const rng = createRng(effectKey)

  return Array.from({ length: layer.count }, () => ({
    basePhase: rng(),
    speed: THREE.MathUtils.lerp(layer.speed[0], layer.speed[1], rng()),
    wobblePhase: rng() * Math.PI * 2,
    radialAngle: rng() * Math.PI * 2,
    radialOffset: rng(),
    size: THREE.MathUtils.lerp(0.85, 1.2, rng()),
    height: THREE.MathUtils.lerp(0.9, 1.15, rng()),
    sway: THREE.MathUtils.lerp(0.8, 1.2, rng()),
  })) satisfies ParticleSeed[]
}

function createRng(seedText: string) {
  let hash = 2166136261
  for (let index = 0; index < seedText.length; index += 1) {
    hash ^= seedText.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  let state = hash >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}
