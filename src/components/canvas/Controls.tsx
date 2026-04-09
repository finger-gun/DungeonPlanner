import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useDungeonStore } from '../../store/useDungeonStore'

const PAN_SPEED = 0.006
const ROTATE_SPEED = 0.025

const TRACKED_KEYS = new Set([
  'w', 'a', 's', 'd',
  'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
  'q', 'e',
])

function KeyboardCameraControls() {
  const pressedKeys = useRef(new Set<string>())
  const { camera, controls } = useThree()
  const isPaintingStrokeActive = useDungeonStore(
    (state) => state.isPaintingStrokeActive,
  )
  const activeCameraMode = useDungeonStore((state) => state.activeCameraMode)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
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

  useFrame(() => {
    if (isPaintingStrokeActive) return
    const keys = pressedKeys.current
    if (keys.size === 0) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orbitControls = controls as any
    if (!orbitControls?.target) return

    const target = orbitControls.target as THREE.Vector3
    const distance = camera.position.distanceTo(target)
    const speed = distance * PAN_SPEED

    const forward = new THREE.Vector3()
      .subVectors(target, camera.position)
      .setY(0)
      .normalize()
    const right = new THREE.Vector3()
      .crossVectors(forward, new THREE.Vector3(0, 1, 0))
      .normalize()

    const delta = new THREE.Vector3()
    if (keys.has('w') || keys.has('arrowup'))    delta.addScaledVector(forward,  speed)
    if (keys.has('s') || keys.has('arrowdown'))  delta.addScaledVector(forward, -speed)
    if (keys.has('d') || keys.has('arrowright')) delta.addScaledVector(right,    speed)
    if (keys.has('a') || keys.has('arrowleft'))  delta.addScaledVector(right,   -speed)

    if (delta.lengthSq() > 0) {
      camera.position.add(delta)
      target.add(delta)
    }

    // Q/E rotation only in perspective mode
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
  const cameraMode = useDungeonStore((state) => state.cameraMode)
  const isPaintingStrokeActive = useDungeonStore(
    (state) => state.isPaintingStrokeActive,
  )
  const activeCameraMode = useDungeonStore((state) => state.activeCameraMode)

  const isPerspective = activeCameraMode === 'perspective'

  return (
    <>
      <OrbitControls
        makeDefault
        enabled={cameraMode === 'orbit' && !isPaintingStrokeActive}
        enableRotate={isPerspective}
        enablePan
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={48}
        maxPolarAngle={isPerspective ? Math.PI / 2.05 : undefined}
        target={[0, 0, 0]}
      />
      <KeyboardCameraControls />
    </>
  )
}
