import * as THREE from 'three'

type CanvasImageSourceWithDimensions = CanvasImageSource & {
  naturalWidth?: number
  naturalHeight?: number
  videoWidth?: number
  videoHeight?: number
  width?: number
  height?: number
}

type StandeeGeometryCacheEntry = {
  geometry: THREE.BufferGeometry
  refCount: number
  lastUsedAt: number
}

export const MAX_GENERATED_STANDEE_CONTOUR_VERTICES = 192
const MAX_GENERATED_STANDEE_MASK_SAMPLE_SIZE = 160
const GENERATED_STANDEE_ALPHA_THRESHOLD = 16
const MAX_CACHED_GENERATED_STANDEE_GEOMETRIES = 24
const GENERATED_STANDEE_BORDER_RATIO = 0.012
const GENERATED_STANDEE_SMOOTHING_ITERATIONS = 1
const MIN_GENERATED_STANDEE_SMOOTHING_VERTICES = 8

const standeeGeometryCache = new Map<string, StandeeGeometryCacheEntry>()
let standeeGeometryAccessCounter = 0

export function acquireGeneratedCharacterStandeeGeometry(
  cacheKey: string,
  alphaTexture: THREE.Texture,
  cardWidth: number,
  cardHeight: number,
  depth: number,
) {
  const existingEntry = standeeGeometryCache.get(cacheKey)
  if (existingEntry) {
    existingEntry.refCount += 1
    existingEntry.lastUsedAt = ++standeeGeometryAccessCounter
    return existingEntry.geometry
  }

  const geometry = createGeneratedCharacterStandeeGeometry(alphaTexture, cardWidth, cardHeight, depth)
  standeeGeometryCache.set(cacheKey, {
    geometry,
    refCount: 1,
    lastUsedAt: ++standeeGeometryAccessCounter,
  })
  pruneGeneratedStandeeGeometryCache()
  return geometry
}

export function releaseGeneratedCharacterStandeeGeometry(cacheKey: string) {
  const entry = standeeGeometryCache.get(cacheKey)
  if (!entry) {
    return
  }

  entry.refCount = Math.max(0, entry.refCount - 1)
  entry.lastUsedAt = ++standeeGeometryAccessCounter
  pruneGeneratedStandeeGeometryCache()
}

export function resetGeneratedCharacterStandeeGeometryCacheForTests() {
  standeeGeometryCache.forEach((entry) => entry.geometry.dispose())
  standeeGeometryCache.clear()
  standeeGeometryAccessCounter = 0
}

export function createGeneratedCharacterStandeeGeometry(
  alphaTexture: THREE.Texture,
  cardWidth: number,
  cardHeight: number,
  depth: number,
) {
  const imageData = readGeneratedStandeeAlphaMask(alphaTexture)
  if (!imageData) {
    return createFallbackStandeeGeometry(cardWidth, cardHeight, depth)
  }

  const { data, width, height } = imageData
  const filledMask = createGeneratedStandeeFilledMask(data, width, height, GENERATED_STANDEE_ALPHA_THRESHOLD)
  const expandedMask = expandGeneratedStandeeFilledMask(
    filledMask,
    width,
    height,
    getGeneratedStandeeBorderPixels(cardWidth, cardHeight, width, height),
  )
  const contour = extractGeneratedStandeeContourFromFilledMask(expandedMask, width, height)
  if (!contour || contour.length < 3) {
    return createFallbackStandeeGeometry(cardWidth, cardHeight, depth)
  }

  const shapePoints = simplifyGeneratedStandeeContour(
    smoothGeneratedStandeeContour(
      contour.map(([x, y]) => new THREE.Vector2(
        ((x / width) - 0.5) * cardWidth,
        (0.5 - (y / height)) * cardHeight,
      )),
      MAX_GENERATED_STANDEE_CONTOUR_VERTICES,
    ),
    MAX_GENERATED_STANDEE_CONTOUR_VERTICES,
  )

  if (shapePoints.length < 3) {
    return createFallbackStandeeGeometry(cardWidth, cardHeight, depth)
  }

  const shape = new THREE.Shape(shapePoints)
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 1,
    steps: 1,
  })
  geometry.translate(0, 0, -depth * 0.5)
  geometry.computeVertexNormals()
  return geometry
}

