import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useDungeonStore } from '../../store/useDungeonStore'
import { useMultiplayerStore, useIsDM } from '../../multiplayer/useMultiplayerStore'
import type { EntitySnapshot } from '../../multiplayer/useMultiplayerStore'
import { GRID_SIZE } from '../../hooks/useSnapToGrid'

const PAN_SPEED = 0.006
const ROTATE_SPEED = 0.025

const TRACKED_KEYS = new Set([
  'w', 'a', 's', 'd',
  'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
  'q', 'e',
])

// Fixed world-space cardinal directions for straight-down (top-down) camera
const WORLD_FORWARD = new THREE.Vector3(0, 0, -1)
const WORLD_RIGHT   = new THREE.Vector3(1, 0, 0)

function KeyboardCameraControls() {
  const pressedKeys = useRef(new Set<string>())
  const { camera } = useThree()
  const isPaintingStrokeActive = useDungeonStore(
    (state) => state.isPaintingStrokeActive,
  )
  const activeCameraMode = useDungeonStore((state) => state.activeCameraMode)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable)
      ) return
      const key = e.key.toLowerCase()
      if (TRACKED_KEYS.has(key)) {
        e.preventDefault()
        pressedKeys.current.add(key)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      pressedKeys.current.delete(e.key.toLowerCase())
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useFrame((state) => {
    if (isPaintingStrokeActive) return
    const keys = pressedKeys.current
    if (keys.size === 0) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orbitControls = state.controls as any
    if (!orbitControls?.target) return

    const target   = orbitControls.target as THREE.Vector3
    const distance = camera.position.distanceTo(target)
    const speed    = distance * PAN_SPEED

    let forward: THREE.Vector3
    let right: THREE.Vector3

    if (activeCameraMode === 'top-down') {
      // Camera is directly above — forward vector degenerates to zero, use world cardinals
      forward = WORLD_FORWARD
      right   = WORLD_RIGHT
    } else {
      const forwardRaw = new THREE.Vector3()
        .subVectors(target, camera.position)
        .setY(0)
      if (forwardRaw.lengthSq() < 0.0001) return
      forward = forwardRaw.normalize()
      right = new THREE.Vector3()
        .crossVectors(forward, new THREE.Vector3(0, 1, 0))
        .normalize()
    }

    const delta = new THREE.Vector3()
    if (keys.has('w') || keys.has('arrowup'))    delta.addScaledVector(forward,  speed)
    if (keys.has('s') || keys.has('arrowdown'))  delta.addScaledVector(forward, -speed)
    if (keys.has('d') || keys.has('arrowright')) delta.addScaledVector(right,    speed)
    if (keys.has('a') || keys.has('arrowleft'))  delta.addScaledVector(right,   -speed)

    if (delta.lengthSq() > 0) {
      camera.position.add(delta)
      target.add(delta)
    }

    // Q/E orbital rotation only in perspective mode
    if (activeCameraMode === 'perspective' && (keys.has('q') || keys.has('e'))) {
      const angle = keys.has('q') ? ROTATE_SPEED : -ROTATE_SPEED
      const offset = new THREE.Vector3().subVectors(camera.position, target)
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)
      camera.position.copy(target).add(offset)
    }

    orbitControls.update()
  })

  return null
}

type PanLimits = { minX: number; maxX: number; minZ: number; maxZ: number } | null

/** Derive pan limits from party PLAYER entity positions */
function buildPanLimits(entities: Record<string, EntitySnapshot>, padding: number): PanLimits {
  const players = Object.values(entities).filter((e) => e.type === 'PLAYER')
  if (players.length === 0) return null
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
  for (const e of players) {
    minX = Math.min(minX, e.worldX); maxX = Math.max(maxX, e.worldX)
    minZ = Math.min(minZ, e.worldZ); maxZ = Math.max(maxZ, e.worldZ)
  }
  return {
    minX: minX - padding, maxX: maxX + padding,
    minZ: minZ - padding, maxZ: maxZ + padding,
  }
}

/** Clamps OrbitControls target to party bounding box each frame (players only). */
function PlayerCameraClamp({ panLimits }: { panLimits: PanLimits }) {
  useFrame((state) => {
    if (!panLimits) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const controls = state.controls as any
    if (!controls?.target) return
    const t = controls.target as THREE.Vector3
    const cx = Math.max(panLimits.minX, Math.min(panLimits.maxX, t.x))
    const cz = Math.max(panLimits.minZ, Math.min(panLimits.maxZ, t.z))
    if (cx !== t.x || cz !== t.z) {
      const delta = new THREE.Vector3(cx - t.x, 0, cz - t.z)
      t.set(cx, t.y, cz)
      state.camera.position.add(delta)
      controls.update()
    }
  })
  return null
}

export function Controls() {
  const cameraMode = useDungeonStore((state) => state.cameraMode)
  const isPaintingStrokeActive = useDungeonStore(
    (state) => state.isPaintingStrokeActive,
  )
  const activeCameraMode = useDungeonStore((state) => state.activeCameraMode)
  const isDM     = useIsDM()
  const entities = useMultiplayerStore((s) => s.entities)

  const PLAYER_PAN_PADDING = GRID_SIZE * 8
  const panLimits = useMemo(
    () => isDM ? null : buildPanLimits(entities, PLAYER_PAN_PADDING),
    [isDM, entities, PLAYER_PAN_PADDING],
  )

  // Player clients are locked to top-down view
  const isPerspective = isDM && activeCameraMode === 'perspective'

  return (
    <>
      <OrbitControls
        makeDefault
        enabled={(isDM ? cameraMode === 'orbit' : true) && !isPaintingStrokeActive}
        enableRotate={isPerspective}
        enablePan={isDM}
        enableDamping
        dampingFactor={0.08}
        {...(isPerspective
          ? { minDistance: 5, maxDistance: isDM ? 48 : 32 }
          : { minZoom: 0.15, maxZoom: isDM ? 8 : 4 }
        )}
        maxPolarAngle={isPerspective ? Math.PI / 2.05 : 0.001}
        target={[0, 0, 0]}
      />
      <KeyboardCameraControls />
      {!isDM && <PlayerCameraClamp panLimits={panLimits} />}
    </>
  )
}
