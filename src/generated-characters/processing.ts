import type { CreateGeneratedCharacterInput } from './types'

const MAX_SOURCE_DIMENSION = 1024
const THUMBNAIL_SIZE = 256
const OUTLINE_RADIUS = 9
const OUTLINE_FEATHER = 1.25
const SUBJECT_ALPHA_THRESHOLD = 18
const GREEN_SCREEN_EDGE_THRESHOLD = 0.2
const NEIGHBOR_OFFSETS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
] as const

export async function processGeneratedCharacterImage(sourceImageDataUrl: string) {
  const image = await loadImage(sourceImageDataUrl)
  const { width, height } = downscaleDimensions(image.naturalWidth, image.naturalHeight, MAX_SOURCE_DIMENSION)
  const sourceCanvas = document.createElement('canvas')
  sourceCanvas.width = width
  sourceCanvas.height = height
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true })
  if (!sourceContext) {
    throw new Error('Canvas 2D context is unavailable.')
  }

  sourceContext.drawImage(image, 0, 0, width, height)
  const sourceImageData = sourceContext.getImageData(0, 0, width, height)
  const alphaMask = new Uint8ClampedArray(width * height)
  const useGreenScreenCleanup = detectGreenScreenBackground(sourceImageData.data, width, height)

  for (let index = 0; index < sourceImageData.data.length; index += 4) {
    const pixelIndex = index / 4
    const red = sourceImageData.data[index]
    const green = sourceImageData.data[index + 1]
    const blue = sourceImageData.data[index + 2]
    const alpha = sourceImageData.data[index + 3]
    const adjustedAlpha = useGreenScreenCleanup
      ? alpha
      : Math.round(alpha * foregroundFactor(red, green, blue))

    sourceImageData.data[index + 3] = adjustedAlpha
    alphaMask[pixelIndex] = adjustedAlpha
  }

  if (useGreenScreenCleanup) {
    removeGreenBackgroundRegions(alphaMask, sourceImageData.data, width, height, SUBJECT_ALPHA_THRESHOLD)
  } else {
    removeEdgeConnectedForeground(alphaMask, width, height, SUBJECT_ALPHA_THRESHOLD)
  }
  keepDominantSubjectComponent(alphaMask, sourceImageData.data, width, height, SUBJECT_ALPHA_THRESHOLD)
  removeGreenEdgeFringe(alphaMask, sourceImageData.data, width, height, SUBJECT_ALPHA_THRESHOLD)
  const cropBounds = getMaskBounds(alphaMask, width, height, SUBJECT_ALPHA_THRESHOLD)

  if (!cropBounds) {
    throw new Error('The generated image did not contain a visible subject after background cleanup.')
  }

  const outlineMask = buildOutlineMask(alphaMask, width, height, OUTLINE_RADIUS, SUBJECT_ALPHA_THRESHOLD)
  const paddedCropBounds = {
    minX: Math.max(0, cropBounds.minX - (OUTLINE_RADIUS + 8)),
    minY: Math.max(0, cropBounds.minY - (OUTLINE_RADIUS + 8)),
    maxX: Math.min(width - 1, cropBounds.maxX + (OUTLINE_RADIUS + 8)),
    maxY: Math.min(height - 1, cropBounds.maxY + (OUTLINE_RADIUS + 8)),
  }
  const cropWidth = paddedCropBounds.maxX - paddedCropBounds.minX + 1
  const cropHeight = paddedCropBounds.maxY - paddedCropBounds.minY + 1

  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = cropWidth
  outputCanvas.height = cropHeight
  const outputContext = outputCanvas.getContext('2d')
  if (!outputContext) {
    throw new Error('Canvas 2D context is unavailable.')
  }

  const compositedImageData = outputContext.createImageData(cropWidth, cropHeight)

  for (let y = paddedCropBounds.minY; y <= paddedCropBounds.maxY; y += 1) {
    for (let x = paddedCropBounds.minX; x <= paddedCropBounds.maxX; x += 1) {
      const sourceIndex = (y * width) + x
      const targetIndex = ((y - paddedCropBounds.minY) * cropWidth + (x - paddedCropBounds.minX)) * 4
      const alpha = alphaMask[sourceIndex]
      const outline = outlineMask[sourceIndex]

      if (outline > 0 && alpha <= SUBJECT_ALPHA_THRESHOLD) {
        compositedImageData.data[targetIndex] = 255
        compositedImageData.data[targetIndex + 1] = 255
        compositedImageData.data[targetIndex + 2] = 255
        compositedImageData.data[targetIndex + 3] = outline
      }

      const originalIndex = sourceIndex * 4
      if (alpha > 0) {
        compositedImageData.data[targetIndex] = sourceImageData.data[originalIndex]
        compositedImageData.data[targetIndex + 1] = sourceImageData.data[originalIndex + 1]
        compositedImageData.data[targetIndex + 2] = sourceImageData.data[originalIndex + 2]
        compositedImageData.data[targetIndex + 3] = alpha
      }
    }
  }

  outputContext.putImageData(compositedImageData, 0, 0)

  const thumbnailCanvas = document.createElement('canvas')
  thumbnailCanvas.width = THUMBNAIL_SIZE
  thumbnailCanvas.height = THUMBNAIL_SIZE
  const thumbnailContext = thumbnailCanvas.getContext('2d')
  if (!thumbnailContext) {
    throw new Error('Canvas 2D context is unavailable.')
  }
  thumbnailContext.imageSmoothingEnabled = true
  thumbnailContext.imageSmoothingQuality = 'high'

  const containScale = Math.min(
    (THUMBNAIL_SIZE * 0.84) / cropWidth,
    (THUMBNAIL_SIZE * 0.84) / cropHeight,
  )
  const thumbnailWidth = cropWidth * containScale
  const thumbnailHeight = cropHeight * containScale
  const thumbnailX = (THUMBNAIL_SIZE - thumbnailWidth) * 0.5
  const thumbnailY = (THUMBNAIL_SIZE - thumbnailHeight) * 0.5
  thumbnailContext.drawImage(outputCanvas, thumbnailX, thumbnailY, thumbnailWidth, thumbnailHeight)

  return {
    processedImageDataUrl: outputCanvas.toDataURL('image/png'),
    thumbnailDataUrl: thumbnailCanvas.toDataURL('image/png'),
    width: cropWidth,
    height: cropHeight,
  }
}

