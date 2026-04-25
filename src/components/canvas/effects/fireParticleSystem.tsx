/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import {
  cos,
  float,
  instancedArray,
  instanceIndex,
  mix,
  mod,
  pow,
  sin,
  uint,
  uniform,
  vec2,
  vec3,
} from 'three/tsl'
import { useDungeonStore } from '../../../store/useDungeonStore'
import type { PlayVisibility } from '../playVisibility'
import { shouldRenderLineOfSightLight } from '../losRendering'
import { FIRE_LAYERS, type ParticleLayerDefinition } from './presets'
import { createParticleSeeds } from './ObjectEffect'
import { getCameraFrustum, hasCameraChanged } from '../propLightPool'
import type { RegisteredEffectSource } from '../objectSourceRegistry'
import { useRegisteredEffectSources } from '../objectSourceRegistry'

/**
 * Maximum number of simultaneously visible fire emitters.
 *
 * Pre-allocating this many slots at scene startup (as fixed-count THREE.Sprite
 * objects) avoids runtime GPU pipeline recompiles. Three.js includes
 * `object.uuid` in its render-object cache key, so any new THREE.Sprite or
 * InstancedMesh always causes a synchronous GPUDevice.createRenderPipeline()
 * stall. A stable, pre-allocated sprite with a fixed `count` keeps the UUID
 * constant and the pipeline hot.
 *
 * Particle motion runs entirely on the GPU via TSL node expressions driven by
 * per-particle seed buffers and per-emitter data, eliminating CPU sin/cos/lerp
 * work and JS→GPU matrix uploads.
 */
const MAX_FIRE_EMITTERS = 256
const FIRE_EMITTER_FRUSTUM_MARGIN = 1.5
const frustumSphereScratch = new THREE.Sphere()

type ActiveFireEmitter = {
  id: string
  worldX: number
  worldY: number
  worldZ: number
  scale: number
  intensity: number
  color: string
}

type EmitterBuffers = {
  posScaleBuf: ReturnType<typeof instancedArray>
  intensBuf: ReturnType<typeof instancedArray>
  colorBuf: ReturnType<typeof instancedArray>
}

function createEmitterBuffers(): EmitterBuffers {
  return {
    // x, y, z = world position; w = emitter scale (0 = inactive slot)
    posScaleBuf: instancedArray(MAX_FIRE_EMITTERS, 'vec4'),
    // per-emitter brightness multiplier (0 = inactive)
    intensBuf: instancedArray(MAX_FIRE_EMITTERS, 'float'),
    colorBuf: instancedArray(MAX_FIRE_EMITTERS, 'vec3'),
  }
}

export function FireParticleSystem({
  scopeKey,
  visibility,
}: {
  scopeKey: string
  visibility: PlayVisibility
}) {
  const { camera, invalidate } = useThree()
  const particleEffectsEnabled = useDungeonStore((state) => state.particleEffectsEnabled)
  const useLineOfSightPostMask = visibility.active
  const effectSources = useRegisteredEffectSources(scopeKey)
  const lastCameraMatrixElementsRef = useRef<Float32Array | null>(null)
  const lastProjectionMatrixElementsRef = useRef<Float32Array | null>(null)

  const [activeEmitters, setActiveEmitters] = useState<ActiveFireEmitter[]>([])

  // Shared emitter data buffers — created once, never recreated.
  const emitterBuffers = useMemo<EmitterBuffers>(() => createEmitterBuffers(), [])

  const publishEmitters = useCallback(() => {
    if (!particleEffectsEnabled) {
      setActiveEmitters((current) => (current.length === 0 ? current : []))
      return
    }

    const nextEmitters = buildActiveFireEmitters({
      effectSources,
      visibility,
      useLineOfSightPostMask,
      cameraFrustum: getCameraFrustum(camera),
      maxEmitters: MAX_FIRE_EMITTERS,
    })

    setActiveEmitters((current) => areActiveEmittersEqual(current, nextEmitters) ? current : nextEmitters)
  }, [camera, effectSources, particleEffectsEnabled, useLineOfSightPostMask, visibility])

  useEffect(() => {
    publishEmitters()
  }, [publishEmitters])

  useFrame(() => {
    if (!hasCameraChanged(camera, lastCameraMatrixElementsRef, lastProjectionMatrixElementsRef)) {
      return
    }

    publishEmitters()
  })

  // Sync emitter positions / intensities to GPU whenever the active set changes.
  useEffect(() => {
    const posArr = emitterBuffers.posScaleBuf.value.array as Float32Array
    const intArr = emitterBuffers.intensBuf.value.array as Float32Array
    const colorArr = emitterBuffers.colorBuf.value.array as Float32Array

    for (let i = 0; i < MAX_FIRE_EMITTERS; i++) {
      if (i < activeEmitters.length) {
        const em = activeEmitters[i]
        const color = new THREE.Color(em.color)
        posArr[i * 4 + 0] = em.worldX
        posArr[i * 4 + 1] = em.worldY
        posArr[i * 4 + 2] = em.worldZ
        posArr[i * 4 + 3] = em.scale
        intArr[i] = em.intensity
        colorArr[i * 3 + 0] = color.r
        colorArr[i * 3 + 1] = color.g
        colorArr[i * 3 + 2] = color.b
      } else {
        // Inactive slot: drive emitter scale to 0 so particles collapse away,
        // and park the position far off-screen as a fallback.
        posArr[i * 4 + 0] = 0
        posArr[i * 4 + 1] = -9999
        posArr[i * 4 + 2] = 0
        posArr[i * 4 + 3] = 0
        intArr[i] = 0
        colorArr[i * 3 + 0] = 1
        colorArr[i * 3 + 1] = 0.6
        colorArr[i * 3 + 2] = 0.27
      }
    }

    emitterBuffers.posScaleBuf.value.needsUpdate = true
    emitterBuffers.intensBuf.value.needsUpdate = true
    emitterBuffers.colorBuf.value.needsUpdate = true
    invalidate()
  }, [activeEmitters, emitterBuffers, invalidate])

  return (
    <>
      {FIRE_LAYERS.map((layer, layerIndex) => (
        <FireGpuLayer
          key={layerIndex}
          layer={layer}
          layerIndex={layerIndex}
          activeEmitters={activeEmitters}
          emitterBuffers={emitterBuffers}
        />
      ))}
    </>
  )
}

