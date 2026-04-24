import { useMemo } from 'react'
import * as THREE from 'three'
import { GRID_SIZE, cellToWorldPosition, getCellKey, type GridCell } from '../../hooks/useSnapToGrid'

const OVERLAY_Y = 0.03
let squareCoreTexture: THREE.CanvasTexture | null = null
let squareGlowTexture: THREE.CanvasTexture | null = null

export function MovementRangeOverlay({ cells }: { cells: GridCell[] }) {
  const geometry = useMemo(() => {
    const nextGeometry = new THREE.PlaneGeometry(GRID_SIZE * 0.92, GRID_SIZE * 0.92)
    nextGeometry.rotateX(-Math.PI / 2)
    return nextGeometry
  }, [])
  const coreTexture = useMemo(() => getSquareCoreTexture(), [])
  const glowTexture = useMemo(() => getSquareGlowTexture(), [])

  return (
    <group>
      {cells.map((cell) => {
        const [x, , z] = cellToWorldPosition(cell)
        return (
          <group key={getCellKey(cell)} position={[x, OVERLAY_Y, z]} frustumCulled={false}>
            <mesh geometry={geometry} renderOrder={2.9}>
              <meshBasicMaterial
                color="#d4a72c"
                map={glowTexture}
                transparent
                opacity={0.2}
                alphaTest={0.005}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                polygonOffset
                polygonOffsetFactor={-2}
                toneMapped={false}
              />
            </mesh>
            <mesh geometry={geometry} renderOrder={3}>
              <meshBasicMaterial
                color="#d4a72c"
                map={coreTexture}
                transparent
                opacity={0.28}
                alphaTest={0.005}
                depthWrite={false}
                polygonOffset
                polygonOffsetFactor={-2}
                toneMapped={false}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function getSquareCoreTexture() {
  if (squareCoreTexture) {
    return squareCoreTexture
  }

  const size = 128
  const inset = 18
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas 2D context is unavailable.')
  }

  context.clearRect(0, 0, size, size)
  context.strokeStyle = 'rgba(255, 255, 255, 0.68)'
  context.lineWidth = 5
  context.strokeRect(inset, inset, size - inset * 2, size - inset * 2)

  squareCoreTexture = new THREE.CanvasTexture(canvas)
  squareCoreTexture.colorSpace = THREE.SRGBColorSpace
  squareCoreTexture.needsUpdate = true
  return squareCoreTexture
}

function getSquareGlowTexture() {
  if (squareGlowTexture) {
    return squareGlowTexture
  }

  const size = 128
  const inset = 18
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas 2D context is unavailable.')
  }

  context.clearRect(0, 0, size, size)
  context.strokeStyle = 'rgba(255, 255, 255, 0.45)'
  context.lineWidth = 7
  context.shadowColor = 'rgba(255, 255, 255, 0.5)'
  context.shadowBlur = 10
  context.strokeRect(inset, inset, size - inset * 2, size - inset * 2)

  squareGlowTexture = new THREE.CanvasTexture(canvas)
  squareGlowTexture.colorSpace = THREE.SRGBColorSpace
  squareGlowTexture.needsUpdate = true
  return squareGlowTexture
}