export function deriveGeneratedCharacterName(prompt: string, ordinal: number) {
  const cleaned = prompt.trim().replace(/\s+/g, ' ')
  if (!cleaned) {
    return `Generated Character ${ordinal}`
  }

  const firstClause = cleaned.split(/[,.!?]/, 1)[0]?.trim() ?? cleaned
  const title = firstClause.slice(0, 34).trim()
  return title.length > 0 ? title : `Generated Character ${ordinal}`
}

export function estimateGeneratedCharacterStorageBytes(
  characters: Record<string, CreateGeneratedCharacterInput | { [key: string]: unknown }>,
) {
  return new Blob([JSON.stringify(characters)]).size
}

function downscaleDimensions(width: number, height: number, maxDimension: number) {
  const scale = Math.min(1, maxDimension / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function foregroundFactor(red: number, green: number, blue: number) {
  const brightness = (0.2126 * red) + (0.7152 * green) + (0.0722 * blue)
  const chroma = Math.max(red, green, blue) - Math.min(red, green, blue)
  const brightnessScore = smoothstep(224, 255, brightness)
  const neutralScore = 1 - smoothstep(18, 56, chroma)
  const backgroundScore = brightnessScore * neutralScore
  return clamp(1 - smoothstep(0.28, 0.96, backgroundScore), 0, 1)
}

function detectGreenScreenBackground(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
) {
  let greenishEdges = 0
  let sampledEdges = 0

  const samplePixel = (x: number, y: number) => {
    const index = ((y * width) + x) * 4
    const alpha = imageData[index + 3]
    if (alpha <= SUBJECT_ALPHA_THRESHOLD) {
      return
    }

    sampledEdges += 1
    if (isGreenishBackgroundPixel(
      imageData[index],
      imageData[index + 1],
      imageData[index + 2],
    )) {
      greenishEdges += 1
    }
  }

  for (let x = 0; x < width; x += 1) {
    samplePixel(x, 0)
    samplePixel(x, height - 1)
  }

  for (let y = 1; y < height - 1; y += 1) {
    samplePixel(0, y)
    samplePixel(width - 1, y)
  }

  if (sampledEdges === 0) {
    return false
  }

  return (greenishEdges / sampledEdges) >= GREEN_SCREEN_EDGE_THRESHOLD
}

export function isGreenishBackgroundPixel(red: number, green: number, blue: number) {
  const greenLead = green - Math.max(red, blue)
  const chroma = Math.max(red, green, blue) - Math.min(red, green, blue)
  return green > 60 && greenLead > 10 && chroma > 12
}

function isLikelyGreenScreenSpillPixel(red: number, green: number, blue: number) {
  const greenLead = green - Math.max(red, blue)
  const chroma = Math.max(red, green, blue) - Math.min(red, green, blue)
  return green >= 155
    && greenLead >= 52
    && chroma >= 44
    && red <= 95
    && blue <= 95
}

function isWhiteBorderPixel(red: number, green: number, blue: number) {
  const brightness = (0.2126 * red) + (0.7152 * green) + (0.0722 * blue)
  const chroma = Math.max(red, green, blue) - Math.min(red, green, blue)
  return brightness >= 228 && chroma <= 36
}

function getMaskBounds(mask: Uint8ClampedArray, width: number, height: number, threshold: number) {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let index = 0; index < mask.length; index += 1) {
    if (mask[index] <= threshold) {
      continue
    }

    const x = index % width
    const y = Math.floor(index / width)
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }

  return maxX < minX || maxY < minY
    ? null
    : { minX, minY, maxX, maxY }
}

function removeEdgeConnectedForeground(
  mask: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number,
) {
  const queue: number[] = []
  const visited = new Uint8Array(mask.length)

  const enqueueIfForeground = (x: number, y: number) => {
    const index = (y * width) + x
    if (visited[index] || mask[index] <= threshold) {
      return
    }

    visited[index] = 1
    queue.push(index)
  }

  for (let x = 0; x < width; x += 1) {
    enqueueIfForeground(x, 0)
    enqueueIfForeground(x, height - 1)
  }

  for (let y = 1; y < height - 1; y += 1) {
    enqueueIfForeground(0, y)
    enqueueIfForeground(width - 1, y)
  }

  for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
    const index = queue[queueIndex]
    const x = index % width
    const y = Math.floor(index / width)
    mask[index] = 0

    if (x > 0) enqueueIfForeground(x - 1, y)
    if (x < width - 1) enqueueIfForeground(x + 1, y)
    if (y > 0) enqueueIfForeground(x, y - 1)
    if (y < height - 1) enqueueIfForeground(x, y + 1)
    if (x > 0 && y > 0) enqueueIfForeground(x - 1, y - 1)
    if (x < width - 1 && y > 0) enqueueIfForeground(x + 1, y - 1)
    if (x > 0 && y < height - 1) enqueueIfForeground(x - 1, y + 1)
    if (x < width - 1 && y < height - 1) enqueueIfForeground(x + 1, y + 1)
  }
}

