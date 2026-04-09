import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
  float,
  fract,
  length,
  min,
  positionWorld,
  smoothstep,
  uniform,
  vec2,
  vec4,
} from 'three/tsl'
import { useDungeonStore } from '../../store/useDungeonStore'
import { GRID_SIZE, cellToWorldPosition } from '../../hooks/useSnapToGrid'

const MAX_INSTANCES = 4096
const OVERLAY_Y = 0.15

type Props = {
  /** XZ world-space cursor position — updated via pointer move */
  centerRef: React.MutableRefObject<THREE.Vector2>
  /** Reveal radius in world units (use a very large value to show all cells) */
  radius?: number
  /** Opacity of grid lines, 0–1 */
  opacity?: number
}

export function FloorGridOverlay({ centerRef, radius = 3.5, opacity = 0.6 }: Props) {
  const paintedCells = useDungeonStore((state) => state.paintedCells)
  const cells = useMemo(() => Object.values(paintedCells), [paintedCells])

  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Flat plane geometry — pre-rotated to lie on the XZ plane
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [])

  // TSL material — created once, updated via uniforms
  const { material, mousePosU, revealRadiusU, lineOpacityU } = useMemo(() => {
    const gridSizeU      = uniform(GRID_SIZE)
    const lineWidthU     = uniform(0.055)
    const lineOpacityU_  = uniform(opacity)
    const mousePosU_     = uniform(new THREE.Vector2(0, 0))
    const revealRadiusU_ = uniform(radius)

    // World-space XZ of this fragment
    const worldXZ = vec2(positionWorld.x, positionWorld.z)

    // Grid lines: distance from nearest cell edge on each axis
    const cellUV     = fract(worldXZ.div(gridSizeU))
    const distToEdge = min(cellUV, cellUV.oneMinus())
    const minDist    = distToEdge.x.min(distToEdge.y)
    const onLine     = float(1).sub(
      smoothstep(lineWidthU, lineWidthU.add(float(0.01)), minDist),
    )

    // Soft radial reveal around cursor position
    const mouseDist  = length(worldXZ.sub(mousePosU_))
    const radialMask = float(1).sub(
      smoothstep(revealRadiusU_.mul(float(0.7)), revealRadiusU_, mouseDist),
    )

    const alpha = onLine.mul(radialMask).mul(lineOpacityU_)

    const mat = new MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    })
    // colorNode with alpha in w component — MeshBasicNodeMaterial respects vec4 alpha when transparent
    mat.colorNode = vec4(float(0.88), float(0.74), float(0.48), alpha)

    return {
      material: mat,
      mousePosU: mousePosU_,
      revealRadiusU: revealRadiusU_,
      lineOpacityU: lineOpacityU_,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync prop changes to uniforms
  useEffect(() => { revealRadiusU.value = radius }, [radius, revealRadiusU])
  useEffect(() => { lineOpacityU.value = opacity }, [opacity, lineOpacityU])

  // Rebuild instance matrices whenever painted cells change
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    cells.forEach((cell, i) => {
      const [x, , z] = cellToWorldPosition(cell)
      dummy.position.set(x, OVERLAY_Y, z)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.count = cells.length
    mesh.instanceMatrix.needsUpdate = true
  }, [cells, dummy])

  // Push cursor position into the shader every frame — zero React overhead
  useFrame(() => {
    mousePosU.value.copy(centerRef.current)
  })

  if (cells.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material as unknown as THREE.Material, MAX_INSTANCES]}
      frustumCulled={false}
      renderOrder={1}
    />
  )
}
