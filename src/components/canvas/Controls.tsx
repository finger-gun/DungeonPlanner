import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useDungeonStore } from '../../store/useDungeonStore'
import { registerDebugCameraPoseReader, registerDebugWorldProjector } from './debugCameraBridge'
import { easePlayerCameraFocusProgress, getPlayerCameraFocusPoint } from './playerCameraFocus'

const PAN_SPEED = 0.006
const ROTATE_SPEED = 0.025
const PLAYER_LOOK_AT_ANIMATION_DURATION = 0.42

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
  const isObjectDragActive = useDungeonStore((state) => state.isObjectDragActive)
  const activeCameraMode = useDungeonStore((state) => state.activeCameraMode)

  function clearPressedKeys() {
    pressedKeys.current.clear()
  }

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
    const onWindowBlur = () => {
      clearPressedKeys()
    }
    const onVisibilityChange = () => {
      if (document.hidden) {
        clearPressedKeys()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onWindowBlur)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      clearPressedKeys()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onWindowBlur)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (isPaintingStrokeActive || isObjectDragActive) {
      clearPressedKeys()
    }
  }, [isObjectDragActive, isPaintingStrokeActive])

  useFrame((state) => {
    if (isPaintingStrokeActive || isObjectDragActive) return
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

export function Controls() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const playerFocusStartRef = useRef(new THREE.Vector3())
  const playerFocusTargetRef = useRef(new THREE.Vector3())
  const playerFocusElapsedRef = useRef(0)
  const playerFocusAnimationActiveRef = useRef(false)
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const invalidate = useThree((state) => state.invalidate)
  const cameraMode = useDungeonStore((state) => state.cameraMode)
  const isPaintingStrokeActive = useDungeonStore(
    (state) => state.isPaintingStrokeActive,
  )
  const isObjectDragActive = useDungeonStore((state) => state.isObjectDragActive)
  const activeCameraMode = useDungeonStore((state) => state.activeCameraMode)
  const selection = useDungeonStore((state) => state.selection)
  const selectedPlayer = useDungeonStore((state) => {
    if (!selection) {
      return null
    }

    const selectedObject = state.placedObjects[selection]
    return selectedObject?.type === 'player' ? selectedObject : null
  })
  const selectedPlayerSize = useDungeonStore((state) =>
    selectedPlayer?.assetId
      ? (state.generatedCharacters[selectedPlayer.assetId]?.size ?? null)
      : null,
  )

  const isPerspective = activeCameraMode === 'perspective'
  const isTopDown     = activeCameraMode === 'top-down'
  const selectedPlayerId = selectedPlayer?.id ?? null
  const selectedPlayerPositionX = selectedPlayer?.position[0] ?? null
  const selectedPlayerPositionY = selectedPlayer?.position[1] ?? null
  const selectedPlayerPositionZ = selectedPlayer?.position[2] ?? null

  useEffect(() => {
    if (!isPerspective || !selectedPlayer || isObjectDragActive) {
      if (!isObjectDragActive) {
        playerFocusAnimationActiveRef.current = false
      }
      return
    }

    const orbitControls = controlsRef.current
    if (!orbitControls) {
      return
    }

    const focusPoint = getPlayerCameraFocusPoint(
      selectedPlayer.position,
      selectedPlayerSize ? { size: selectedPlayerSize } : null,
    )

    playerFocusStartRef.current.copy(orbitControls.target)
    playerFocusTargetRef.current.set(focusPoint.x, focusPoint.y, focusPoint.z)
    playerFocusElapsedRef.current = 0
    playerFocusAnimationActiveRef.current = true
    invalidate()
  }, [
    invalidate,
    isPerspective,
    isObjectDragActive,
    selectedPlayer,
    selectedPlayerId,
    selectedPlayerPositionX,
    selectedPlayerPositionY,
    selectedPlayerPositionZ,
    selectedPlayerSize,
  ])

  useFrame((_, delta) => {
    if (!isPerspective || isObjectDragActive || !playerFocusAnimationActiveRef.current) {
      return
    }

    const orbitControls = controlsRef.current
    if (!orbitControls) {
      return
    }

    playerFocusElapsedRef.current += Math.max(delta, 0)
    const rawProgress = PLAYER_LOOK_AT_ANIMATION_DURATION <= 0
      ? 1
      : Math.min(playerFocusElapsedRef.current / PLAYER_LOOK_AT_ANIMATION_DURATION, 1)
    const easedProgress = easePlayerCameraFocusProgress(rawProgress)

    orbitControls.target.lerpVectors(
      playerFocusStartRef.current,
      playerFocusTargetRef.current,
      easedProgress,
    )

    if (rawProgress >= 1) {
      orbitControls.target.copy(playerFocusTargetRef.current)
      playerFocusAnimationActiveRef.current = false
    }

    orbitControls.update()
    invalidate()
  })

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }

    registerDebugCameraPoseReader(() => {
      const target = controlsRef.current?.target ?? new THREE.Vector3()

      return {
        position: [camera.position.x, camera.position.y, camera.position.z] as const,
        target: [target.x, target.y, target.z] as const,
      }
    })
    registerDebugWorldProjector((point) => {
      const vector = new THREE.Vector3(point[0], point[1], point[2]).project(camera)
      const rect = gl.domElement.getBoundingClientRect()
      return {
        x: rect.left + ((vector.x + 1) * 0.5 * rect.width),
        y: rect.top + ((1 - vector.y) * 0.5 * rect.height),
      }
    })

    return () => {
      registerDebugCameraPoseReader(null)
      registerDebugWorldProjector(null)
    }
  }, [camera, gl])

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={cameraMode === 'orbit' && !isPaintingStrokeActive && !isObjectDragActive}
        enableRotate={isPerspective}
        enablePan
        enableDamping
        dampingFactor={0.08}
        // Distance constraints for perspective/iso; zoom constraints for ortho top-down
        {...(isTopDown
          ? { minZoom: 0.15, maxZoom: 8 }
          : { minDistance: 5, maxDistance: 48 }
        )}
        maxPolarAngle={isPerspective ? Math.PI / 2.05 : undefined}
        target={[0, 0, 0]}
      />
      <KeyboardCameraControls />
    </>
  )
}
