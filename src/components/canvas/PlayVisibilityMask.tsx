import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { PlayVisibilityMask as PlayVisibilityMaskData } from './playVisibility'
import { GRID_SIZE } from '../../hooks/useSnapToGrid'

const HIDDEN_FILL = 'rgba(5, 6, 9, 0.94)'
const EXPLORED_FILL = 'rgba(5, 6, 9, 0.6)'
const DEBUG_VISIBLE_FILL = 'rgba(34, 197, 94, 0.34)'
const DEBUG_VISIBLE_STROKE = 'rgba(74, 222, 128, 0.8)'
const PIXELS_PER_CELL = 128
const MAX_TEXTURE_SIZE = 4096
const FLOOR_MASK_Y = 0.34

export function PlayVisibilityMask({
  mask,
  mode = 'occlusion',
}: {
  mask: PlayVisibilityMaskData
  mode?: 'occlusion' | 'debug'
}) {
  const canvas = useMemo(() => document.createElement('canvas'), [])
  const texture = useMemo(() => {
    const nextTexture = new THREE.CanvasTexture(canvas)
    nextTexture.colorSpace = THREE.SRGBColorSpace
    nextTexture.minFilter = THREE.LinearFilter
    nextTexture.magFilter = THREE.LinearFilter
    nextTexture.generateMipmaps = false
    return nextTexture
  }, [canvas])

  useEffect(() => {
    const widthCells = Math.max(1, Math.round((mask.bounds.maxX - mask.bounds.minX) / GRID_SIZE))
    const heightCells = Math.max(1, Math.round((mask.bounds.maxZ - mask.bounds.minZ) / GRID_SIZE))
    const scale = Math.min(
      1,
      MAX_TEXTURE_SIZE / Math.max(widthCells * PIXELS_PER_CELL, heightCells * PIXELS_PER_CELL),
    )
    const pixelsPerCell = Math.max(24, Math.floor(PIXELS_PER_CELL * scale))
    canvas.width = Math.max(1, widthCells * pixelsPerCell)
    canvas.height = Math.max(1, heightCells * pixelsPerCell)

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    context.clearRect(0, 0, canvas.width, canvas.height)

    if (mode === 'occlusion') {
      for (const cellKey of mask.paintedCellKeys) {
        fillCell(context, cellKey, mask.bounds, canvas, HIDDEN_FILL)
      }

      for (const cellKey of mask.exploredCellKeys) {
        fillCell(context, cellKey, mask.bounds, canvas, EXPLORED_FILL)
      }

      context.save()
      context.globalCompositeOperation = 'destination-out'
      context.fillStyle = '#000000'
      drawSourceShapes(context, mask, canvas)
      context.restore()
    } else {
      context.save()
      context.fillStyle = DEBUG_VISIBLE_FILL
      context.strokeStyle = DEBUG_VISIBLE_STROKE
      context.lineWidth = 1.5
      drawSourceShapes(context, mask, canvas, true)
      context.restore()
    }

    texture.needsUpdate = true
  }, [canvas, mask, mode, texture])

  useEffect(() => () => texture.dispose(), [texture])

  const width = mask.bounds.maxX - mask.bounds.minX
  const depth = mask.bounds.maxZ - mask.bounds.minZ
  const centerX = mask.bounds.minX + width * 0.5
  const centerZ = mask.bounds.minZ + depth * 0.5

  return (
    <mesh
      position={[centerX, mode === 'debug' ? FLOOR_MASK_Y + 0.01 : FLOOR_MASK_Y, centerZ]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={mode === 'debug' ? 60 : 50}
    >
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={mode === 'debug' ? 0.95 : 1}
        depthTest
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={mode === 'debug' ? -3 : -2}
        polygonOffsetUnits={mode === 'debug' ? -3 : -2}
        side={THREE.FrontSide}
        toneMapped={false}
      />
    </mesh>
  )
}

function drawSourceShapes(
  context: CanvasRenderingContext2D,
  mask: PlayVisibilityMaskData,
  canvas: HTMLCanvasElement,
  stroke = false,
) {
  for (const source of mask.sources) {
    const [originX, originY] = worldToCanvas(source.origin[0], source.origin[1], mask.bounds, canvas)

    for (const sector of source.sectors) {
      if (sector.length < 2) {
        continue
      }

      context.beginPath()
      context.moveTo(originX, originY)
      sector.forEach(([x, z]) => {
        const [canvasX, canvasY] = worldToCanvas(x, z, mask.bounds, canvas)
        context.lineTo(canvasX, canvasY)
      })
      context.closePath()
      context.fill()
      if (stroke) {
        context.stroke()
      }
    }
  }
}

function fillCell(
  context: CanvasRenderingContext2D,
  cellKey: string,
  bounds: PlayVisibilityMaskData['bounds'],
  canvas: HTMLCanvasElement,
  fillStyle: string,
) {
  const [xText, zText] = cellKey.split(':')
  const cellX = Number.parseInt(xText ?? '', 10)
  const cellZ = Number.parseInt(zText ?? '', 10)
  if (!Number.isFinite(cellX) || !Number.isFinite(cellZ)) {
    return
  }

  const minX = cellX * GRID_SIZE
  const maxX = (cellX + 1) * GRID_SIZE
  const minZ = cellZ * GRID_SIZE
  const maxZ = (cellZ + 1) * GRID_SIZE
  const [canvasMinX, canvasMinY] = worldToCanvas(minX, minZ, bounds, canvas)
  const [canvasMaxX, canvasMaxY] = worldToCanvas(maxX, maxZ, bounds, canvas)

  context.fillStyle = fillStyle
  context.fillRect(
    Math.min(canvasMinX, canvasMaxX),
    Math.min(canvasMinY, canvasMaxY),
    Math.abs(canvasMaxX - canvasMinX),
    Math.abs(canvasMaxY - canvasMinY),
  )
}

function worldToCanvas(
  x: number,
  z: number,
  bounds: PlayVisibilityMaskData['bounds'],
  canvas: HTMLCanvasElement,
): [number, number] {
  const normalizedX = (x - bounds.minX) / Math.max(0.0001, bounds.maxX - bounds.minX)
  const normalizedZ = (z - bounds.minZ) / Math.max(0.0001, bounds.maxZ - bounds.minZ)

  return [
    normalizedX * canvas.width,
    normalizedZ * canvas.height,
  ]
}