export function extractGeneratedStandeeContour(
  alphaPixels: Uint8ClampedArray,
  width: number,
  height: number,
  threshold = GENERATED_STANDEE_ALPHA_THRESHOLD,
) {
  return extractGeneratedStandeeContourFromFilledMask(
    createGeneratedStandeeFilledMask(alphaPixels, width, height, threshold),
    width,
    height,
  )
}

function createGeneratedStandeeFilledMask(
  alphaPixels: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number,
) {
  const filled = new Uint8Array(width * height)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      filled[(y * width) + x] = getGeneratedStandeeMaskCoverage(alphaPixels, (y * width) + x) > threshold ? 1 : 0
    }
  }
  return filled
}

function extractGeneratedStandeeContourFromFilledMask(
  filled: Uint8Array,
  width: number,
  height: number,
) {
  const outgoing = new Map<string, Edge[]>()
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!filled[(y * width) + x]) {
        continue
      }

      if (y === 0 || !filled[((y - 1) * width) + x]) {
        addEdge(outgoing, { start: [x, y], end: [x + 1, y] })
      }
      if (x === width - 1 || !filled[(y * width) + x + 1]) {
        addEdge(outgoing, { start: [x + 1, y], end: [x + 1, y + 1] })
      }
      if (y === height - 1 || !filled[((y + 1) * width) + x]) {
        addEdge(outgoing, { start: [x + 1, y + 1], end: [x, y + 1] })
      }
      if (x === 0 || !filled[(y * width) + x - 1]) {
        addEdge(outgoing, { start: [x, y + 1], end: [x, y] })
      }
    }
  }

  const loops: Array<Array<readonly [number, number]>> = []
  while (true) {
    const seedEdge = findNextUnusedEdge(outgoing)
    if (!seedEdge) {
      break
    }

    const loop = traceGeneratedStandeeContourLoop(seedEdge, outgoing)
    if (loop.length >= 3) {
      loops.push(removeCollinearContourPoints(loop))
    }
  }

  return loops
    .sort((left, right) => Math.abs(computeContourArea(right)) - Math.abs(computeContourArea(left)))[0]
    ?? null
}

function expandGeneratedStandeeFilledMask(
  filledMask: Uint8Array,
  width: number,
  height: number,
  expansionPixels: number,
) {
  if (expansionPixels <= 0) {
    return filledMask
  }

  let expanded = filledMask.slice()
  for (let iteration = 0; iteration < expansionPixels; iteration += 1) {
    const next = expanded.slice()
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width) + x
        if (expanded[index]) {
          continue
        }

        let shouldFill = false
        for (let offsetY = -1; offsetY <= 1 && !shouldFill; offsetY += 1) {
          for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
            if (offsetX === 0 && offsetY === 0) {
              continue
            }
            const nextX = x + offsetX
            const nextY = y + offsetY
            if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
              continue
            }
            if (expanded[(nextY * width) + nextX]) {
              shouldFill = true
              break
            }
          }
        }

        if (shouldFill) {
          next[index] = 1
        }
      }
    }
    expanded = next
  }

  return expanded
}

