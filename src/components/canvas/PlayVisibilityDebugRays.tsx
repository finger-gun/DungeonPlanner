import { useMemo } from 'react'
import * as THREE from 'three'
import type { PlayVisibilityMask } from './playVisibility'

const RAY_Y = 0.38
const ORIGIN_Y = 0.44

export function PlayVisibilityDebugRays({ mask }: { mask: PlayVisibilityMask }) {
  const rayPositions = useMemo(() => {
    const positions: number[] = []

    for (const source of mask.sources) {
      for (const point of source.polygon) {
        positions.push(
          source.origin[0], RAY_Y, source.origin[1],
          point[0], RAY_Y, point[1],
        )
      }
    }

    return new Float32Array(positions)
  }, [mask.sources])

  const originPositions = useMemo(() => {
    const positions = mask.sources.flatMap((source) => [
      source.origin[0], ORIGIN_Y, source.origin[1],
    ])
    return new Float32Array(positions)
  }, [mask.sources])

  if (rayPositions.length === 0) {
    return null
  }

  return (
    <group renderOrder={200}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[rayPositions, 3]}
            count={rayPositions.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#facc15"
          transparent
          opacity={0.35}
          depthTest={false}
          toneMapped={false}
        />
      </lineSegments>

      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[originPositions, 3]}
            count={originPositions.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color={new THREE.Color('#f59e0b')}
          size={0.12}
          sizeAttenuation
          depthTest={false}
          transparent
          opacity={0.95}
          toneMapped={false}
        />
      </points>
    </group>
  )
}
