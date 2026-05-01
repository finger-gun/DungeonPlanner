import {
  attributeArray,
  Fn,
  If,
  Loop,
  float,
  int,
  instanceIndex,
  vec4,
} from 'three/tsl'
import { GRID_SIZE, getCellKey, type GridCell } from '../../hooks/useSnapToGrid'
import type { FloorDirtyRect } from '../../store/floorDirtyDomains'
import {
  prepareBakedFloorLightFieldBuild,
  prepareBakedFloorLightFieldWorkerBuild,
  type BakedFloorLightFieldBuildInput,
  type BakedFloorLightFieldWorkerChunk,
  type BakedFloorLightFieldWorkerInput,
  type BakedFloorLightFieldWorkerLightSource,
  type PreparedBakedFloorLightFieldBuild,
} from '../dungeonLightField'

export const DEFAULT_FLOOR_LIGHT_COMPUTE_WORKGROUP_SIZE = 64
export const DEFAULT_FLOOR_LIGHT_COMPUTE_MAX_LIGHTS = 128
export const FLOOR_LIGHT_COMPUTE_CELL_STRIDE = 4
export const FLOOR_LIGHT_COMPUTE_LIGHT_VECTORS_PER_LIGHT = 3
export const FLOOR_LIGHT_COMPUTE_CONFIG_VECTORS = 3

export type FloorLightComputePrototypeOptions = {
  maxLightsPerDispatch?: number
  workgroupSize?: number
}

export type FloorLightComputePrototypePackInput = {
  floorId: string
  sourceHash: string
  workerInput: BakedFloorLightFieldWorkerInput
  requestedDirtyRegion?: FloorDirtyRect
  maxLightsPerDispatch?: number
}

export type FloorLightComputePrototypeBuffer<TArray extends Int32Array | Float32Array> = {
  format: 'ivec4' | 'vec4'
  stride: number
  data: TArray
}

export type FloorLightComputePrototypePackedBuffers = {
  cellData: FloorLightComputePrototypeBuffer<Int32Array>
  lightData: FloorLightComputePrototypeBuffer<Float32Array>
  lightFlags: FloorLightComputePrototypeBuffer<Int32Array>
  configData: FloorLightComputePrototypeBuffer<Int32Array>
  outputData: FloorLightComputePrototypeBuffer<Float32Array>
}

export type FloorLightComputePrototypePackedJob = {
  floorId: string
  sourceHash: string
  chunkSize: number
  requestedDirtyRegion: FloorDirtyRect
  dispatchDirtyRegion: FloorDirtyRect
  dirtyChunkKeys: string[]
  cellKeys: string[]
  lightKeys: string[]
  flickerLightKeys: string[]
  cellCount: number
  lightCount: number
  truncatedLightCount: number
  solidWallCount: number
  cornerBlockingWallCount: number
  buffers: FloorLightComputePrototypePackedBuffers
}

export type FloorLightComputePrototypeDispatch = {
  entryPoint: 'one-cell-per-invocation'
  invocationCount: number
  workgroupSize: number
  workgroupCount: [number, number, number]
  computeNode: unknown
  bufferNodes: {
    cellData: unknown
    lightData: unknown
    outputData: unknown
  }
}

export type PreparedFloorLightComputePrototype = {
  prepared: PreparedBakedFloorLightFieldBuild
  workerInput: BakedFloorLightFieldWorkerInput
  packed: FloorLightComputePrototypePackedJob
  dispatch: FloorLightComputePrototypeDispatch
}

type PackedCellEntry = {
  cellKey: string
  cellX: number
  cellZ: number
  chunkX: number
  chunkZ: number
}

