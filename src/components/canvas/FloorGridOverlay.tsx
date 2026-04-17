import { useMemo } from 'react'
import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
  abs,
  float,
  fract,
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
import { GRID_SIZE } from '../../hooks/useSnapToGrid'

const GRID_Y = 0.01
const GRID_POLYGON_OFFSET_FACTOR = -2
const GRID_POLYGON_OFFSET_UNITS = -2

type Props = {
  size?: number
  showBase?: boolean
}

export function FloorGridOverlay({ size = 120, showBase = true }: Props) {
  // ── Base grid material (full-coverage plane) ─────────────────────────────
  // Dark grid lines everywhere + extra-thick axis lines at X=0 / Z=0.
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
      polygonOffset: true,
      polygonOffsetFactor: GRID_POLYGON_OFFSET_FACTOR,
      polygonOffsetUnits: GRID_POLYGON_OFFSET_UNITS,
    })
    mat.colorNode = vec4(lineColor.x, lineColor.y, lineColor.z, alpha)
    return mat
  }, [])

  // ── Geometry ─────────────────────────────────────────────────────────────
  const fullGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [size])

  return (
    <>
      {/* Full-coverage base: dark grid + thick axes */}
      {showBase && (
        <mesh
          geometry={fullGeo}
          material={baseMat as unknown as THREE.Material}
          position={[0, GRID_Y, 0]}
          renderOrder={1}
          frustumCulled={false}
        />
      )}
    </>
  )
}