export function buildActiveFireEmitters({
  effectSources,
  visibility,
  useLineOfSightPostMask,
  cameraFrustum,
  maxEmitters = MAX_FIRE_EMITTERS,
}: {
  effectSources: RegisteredEffectSource[]
  visibility: Pick<PlayVisibility, 'getObjectVisibility'>
  useLineOfSightPostMask: boolean
  cameraFrustum?: THREE.Frustum
  maxEmitters?: number
}) {
  const result: ActiveFireEmitter[] = []

  for (const source of effectSources) {
    if (!shouldRenderLineOfSightLight(visibility.getObjectVisibility(source.object), useLineOfSightPostMask)) {
      continue
    }

    const [px, py, pz] = source.object.position
    const emitters = source.effect.emitters?.length ? source.effect.emitters : [{}]
    for (let emIdx = 0; emIdx < emitters.length && result.length < maxEmitters; emIdx += 1) {
      const em = emitters[emIdx]
      const [ox, oy, oz] = (em.offset ?? [0, 0, 0]) as [number, number, number]
      const worldX = px + ox
      const worldY = py + oy
      const worldZ = pz + oz
      const scale = em.scale ?? 1

      if (cameraFrustum) {
        frustumSphereScratch.center.set(worldX, worldY, worldZ)
        frustumSphereScratch.radius = scale + FIRE_EMITTER_FRUSTUM_MARGIN
        if (!cameraFrustum.intersectsSphere(frustumSphereScratch)) {
          continue
        }
      }

      result.push({
        id: `${source.object.id}:${emIdx}`,
        worldX,
        worldY,
        worldZ,
        scale,
        intensity: em.intensity ?? 1,
        color: em.color ?? '#ff9944',
      })
    }
  }

  return result
}

function areActiveEmittersEqual(left: ActiveFireEmitter[], right: ActiveFireEmitter[]) {
  if (left.length !== right.length) {
    return false
  }

  for (let index = 0; index < left.length; index += 1) {
    const leftEmitter = left[index]
    const rightEmitter = right[index]
    if (
      leftEmitter.id !== rightEmitter.id
      || leftEmitter.worldX !== rightEmitter.worldX
      || leftEmitter.worldY !== rightEmitter.worldY
      || leftEmitter.worldZ !== rightEmitter.worldZ
      || leftEmitter.scale !== rightEmitter.scale
      || leftEmitter.intensity !== rightEmitter.intensity
      || leftEmitter.color !== rightEmitter.color
    ) {
      return false
    }
  }

  return true
}

