import * as THREE from 'three'
import { GRID_SIZE, cellToWorldPosition } from '../../hooks/useSnapToGrid'
import type { RoomFloorMaskData } from './roomFloorMask'

const MIN_MASK_TEXTURE_SIZE = 64
const MAX_MASK_TEXTURE_SIZE = 2048
const MASK_TEXTURE_PIXELS_PER_CELL = 64
const HALF_GRID_SIZE = GRID_SIZE * 0.5

export type RoomFloorMaskRuntime = {
  texture: THREE.Texture
  minWorldX: number
  minWorldZ: number
  sizeWorldX: number
  sizeWorldZ: number
  signature: string
}

type MaskBounds = {
  minWorldX: number
  minWorldZ: number
  maxWorldX: number
  maxWorldZ: number
}

type SupportedCanvas = HTMLCanvasElement | OffscreenCanvas
type MaskImageData = {
  data: Uint8ClampedArray
}

export function buildRoomFloorMaskRuntime(maskData: RoomFloorMaskData): RoomFloorMaskRuntime | null {
  const bounds = getRoomFloorMaskBounds(maskData)
  if (!bounds) {
    return null
  }

  const sizeWorldX = Math.max(bounds.maxWorldX - bounds.minWorldX, GRID_SIZE * 0.25)
  const sizeWorldZ = Math.max(bounds.maxWorldZ - bounds.minWorldZ, GRID_SIZE * 0.25)
  const width = clampMaskTextureSize(Math.ceil((sizeWorldX / GRID_SIZE) * MASK_TEXTURE_PIXELS_PER_CELL))
  const height = clampMaskTextureSize(Math.ceil((sizeWorldZ / GRID_SIZE) * MASK_TEXTURE_PIXELS_PER_CELL))
  const canvas = createMaskCanvas(width, height)
  const context = canvas?.getContext('2d')
  if (!canvas || !context) {
    return null
  }

  context.clearRect(0, 0, width, height)
  context.fillStyle = '#000000'
  context.fillRect(0, 0, width, height)
  context.fillStyle = '#ffffff'

  const toCanvasX = (worldX: number) => ((worldX - bounds.minWorldX) / sizeWorldX) * width
  const toCanvasY = (worldZ: number) => (1 - ((worldZ - bounds.minWorldZ) / sizeWorldZ)) * height

  maskData.legacyCells.forEach((cell) => {
    const [worldX, , worldZ] = cellToWorldPosition(cell)
    const minX = toCanvasX(worldX - HALF_GRID_SIZE)
    const maxX = toCanvasX(worldX + HALF_GRID_SIZE)
    const minY = toCanvasY(worldZ + HALF_GRID_SIZE)
    const maxY = toCanvasY(worldZ - HALF_GRID_SIZE)
    context.fillRect(minX, minY, maxX - minX, maxY - minY)
  })

  maskData.polygons.forEach((polygon) => {
    context.beginPath()
    polygon.points.forEach((point, index) => {
      const x = toCanvasX(point[0])
      const y = toCanvasY(point[1])
      if (index === 0) {
        context.moveTo(x, y)
        return
      }
      context.lineTo(x, y)
    })
    context.closePath()
    context.fill()
  })
  solidifyMaskCoverage(context, width, height)

  const texture = new THREE.CanvasTexture(canvas)
  texture.name = 'room-floor-mask'
  texture.colorSpace = THREE.NoColorSpace
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true

  return {
    texture,
    minWorldX: bounds.minWorldX,
    minWorldZ: bounds.minWorldZ,
    sizeWorldX,
    sizeWorldZ,
    signature: buildRoomFloorMaskSignature(maskData, bounds, width, height),
  }
}

export function disposeRoomFloorMaskRuntime(runtime: RoomFloorMaskRuntime | null | undefined) {
  runtime?.texture.dispose()
}

function getRoomFloorMaskBounds(maskData: RoomFloorMaskData): MaskBounds | null {
  let minWorldX = Number.POSITIVE_INFINITY
  let minWorldZ = Number.POSITIVE_INFINITY
  let maxWorldX = Number.NEGATIVE_INFINITY
  let maxWorldZ = Number.NEGATIVE_INFINITY

  maskData.legacyCells.forEach((cell) => {
    const [worldX, , worldZ] = cellToWorldPosition(cell)
    minWorldX = Math.min(minWorldX, worldX - HALF_GRID_SIZE)
    minWorldZ = Math.min(minWorldZ, worldZ - HALF_GRID_SIZE)
    maxWorldX = Math.max(maxWorldX, worldX + HALF_GRID_SIZE)
    maxWorldZ = Math.max(maxWorldZ, worldZ + HALF_GRID_SIZE)
  })

  maskData.polygons.forEach((polygon) => {
    polygon.points.forEach((point) => {
      minWorldX = Math.min(minWorldX, point[0])
      minWorldZ = Math.min(minWorldZ, point[1])
      maxWorldX = Math.max(maxWorldX, point[0])
      maxWorldZ = Math.max(maxWorldZ, point[1])
    })
  })

  if (
    !Number.isFinite(minWorldX)
    || !Number.isFinite(minWorldZ)
    || !Number.isFinite(maxWorldX)
    || !Number.isFinite(maxWorldZ)
  ) {
    return null
  }

  return {
    minWorldX,
    minWorldZ,
    maxWorldX,
    maxWorldZ,
  }
}

function buildRoomFloorMaskSignature(
  maskData: RoomFloorMaskData,
  bounds: MaskBounds,
  width: number,
  height: number,
) {
  let hash = 2166136261 >>> 0

  const pushValue = (value: string | number) => {
    const text = String(value)
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index)
      hash = Math.imul(hash, 16777619) >>> 0
    }
  }

  pushValue(bounds.minWorldX)
  pushValue(bounds.minWorldZ)
  pushValue(bounds.maxWorldX)
  pushValue(bounds.maxWorldZ)
  pushValue(width)
  pushValue(height)

  maskData.legacyCells.forEach((cell) => {
    pushValue(cell[0])
    pushValue(cell[1])
  })

  maskData.polygons.forEach((polygon) => {
    pushValue(polygon.key)
    polygon.points.forEach((point) => {
      pushValue(point[0])
      pushValue(point[1])
    })
  })

  return `room-floor-mask:${hash.toString(16)}`
}

function createMaskCanvas(width: number, height: number): SupportedCanvas | null {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height)
  }

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  }

  return null
}

function clampMaskTextureSize(size: number) {
  return Math.max(MIN_MASK_TEXTURE_SIZE, Math.min(MAX_MASK_TEXTURE_SIZE, size))
}

type ImageDataContext = Pick<
  CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  'getImageData' | 'putImageData'
>

function solidifyMaskCoverage(context: ImageDataContext, width: number, height: number) {
  const imageData = context.getImageData(0, 0, width, height)
  solidifyMaskCoveragePixels(imageData)
  context.putImageData(imageData, 0, 0)
}

export function solidifyMaskCoveragePixels(imageData: MaskImageData) {
  for (let index = 0; index < imageData.data.length; index += 4) {
    const coverage = imageData.data[index] ?? 0
    const nextCoverage = coverage > 0 ? 255 : 0
    imageData.data[index] = nextCoverage
    imageData.data[index + 1] = nextCoverage
    imageData.data[index + 2] = nextCoverage
    imageData.data[index + 3] = 255
  }
}
