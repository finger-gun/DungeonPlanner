import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import {
  getRuntimePropLightingDebugEntries,
  useRuntimePropLightingCacheVersion,
  type RuntimePropLightingDebugEntry,
} from '../../rendering/propLightingCache'

const boxCenterScratch = new THREE.Vector3()
const boxSizeScratch = new THREE.Vector3()
const directionOriginScratch = new THREE.Vector3()
const directionTipScratch = new THREE.Vector3()
const noRaycast: THREE.Object3D['raycast'] = () => {}

export function PropProbeDebugOverlay({ floorId }: { floorId: string }) {
  useRuntimePropLightingCacheVersion()
  const entries = getRuntimePropLightingDebugEntries(floorId)

  if (entries.length === 0) {
    return null
  }

  return (
    <group renderOrder={40}>
      {entries.map((entry) => (
        <PropProbeDebugEntry key={entry.instanceKey} entry={entry} />
      ))}
    </group>
  )
}

function PropProbeDebugEntry({ entry }: { entry: RuntimePropLightingDebugEntry }) {
  const overlay = useMemo(() => {
    const center = entry.worldBounds.getCenter(boxCenterScratch.clone())
    const size = entry.worldBounds.getSize(boxSizeScratch.clone())
    const directionOrigin = directionOriginScratch
      .set(center.x, (entry.probe.baseY + entry.probe.topY) * 0.5, center.z)
      .clone()
    const directionLength = 0.28 + entry.probe.directionalStrength * 0.82
    const directionTip = directionTipScratch
      .set(...entry.probe.lightDirection)
      .normalize()
      .multiplyScalar(directionLength)
      .add(directionOrigin)
      .clone()

    return {
      boundsCenter: center.toArray() as [number, number, number],
      boundsSize: [
        Math.max(size.x, 0.04),
        Math.max(size.y, 0.04),
        Math.max(size.z, 0.04),
      ] as [number, number, number],
      basePosition: [center.x, entry.probe.baseY, center.z] as [number, number, number],
      topPosition: [center.x, entry.probe.topY, center.z] as [number, number, number],
      directionPoints: [
        directionOrigin.toArray() as [number, number, number],
        directionTip.toArray() as [number, number, number],
      ] as const,
      baseColor: buildProbeColor(entry.probe.baseLight),
      topColor: buildProbeColor(entry.probe.topLight),
    }
  }, [entry])

  return (
    <group>
      <mesh
        position={overlay.boundsCenter}
        renderOrder={40}
        raycast={noRaycast}
      >
        <boxGeometry args={overlay.boundsSize} />
        <meshBasicMaterial
          color="#22d3ee"
          wireframe
          transparent
          opacity={0.45}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <DebugLine
        points={[overlay.basePosition, overlay.topPosition]}
        color="#38bdf8"
      />
      <DebugLine
        points={overlay.directionPoints}
        color="#fbbf24"
      />
      <mesh position={overlay.basePosition} renderOrder={40} raycast={noRaycast}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color={overlay.baseColor} depthWrite={false} depthTest={false} />
      </mesh>
      <mesh position={overlay.topPosition} renderOrder={40} raycast={noRaycast}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color={overlay.topColor} depthWrite={false} depthTest={false} />
      </mesh>
    </group>
  )
}

function DebugLine({
  points,
  color,
}: {
  points: readonly [readonly [number, number, number], readonly [number, number, number]]
  color: string
}) {
  const geometry = useMemo(
    () => {
      const lineGeometry = new THREE.BufferGeometry()
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points.flat()), 3))
      return lineGeometry
    },
    [points],
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <lineSegments geometry={geometry} renderOrder={40} raycast={noRaycast}>
      <lineBasicMaterial color={color} transparent opacity={0.95} depthWrite={false} depthTest={false} />
    </lineSegments>
  )
}

function buildProbeColor(sample: readonly [number, number, number]) {
  return new THREE.Color(
    clamp01(sample[0] * 1.2),
    clamp01(sample[1] * 1.2),
    clamp01(sample[2] * 1.2),
  )
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}