export function simplifyGeneratedStandeeContour(points: THREE.Vector2[], maxVertices: number) {
  const deduped = removeDuplicateVectorPoints(removeCollinearVectorPoints(points))
  if (deduped.length <= maxVertices) {
    return deduped
  }

  const rotated = rotateContourToStableStart(deduped)
  const openPolyline = [...rotated, rotated[0]!.clone()]
  let low = 0
  let high = Math.max(...rotated.map((point) => point.length()), 0) || 1
  let best = removeDuplicateVectorPoints(removeCollinearVectorPoints(
    simplifyOpenPolyline(openPolyline, high).slice(0, -1),
  ))

  for (let iteration = 0; iteration < 18; iteration += 1) {
    const epsilon = (low + high) * 0.5
    const candidate = removeDuplicateVectorPoints(
      removeCollinearVectorPoints(
        simplifyOpenPolyline(openPolyline, epsilon).slice(0, -1),
      ),
    )

    if (candidate.length > maxVertices) {
      low = epsilon
      continue
    }

    best = candidate.length >= 3 && candidate.length >= best.length ? candidate : best
    high = epsilon
  }

  if (best.length <= maxVertices && best.length >= Math.floor(maxVertices * 0.5)) {
    return best
  }

  const fallback = removeDuplicateVectorPoints(removeCollinearVectorPoints(
    simplifyOpenPolyline(openPolyline, high * 1.5).slice(0, -1),
  ))
  const boundedFallback = fallback.length >= 3 ? fallback : best
  if (boundedFallback.length >= Math.floor(maxVertices * 0.5)) {
    return boundedFallback
  }

  return sampleClosedContour(deduped, maxVertices)
}

export function smoothGeneratedStandeeContour(points: THREE.Vector2[], maxVertices: number) {
  const deduped = removeDuplicateVectorPoints(removeCollinearVectorPoints(points))
  if (deduped.length < MIN_GENERATED_STANDEE_SMOOTHING_VERTICES) {
    return deduped
  }

  let smoothed = deduped
  const smoothingVertexLimit = Math.max(maxVertices * 2, deduped.length)
  for (let iteration = 0; iteration < GENERATED_STANDEE_SMOOTHING_ITERATIONS; iteration += 1) {
    smoothed = chaikinSmoothClosedContour(smoothed)
    if (smoothed.length >= smoothingVertexLimit) {
      break
    }
  }

  return smoothed.length >= 3 ? smoothed : deduped
}