export function packFloorLightComputePrototype({
  floorId,
  sourceHash,
  workerInput,
  requestedDirtyRegion,
  maxLightsPerDispatch = DEFAULT_FLOOR_LIGHT_COMPUTE_MAX_LIGHTS,
}: FloorLightComputePrototypePackInput): FloorLightComputePrototypePackedJob {
  const clampedMaxLights = Math.max(0, Math.floor(maxLightsPerDispatch))
  const dirtyChunks = [...workerInput.chunks].sort(compareChunks)
  const packedCells = collectPackedCells(dirtyChunks)
  const dispatchDirtyRegion = buildDirtyRectFromCells(packedCells)
  const requestedRegion = requestedDirtyRegion ?? dispatchDirtyRegion
  const flickerLightKeySet = new Set(workerInput.flickerStaticLightSources.map((lightSource) => lightSource.key))
  const selectedLightSources = [...workerInput.staticLightSources]
    .sort((left, right) => left.key.localeCompare(right.key))
    .slice(0, clampedMaxLights)
  const truncatedLightCount = Math.max(workerInput.staticLightSources.length - selectedLightSources.length, 0)

  const cellData = new Int32Array(packedCells.length * FLOOR_LIGHT_COMPUTE_CELL_STRIDE)
  packedCells.forEach((cell, index) => {
    const offset = index * FLOOR_LIGHT_COMPUTE_CELL_STRIDE
    cellData[offset + 0] = cell.cellX
    cellData[offset + 1] = cell.cellZ
    cellData[offset + 2] = cell.chunkX
    cellData[offset + 3] = cell.chunkZ
  })

  const lightData = new Float32Array(selectedLightSources.length * FLOOR_LIGHT_COMPUTE_LIGHT_VECTORS_PER_LIGHT * 4)
  selectedLightSources.forEach((lightSource, index) => {
    const offset = index * FLOOR_LIGHT_COMPUTE_LIGHT_VECTORS_PER_LIGHT * 4
    lightData[offset + 0] = lightSource.position[0]
    lightData[offset + 1] = lightSource.position[1]
    lightData[offset + 2] = lightSource.position[2]
    lightData[offset + 3] = lightSource.light.distance
    lightData[offset + 4] = lightSource.linearColor[0]
    lightData[offset + 5] = lightSource.linearColor[1]
    lightData[offset + 6] = lightSource.linearColor[2]
    lightData[offset + 7] = lightSource.light.intensity
    lightData[offset + 8] = lightSource.light.decay
    lightData[offset + 9] = 0
    lightData[offset + 10] = 0
    lightData[offset + 11] = 0
  })

  const lightFlags = new Int32Array(selectedLightSources.length * 4)
  selectedLightSources.forEach((lightSource, index) => {
    const offset = index * 4
    lightFlags[offset + 0] = flickerLightKeySet.has(lightSource.key) ? 1 : 0
    lightFlags[offset + 1] = 0
    lightFlags[offset + 2] = 0
    lightFlags[offset + 3] = 0
  })

  const dispatchWidth = dispatchDirtyRegion
    ? dispatchDirtyRegion.maxCellX - dispatchDirtyRegion.minCellX + 1
    : 0
  const dispatchHeight = dispatchDirtyRegion
    ? dispatchDirtyRegion.maxCellZ - dispatchDirtyRegion.minCellZ + 1
    : 0
  const configData = new Int32Array(FLOOR_LIGHT_COMPUTE_CONFIG_VECTORS * 4)
  configData[0] = dispatchDirtyRegion?.minCellX ?? 0
  configData[1] = dispatchDirtyRegion?.minCellZ ?? 0
  configData[2] = dispatchWidth
  configData[3] = dispatchHeight
  configData[4] = packedCells.length
  configData[5] = selectedLightSources.length
  configData[6] = workerInput.solidWalls.length
  configData[7] = workerInput.cornerBlockingWalls.length
  configData[8] = workerInput.chunkSize
  configData[9] = truncatedLightCount
  configData[10] = workerInput.flickerStaticLightSources.length
  configData[11] = dirtyChunks.length

  return {
    floorId,
    sourceHash,
    chunkSize: workerInput.chunkSize,
    requestedDirtyRegion: requestedRegion,
    dispatchDirtyRegion,
    dirtyChunkKeys: dirtyChunks.map((chunk) => chunk.key),
    cellKeys: packedCells.map((cell) => cell.cellKey),
    lightKeys: selectedLightSources.map((lightSource) => lightSource.key),
    flickerLightKeys: selectedLightSources
      .filter((lightSource) => flickerLightKeySet.has(lightSource.key))
      .map((lightSource) => lightSource.key),
    cellCount: packedCells.length,
    lightCount: selectedLightSources.length,
    truncatedLightCount,
    solidWallCount: workerInput.solidWalls.length,
    cornerBlockingWallCount: workerInput.cornerBlockingWalls.length,
    buffers: {
      cellData: {
        format: 'ivec4',
        stride: FLOOR_LIGHT_COMPUTE_CELL_STRIDE,
        data: cellData,
      },
      lightData: {
        format: 'vec4',
        stride: FLOOR_LIGHT_COMPUTE_LIGHT_VECTORS_PER_LIGHT * 4,
        data: lightData,
      },
      lightFlags: {
        format: 'ivec4',
        stride: 4,
        data: lightFlags,
      },
      configData: {
        format: 'ivec4',
        stride: 4,
        data: configData,
      },
      outputData: {
        format: 'vec4',
        stride: 4,
        data: new Float32Array(packedCells.length * 4),
      },
    },
  }
}