function FireGpuLayer({
  layer,
  layerIndex,
  activeEmitters,
  emitterBuffers,
}: {
  layer: ParticleLayerDefinition
  layerIndex: number
  activeEmitters: ActiveFireEmitter[]
  emitterBuffers: EmitterBuffers
}) {
  const totalCount = MAX_FIRE_EMITTERS * layer.count

  const { seedBuf1, seedBuf2, material, uTime } = useMemo(() => {
    const { posScaleBuf, intensBuf, colorBuf } = emitterBuffers

    // ── Seed buffers (per-particle, static after emitter assignment) ───────
    // seedBuf1: basePhase, speed, wobblePhase, sizeFactor
    // seedBuf2: radialAngle, radialOffset, heightFactor, swayFactor
    const seedBuf1 = instancedArray(totalCount, 'vec4')
    const seedBuf2 = instancedArray(totalCount, 'vec4')

    // ── Parse layer color constants once ─────────────────────────────────────
    new THREE.Color(layer.colorStart)
    new THREE.Color(layer.colorEnd)

    const layerCount = uint(layer.count)
    const uTime = uniform(0)

    const idx = instanceIndex
    const emIdx = idx.div(layerCount)

    const s1 = seedBuf1.element(idx) // vec4: basePhase, speed, wobblePhase, sizeFactor
    const s2 = seedBuf2.element(idx) // vec4: radialAngle, radialOffset, heightFactor, swayFactor

    const emData = posScaleBuf.element(emIdx) // vec4: x, y, z, scale
    const emIntens = intensBuf.element(emIdx) // float: intensity (0 = inactive)
    const emColor = colorBuf.element(emIdx) // vec3: emitter tint
    const emScale = emData.w

    // Life cycle: wraps [0, 1) continuously
    const life = mod(uTime.mul(s1.y).add(s1.x), 1.0)
    const fade = pow(sin(life.mul(Math.PI)), 1.35)
    const invLife = float(1).sub(life)

    // World-space offset from emitter origin
    const height = life.mul(layer.height).mul(emScale).mul(s2.z)
    const sway = invLife.mul(layer.drift).mul(emScale).mul(s2.w)
    const spiral = uTime.mul(0.9).add(s1.z)

    const lx = cos(s2.x.add(spiral.mul(0.7)))
      .mul(s2.y)
      .mul(layer.spread)
      .mul(emScale)
      .add(sin(spiral.mul(1.4)).mul(sway))

    const lz = sin(s2.x.add(spiral.mul(0.9)))
      .mul(s2.y)
      .mul(layer.spread)
      .mul(emScale)
      .add(cos(spiral.mul(1.2)).mul(sway))

    const worldPos = vec3(emData.x.add(lx), emData.y.add(height), emData.z.add(lz))

    // Billboard size (zero when emitter is inactive because emScale = 0)
    const pSize = mix(float(layer.size[0]), float(layer.size[1]), life)
      .mul(fade)
      .mul(emScale)
      .mul(s1.w)
    const worldScale = vec2(pSize, pSize.mul(float(1.15).add(life.mul(0.9))))

    const flameCore = mix(emColor, vec3(1.0, 0.96, 0.84), invLife.mul(0.18))
    const flameEdge = emColor.mul(0.72)
    const rgb = mix(flameCore, flameEdge, life)
      .mul(float(0.75).add(fade.mul(0.85)))
      .mul(emIntens)

    const mat = new THREE.SpriteNodeMaterial({
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    })
    mat.positionNode = worldPos
    mat.scaleNode = worldScale
    mat.colorNode = rgb
    mat.opacityNode = fade.mul(layer.opacity)

    return { seedBuf1, seedBuf2, material: mat, uTime }
  }, [totalCount, layer, emitterBuffers])

  // Re-upload seed data whenever emitter slot assignments change so each torch
  // keeps its visual identity even when other torches are added or removed.
  useEffect(() => {
    const s1Array = seedBuf1.value.array as Float32Array
    const s2Array = seedBuf2.value.array as Float32Array

    for (let slotIdx = 0; slotIdx < MAX_FIRE_EMITTERS; slotIdx++) {
      const emitter = activeEmitters[slotIdx]
      // Key seeds by emitter ID for visual stability; fall back to slot index.
      const seedKey = emitter ? `${emitter.id}:${layerIndex}` : `gpuslot:${slotIdx}:${layerIndex}`
      const seeds = createParticleSeeds(seedKey, layer)

      for (let pIdx = 0; pIdx < layer.count; pIdx++) {
        const i = (slotIdx * layer.count + pIdx) * 4
        s1Array[i + 0] = seeds[pIdx].basePhase
        s1Array[i + 1] = seeds[pIdx].speed
        s1Array[i + 2] = seeds[pIdx].wobblePhase
        s1Array[i + 3] = seeds[pIdx].size
        s2Array[i + 0] = seeds[pIdx].radialAngle
        s2Array[i + 1] = seeds[pIdx].radialOffset
        s2Array[i + 2] = seeds[pIdx].height
        s2Array[i + 3] = seeds[pIdx].sway
      }
    }

    seedBuf1.value.needsUpdate = true
    seedBuf2.value.needsUpdate = true
  }, [activeEmitters, seedBuf1, seedBuf2, layer, layerIndex])

  useFrame(({ clock }) => {
    uTime.value = clock.elapsedTime
  })

  const spriteRef = useRef<THREE.Sprite>(null)

  return (
    <sprite
      ref={spriteRef}
      // @ts-expect-error: THREE.Sprite.count is supported by the WebGPU renderer
      // supported by the WebGPU renderer to drive the instance draw count.
      count={totalCount}
      frustumCulled={false}
      renderOrder={12}
      material={material}
    />
  )
}