function readGeneratedStandeeAlphaMask(texture: THREE.Texture) {
  const source = texture.image
  if (!source || typeof source !== 'object' || typeof document === 'undefined') {
    return null
  }

  const dimensions = getImageSourceDimensions(source as CanvasImageSourceWithDimensions)
  if (dimensions.width <= 0 || dimensions.height <= 0) {
    return null
  }

  const scale = Math.min(1, MAX_GENERATED_STANDEE_MASK_SAMPLE_SIZE / Math.max(dimensions.width, dimensions.height))
  const width = Math.max(1, Math.round(dimensions.width * scale))
  const height = Math.max(1, Math.round(dimensions.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    return null
  }

  context.drawImage(source as CanvasImageSource, 0, 0, width, height)
  return {
    width,
    height,
    data: context.getImageData(0, 0, width, height).data,
  }
}

function createFallbackStandeeGeometry(cardWidth: number, cardHeight: number, depth: number) {
  return new THREE.BoxGeometry(cardWidth, cardHeight, depth)
}

function pruneGeneratedStandeeGeometryCache() {
  if (standeeGeometryCache.size <= MAX_CACHED_GENERATED_STANDEE_GEOMETRIES) {
    return
  }

  const candidates = [...standeeGeometryCache.entries()]
    .filter(([, entry]) => entry.refCount === 0)
    .sort((left, right) => left[1].lastUsedAt - right[1].lastUsedAt)

  for (const [cacheKey, entry] of candidates) {
    if (standeeGeometryCache.size <= MAX_CACHED_GENERATED_STANDEE_GEOMETRIES) {
      break
    }
    entry.geometry.dispose()
    standeeGeometryCache.delete(cacheKey)
  }
}

type Edge = {
  start: readonly [number, number]
  end: readonly [number, number]
  used?: boolean
}

function addEdge(outgoing: Map<string, Edge[]>, edge: Edge) {
  const key = getContourPointKey(edge.start)
  const current = outgoing.get(key)
  if (current) {
    current.push(edge)
  } else {
    outgoing.set(key, [edge])
  }
}

function findNextUnusedEdge(outgoing: Map<string, Edge[]>) {
  const entries = [...outgoing.entries()].sort(([left], [right]) => left.localeCompare(right))
  for (const [, edges] of entries) {
    const edge = edges.find((candidate) => !candidate.used)
    if (edge) {
      return edge
    }
  }
  return null
}

function traceGeneratedStandeeContourLoop(seed: Edge, outgoing: Map<string, Edge[]>) {
  const loop: Array<readonly [number, number]> = []
  let current = seed

  while (!current.used) {
    current.used = true
    loop.push(current.start)
    const nextKey = getContourPointKey(current.end)
    if (nextKey === getContourPointKey(seed.start)) {
      break
    }
    const candidates = (outgoing.get(nextKey) ?? []).filter((candidate) => !candidate.used)
    if (candidates.length === 0) {
      break
    }
    current = chooseNextContourEdge(current, candidates)
  }

  return loop
}

function chooseNextContourEdge(current: Edge, candidates: Edge[]) {
  const currentDirection = getContourDirectionIndex(current.start, current.end)
  return [...candidates].sort((left, right) => {
    const leftPriority = getContourTurnPriority(currentDirection, getContourDirectionIndex(left.start, left.end))
    const rightPriority = getContourTurnPriority(currentDirection, getContourDirectionIndex(right.start, right.end))
    return leftPriority - rightPriority
  })[0]!
}

function getContourTurnPriority(currentDirection: number, nextDirection: number) {
  const delta = (nextDirection - currentDirection + 4) % 4
  switch (delta) {
    case 1:
      return 0
    case 0:
      return 1
    case 3:
      return 2
    case 2:
    default:
      return 3
  }
}

function getContourDirectionIndex(start: readonly [number, number], end: readonly [number, number]) {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  if (dx > 0) return 0
  if (dy > 0) return 1
  if (dx < 0) return 2
  return 3
}

function removeCollinearContourPoints(points: Array<readonly [number, number]>) {
  if (points.length <= 3) {
    return points
  }

  const result: Array<readonly [number, number]> = []
  for (let index = 0; index < points.length; index += 1) {
    const previous = points[(index - 1 + points.length) % points.length]!
    const current = points[index]!
    const next = points[(index + 1) % points.length]!
    const cross =
      (current[0] - previous[0]) * (next[1] - current[1])
      - (current[1] - previous[1]) * (next[0] - current[0])
    if (cross !== 0) {
      result.push(current)
    }
  }
  return result.length >= 3 ? result : points
}

function computeContourArea(points: Array<readonly [number, number]>) {
  let area = 0
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]!
    const next = points[(index + 1) % points.length]!
    area += (current[0] * next[1]) - (next[0] * current[1])
  }
  return area * 0.5
}

function rotateContourToStableStart(points: THREE.Vector2[]) {
  let startIndex = 0
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index]!
    const current = points[startIndex]!
    if (point.x < current.x || (point.x === current.x && point.y < current.y)) {
      startIndex = index
    }
  }

  return [
    ...points.slice(startIndex).map((point) => point.clone()),
    ...points.slice(0, startIndex).map((point) => point.clone()),
  ]
}

function removeDuplicateVectorPoints(points: THREE.Vector2[]) {
  const result: THREE.Vector2[] = []
  for (const point of points) {
    const previous = result.at(-1)
    if (!previous || previous.distanceToSquared(point) > 1e-8) {
      result.push(point.clone())
    }
  }
  if (result.length > 1 && result[0]!.distanceToSquared(result.at(-1)!) <= 1e-8) {
    result.pop()
  }
  return result
}

function removeCollinearVectorPoints(points: THREE.Vector2[]) {
  if (points.length <= 3) {
    return points.map((point) => point.clone())
  }

  const result: THREE.Vector2[] = []
  for (let index = 0; index < points.length; index += 1) {
    const previous = points[(index - 1 + points.length) % points.length]!
    const current = points[index]!
    const next = points[(index + 1) % points.length]!
    const previousVector = current.clone().sub(previous)
    const nextVector = next.clone().sub(current)
    if (Math.abs(previousVector.cross(nextVector)) > 1e-8) {
      result.push(current.clone())
    }
  }
  return result.length >= 3 ? result : points.map((point) => point.clone())
}