export function createFloorLightComputePrototypeDispatch(
  packed: FloorLightComputePrototypePackedJob,
  options: FloorLightComputePrototypeOptions = {},
): FloorLightComputePrototypeDispatch {
  const workgroupSize = Math.max(1, Math.floor(options.workgroupSize ?? DEFAULT_FLOOR_LIGHT_COMPUTE_WORKGROUP_SIZE))
  const invocationCount = packed.cellCount
  const workgroupCountX = invocationCount === 0 ? 0 : Math.ceil(invocationCount / workgroupSize)

  const cellDataNode = attributeArray(packed.buffers.cellData.data, 'ivec4').setName('floorLightPrototypeCells')
  const lightDataNode = attributeArray(packed.buffers.lightData.data, 'vec4').setName('floorLightPrototypeLights')
  const outputDataNode = attributeArray(packed.buffers.outputData.data, 'vec4').setName('floorLightPrototypeOutput')

  const computeNode = Fn(() => {
    const cell = cellDataNode.element(instanceIndex)
    const cellWorldX = float(cell.x).add(float(0.5)).mul(float(GRID_SIZE))
    const cellWorldZ = float(cell.y).add(float(0.5)).mul(float(GRID_SIZE))
    const accumulated = vec4(0).toVar()

    Loop(packed.lightCount, ({ i }) => {
      const lightBaseIndex = int(i).mul(int(FLOOR_LIGHT_COMPUTE_LIGHT_VECTORS_PER_LIGHT))
      const positionAndDistance = lightDataNode.element(lightBaseIndex)
      const colorAndIntensity = lightDataNode.element(lightBaseIndex.add(int(1)))
      const dx = positionAndDistance.x.sub(cellWorldX)
      const dz = positionAndDistance.z.sub(cellWorldZ)
      const distanceSquared = dx.mul(dx).add(dz.mul(dz))
      const radiusSquared = positionAndDistance.w.mul(positionAndDistance.w)

      If(distanceSquared.lessThanEqual(radiusSquared), () => {
        accumulated.assign(
          accumulated.add(
            vec4(colorAndIntensity.xyz.mul(colorAndIntensity.w), colorAndIntensity.w),
          ),
        )
      })
    })

    outputDataNode.element(instanceIndex).assign(accumulated)
  })()

  return {
    entryPoint: 'one-cell-per-invocation',
    invocationCount,
    workgroupSize,
    workgroupCount: [workgroupCountX, 1, 1],
    computeNode: invocationCount > 0 ? computeNode.compute(invocationCount).setName('Prototype Floor Light Compute') : null,
    bufferNodes: {
      cellData: cellDataNode,
      lightData: lightDataNode,
      outputData: outputDataNode,
    },
  }
}

export function prepareFloorLightComputePrototype(
  input: BakedFloorLightFieldBuildInput,
  options: FloorLightComputePrototypeOptions = {},
): PreparedFloorLightComputePrototype | null {
  const prepared = prepareBakedFloorLightFieldBuild(input)
  const workerBuild = prepareBakedFloorLightFieldWorkerBuild(prepared)
  if (!workerBuild) {
    return null
  }

  return prepareFloorLightComputePrototypeFromBuild(prepared, workerBuild, options)
}

export function prepareFloorLightComputePrototypeFromBuild(
  prepared: PreparedBakedFloorLightFieldBuild,
  workerBuild: Pick<NonNullable<ReturnType<typeof prepareBakedFloorLightFieldWorkerBuild>>, 'workerInput'>,
  options: FloorLightComputePrototypeOptions = {},
): PreparedFloorLightComputePrototype | null {
  const { workerInput } = workerBuild

  const packed = packFloorLightComputePrototype({
    floorId: prepared.floorId,
    sourceHash: prepared.sourceHash,
    workerInput,
    requestedDirtyRegion: prepared.dirtyHint?.dirtyCellRect ?? null,
    maxLightsPerDispatch: options.maxLightsPerDispatch,
  })
  if (packed.cellCount === 0 || packed.lightCount === 0) {
    return null
  }

  return {
    prepared,
    workerInput,
    packed,
    dispatch: createFloorLightComputePrototypeDispatch(packed, options),
  }
}