export function removeGreenBackgroundRegions(
  mask: Uint8ClampedArray,
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number,
) {
  const visited = new Uint8Array(mask.length)
  const enclosedPocketAreaLimit = Math.max(16, Math.round(width * height * 0.006))

  const isOpaqueGreen = (pixelIndex: number) => {
    if (mask[pixelIndex] <= threshold) {
      return false
    }

    const colorIndex = pixelIndex * 4
    return isGreenishBackgroundPixel(
      imageData[colorIndex],
      imageData[colorIndex + 1],
      imageData[colorIndex + 2],
    )
  }

  for (let pixelIndex = 0; pixelIndex < mask.length; pixelIndex += 1) {
    if (visited[pixelIndex] || !isOpaqueGreen(pixelIndex)) {
      continue
    }

    const component: number[] = [pixelIndex]
    let touchesEdge = false
    let whiteBorderNeighbors = 0
    let subjectNeighbors = 0
    let spillGreenPixels = 0
    visited[pixelIndex] = 1

    for (let queueIndex = 0; queueIndex < component.length; queueIndex += 1) {
      const currentIndex = component[queueIndex]
      const x = currentIndex % width
      const y = Math.floor(currentIndex / width)
      const currentColorIndex = currentIndex * 4

      if (isLikelyGreenScreenSpillPixel(
        imageData[currentColorIndex],
        imageData[currentColorIndex + 1],
        imageData[currentColorIndex + 2],
      )) {
        spillGreenPixels += 1
      }

      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        touchesEdge = true
      }

      for (const [offsetX, offsetY] of NEIGHBOR_OFFSETS) {
        const nextX = x + offsetX
        const nextY = y + offsetY

        if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
          touchesEdge = true
          continue
        }

        const nextIndex = (nextY * width) + nextX
        if (isOpaqueGreen(nextIndex)) {
          if (!visited[nextIndex]) {
            visited[nextIndex] = 1
            component.push(nextIndex)
          }
          continue
        }

        if (mask[nextIndex] <= threshold) {
          continue
        }

        const colorIndex = nextIndex * 4
        if (isWhiteBorderPixel(
          imageData[colorIndex],
          imageData[colorIndex + 1],
          imageData[colorIndex + 2],
        )) {
          whiteBorderNeighbors += 1
        } else {
          subjectNeighbors += 1
        }
      }
    }

    const neighborCount = whiteBorderNeighbors + subjectNeighbors
    const borderedByWhitespace = whiteBorderNeighbors > 0
      && whiteBorderNeighbors >= Math.max(2, Math.ceil(subjectNeighbors * 0.6))
    const whiteEnclosedIsland = neighborCount > 0
      && whiteBorderNeighbors >= 6
      && (whiteBorderNeighbors / neighborCount) >= 0.5
    const spillDominance = spillGreenPixels / component.length
    const enclosedSpillPocket = !touchesEdge
      && component.length <= enclosedPocketAreaLimit
      && subjectNeighbors >= 8
      && spillDominance >= 0.75
    const saturatedInteriorSpill = !touchesEdge
      && component.length <= enclosedPocketAreaLimit
      && subjectNeighbors >= 12
      && spillGreenPixels >= 6
      && spillDominance >= 0.45
    const shouldRemove =
      touchesEdge
      || borderedByWhitespace
      || whiteEnclosedIsland
      || enclosedSpillPocket
      || saturatedInteriorSpill
    if (!shouldRemove) {
      continue
    }

    for (const componentIndex of component) {
      mask[componentIndex] = 0
    }
  }
}

