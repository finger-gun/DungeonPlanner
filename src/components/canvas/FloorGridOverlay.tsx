import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
  abs,
  float,
  fract,
  length,
  max,
  min,
  mix,
  positionWorld,
  smoothstep,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl'
import { useDungeonStore } from '../../store/useDungeonStore'
import { GRID_SIZE, cellToWorldPosition } from '../../hooks/useSnapToGrid'

// Just above the tallest floor tile model (~0.244 measured).
// depthTest:true at this height → test passes on floor tiles AND in empty void,
// but tall geometry (walls, props) occludes the grid.
const GRID_Y = 0.270

const MAX_INSTANCES = 4096

type Props = {
  centerRef: React.MutableRefObject<THREE.Vector2>
  size?: number
  radius?: number
}

export function FloorGridOverlay({ centerRef, size = 120, radius = 10 }: Props) {
  const paintedCells = useDungeonStore((state) => state.paintedCells)
  const layers       = useDungeonStore((state) => state.layers)

  const cells = useMemo(
    () =>
      Object.values(paintedCells)
        .filter((r) => layers[r.layerId]?.visible !== false)
        .map((r) => r.cell),
    [paintedCells, layers],
  )

  // ── Base grid material (full-coverage plane) ─────────────────────────────
  // Dark grid lines everywhere + extra-thick axis lines at X=0 / Z=0.
  // No cursor glow — that lives on the instanced layer below.
  const baseMat = useMemo(() => {
    const gridSizeU  = uniform(GRID_SIZE)
    const lineWidthU = uniform(0.022)   // fraction of cell size
    const axisWidthU = uniform(0.09)    // world-space half-width of X=0 / Z=0 lines

    const worldXZ = vec2(positionWorld.x, positionWorld.z)

    // Regular grid lines (edge detection in cell UV space)
    const cellUV     = fract(worldXZ.div(gridSizeU))
    const distToEdge = min(cellUV, cellUV.oneMinus())
    const minDist    = distToEdge.x.min(distToEdge.y)
    const gridMask   = float(1.0).sub(
      smoothstep(lineWidthU.mul(float(0.4)), lineWidthU, minDist),
    )

    // Thick axis lines in world space
    const onAxisX = float(1.0).sub(
      smoothstep(axisWidthU.mul(float(0.3)), axisWidthU, abs(positionWorld.x)),
    )
    const onAxisZ = float(1.0).sub(
      smoothstep(axisWidthU.mul(float(0.3)), axisWidthU, abs(positionWorld.z)),
    )
    const axisMask = onAxisX.max(onAxisZ)

    // Colors: dim for regular lines, brighter warm for axis
    const gridColor  = vec3(float(0.165), float(0.149), float(0.129)) // #2a2621
    const axisColor  = vec3(float(0.28),  float(0.23),  float(0.17))  // lighter warm
    const lineColor  = mix(gridColor, axisColor, axisMask)

    const gridAlpha  = gridMask.mul(float(0.18))
    const axisAlpha  = axisMask.mul(float(0.28))
    const alpha      = max(gridAlpha, axisAlpha)

    const mat = new MeshBasicNodeMaterial({
      transparent: true,
      depthWrite:  false,
      depthTest:   true,
      side: THREE.DoubleSide,
    })
    mat.colorNode = vec4(lineColor.x, lineColor.y, lineColor.z, alpha)
    return mat
  }, [])

  // ── Cursor-glow material (instanced, per painted cell) ───────────────────
  // Warm amber brightening that follows the cursor — only where floor tiles exist.
  const { glowMat, mousePosU, revealRadiusU } = useMemo(() => {
    const mPos = uniform(new THREE.Vector2(0, 0))
    const rRad = uniform(10.0)

    const gridSizeU  = uniform(GRID_SIZE)
    const lineWidthU = uniform(0.022)

    const worldXZ    = vec2(positionWorld.x, positionWorld.z)
    const cellUV     = fract(worldXZ.div(gridSizeU))
    const distToEdge = min(cellUV, cellUV.oneMinus())
    const minDist    = distToEdge.x.min(distToEdge.y)
    const gridMask   = float(1.0).sub(
      smoothstep(lineWidthU.mul(float(0.4)), lineWidthU, minDist),
    )

    const dist   = length(worldXZ.sub(mPos))
    const reveal = float(1.0).sub(
      smoothstep(rRad.mul(float(0.55)), rRad, dist),
    )

    const nearColor = vec3(float(0.42), float(0.34), float(0.22))
    const alpha     = gridMask.mul(reveal).mul(float(0.18))

    const mat = new MeshBasicNodeMaterial({
      transparent: true,
      depthWrite:  false,
      depthTest:   true,
      side: THREE.DoubleSide,
    })
    mat.colorNode = vec4(nearColor.x, nearColor.y, nearColor.z, alpha)
    return { glowMat: mat, mousePosU: mPos, revealRadiusU: rRad }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { revealRadiusU.value = radius }, [radius, revealRadiusU])

  // ── Geometry ─────────────────────────────────────────────────────────────
  const fullGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [size])

  const cellGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [])

  // ── Instance matrices for glow tiles ─────────────────────────────────────
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy   = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    cells.forEach((cell, i) => {
      const [x, , z] = cellToWorldPosition(cell)
      dummy.position.set(x, GRID_Y, z)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.count = cells.length
    mesh.instanceMatrix.needsUpdate = true
  }, [cells, dummy])

  useFrame(() => { mousePosU.value.copy(centerRef.current) })

  return (
    <>
      {/* Full-coverage base: dark grid + thick axes */}
      <mesh
        geometry={fullGeo}
        material={baseMat as unknown as THREE.Material}
        position={[0, GRID_Y, 0]}
        renderOrder={1}
        frustumCulled={false}
      />
      {/* Cursor glow: only on painted floor cells, renders on top of base */}
      {cells.length > 0 && (
        <instancedMesh
          ref={meshRef}
          args={[cellGeo, glowMat as unknown as THREE.Material, MAX_INSTANCES]}
          frustumCulled={false}
          renderOrder={2}
        />
      )}
    </>
  )
}