export function getFloorLightComputePrototypeTransferables(
  packed: FloorLightComputePrototypePackedJob,
) {
  return [
    packed.buffers.cellData.data.buffer,
    packed.buffers.lightData.data.buffer,
    packed.buffers.lightFlags.data.buffer,
    packed.buffers.configData.data.buffer,
    packed.buffers.outputData.data.buffer,
  ]
}

function collectPackedCells(chunks: BakedFloorLightFieldWorkerChunk[]) {
  const seenCellKeys = new Set<string>()
  const packedCells: PackedCellEntry[] = []

  chunks.forEach((chunk) => {
    [...chunk.cellKeys]
      .sort(compareCellKeys)
      .forEach((cellKey) => {
        if (seenCellKeys.has(cellKey)) {
          return
        }

        const cell = parseCellKey(cellKey)
        if (!cell) {
          return
        }

        seenCellKeys.add(cellKey)
        packedCells.push({
          cellKey,
          cellX: cell[0],
          cellZ: cell[1],
          chunkX: chunk.chunkX,
          chunkZ: chunk.chunkZ,
        })
      })
  })

  return packedCells
}

function buildDirtyRectFromCells(cells: PackedCellEntry[]): FloorDirtyRect {
  if (cells.length === 0) {
    return null
  }

  let minCellX = Number.POSITIVE_INFINITY
  let maxCellX = Number.NEGATIVE_INFINITY
  let minCellZ = Number.POSITIVE_INFINITY
  let maxCellZ = Number.NEGATIVE_INFINITY

  cells.forEach((cell) => {
    minCellX = Math.min(minCellX, cell.cellX)
    maxCellX = Math.max(maxCellX, cell.cellX)
    minCellZ = Math.min(minCellZ, cell.cellZ)
    maxCellZ = Math.max(maxCellZ, cell.cellZ)
  })

  return {
    minCellX,
    maxCellX,
    minCellZ,
    maxCellZ,
  }
}

function compareChunks(left: BakedFloorLightFieldWorkerChunk, right: BakedFloorLightFieldWorkerChunk) {
  return left.chunkZ - right.chunkZ || left.chunkX - right.chunkX
}

function compareCellKeys(left: string, right: string) {
  const leftCell = parseCellKey(left)
  const rightCell = parseCellKey(right)
  if (!leftCell || !rightCell) {
    return left.localeCompare(right)
  }

  return leftCell[1] - rightCell[1] || leftCell[0] - rightCell[0]
}

function parseCellKey(cellKey: string): GridCell | null {
  const [cellXPart, cellZPart] = cellKey.split(':')
  const cellX = Number.parseInt(cellXPart ?? '', 10)
  const cellZ = Number.parseInt(cellZPart ?? '', 10)
  if (Number.isNaN(cellX) || Number.isNaN(cellZ)) {
    return null
  }

  return [cellX, cellZ]
}

export function createPrototypeDirtyHint(cells: GridCell[]): NonNullable<BakedFloorLightFieldBuildInput['dirtyHint']> {
  return {
    sequence: 1,
    dirtyCellRect: buildDirtyRectFromCells(cells.map((cell) => ({
      cellKey: getCellKey(cell),
      cellX: cell[0],
      cellZ: cell[1],
      chunkX: 0,
      chunkZ: 0,
    }))),
    dirtyWallKeys: [],
    affectedObjectIds: [],
    fullRefresh: false,
  }
}

export function isPrototypeLightIncluded(
  lightKey: string,
  packed: FloorLightComputePrototypePackedJob,
) {
  return packed.lightKeys.includes(lightKey)
}

export function getPrototypeLightBufferOffset(
  packed: FloorLightComputePrototypePackedJob,
  lightKey: string,
) {
  const lightIndex = packed.lightKeys.indexOf(lightKey)
  return lightIndex === -1 ? -1 : lightIndex * FLOOR_LIGHT_COMPUTE_LIGHT_VECTORS_PER_LIGHT * 4
}

export function serializePrototypeLightSource(
  lightSource: BakedFloorLightFieldWorkerLightSource,
) {
  return {
    key: lightSource.key,
    position: [...lightSource.position] as [number, number, number],
    linearColor: [...lightSource.linearColor] as [number, number, number],
    light: {
      intensity: lightSource.light.intensity,
      distance: lightSource.light.distance,
      decay: lightSource.light.decay,
    },
  }
}