type ForegroundComponent = {
  pixels: number[]
  area: number
  minX: number
  minY: number
  maxX: number
  maxY: number
  touchesEdge: boolean
  whitePixelCount: number
}

export function keepDominantSubjectComponent(
  mask: Uint8ClampedArray,
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number,
) {
  const components = collectForegroundComponents(mask, imageData, width, height, threshold)
  if (components.length <= 1) {
    return
  }

  const scoredComponents = components.map((component) => ({
    component,
    frameLike: isFrameLikeArtifact(component, width, height),
    score: scoreComponent(component, width, height),
  }))

  const candidates = scoredComponents.filter((entry) => !entry.frameLike)
  const ranked = (candidates.length > 0 ? candidates : scoredComponents)
    .sort((left, right) => right.score - left.score || right.component.area - left.component.area)
  const dominant = ranked[0]?.component

  if (!dominant) {
    return
  }

  const dominantPixels = new Set(dominant.pixels)
  for (const component of components) {
    for (const pixelIndex of component.pixels) {
      if (!dominantPixels.has(pixelIndex)) {
        mask[pixelIndex] = 0
      }
    }
  }
}

export function removeGreenEdgeFringe(
  mask: Uint8ClampedArray,
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number,
) {
  const cleared = new Uint8Array(mask.length)

  for (let pixelIndex = 0; pixelIndex < mask.length; pixelIndex += 1) {
    if (mask[pixelIndex] <= threshold) {
      continue
    }

    const colorIndex = pixelIndex * 4
    if (!isGreenishBackgroundPixel(
      imageData[colorIndex],
      imageData[colorIndex + 1],
      imageData[colorIndex + 2],
    )) {
      continue
    }

    const x = pixelIndex % width
    const y = Math.floor(pixelIndex / width)
    let touchesOutside = false

    for (const [offsetX, offsetY] of NEIGHBOR_OFFSETS) {
      const nextX = x + offsetX
      const nextY = y + offsetY
      if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
        touchesOutside = true
        break
      }

      const nextIndex = (nextY * width) + nextX
      if (mask[nextIndex] <= threshold) {
        touchesOutside = true
        break
      }
    }

    if (touchesOutside) {
      cleared[pixelIndex] = 1
    }
  }

  for (let pixelIndex = 0; pixelIndex < cleared.length; pixelIndex += 1) {
    if (cleared[pixelIndex] === 1) {
      mask[pixelIndex] = 0
    }
  }
}

