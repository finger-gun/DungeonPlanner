/**
 * Renders a ground-plane hole + dark pit for every StaircaseDown prop.
 *
 * The staircase model (staircase.glb) has PIVOT_OFFSET [-1,0,-1] and an
 * intrinsic Y=PI rotation, so for a prop at cell [cx,cz] the visual footprint
 * extends in the -X and -Z direction from the cell corner:
 *   X: [cx*GRID_SIZE - HOLE_W, cx*GRID_SIZE]
 *   Z: [cz*GRID_SIZE - HOLE_D, cz*GRID_SIZE]
 *
 * Adjust HOLE_OFFSET_X / HOLE_OFFSET_Z if the hole needs to shift.
 */
import { useMemo } from 'react'
import * as THREE from 'three'
import { GRID_SIZE } from '../../hooks/useSnapToGrid'

// World-unit dimensions of the opening
export const STAIRCASE_HOLE_W = 2  // width  (X axis)
export const STAIRCASE_HOLE_D = 4  // depth  (Z axis)

// Offset of the hole corner relative to the placed cell corner (cx*G, cz*G).
// Positive = toward +X/+Z, negative = toward -X/-Z.
const HOLE_OFFSET_X = 0
const HOLE_OFFSET_Z = 0

const PIT_DEPTH = 12

/**
 * Returns the cells blocked by a staircase-down placed at [cx, cz].
 * These cells should NOT render floor tiles.
 */
export function getStaircaseDownBlockedCells(cx: number, cz: number, ry = 0): [number, number][] {
  // Corners of the hole in world XZ, before rotation
  const hx = cx * GRID_SIZE + HOLE_OFFSET_X
  const hz = cz * GRID_SIZE + HOLE_OFFSET_Z

  // Centre of the hole rectangle
  const holeCx = hx + STAIRCASE_HOLE_W / 2
  const holeCz = hz + STAIRCASE_HOLE_D / 2

  // Rotate the four corners around the hole centre and collect cells
  const hw = STAIRCASE_HOLE_W / 2
  const hd = STAIRCASE_HOLE_D / 2
  const cos = Math.cos(ry)
  const sin = Math.sin(ry)

  function rotXZ(lx: number, lz: number): [number, number] {
    return [holeCx + lx * cos - lz * sin, holeCz + lx * sin + lz * cos]
  }

  const corners = [
    rotXZ(-hw, -hd), rotXZ(hw, -hd),
    rotXZ(hw,  hd), rotXZ(-hw,  hd),
  ]

  // Axis-aligned bounding box of rotated corners → conservative cell set
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
  for (const [x, z] of corners) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x)
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z)
  }

  const cells: [number, number][] = []
  for (let x = Math.floor(minX / GRID_SIZE); x <= Math.floor((maxX - 0.01) / GRID_SIZE); x++) {
    for (let z = Math.floor(minZ / GRID_SIZE); z <= Math.floor((maxZ - 0.01) / GRID_SIZE); z++) {
      cells.push([x, z])
    }
  }
  return cells
}

type HoleRect = { hx: number; hz: number; ry: number }

/**
 * Given a list of staircase-down objects, compute the hole rectangles
 * (in Shape XY space where Y = world Z).
 */
function buildGroundGeometry(
  holeRects: HoleRect[],
  groundHalfSize = 250,
): THREE.ShapeGeometry {
  const shape = new THREE.Shape()
  shape.moveTo(-groundHalfSize, -groundHalfSize)
  shape.lineTo( groundHalfSize, -groundHalfSize)
  shape.lineTo( groundHalfSize,  groundHalfSize)
  shape.lineTo(-groundHalfSize,  groundHalfSize)
  shape.closePath()

  for (const { hx, hz, ry } of holeRects) {
    const holeCx = hx + STAIRCASE_HOLE_W / 2
    const holeCz = hz + STAIRCASE_HOLE_D / 2
    const hw = STAIRCASE_HOLE_W / 2
    const hd = STAIRCASE_HOLE_D / 2
    const cos = Math.cos(ry)
    const sin = Math.sin(ry)

    function rotXY(lx: number, ly: number): [number, number] {
      // Shape space: X = world X, Y = world Z
      return [holeCx + lx * cos - ly * sin, holeCz + lx * sin + ly * cos]
    }

    const hole = new THREE.Path()
    const [x0, y0] = rotXY(-hw, -hd)
    hole.moveTo(x0, y0)
    const [x1, y1] = rotXY( hw, -hd); hole.lineTo(x1, y1)
    const [x2, y2] = rotXY( hw,  hd); hole.lineTo(x2, y2)
    const [x3, y3] = rotXY(-hw,  hd); hole.lineTo(x3, y3)
    hole.closePath()
    shape.holes.push(hole)
  }

  return new THREE.ShapeGeometry(shape)
}

// ── Components ────────────────────────────────────────────────────────────────

type StaircaseHoleObject = {
  id: string
  cell: [number, number]
  rotation: [number, number, number]
}

export function StaircaseHoles({
  staircases,
  groundColor,
}: {
  staircases: StaircaseHoleObject[]
  groundColor: string
}) {
  const holeRects = useMemo<HoleRect[]>(
    () =>
      staircases.map(({ cell: [cx, cz], rotation: [, ry] }) => ({
        hx: cx * GRID_SIZE + HOLE_OFFSET_X,
        hz: cz * GRID_SIZE + HOLE_OFFSET_Z,
        ry,
      })),
    [staircases],
  )

  const geometry = useMemo(
    () => buildGroundGeometry(holeRects),
    [holeRects],
  )

  return (
    <>
      {/* Ground plane with holes punched out */}
      <mesh
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        renderOrder={-1}
        receiveShadow
      >
        <meshStandardMaterial color={groundColor} roughness={1} metalness={0} />
      </mesh>

      {/* Dark pit under each hole */}
      {holeRects.map(({ hx, hz, ry }, i) => {
        const cx = hx + STAIRCASE_HOLE_W / 2
        const cz = hz + STAIRCASE_HOLE_D / 2
        return (
          <mesh
            key={i}
            position={[cx, -PIT_DEPTH / 2, cz]}
            rotation={[0, ry, 0]}
            receiveShadow
            castShadow
          >
            <boxGeometry args={[STAIRCASE_HOLE_W, PIT_DEPTH, STAIRCASE_HOLE_D]} />
            <meshStandardMaterial color="#0a0806" roughness={1} metalness={0} side={THREE.BackSide} />
          </mesh>
        )
      })}
    </>
  )
}
