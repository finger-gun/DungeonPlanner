import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useDungeonStore } from '../../store/useDungeonStore'
import { getKeyboardPanAmount, getKeyboardRotateAmount } from './keyboardCameraMath'

const TRACKED_KEYS = new Set([
  'w', 'a', 's', 'd',
  'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
  'q', 'e',
])

// Fixed world-space cardinal directions for straight-down (top-down) camera
const WORLD_FORWARD = new THREE.Vector3(0, 0, -1)
const WORLD_RIGHT   = new THREE.Vector3(1, 0, 0)
const WORLD_UP      = new THREE.Vector3(0, 1, 0)

function KeyboardCameraControls() {
  const pressedKeys = useRef(new Set<string>())
  const forwardScratchRef = useRef(new THREE.Vector3())
  const rightScratchRef = useRef(new THREE.Vector3())
  const deltaScratchRef = useRef(new THREE.Vector3())
  const offsetScratchRef = useRef(new THREE.Vector3())
  const { camera, invalidate } = useThree()
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
        invalidate()
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
  }, [invalidate])

  useEffect(() => {
    if (isPaintingStrokeActive || isObjectDragActive) {
      clearPressedKeys()
    }
  }, [isObjectDragActive, isPaintingStrokeActive])

  useFrame((state, deltaSeconds) => {
    if (isPaintingStrokeActive || isObjectDragActive) return
    const keys = pressedKeys.current
    if (keys.size === 0) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orbitControls = state.controls as any
    if (!orbitControls?.target) return

    const target   = orbitControls.target as THREE.Vector3
    const distance = camera.position.distanceTo(target)
    const speed    = getKeyboardPanAmount(distance, deltaSeconds)

    let forward: THREE.Vector3
    let right: THREE.Vector3

    if (activeCameraMode === 'top-down') {
      // Camera is directly above — forward vector degenerates to zero, use world cardinals
      forward = WORLD_FORWARD
      right   = WORLD_RIGHT
    } else {
      const forwardRaw = forwardScratchRef.current
        .subVectors(target, camera.position)
        .setY(0)
      if (forwardRaw.lengthSq() < 0.0001) return
      forward = forwardRaw.normalize()
      right = rightScratchRef.current
        .crossVectors(forward, WORLD_UP)
        .normalize()
    }

    const delta = deltaScratchRef.current.set(0, 0, 0)
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
      const angle = keys.has('q')
        ? getKeyboardRotateAmount(deltaSeconds)
        : -getKeyboardRotateAmount(deltaSeconds)
      const offset = offsetScratchRef.current.subVectors(camera.position, target)
      offset.applyAxisAngle(WORLD_UP, angle)
      camera.position.copy(target).add(offset)
    }

    orbitControls.update()
    invalidate()
  })

  return null
}

export function Controls() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const cameraMode = useDungeonStore((state) => state.cameraMode)
  const isPaintingStrokeActive = useDungeonStore(
    (state) => state.isPaintingStrokeActive,
  )
  const isObjectDragActive = useDungeonStore((state) => state.isObjectDragActive)
  const activeCameraMode = useDungeonStore((state) => state.activeCameraMode)
  const isPerspective = activeCameraMode === 'perspective'
  const isOrthographic =
    activeCameraMode === 'isometric'
    || activeCameraMode === 'top-down'
    || activeCameraMode === 'classic'

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
        // Distance constraints for perspective; zoom constraints for orthographic presets
        {...(isOrthographic
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