function collectForegroundComponents(
  mask: Uint8ClampedArray,
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number,
) {
  const visited = new Uint8Array(mask.length)
  const components: ForegroundComponent[] = []

  for (let pixelIndex = 0; pixelIndex < mask.length; pixelIndex += 1) {
    if (visited[pixelIndex] || mask[pixelIndex] <= threshold) {
      continue
    }

    const pixels: number[] = [pixelIndex]
    visited[pixelIndex] = 1
    let minX = width
    let minY = height
    let maxX = -1
    let maxY = -1
    let touchesEdge = false
    let whitePixelCount = 0

    for (let queueIndex = 0; queueIndex < pixels.length; queueIndex += 1) {
      const currentIndex = pixels[queueIndex]
      const x = currentIndex % width
      const y = Math.floor(currentIndex / width)
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        touchesEdge = true
      }

      const colorIndex = currentIndex * 4
      if (isWhiteBorderPixel(
        imageData[colorIndex],
        imageData[colorIndex + 1],
        imageData[colorIndex + 2],
      )) {
        whitePixelCount += 1
      }

      for (const [offsetX, offsetY] of NEIGHBOR_OFFSETS) {
        const nextX = x + offsetX
        const nextY = y + offsetY

        if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
          continue
        }

        const nextIndex = (nextY * width) + nextX
        if (visited[nextIndex] || mask[nextIndex] <= threshold) {
          continue
        }

        visited[nextIndex] = 1
        pixels.push(nextIndex)
      }
    }

    components.push({
      pixels,
      area: pixels.length,
      minX,
      minY,
      maxX,
      maxY,
      touchesEdge,
      whitePixelCount,
    })
  }

  return components
}

function scoreComponent(component: ForegroundComponent, width: number, height: number) {
  const componentWidth = component.maxX - component.minX + 1
  const componentHeight = component.maxY - component.minY + 1
  const fillRatio = component.area / (componentWidth * componentHeight)
  const whiteRatio = component.whitePixelCount / component.area
  const centerX = (component.minX + component.maxX) * 0.5
  const centerY = (component.minY + component.maxY) * 0.5
  const normalizedDistance = Math.hypot(
    (centerX - (width * 0.5)) / Math.max(1, width * 0.5),
    (centerY - (height * 0.5)) / Math.max(1, height * 0.5),
  )
  const centerScore = 1 - clamp(normalizedDistance, 0, 1)
  const edgePenalty = component.touchesEdge ? 0.72 : 1
  const whitenessPenalty = clamp(1 - (whiteRatio * 0.55), 0.25, 1)
  const solidityBonus = clamp(fillRatio, 0.35, 1)
  const centerBonus = 0.75 + (centerScore * 0.25)

  return component.area * edgePenalty * whitenessPenalty * solidityBonus * centerBonus
}