function chaikinSmoothClosedContour(points: THREE.Vector2[]) {
  if (points.length < 3) {
    return points.map((point) => point.clone())
  }

  const smoothed: THREE.Vector2[] = []
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]!
    const next = points[(index + 1) % points.length]!
    smoothed.push(
      current.clone().lerp(next, 0.25),
      current.clone().lerp(next, 0.75),
    )
  }

  return removeDuplicateVectorPoints(removeCollinearVectorPoints(smoothed))
}

function simplifyOpenPolyline(points: THREE.Vector2[], epsilon: number): THREE.Vector2[] {
  if (points.length <= 2 || epsilon <= 0) {
    return points.map((point) => point.clone())
  }

  let maxDistance = 0
  let splitIndex = -1
  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = getPointToSegmentDistance(points[index]!, points[0]!, points.at(-1)!)
    if (distance > maxDistance) {
      maxDistance = distance
      splitIndex = index
    }
  }

  if (maxDistance <= epsilon || splitIndex < 0) {
    return [points[0]!.clone(), points.at(-1)!.clone()]
  }

  const left: THREE.Vector2[] = simplifyOpenPolyline(points.slice(0, splitIndex + 1), epsilon)
  const right: THREE.Vector2[] = simplifyOpenPolyline(points.slice(splitIndex), epsilon)
  return [...left.slice(0, -1), ...right]
}

function sampleClosedContour(points: THREE.Vector2[], maxVertices: number) {
  if (points.length <= maxVertices) {
    return points.map((point) => point.clone())
  }

  const sampled: THREE.Vector2[] = []
  for (let index = 0; index < maxVertices; index += 1) {
    const sourceIndex = Math.floor((index / maxVertices) * points.length)
    sampled.push(points[sourceIndex]!.clone())
  }
  return removeDuplicateVectorPoints(removeCollinearVectorPoints(sampled))
}

function getPointToSegmentDistance(point: THREE.Vector2, start: THREE.Vector2, end: THREE.Vector2) {
  const segment = end.clone().sub(start)
  const lengthSq = segment.lengthSq()
  if (lengthSq <= Number.EPSILON) {
    return point.distanceTo(start)
  }

  const t = THREE.MathUtils.clamp(point.clone().sub(start).dot(segment) / lengthSq, 0, 1)
  const projection = start.clone().add(segment.multiplyScalar(t))
  return point.distanceTo(projection)
}

function getContourPointKey(point: readonly [number, number]) {
  return `${point[0]},${point[1]}`
}

function getImageSourceDimensions(source: CanvasImageSourceWithDimensions) {
  return {
    width: typeof source.naturalWidth === 'number'
      ? source.naturalWidth
      : typeof source.videoWidth === 'number'
        ? source.videoWidth
        : typeof source.width === 'number'
          ? source.width
          : 0,
    height: typeof source.naturalHeight === 'number'
      ? source.naturalHeight
      : typeof source.videoHeight === 'number'
        ? source.videoHeight
        : typeof source.height === 'number'
          ? source.height
          : 0,
  }
}

function getGeneratedStandeeMaskCoverage(imageData: Uint8ClampedArray, pixelIndex: number) {
  const index = pixelIndex * 4
  const red = imageData[index] ?? 0
  const green = imageData[index + 1] ?? 0
  const blue = imageData[index + 2] ?? 0

  return Math.max(red, green, blue)
}

function getGeneratedStandeeBorderPixels(
  cardWidth: number,
  cardHeight: number,
  maskWidth: number,
  maskHeight: number,
) {
  const borderWorldUnits = Math.min(cardWidth, cardHeight) * GENERATED_STANDEE_BORDER_RATIO
  const worldUnitsPerPixel = Math.min(
    cardWidth / Math.max(1, maskWidth),
    cardHeight / Math.max(1, maskHeight),
  )

  return Math.max(1, Math.round(borderWorldUnits / Math.max(worldUnitsPerPixel, 1e-4)))
}