function isFrameLikeArtifact(component: ForegroundComponent, width: number, height: number) {
  const componentWidth = component.maxX - component.minX + 1
  const componentHeight = component.maxY - component.minY + 1
  const fillRatio = component.area / (componentWidth * componentHeight)
  const whiteRatio = component.whitePixelCount / component.area
  const widthSpan = componentWidth / Math.max(1, width)
  const heightSpan = componentHeight / Math.max(1, height)
  const aspectRatio = Math.max(componentWidth / Math.max(1, componentHeight), componentHeight / Math.max(1, componentWidth))

  const edgeConnectedFrame = component.touchesEdge
    && (widthSpan >= 0.78 || heightSpan >= 0.78)
    && fillRatio <= 0.28
    && whiteRatio >= 0.35
  const longThinFrameStroke = aspectRatio >= 8 && fillRatio <= 0.36 && whiteRatio >= 0.5
  const nameplateLikeStrip = (
    (widthSpan >= 0.45 && heightSpan <= 0.2)
    || (heightSpan >= 0.45 && widthSpan <= 0.2)
  ) && fillRatio <= 0.55 && whiteRatio >= 0.45

  return edgeConnectedFrame || longThinFrameStroke || nameplateLikeStrip
}

export function buildOutlineMask(
  mask: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
  threshold = 0,
) {
  const distanceField = new Float32Array(mask.length)
  distanceField.fill(Number.POSITIVE_INFINITY)
  const straightCost = 1
  const diagonalCost = Math.SQRT2

  for (let index = 0; index < mask.length; index += 1) {
    if (mask[index] > threshold) {
      distanceField[index] = 0
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width) + x
      let bestDistance = distanceField[index]

      if (x > 0) bestDistance = Math.min(bestDistance, distanceField[index - 1] + straightCost)
      if (y > 0) bestDistance = Math.min(bestDistance, distanceField[index - width] + straightCost)
      if (x > 0 && y > 0) bestDistance = Math.min(bestDistance, distanceField[index - width - 1] + diagonalCost)
      if (x < width - 1 && y > 0) bestDistance = Math.min(bestDistance, distanceField[index - width + 1] + diagonalCost)

      distanceField[index] = bestDistance
    }
  }

  for (let y = height - 1; y >= 0; y -= 1) {
    for (let x = width - 1; x >= 0; x -= 1) {
      const index = (y * width) + x
      let bestDistance = distanceField[index]

      if (x < width - 1) bestDistance = Math.min(bestDistance, distanceField[index + 1] + straightCost)
      if (y < height - 1) bestDistance = Math.min(bestDistance, distanceField[index + width] + straightCost)
      if (x < width - 1 && y < height - 1) bestDistance = Math.min(bestDistance, distanceField[index + width + 1] + diagonalCost)
      if (x > 0 && y < height - 1) bestDistance = Math.min(bestDistance, distanceField[index + width - 1] + diagonalCost)

      distanceField[index] = bestDistance
    }
  }

  const outlineMask = new Uint8ClampedArray(mask.length)
  const fadeStart = Math.max(0, radius - OUTLINE_FEATHER)
  const fadeEnd = radius + 0.35

  for (let index = 0; index < mask.length; index += 1) {
    if (mask[index] > threshold) {
      continue
    }

    const distance = distanceField[index]
    if (!Number.isFinite(distance) || distance > fadeEnd) {
      continue
    }

    outlineMask[index] = distance <= fadeStart
      ? 255
      : Math.round(255 * (1 - smoothstep(fadeStart, fadeEnd, distance)))
  }

  return outlineMask
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load generated image.'))
    image.src = source
  })
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const normalized = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return normalized * normalized * (3 - (2 * normalized))
}
