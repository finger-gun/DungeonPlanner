import { getContentPackAssetById } from '../../content-packs/registry'
import { GRID_SIZE } from '../../hooks/useSnapToGrid'
import {
  attributeArray,
  Break,
  Fn,
  If,
  Loop,
  float,
  int,
  instanceIndex,
  vec4,
} from 'three/tsl'
import type { StorageBufferAttribute } from 'three/webgpu'
import type { SplineWallGraph } from '../../store/splineWallGraph'
import {
  createSplineWallQueryCache,
  getSplineWallSegmentQueryData,
  type SplineWallQueryEdge,
  type SplineWallSegmentQueryData,
} from '../../store/splineWallQueries'
import {
  buildRoomSplineWallChainsFromGraph,
  buildSampledSplineWallFrames,
  DEFAULT_SPLINE_WALL_HEIGHT,
  DEFAULT_SPLINE_WALL_THICKNESS,
  DEFAULT_SPLINE_WALL_UV_SCALE,
  SPLINE_WALL_GEOMETRY_EPSILON,
  getSharedRenderableSegmentCutouts,
  type SampledSplineWallFrame,
  type SplineWallGeometryData,
  type SplineWallGeometryOptions,
} from '../../store/splineWalls'

export const DEFAULT_SPLINE_WALL_COMPUTE_WORKGROUP_SIZE = 64
const DEFAULT_SPLINE_WALL_COLLAPSE_PATH_STEP = 0.125
const DEFAULT_SPLINE_WALL_COLLAPSE_HEIGHT_STEP = 0.125
const DEFAULT_SPLINE_WALL_COLLAPSE_ARCH_SLICES = 6
const SPLINE_WALL_COLLAPSE_SHAPE_RECTANGLE = 0
const SPLINE_WALL_COLLAPSE_SHAPE_ARCHED = 1

type SplineWallComputePrototypeChain = {
  roomId: string
  closed: boolean
  frames: SampledSplineWallFrame[]
  wallBaseHeight?: number
  wallHeight?: number
}

type SplineWallComputePrototypeCutout = {
  origin: readonly [number, number]
  tangent: readonly [number, number]
  startDistance: number
  endDistance: number
  bottomHeight: number
  topHeight: number
  halfThickness: number
  archBaseHeight: number
  radius: number
  shapeType: number
  segmentLength: number
  segmentKey: string
  pathEdges: readonly SplineWallComputePrototypeCutoutPathEdge[]
  wallBaseHeight: number
  wallTopHeight: number
}

export type SplineWallComputePrototypeDebugCutout = SplineWallComputePrototypeCutout

type SplineWallComputePrototypeCutoutPathEdge = {
  start: readonly [number, number]
  end: readonly [number, number]
  tangent: readonly [number, number]
  normal: readonly [number, number]
  startRatio: number
  endRatio: number
  startDistance: number
  endDistance: number
}

type SplineWallComputePrototypeVertexDescriptor = {
  pathIndex: number
  lateralOffset: number
  height: number
  u: number
  v: number
  normalBasis: readonly [number, number, number]
}

type SplineWallComputePrototypeChainGeometry = {
  vertexPathData: number[]
  vertexSurfaceData: number[]
  vertexNormalData: number[]
  indexData: number[]
  vertexCount: number
  indexCount: number
}

export type SplineWallComputePrototypeOptions = SplineWallGeometryOptions & {
  workgroupSize?: number
}

export type SplineWallComputePrototypeBuffer<TArray extends Int32Array | Float32Array> = {
  format: 'ivec4' | 'vec4' | 'int'
  stride: number
  data: TArray
}

export type SplineWallComputePrototypeIndexBuffer = SplineWallComputePrototypeBuffer<Int32Array>

export type SplineWallComputePrototypePackedBuffers = {
  chainRanges: SplineWallComputePrototypeBuffer<Int32Array>
  pathData: SplineWallComputePrototypeBuffer<Float32Array>
  vertexPathData: SplineWallComputePrototypeBuffer<Int32Array>
  vertexSurfaceData: SplineWallComputePrototypeBuffer<Float32Array>
  vertexNormalData: SplineWallComputePrototypeBuffer<Float32Array>
  outputPositionData: SplineWallComputePrototypeBuffer<Float32Array>
  outputNormalData: SplineWallComputePrototypeBuffer<Float32Array>
  outputUvData: SplineWallComputePrototypeBuffer<Float32Array>
  cutoutFrameData: SplineWallComputePrototypeBuffer<Float32Array>
  cutoutBoundsData: SplineWallComputePrototypeBuffer<Float32Array>
  cutoutMetaData: SplineWallComputePrototypeBuffer<Float32Array>
  cutoutTypeData: SplineWallComputePrototypeBuffer<Int32Array>
  indexData: SplineWallComputePrototypeIndexBuffer
}

export type SplineWallComputePrototypePackedJob = {
  floorId: string
  chainCount: number
  cutoutCount: number
  pathPointCount: number
  vertexCount: number
  indexCount: number
  uvScale: number
  chainRoomIds: string[]
  cutouts: SplineWallComputePrototypeCutout[]
  buffers: SplineWallComputePrototypePackedBuffers
}

export type SplineWallComputePrototypeDispatch = {
  entryPoint: 'one-vertex-per-invocation'
  invocationCount: number
  workgroupSize: number
  workgroupCount: [number, number, number]
  computeNode: unknown
  collapseEntryPoint: 'one-triangle-per-invocation' | null
  collapseInvocationCount: number
  collapseWorkgroupCount: [number, number, number]
  collapseComputeNode: unknown
  bufferAttributes: {
    pathData: StorageBufferAttribute
    vertexPathData: StorageBufferAttribute
    vertexSurfaceData: StorageBufferAttribute
    vertexNormalData: StorageBufferAttribute
    outputPositionData: StorageBufferAttribute
    outputNormalData: StorageBufferAttribute
    outputUvData: StorageBufferAttribute
    indexData: StorageBufferAttribute
  }
  bufferNodes: {
    pathData: unknown
    vertexPathData: unknown
    vertexSurfaceData: unknown
    vertexNormalData: unknown
    outputPositionData: unknown
    outputNormalData: unknown
    outputUvData: unknown
    indexData: unknown
  }
}

export type PreparedSplineWallComputePrototype = {
  packed: SplineWallComputePrototypePackedJob
  dispatch: SplineWallComputePrototypeDispatch
}

export function prepareSplineWallComputePrototype({
  floorId,
  splineWallGraph,
  visibleLayerIds = null,
  suppressedWallKeys = new Set(),
  roomIds = null,
  ...options
}: {
  floorId: string
  splineWallGraph: SplineWallGraph
  visibleLayerIds?: ReadonlySet<string> | null
  suppressedWallKeys?: ReadonlySet<string>
  roomIds?: ReadonlySet<string> | null
} & SplineWallComputePrototypeOptions): PreparedSplineWallComputePrototype | null {
  const packed = packSplineWallComputePrototype({
    floorId,
    splineWallGraph,
    visibleLayerIds,
    suppressedWallKeys,
    roomIds,
    ...options,
  })
  if (!packed) {
    return null
  }

  return {
    packed,
    dispatch: createSplineWallComputePrototypeDispatch(packed, options),
  }
}

export function packSplineWallComputePrototype({
  floorId,
  splineWallGraph,
  visibleLayerIds = null,
  suppressedWallKeys = new Set(),
  roomIds = null,
  ...options
}: {
  floorId: string
  splineWallGraph: SplineWallGraph
  visibleLayerIds?: ReadonlySet<string> | null
  suppressedWallKeys?: ReadonlySet<string>
  roomIds?: ReadonlySet<string> | null
} & SplineWallComputePrototypeOptions): SplineWallComputePrototypePackedJob | null {
  const uvScale = Math.max(options.uvScale ?? DEFAULT_SPLINE_WALL_UV_SCALE, SPLINE_WALL_GEOMETRY_EPSILON)
  const cutouts = collectSplineWallComputePrototypeDebugCutouts(
    splineWallGraph,
    visibleLayerIds,
    roomIds,
    options,
  )
  const cutoutPathTargets = buildSplineWallComputePrototypeCutoutPathTargets(cutouts)
  const chains = buildRoomSplineWallChainsFromGraph(
    splineWallGraph,
    visibleLayerIds,
    suppressedWallKeys,
    roomIds,
    options.wallHeight ?? DEFAULT_SPLINE_WALL_HEIGHT,
    false,
    options,
  )
  const sampledChains: SplineWallComputePrototypeChain[] = chains
    .map((chain) => ({
      roomId: chain.roomId,
      closed: chain.closed,
      frames: densifySplineWallComputeFrames(
        buildSampledSplineWallFrames(chain, options),
        chain.closed,
        cutouts.length > 0 ? DEFAULT_SPLINE_WALL_COLLAPSE_PATH_STEP : null,
        cutoutPathTargets,
      ),
      wallBaseHeight: chain.wallBaseHeight,
      wallHeight: chain.wallHeight,
    }))
    .filter((entry) => entry.frames.length >= 2)

  if (sampledChains.length === 0) {
    return null
  }

  const totalPathPointCount = sampledChains.reduce((sum, chain) => sum + chain.frames.length, 0)
  const chainRanges = new Int32Array(sampledChains.length * 4)
  const pathData = new Float32Array(totalPathPointCount * 4)
  const vertexPathDataParts: number[] = []
  const vertexSurfaceDataParts: number[] = []
  const vertexNormalDataParts: number[] = []
  const indexDataParts: number[] = []

  let pathOffset = 0
  let vertexOffset = 0

  sampledChains.forEach((chain, chainIndex) => {
    chain.frames.forEach((frame, frameIndex) => {
      const offset = (pathOffset + frameIndex) * 4
      pathData[offset + 0] = frame.position[0]
      pathData[offset + 1] = frame.position[1]
      pathData[offset + 2] = frame.normal[0]
      pathData[offset + 3] = frame.normal[1]
    })

    const chainGeometry = buildSplineWallComputeChainGeometry(chain, pathOffset, vertexOffset, options, cutouts)
    appendSplineWallComputeNumberArray(vertexPathDataParts, chainGeometry.vertexPathData)
    appendSplineWallComputeNumberArray(vertexSurfaceDataParts, chainGeometry.vertexSurfaceData)
    appendSplineWallComputeNumberArray(vertexNormalDataParts, chainGeometry.vertexNormalData)
    appendSplineWallComputeNumberArray(indexDataParts, chainGeometry.indexData)

    const rangeOffset = chainIndex * 4
    chainRanges[rangeOffset + 0] = pathOffset
    chainRanges[rangeOffset + 1] = chain.frames.length
    chainRanges[rangeOffset + 2] = vertexOffset
    chainRanges[rangeOffset + 3] = chainGeometry.vertexCount

    pathOffset += chain.frames.length
    vertexOffset += chainGeometry.vertexCount
  })

  const vertexPathData = new Int32Array(vertexPathDataParts)
  const vertexSurfaceData = new Float32Array(vertexSurfaceDataParts)
  const vertexNormalData = new Float32Array(vertexNormalDataParts)
  const outputPositionData = new Float32Array(vertexOffset * 4)
  const outputNormalData = new Float32Array(vertexOffset * 4)
  const outputUvData = new Float32Array(vertexOffset * 4)
  const cutoutFrameData = new Float32Array(cutouts.length * 4)
  const cutoutBoundsData = new Float32Array(cutouts.length * 4)
  const cutoutMetaData = new Float32Array(cutouts.length * 4)
  const cutoutTypeData = new Int32Array(cutouts.length)
  const indexData = new Int32Array(indexDataParts)

  cutouts.forEach((cutout, index) => {
    const frameOffset = index * 4
    cutoutFrameData[frameOffset + 0] = cutout.origin[0]
    cutoutFrameData[frameOffset + 1] = cutout.origin[1]
    cutoutFrameData[frameOffset + 2] = cutout.tangent[0]
    cutoutFrameData[frameOffset + 3] = cutout.tangent[1]
    cutoutBoundsData[frameOffset + 0] = cutout.startDistance
    cutoutBoundsData[frameOffset + 1] = cutout.endDistance
    cutoutBoundsData[frameOffset + 2] = cutout.bottomHeight
    cutoutBoundsData[frameOffset + 3] = cutout.topHeight
    cutoutMetaData[frameOffset + 0] = cutout.halfThickness
    cutoutMetaData[frameOffset + 1] = cutout.archBaseHeight
    cutoutMetaData[frameOffset + 2] = cutout.radius
    cutoutMetaData[frameOffset + 3] = 0
    cutoutTypeData[index] = cutout.shapeType
  })

  return {
    floorId,
    chainCount: sampledChains.length,
    cutoutCount: cutouts.length,
    pathPointCount: totalPathPointCount,
    vertexCount: vertexOffset,
    indexCount: indexData.length,
    uvScale,
    chainRoomIds: sampledChains.map((chain) => chain.roomId),
    cutouts,
    buffers: {
      chainRanges: {
        format: 'ivec4',
        stride: 4,
        data: chainRanges,
      },
      pathData: {
        format: 'vec4',
        stride: 4,
        data: pathData,
      },
      vertexPathData: {
        format: 'ivec4',
        stride: 4,
        data: vertexPathData,
      },
      vertexSurfaceData: {
        format: 'vec4',
        stride: 4,
        data: vertexSurfaceData,
      },
      vertexNormalData: {
        format: 'vec4',
        stride: 4,
        data: vertexNormalData,
      },
      outputPositionData: {
        format: 'vec4',
        stride: 4,
        data: outputPositionData,
      },
      outputNormalData: {
        format: 'vec4',
        stride: 4,
        data: outputNormalData,
      },
      outputUvData: {
        format: 'vec4',
        stride: 4,
        data: outputUvData,
      },
      cutoutFrameData: {
        format: 'vec4',
        stride: 4,
        data: cutoutFrameData,
      },
      cutoutBoundsData: {
        format: 'vec4',
        stride: 4,
        data: cutoutBoundsData,
      },
      cutoutMetaData: {
        format: 'vec4',
        stride: 4,
        data: cutoutMetaData,
      },
      cutoutTypeData: {
        format: 'int',
        stride: 1,
        data: cutoutTypeData,
      },
      indexData: {
        format: 'int',
        stride: 1,
        data: indexData,
      },
    },
  }
}

export function createSplineWallComputePrototypeDispatch(
  packed: SplineWallComputePrototypePackedJob,
  options: SplineWallComputePrototypeOptions = {},
): SplineWallComputePrototypeDispatch {
  const workgroupSize = Math.max(1, Math.floor(options.workgroupSize ?? DEFAULT_SPLINE_WALL_COMPUTE_WORKGROUP_SIZE))
  const invocationCount = packed.vertexCount
  const workgroupCountX = invocationCount === 0 ? 0 : Math.ceil(invocationCount / workgroupSize)
  const collapseInvocationCount = Math.floor(packed.indexCount / 3)
  const collapseWorkgroupCountX = collapseInvocationCount === 0 ? 0 : Math.ceil(collapseInvocationCount / workgroupSize)
  const pathDataNode = attributeArray(packed.buffers.pathData.data, 'vec4').setName('splineWallPrototypePathData')
  const vertexPathDataNode = attributeArray(packed.buffers.vertexPathData.data, 'ivec4').setName('splineWallPrototypeVertexPathData')
  const vertexSurfaceDataNode = attributeArray(packed.buffers.vertexSurfaceData.data, 'vec4').setName('splineWallPrototypeVertexSurfaceData')
  const vertexNormalDataNode = attributeArray(packed.buffers.vertexNormalData.data, 'vec4').setName('splineWallPrototypeVertexNormalData')
  const outputPositionNode = attributeArray(packed.buffers.outputPositionData.data, 'vec4').setName('splineWallPrototypeOutputPosition')
  const outputNormalNode = attributeArray(packed.buffers.outputNormalData.data, 'vec4').setName('splineWallPrototypeOutputNormal')
  const outputUvNode = attributeArray(packed.buffers.outputUvData.data, 'vec4').setName('splineWallPrototypeOutputUv')
  const cutoutFrameDataNode = attributeArray(packed.buffers.cutoutFrameData.data, 'vec4').setName('splineWallPrototypeCutoutFrame')
  const cutoutBoundsDataNode = attributeArray(packed.buffers.cutoutBoundsData.data, 'vec4').setName('splineWallPrototypeCutoutBounds')
  const cutoutMetaDataNode = attributeArray(packed.buffers.cutoutMetaData.data, 'vec4').setName('splineWallPrototypeCutoutMeta')
  const cutoutTypeDataNode = attributeArray(packed.buffers.cutoutTypeData.data, 'int').setName('splineWallPrototypeCutoutType')
  const indexDataNode = attributeArray(packed.buffers.indexData.data, 'int').setName('splineWallPrototypeIndexData')

  const computeNode = Fn(() => {
    const vertexPathRef = vertexPathDataNode.element(instanceIndex)
    const surface = vertexSurfaceDataNode.element(instanceIndex)
    const normalBasis = vertexNormalDataNode.element(instanceIndex)
    const path = pathDataNode.element(vertexPathRef.x)
    const tangentX = path.w
    const tangentY = path.z.negate()

    outputPositionNode.element(instanceIndex).assign(vec4(
      path.x.add(surface.x.mul(path.z)),
      surface.y,
      path.y.add(surface.x.mul(path.w)),
      float(1),
    ))

    outputNormalNode.element(instanceIndex).assign(vec4(
      path.z.mul(normalBasis.x).add(tangentX.mul(normalBasis.y)),
      normalBasis.z,
      path.w.mul(normalBasis.x).add(tangentY.mul(normalBasis.y)),
      float(0),
    ))

    outputUvNode.element(instanceIndex).assign(vec4(surface.z, surface.w, float(0), float(0)))
  })()

  const collapseComputeNode = packed.cutoutCount > 0 ? Fn(() => {
    const triangleIndex = int(instanceIndex).toVar()
    const triangleOffset = triangleIndex.mul(int(3)).toVar()
    const i0 = indexDataNode.element(triangleOffset)
    const i1 = indexDataNode.element(triangleOffset.add(int(1)))
    const i2 = indexDataNode.element(triangleOffset.add(int(2)))
    const p0 = outputPositionNode.element(i0)
    const p1 = outputPositionNode.element(i1)
    const p2 = outputPositionNode.element(i2)
    const centerX = p0.x.add(p1.x).add(p2.x).div(float(3))
    const centerY = p0.y.add(p1.y).add(p2.y).div(float(3))
    const centerZ = p0.z.add(p1.z).add(p2.z).div(float(3))

    Loop(packed.cutoutCount, ({ i }) => {
      const cutoutFrame = cutoutFrameDataNode.element(i)
      const cutoutBounds = cutoutBoundsDataNode.element(i)
      const cutoutMeta = cutoutMetaDataNode.element(i)
      const cutoutType = cutoutTypeDataNode.element(i)
      const offsetX = centerX.sub(cutoutFrame.x)
      const offsetZ = centerZ.sub(cutoutFrame.y)
      const tangentX = cutoutFrame.z
      const tangentZ = cutoutFrame.w
      const localDistance = offsetX.mul(tangentX).add(offsetZ.mul(tangentZ))
      const localDepth = offsetX.mul(tangentZ.negate()).add(offsetZ.mul(tangentX))
      const withinDepth = localDepth.abs().lessThanEqual(cutoutMeta.x)
      const withinHeight = centerY.greaterThanEqual(cutoutBounds.z).and(centerY.lessThanEqual(cutoutBounds.w))
      const withinLength = localDistance.greaterThanEqual(cutoutBounds.x).and(localDistance.lessThanEqual(cutoutBounds.y))

      If(withinDepth.and(withinHeight), () => {
        If(cutoutType.equal(int(SPLINE_WALL_COLLAPSE_SHAPE_ARCHED)), () => {
          If(centerY.lessThanEqual(cutoutMeta.y), () => {
            If(withinLength, () => {
              indexDataNode.element(triangleOffset.add(int(1))).assign(i0)
              indexDataNode.element(triangleOffset.add(int(2))).assign(i0)
              Break()
            })
          }).Else(() => {
            const cutoutCenter = cutoutBounds.x.add(cutoutBounds.y).mul(float(0.5))
            const dx = localDistance.sub(cutoutCenter)
            const dy = centerY.sub(cutoutMeta.y)
            If(dx.mul(dx).add(dy.mul(dy)).lessThanEqual(cutoutMeta.z.mul(cutoutMeta.z)), () => {
              indexDataNode.element(triangleOffset.add(int(1))).assign(i0)
              indexDataNode.element(triangleOffset.add(int(2))).assign(i0)
              Break()
            })
          })
        }).Else(() => {
          If(withinLength, () => {
            indexDataNode.element(triangleOffset.add(int(1))).assign(i0)
            indexDataNode.element(triangleOffset.add(int(2))).assign(i0)
            Break()
          })
        })
      })
    })
  })() : null

  return {
    entryPoint: 'one-vertex-per-invocation',
    invocationCount,
    workgroupSize,
    workgroupCount: [workgroupCountX, 1, 1],
    computeNode: invocationCount > 0 ? computeNode.compute(invocationCount, [workgroupSize]).setName('Prototype Spline Wall Compute') : null,
    collapseEntryPoint: packed.cutoutCount > 0 ? 'one-triangle-per-invocation' : null,
    collapseInvocationCount,
    collapseWorkgroupCount: [collapseWorkgroupCountX, 1, 1],
    collapseComputeNode: collapseComputeNode && collapseInvocationCount > 0
      ? collapseComputeNode.compute(collapseInvocationCount, [workgroupSize]).setName('Prototype Spline Wall Triangle Collapse')
      : null,
    bufferAttributes: {
      pathData: getStorageBufferAttribute(pathDataNode),
      vertexPathData: getStorageBufferAttribute(vertexPathDataNode),
      vertexSurfaceData: getStorageBufferAttribute(vertexSurfaceDataNode),
      vertexNormalData: getStorageBufferAttribute(vertexNormalDataNode),
      outputPositionData: getStorageBufferAttribute(outputPositionNode),
      outputNormalData: getStorageBufferAttribute(outputNormalNode),
      outputUvData: getStorageBufferAttribute(outputUvNode),
      indexData: getStorageBufferAttribute(indexDataNode),
    },
    bufferNodes: {
      pathData: pathDataNode,
      vertexPathData: vertexPathDataNode,
      vertexSurfaceData: vertexSurfaceDataNode,
      vertexNormalData: vertexNormalDataNode,
      outputPositionData: outputPositionNode,
      outputNormalData: outputNormalNode,
      outputUvData: outputUvNode,
      indexData: indexDataNode,
    },
  }
}

export function getSplineWallComputePrototypeTransferables(packed: SplineWallComputePrototypePackedJob) {
  return [
    packed.buffers.chainRanges.data.buffer,
    packed.buffers.pathData.data.buffer,
    packed.buffers.vertexPathData.data.buffer,
    packed.buffers.vertexSurfaceData.data.buffer,
    packed.buffers.vertexNormalData.data.buffer,
    packed.buffers.outputPositionData.data.buffer,
    packed.buffers.outputNormalData.data.buffer,
    packed.buffers.outputUvData.data.buffer,
    packed.buffers.cutoutFrameData.data.buffer,
    packed.buffers.cutoutBoundsData.data.buffer,
    packed.buffers.cutoutMetaData.data.buffer,
    packed.buffers.cutoutTypeData.data.buffer,
    packed.buffers.indexData.data.buffer,
  ]
}

export function populateSplineWallComputePrototypeFallbackOutputs(
  packed: SplineWallComputePrototypePackedJob,
) {
  const { pathData, vertexPathData, vertexSurfaceData, vertexNormalData, outputPositionData, outputNormalData, outputUvData } = packed.buffers

  for (let vertexIndex = 0; vertexIndex < packed.vertexCount; vertexIndex += 1) {
    const vertexPathOffset = vertexIndex * 4
    const pathIndex = vertexPathData.data[vertexPathOffset] ?? 0
    const pathOffset = pathIndex * 4
    const surfaceOffset = vertexIndex * 4
    const normalOffset = vertexIndex * 4
    const positionOffset = vertexIndex * 4

    const lateralOffset = vertexSurfaceData.data[surfaceOffset] ?? 0
    const height = vertexSurfaceData.data[surfaceOffset + 1] ?? 0
    const u = vertexSurfaceData.data[surfaceOffset + 2] ?? 0
    const v = vertexSurfaceData.data[surfaceOffset + 3] ?? 0
    const normalCoeff = vertexNormalData.data[normalOffset] ?? 0
    const tangentCoeff = vertexNormalData.data[normalOffset + 1] ?? 0
    const upCoeff = vertexNormalData.data[normalOffset + 2] ?? 0

    const pathX = pathData.data[pathOffset] ?? 0
    const pathZ = pathData.data[pathOffset + 1] ?? 0
    const normalX = pathData.data[pathOffset + 2] ?? 0
    const normalZ = pathData.data[pathOffset + 3] ?? 0
    const tangentX = normalZ
    const tangentZ = -normalX

    outputPositionData.data[positionOffset] = pathX + lateralOffset * normalX
    outputPositionData.data[positionOffset + 1] = height
    outputPositionData.data[positionOffset + 2] = pathZ + lateralOffset * normalZ
    outputPositionData.data[positionOffset + 3] = 1

    outputNormalData.data[positionOffset] = normalX * normalCoeff + tangentX * tangentCoeff
    outputNormalData.data[positionOffset + 1] = upCoeff
    outputNormalData.data[positionOffset + 2] = normalZ * normalCoeff + tangentZ * tangentCoeff
    outputNormalData.data[positionOffset + 3] = 0

    outputUvData.data[positionOffset] = u
    outputUvData.data[positionOffset + 1] = v
    outputUvData.data[positionOffset + 2] = 0
    outputUvData.data[positionOffset + 3] = 0
  }

}

export function extractSplineWallComputePrototypeGeometry(
  packed: SplineWallComputePrototypePackedJob,
): SplineWallGeometryData {
  const positions = new Float32Array(packed.vertexCount * 3)
  const normals = new Float32Array(packed.vertexCount * 3)
  const uvs = new Float32Array(packed.vertexCount * 2)

  for (let vertexIndex = 0; vertexIndex < packed.vertexCount; vertexIndex += 1) {
    const inputOffset = vertexIndex * 4
    const positionOffset = vertexIndex * 3
    const uvOffset = vertexIndex * 2

    positions[positionOffset] = packed.buffers.outputPositionData.data[inputOffset] ?? 0
    positions[positionOffset + 1] = packed.buffers.outputPositionData.data[inputOffset + 1] ?? 0
    positions[positionOffset + 2] = packed.buffers.outputPositionData.data[inputOffset + 2] ?? 0

    normals[positionOffset] = packed.buffers.outputNormalData.data[inputOffset] ?? 0
    normals[positionOffset + 1] = packed.buffers.outputNormalData.data[inputOffset + 1] ?? 0
    normals[positionOffset + 2] = packed.buffers.outputNormalData.data[inputOffset + 2] ?? 0

    uvs[uvOffset] = packed.buffers.outputUvData.data[inputOffset] ?? 0
    uvs[uvOffset + 1] = packed.buffers.outputUvData.data[inputOffset + 1] ?? 0
  }

  const baseGeometry = {
    positions,
    normals,
    uvs,
    indices: Uint32Array.from(packed.buffers.indexData.data, (value) => Math.max(value, 0)),
  } satisfies SplineWallGeometryData

  if (packed.cutoutCount === 0) {
    return baseGeometry
  }

  const cutoutLiningGeometry = buildSplineWallComputePrototypeCutoutLiningGeometry(
    packed.cutouts,
    packed.uvScale,
  )
  if (cutoutLiningGeometry.indices.length === 0) {
    return baseGeometry
  }

  return mergeSplineWallComputePrototypeGeometryData([
    baseGeometry,
    cutoutLiningGeometry,
  ])
}

export function collectSplineWallComputePrototypeDebugCutouts(
  splineWallGraph: SplineWallGraph,
  visibleLayerIds: ReadonlySet<string> | null,
  roomIds: ReadonlySet<string> | null,
  options: SplineWallComputePrototypeOptions,
) {
  const defaultWallHeight = options.wallHeight ?? DEFAULT_SPLINE_WALL_HEIGHT
  const defaultWallThickness = options.wallThickness ?? DEFAULT_SPLINE_WALL_THICKNESS
  const queryCache = createSplineWallQueryCache(splineWallGraph, {
    visibleLayerIds,
    roomIds,
    wallHeight: defaultWallHeight,
    wallThickness: defaultWallThickness,
    cornerRadius: options.cornerRadius,
    curveSubdivisions: options.curveSubdivisions,
  })
  const sharedSegmentGroups = buildSharedSplineWallSegmentGroupsForCompute(
    splineWallGraph,
    visibleLayerIds,
  )

  return Object.values(splineWallGraph.segments)
    .filter((segment) =>
      (!visibleLayerIds || visibleLayerIds.has(segment.layerId))
      && (!roomIds || (segment.roomId !== null && roomIds.has(segment.roomId))))
    .flatMap((segment) => {
      const sharedSegmentGroup = sharedSegmentGroups.get(segment.id)
      if (sharedSegmentGroup && sharedSegmentGroup.ownerSegmentId !== segment.id) {
        return []
      }

      const start = splineWallGraph.nodes[segment.startNodeId]?.position
      const end = splineWallGraph.nodes[segment.endNodeId]?.position
      if (!start || !end) {
        return []
      }

      const startWorld = toSplineWallComputeWorldPoint(start)
      const endWorld = toSplineWallComputeWorldPoint(end)
      const length = Math.hypot(endWorld[0] - startWorld[0], endWorld[1] - startWorld[1])
      if (length <= SPLINE_WALL_GEOMETRY_EPSILON) {
        return []
      }

      const tangent: [number, number] = [
        (endWorld[0] - startWorld[0]) / length,
        (endWorld[1] - startWorld[1]) / length,
      ]
      const segmentKey = sharedSegmentGroup?.ownerSegmentId ?? segment.id
      const pathEdges = buildSplineWallComputePrototypeCutoutPathEdges(
        getSplineWallSegmentQueryData(queryCache, segmentKey),
        startWorld,
        endWorld,
        tangent,
      )
      const segmentLength = pathEdges.at(-1)?.endDistance ?? length
      const resolvedWallHeight = segment.wallHeight ?? defaultWallHeight
      const halfThickness = (segment.wallThickness ?? defaultWallThickness) / 2
      const cutouts = sharedSegmentGroup
        ? getSharedRenderableSegmentCutouts(
            splineWallGraph,
            sharedSegmentGroup.ownerSegmentId,
            sharedSegmentGroup.segmentIds,
          )
        : segment.cutouts

      return cutouts.flatMap((cutout) => {
        const startRatio = Math.max(0, Math.min(cutout.startRatio, cutout.endRatio))
        const endRatio = Math.min(1, Math.max(cutout.startRatio, cutout.endRatio))
        const bottomHeight = clampSplineWallComputeValue(cutout.bottomHeight, 0, resolvedWallHeight)
        const topHeight = clampSplineWallComputeValue(
          cutout.topHeight ?? resolvedWallHeight,
          bottomHeight,
          resolvedWallHeight,
        )
        if (
          endRatio - startRatio <= SPLINE_WALL_GEOMETRY_EPSILON
          || topHeight - bottomHeight <= SPLINE_WALL_GEOMETRY_EPSILON
        ) {
          return []
        }

        const startDistance = getSplineWallComputePrototypePathDistanceAtRatio(
          pathEdges,
          startRatio,
          segmentLength,
        )
        const endDistance = getSplineWallComputePrototypePathDistanceAtRatio(
          pathEdges,
          endRatio,
          segmentLength,
        )
        const shapeType = getSplineWallComputeCutoutShapeType(cutout.assetId)
        const radius = shapeType === SPLINE_WALL_COLLAPSE_SHAPE_ARCHED
          ? Math.min((endDistance - startDistance) / 2, topHeight - bottomHeight)
          : 0
        const archBaseHeight = shapeType === SPLINE_WALL_COLLAPSE_SHAPE_ARCHED
          ? topHeight - radius
          : topHeight

        return [{
          origin: startWorld,
          tangent,
          startDistance,
          endDistance,
          bottomHeight,
          topHeight,
          halfThickness,
          archBaseHeight,
          radius,
          shapeType: radius > SPLINE_WALL_GEOMETRY_EPSILON ? shapeType : SPLINE_WALL_COLLAPSE_SHAPE_RECTANGLE,
          segmentLength,
          segmentKey,
          pathEdges,
          wallBaseHeight: 0,
          wallTopHeight: resolvedWallHeight,
        } satisfies SplineWallComputePrototypeCutout]
      })
    })
}

function buildSplineWallComputePrototypeCutoutPathEdges(
  segmentQuery: SplineWallSegmentQueryData | null,
  startWorld: readonly [number, number],
  endWorld: readonly [number, number],
  tangent: readonly [number, number],
): SplineWallComputePrototypeCutoutPathEdge[] {
  const straightLength = Math.hypot(endWorld[0] - startWorld[0], endWorld[1] - startWorld[1])
  const straightNormal: [number, number] = [-tangent[1], tangent[0]]
  if (!segmentQuery || segmentQuery.edges.length === 0 || straightLength <= SPLINE_WALL_GEOMETRY_EPSILON) {
    return straightLength <= SPLINE_WALL_GEOMETRY_EPSILON
      ? []
      : [{
          start: startWorld,
          end: endWorld,
          tangent,
          normal: straightNormal,
          startRatio: 0,
          endRatio: 1,
          startDistance: 0,
          endDistance: straightLength,
        }]
  }

  let distance = 0
  const edges = [...segmentQuery.edges]
    .map(normalizeSplineWallComputePrototypeCutoutQueryEdge)
    .filter((edge) => edge !== null)
    .sort((left, right) =>
      (left.startRatio + left.endRatio) - (right.startRatio + right.endRatio))
    .flatMap((edge) => {
      const length = Math.hypot(
        edge.end[0] - edge.start[0],
        edge.end[1] - edge.start[1],
      )
      if (length <= SPLINE_WALL_GEOMETRY_EPSILON) {
        return []
      }

      const nextEdge = {
        ...edge,
        startDistance: distance,
        endDistance: distance + length,
      } satisfies SplineWallComputePrototypeCutoutPathEdge
      distance += length
      return [nextEdge]
    })

  if (edges.length > 0) {
    return edges
  }

  return [{
    start: startWorld,
    end: endWorld,
    tangent,
    normal: straightNormal,
    startRatio: 0,
    endRatio: 1,
    startDistance: 0,
    endDistance: straightLength,
  }]
}

function normalizeSplineWallComputePrototypeCutoutQueryEdge(
  edge: SplineWallQueryEdge,
): Omit<SplineWallComputePrototypeCutoutPathEdge, 'startDistance' | 'endDistance'> | null {
  const startRatio = Math.min(edge.startRatio, edge.endRatio)
  const endRatio = Math.max(edge.startRatio, edge.endRatio)
  const forward = edge.endRatio >= edge.startRatio
  const start = forward ? edge.start : edge.end
  const end = forward ? edge.end : edge.start
  const tangent: [number, number] = forward
    ? [edge.tangent[0], edge.tangent[1]]
    : [-edge.tangent[0], -edge.tangent[1]]
  const normal: [number, number] = forward
    ? [edge.normal[0], edge.normal[1]]
    : [-edge.normal[0], -edge.normal[1]]
  const length = Math.hypot(end[0] - start[0], end[1] - start[1])
  if (
    endRatio - startRatio <= SPLINE_WALL_GEOMETRY_EPSILON
    || length <= SPLINE_WALL_GEOMETRY_EPSILON
  ) {
    return null
  }

  return {
    start,
    end,
    tangent,
    normal,
    startRatio,
    endRatio,
  }
}

function getSplineWallComputePrototypePathDistanceAtRatio(
  pathEdges: readonly SplineWallComputePrototypeCutoutPathEdge[],
  ratio: number,
  fallbackLength: number,
) {
  const clampedRatio = clampSplineWallComputeValue(ratio, 0, 1)
  for (const edge of pathEdges) {
    if (
      clampedRatio < edge.startRatio - SPLINE_WALL_GEOMETRY_EPSILON
      || clampedRatio > edge.endRatio + SPLINE_WALL_GEOMETRY_EPSILON
    ) {
      continue
    }

    const ratioSpan = edge.endRatio - edge.startRatio
    const localRatio = ratioSpan <= SPLINE_WALL_GEOMETRY_EPSILON
      ? 0
      : clampSplineWallComputeValue((clampedRatio - edge.startRatio) / ratioSpan, 0, 1)
    return edge.startDistance + ((edge.endDistance - edge.startDistance) * localRatio)
  }

  return clampedRatio * fallbackLength
}

type SharedSplineWallSegmentGroup = {
  ownerSegmentId: string
  segmentIds: string[]
}

function buildSharedSplineWallSegmentGroupsForCompute(
  splineWallGraph: SplineWallGraph,
  visibleLayerIds: ReadonlySet<string> | null,
) {
  const segmentsByGeometryKey = new Map<string, SplineWallGraph['segments'][string][]>()

  Object.values(splineWallGraph.segments).forEach((segment) => {
    if (visibleLayerIds && !visibleLayerIds.has(segment.layerId)) {
      return
    }

    const start = splineWallGraph.nodes[segment.startNodeId]?.position
    const end = splineWallGraph.nodes[segment.endNodeId]?.position
    if (!start || !end) {
      return
    }

    const geometryKey = buildCoincidentComputeSegmentKey(segment.layerId, start, end)
    const existing = segmentsByGeometryKey.get(geometryKey)
    if (existing) {
      existing.push(segment)
    } else {
      segmentsByGeometryKey.set(geometryKey, [segment])
    }
  })

  const sharedSegmentGroups = new Map<string, SharedSplineWallSegmentGroup>()
  segmentsByGeometryKey.forEach((segments) => {
    if (segments.length < 2) {
      return
    }

    const distinctRoomIds = new Set(
      segments.map((segment) => segment.roomId ?? `segment:${segment.id}`),
    )
    if (distinctRoomIds.size < 2) {
      return
    }

    const ownerSegmentId = [...segments].sort(compareComputeSegmentOwnership)[0]?.id
    if (!ownerSegmentId) {
      return
    }

    const segmentIds = [...new Set(segments.map((segment) => segment.id))]
    segmentIds.forEach((segmentId) => {
      sharedSegmentGroups.set(segmentId, {
        ownerSegmentId,
        segmentIds,
      })
    })
  })

  return sharedSegmentGroups
}

function buildCoincidentComputeSegmentKey(
  layerId: string,
  start: readonly [number, number],
  end: readonly [number, number],
) {
  const startKey = `${start[0]}:${start[1]}`
  const endKey = `${end[0]}:${end[1]}`
  return startKey <= endKey
    ? `${layerId}:${startKey}|${endKey}`
    : `${layerId}:${endKey}|${startKey}`
}

function compareComputeSegmentOwnership(
  left: SplineWallGraph['segments'][string],
  right: SplineWallGraph['segments'][string],
) {
  const leftOwnership = getComputeSegmentOwnershipOrder(left)
  const rightOwnership = getComputeSegmentOwnershipOrder(right)

  if (leftOwnership.rank !== rightOwnership.rank) {
    return leftOwnership.rank - rightOwnership.rank
  }
  if (leftOwnership.cellX !== rightOwnership.cellX) {
    return leftOwnership.cellX - rightOwnership.cellX
  }
  if (leftOwnership.cellZ !== rightOwnership.cellZ) {
    return leftOwnership.cellZ - rightOwnership.cellZ
  }
  if (leftOwnership.directionRank !== rightOwnership.directionRank) {
    return leftOwnership.directionRank - rightOwnership.directionRank
  }
  if (leftOwnership.roomId !== rightOwnership.roomId) {
    return leftOwnership.roomId.localeCompare(rightOwnership.roomId)
  }
  return left.id.localeCompare(right.id)
}

function getComputeSegmentOwnershipOrder(segment: SplineWallGraph['segments'][string]) {
  if (segment.wallKey) {
    const [cellXText = '', cellZText = '', direction = ''] = segment.wallKey.split(':')
    const cellX = Number.parseInt(cellXText, 10)
    const cellZ = Number.parseInt(cellZText, 10)
    if (Number.isFinite(cellX) && Number.isFinite(cellZ)) {
      return {
        rank: 0,
        cellX,
        cellZ,
        directionRank: getComputeWallDirectionSortRank(direction),
        roomId: segment.roomId ?? '',
      }
    }
  }

  return {
    rank: segment.wallKey ? 1 : 2,
    cellX: Number.POSITIVE_INFINITY,
    cellZ: Number.POSITIVE_INFINITY,
    directionRank: Number.POSITIVE_INFINITY,
    roomId: segment.roomId ?? '',
  }
}

function getComputeWallDirectionSortRank(direction: string) {
  switch (direction) {
    case 'north':
      return 0
    case 'east':
      return 1
    case 'south':
      return 2
    case 'west':
      return 3
    default:
      return 4
  }
}

function getSplineWallComputeCutoutShapeType(assetId: string | null) {
  const shape = assetId
    ? getContentPackAssetById(assetId)?.metadata?.openingCutoutShape
    : undefined
  return shape === 'arched'
    ? SPLINE_WALL_COLLAPSE_SHAPE_ARCHED
    : SPLINE_WALL_COLLAPSE_SHAPE_RECTANGLE
}

function densifySplineWallComputeFrames(
  frames: readonly SampledSplineWallFrame[],
  closed: boolean,
  maxStep: number | null,
  targetPoints: readonly (readonly [number, number])[] = [],
) {
  if (!maxStep || maxStep <= SPLINE_WALL_GEOMETRY_EPSILON || frames.length < 2) {
    return [...frames]
  }

  const densified: SampledSplineWallFrame[] = []
  const segmentCount = closed ? frames.length : frames.length - 1

  for (let index = 0; index < segmentCount; index += 1) {
    const current = frames[index]
    const next = frames[(index + 1) % frames.length]
    if (!current || !next) {
      continue
    }

    densified.push(current)
    const segmentLength = distanceBetweenFrames(current, next)
    const subdivisions = Math.max(1, Math.ceil(segmentLength / maxStep))
    const segmentTangent = normalizeSplineWallComputePoint([
      next.position[0] - current.position[0],
      next.position[1] - current.position[1],
    ], current.tangent)
    const segmentNormal: [number, number] = [-segmentTangent[1], segmentTangent[0]]
    const ratios = new Set<number>()

    for (let step = 1; step < subdivisions; step += 1) {
      ratios.add(Number((step / subdivisions).toFixed(6)))
    }

    if (targetPoints.length > 0) {
      const segmentX = next.position[0] - current.position[0]
      const segmentZ = next.position[1] - current.position[1]
      const segmentLengthSquared = (segmentX * segmentX) + (segmentZ * segmentZ)
      const targetTolerance = 1e-4

      if (segmentLengthSquared > SPLINE_WALL_GEOMETRY_EPSILON) {
        targetPoints.forEach((targetPoint) => {
          const offsetX = targetPoint[0] - current.position[0]
          const offsetZ = targetPoint[1] - current.position[1]
          const ratio = ((offsetX * segmentX) + (offsetZ * segmentZ)) / segmentLengthSquared
          if (ratio <= SPLINE_WALL_GEOMETRY_EPSILON || ratio >= 1 - SPLINE_WALL_GEOMETRY_EPSILON) {
            return
          }

          const projectedX = current.position[0] + (segmentX * ratio)
          const projectedZ = current.position[1] + (segmentZ * ratio)
          if (Math.hypot(targetPoint[0] - projectedX, targetPoint[1] - projectedZ) > targetTolerance) {
            return
          }

          ratios.add(Number(ratio.toFixed(6)))
        })
      }
    }

    const sortedRatios = [...ratios].sort((left, right) => left - right)
    sortedRatios.forEach((ratio) => {
      if (ratio <= SPLINE_WALL_GEOMETRY_EPSILON || ratio >= 1 - SPLINE_WALL_GEOMETRY_EPSILON) {
        return
      }

      densified.push({
        position: [
          current.position[0] + ((next.position[0] - current.position[0]) * ratio),
          current.position[1] + ((next.position[1] - current.position[1]) * ratio),
        ],
        tangent: segmentTangent,
        normal: segmentNormal,
        distance: current.distance + (segmentLength * ratio),
        offsetScale: 1,
      })
    })
  }

  if (!closed) {
    densified.push(frames.at(-1)!)
  }

  return densified
}

function buildSplineWallComputePrototypeCutoutPathTargets(
  cutouts: readonly SplineWallComputePrototypeCutout[],
) {
  const targets: [number, number][] = []

  cutouts.forEach((cutout) => {
    buildSplineWallComputePrototypeCutoutDistanceSamples(cutout).forEach((distance) => {
      const sample = sampleSplineWallComputePrototypeCutoutPath(cutout, distance)
      appendUniqueSplineWallComputeTargetPoint(targets, [
        sample.position[0],
        sample.position[1],
      ])
    })
  })

  return targets
}

function buildSplineWallComputeHeightLevels(
  wallBaseHeight: number,
  wallTopHeight: number,
  cutouts: readonly SplineWallComputePrototypeCutout[],
) {
  const levels = new Set<number>([wallBaseHeight, wallTopHeight])

  for (let height = wallBaseHeight + DEFAULT_SPLINE_WALL_COLLAPSE_HEIGHT_STEP; height < wallTopHeight - SPLINE_WALL_GEOMETRY_EPSILON; height += DEFAULT_SPLINE_WALL_COLLAPSE_HEIGHT_STEP) {
    levels.add(Number(height.toFixed(6)))
  }

  cutouts.forEach((cutout) => {
    levels.add(clampSplineWallComputeValue(cutout.bottomHeight, wallBaseHeight, wallTopHeight))
    levels.add(clampSplineWallComputeValue(cutout.topHeight, wallBaseHeight, wallTopHeight))
    if (cutout.shapeType === SPLINE_WALL_COLLAPSE_SHAPE_ARCHED) {
      levels.add(clampSplineWallComputeValue(cutout.archBaseHeight, wallBaseHeight, wallTopHeight))
      for (let step = 1; step < DEFAULT_SPLINE_WALL_COLLAPSE_ARCH_SLICES; step += 1) {
        const ratio = step / DEFAULT_SPLINE_WALL_COLLAPSE_ARCH_SLICES
        levels.add(clampSplineWallComputeValue(
          cutout.archBaseHeight + ((cutout.topHeight - cutout.archBaseHeight) * ratio),
          wallBaseHeight,
          wallTopHeight,
        ))
      }
    }
  })

  return [...levels]
    .sort((left, right) => left - right)
    .filter((height, index, values) =>
      index === 0 || Math.abs(height - (values[index - 1] ?? height)) > SPLINE_WALL_GEOMETRY_EPSILON)
}

export function applySplineWallComputePrototypeTriangleCollapse(
  packed: SplineWallComputePrototypePackedJob,
) {
  const { outputPositionData, indexData } = packed.buffers
  for (let triangleOffset = 0; triangleOffset < packed.indexCount; triangleOffset += 3) {
    const i0 = indexData.data[triangleOffset]
    const i1 = indexData.data[triangleOffset + 1]
    const i2 = indexData.data[triangleOffset + 2]
    if (i0 === undefined || i1 === undefined || i2 === undefined) {
      continue
    }

    const centerX = (
      (outputPositionData.data[(i0 * 4)] ?? 0)
      + (outputPositionData.data[(i1 * 4)] ?? 0)
      + (outputPositionData.data[(i2 * 4)] ?? 0)
    ) / 3
    const centerY = (
      (outputPositionData.data[(i0 * 4) + 1] ?? 0)
      + (outputPositionData.data[(i1 * 4) + 1] ?? 0)
      + (outputPositionData.data[(i2 * 4) + 1] ?? 0)
    ) / 3
    const centerZ = (
      (outputPositionData.data[(i0 * 4) + 2] ?? 0)
      + (outputPositionData.data[(i1 * 4) + 2] ?? 0)
      + (outputPositionData.data[(i2 * 4) + 2] ?? 0)
    ) / 3

    for (const cutout of packed.cutouts) {
      const projection = projectPointOntoSplineWallComputePrototypeCutoutPath(
        cutout,
        [centerX, centerZ],
      )
      if (!projection) {
        continue
      }

      const withinDepth = Math.abs(projection.depth) <= cutout.halfThickness + SPLINE_WALL_GEOMETRY_EPSILON
      const withinHeight = centerY >= cutout.bottomHeight - SPLINE_WALL_GEOMETRY_EPSILON
        && centerY <= cutout.topHeight + SPLINE_WALL_GEOMETRY_EPSILON
      if (!withinDepth || !withinHeight) {
        continue
      }

      let inside = projection.distance >= cutout.startDistance - SPLINE_WALL_GEOMETRY_EPSILON
        && projection.distance <= cutout.endDistance + SPLINE_WALL_GEOMETRY_EPSILON

      if (cutout.shapeType === SPLINE_WALL_COLLAPSE_SHAPE_ARCHED && centerY > cutout.archBaseHeight) {
        const centerDistance = (cutout.startDistance + cutout.endDistance) / 2
        const dx = projection.distance - centerDistance
        const dy = centerY - cutout.archBaseHeight
        inside = (dx * dx) + (dy * dy) <= (cutout.radius * cutout.radius) + SPLINE_WALL_GEOMETRY_EPSILON
      }

      if (inside) {
        indexData.data[triangleOffset + 1] = i0
        indexData.data[triangleOffset + 2] = i0
        break
      }
    }
  }
}

type SplineWallComputePrototypeCutoutFaceGroup = {
  segmentKey: string
  halfThickness: number
  segmentLength: number
  pathEdges: readonly SplineWallComputePrototypeCutoutPathEdge[]
  wallBaseHeight: number
  wallTopHeight: number
  cutouts: SplineWallComputePrototypeCutout[]
}

type SplineWallComputePrototypeFaceBoundary =
  | { kind: 'outer', side: 'left' | 'right' }
  | { kind: 'cutout', side: 'left' | 'right', cutout: SplineWallComputePrototypeCutout }

type SplineWallComputePrototypeOpenInterval = {
  start: number
  end: number
  leftBoundary: SplineWallComputePrototypeFaceBoundary
  rightBoundary: SplineWallComputePrototypeFaceBoundary
}

type SplineWallComputePrototypeSolidInterval = {
  leftBoundary: SplineWallComputePrototypeFaceBoundary
  rightBoundary: SplineWallComputePrototypeFaceBoundary
}

function buildSplineWallComputePrototypeCutoutFaceGeometry(
  cutouts: readonly SplineWallComputePrototypeCutout[],
  uvScale: number,
): SplineWallGeometryData {
  if (cutouts.length === 0) {
    return createEmptySplineWallComputePrototypeGeometryData()
  }

  const faceGroups = buildSplineWallComputePrototypeCutoutFaceGroups(cutouts)
  if (faceGroups.length === 0) {
    return createEmptySplineWallComputePrototypeGeometryData()
  }

  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  faceGroups.forEach((group) => {
    const heightLevels = buildSplineWallComputePrototypeCutoutFaceHeightLevels(group)
    if (heightLevels.length < 2) {
      return
    }

    for (let levelIndex = 0; levelIndex < heightLevels.length - 1; levelIndex += 1) {
      const bandBaseHeight = heightLevels[levelIndex] ?? group.wallBaseHeight
      const bandTopHeight = heightLevels[levelIndex + 1] ?? group.wallTopHeight
      if (bandTopHeight - bandBaseHeight <= SPLINE_WALL_GEOMETRY_EPSILON) {
        continue
      }

      const sampleHeight = (bandBaseHeight + bandTopHeight) / 2
      const solidIntervals = buildSplineWallComputePrototypeSolidIntervalsForFaceBand(group, sampleHeight)
      solidIntervals.forEach((interval) => {
        const startDistanceBottom = getSplineWallComputePrototypeFaceBoundaryDistance(group, interval.leftBoundary, bandBaseHeight)
        const startDistanceTop = getSplineWallComputePrototypeFaceBoundaryDistance(group, interval.leftBoundary, bandTopHeight)
        const endDistanceBottom = getSplineWallComputePrototypeFaceBoundaryDistance(group, interval.rightBoundary, bandBaseHeight)
        const endDistanceTop = getSplineWallComputePrototypeFaceBoundaryDistance(group, interval.rightBoundary, bandTopHeight)
        if (
          Math.max(
            endDistanceBottom - startDistanceBottom,
            endDistanceTop - startDistanceTop,
          ) <= SPLINE_WALL_GEOMETRY_EPSILON
        ) {
          return
        }

        appendSplineWallComputePrototypeWorldQuad(
          positions,
          normals,
          uvs,
          indices,
          getSplineWallComputePrototypeCutoutWorldPoint(
            group.cutouts[0]!,
            startDistanceBottom,
            group.halfThickness,
            bandBaseHeight,
          ),
          getSplineWallComputePrototypeCutoutWorldPoint(
            group.cutouts[0]!,
            startDistanceTop,
            group.halfThickness,
            bandTopHeight,
          ),
          getSplineWallComputePrototypeCutoutWorldPoint(
            group.cutouts[0]!,
            endDistanceBottom,
            group.halfThickness,
            bandBaseHeight,
          ),
          getSplineWallComputePrototypeCutoutWorldPoint(
            group.cutouts[0]!,
            endDistanceTop,
            group.halfThickness,
            bandTopHeight,
          ),
          [startDistanceBottom / uvScale, bandBaseHeight / uvScale],
          [startDistanceTop / uvScale, bandTopHeight / uvScale],
          [endDistanceBottom / uvScale, bandBaseHeight / uvScale],
          [endDistanceTop / uvScale, bandTopHeight / uvScale],
        )

        appendSplineWallComputePrototypeWorldQuad(
          positions,
          normals,
          uvs,
          indices,
          getSplineWallComputePrototypeCutoutWorldPoint(
            group.cutouts[0]!,
            endDistanceBottom,
            -group.halfThickness,
            bandBaseHeight,
          ),
          getSplineWallComputePrototypeCutoutWorldPoint(
            group.cutouts[0]!,
            endDistanceTop,
            -group.halfThickness,
            bandTopHeight,
          ),
          getSplineWallComputePrototypeCutoutWorldPoint(
            group.cutouts[0]!,
            startDistanceBottom,
            -group.halfThickness,
            bandBaseHeight,
          ),
          getSplineWallComputePrototypeCutoutWorldPoint(
            group.cutouts[0]!,
            startDistanceTop,
            -group.halfThickness,
            bandTopHeight,
          ),
          [endDistanceBottom / uvScale, bandBaseHeight / uvScale],
          [endDistanceTop / uvScale, bandTopHeight / uvScale],
          [startDistanceBottom / uvScale, bandBaseHeight / uvScale],
          [startDistanceTop / uvScale, bandTopHeight / uvScale],
        )
      })
    }
  })

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: new Uint32Array(indices),
  }
}

void buildSplineWallComputePrototypeCutoutFaceGeometry

function buildSplineWallComputePrototypeCutoutFaceGroups(
  cutouts: readonly SplineWallComputePrototypeCutout[],
) {
  const groups = new Map<string, SplineWallComputePrototypeCutoutFaceGroup>()

  cutouts.forEach((cutout) => {
    const key = [
      cutout.segmentKey,
      cutout.halfThickness.toFixed(6),
      cutout.segmentLength.toFixed(6),
      cutout.wallBaseHeight.toFixed(6),
      cutout.wallTopHeight.toFixed(6),
    ].join(':')
    const existing = groups.get(key)
    if (existing) {
      existing.cutouts.push(cutout)
      return
    }

    groups.set(key, {
      segmentKey: cutout.segmentKey,
      halfThickness: cutout.halfThickness,
      segmentLength: cutout.segmentLength,
      pathEdges: cutout.pathEdges,
      wallBaseHeight: cutout.wallBaseHeight,
      wallTopHeight: cutout.wallTopHeight,
      cutouts: [cutout],
    })
  })

  return [...groups.values()]
}

function buildSplineWallComputePrototypeCutoutFaceHeightLevels(
  group: SplineWallComputePrototypeCutoutFaceGroup,
) {
  const levels = new Set<number>([group.wallBaseHeight, group.wallTopHeight])

  group.cutouts.forEach((cutout) => {
    buildSplineWallComputePrototypeCutoutProfilePath(cutout).forEach((point) => {
      levels.add(clampSplineWallComputeValue(point.height, group.wallBaseHeight, group.wallTopHeight))
    })
  })

  return [...levels]
    .sort((left, right) => left - right)
    .filter((height, index, values) =>
      index === 0 || Math.abs(height - (values[index - 1] ?? height)) > SPLINE_WALL_GEOMETRY_EPSILON)
}

function buildSplineWallComputePrototypeSolidIntervalsForFaceBand(
  group: SplineWallComputePrototypeCutoutFaceGroup,
  sampleHeight: number,
) {
  const mergedIntervals = buildSplineWallComputePrototypeMergedOpenIntervalsForFaceBand(group, sampleHeight)

  const solidIntervals: SplineWallComputePrototypeSolidInterval[] = []
  let solidStart = 0
  let leftBoundary: SplineWallComputePrototypeFaceBoundary = { kind: 'outer', side: 'left' }

  mergedIntervals.forEach((interval) => {
    if (interval.start > solidStart + SPLINE_WALL_GEOMETRY_EPSILON) {
      solidIntervals.push({
        leftBoundary,
        rightBoundary: interval.leftBoundary,
      })
    }

    solidStart = Math.max(solidStart, interval.end)
    leftBoundary = interval.rightBoundary
  })

  if (solidStart < group.segmentLength - SPLINE_WALL_GEOMETRY_EPSILON) {
    solidIntervals.push({
      leftBoundary,
      rightBoundary: { kind: 'outer', side: 'right' },
    })
  }

  return solidIntervals
}

function buildSplineWallComputePrototypeMergedOpenIntervalsForFaceBand(
  group: SplineWallComputePrototypeCutoutFaceGroup,
  sampleHeight: number,
) {
  const openIntervals = group.cutouts
    .map((cutout) => getSplineWallComputePrototypeOpenIntervalAtHeight(cutout, sampleHeight))
    .filter((interval): interval is SplineWallComputePrototypeOpenInterval => interval !== null)
    .sort((left, right) => left.start - right.start)

  const mergedIntervals: SplineWallComputePrototypeOpenInterval[] = []
  openIntervals.forEach((interval) => {
    const previous = mergedIntervals.at(-1)
    if (!previous || interval.start > previous.end + SPLINE_WALL_GEOMETRY_EPSILON) {
      mergedIntervals.push({ ...interval })
      return
    }

    if (interval.end > previous.end) {
      previous.end = interval.end
      previous.rightBoundary = interval.rightBoundary
    }
  })

  return mergedIntervals
}

function getSplineWallComputePrototypeOpenIntervalAtHeight(
  cutout: SplineWallComputePrototypeCutout,
  height: number,
): SplineWallComputePrototypeOpenInterval | null {
  if (
    height < cutout.bottomHeight - SPLINE_WALL_GEOMETRY_EPSILON
    || height > cutout.topHeight + SPLINE_WALL_GEOMETRY_EPSILON
  ) {
    return null
  }

  const start = getSplineWallComputePrototypeCutoutBoundaryDistance(cutout, 'left', height)
  const end = getSplineWallComputePrototypeCutoutBoundaryDistance(cutout, 'right', height)
  if (end - start <= SPLINE_WALL_GEOMETRY_EPSILON) {
    return null
  }

  return {
    start,
    end,
    leftBoundary: { kind: 'cutout', side: 'left', cutout },
    rightBoundary: { kind: 'cutout', side: 'right', cutout },
  }
}

function getSplineWallComputePrototypeFaceBoundaryDistance(
  group: SplineWallComputePrototypeCutoutFaceGroup,
  boundary: SplineWallComputePrototypeFaceBoundary,
  height: number,
) {
  if (boundary.kind === 'outer') {
    return boundary.side === 'left' ? 0 : group.segmentLength
  }

  return getSplineWallComputePrototypeCutoutBoundaryDistance(boundary.cutout, boundary.side, height)
}

function getSplineWallComputePrototypeCutoutBoundaryDistance(
  cutout: SplineWallComputePrototypeCutout,
  side: 'left' | 'right',
  height: number,
) {
  if (
    cutout.shapeType === SPLINE_WALL_COLLAPSE_SHAPE_ARCHED
    && cutout.radius > SPLINE_WALL_GEOMETRY_EPSILON
    && height > cutout.archBaseHeight + SPLINE_WALL_GEOMETRY_EPSILON
  ) {
    const centerDistance = (cutout.startDistance + cutout.endDistance) / 2
    const clampedDy = Math.max(0, Math.min(height - cutout.archBaseHeight, cutout.radius))
    const dx = Math.sqrt(Math.max((cutout.radius * cutout.radius) - (clampedDy * clampedDy), 0))
    return side === 'left'
      ? centerDistance - dx
      : centerDistance + dx
  }

  return side === 'left'
    ? cutout.startDistance
    : cutout.endDistance
}

function buildSplineWallComputePrototypeCutoutLiningGeometry(
  cutouts: readonly SplineWallComputePrototypeCutout[],
  uvScale: number,
): SplineWallGeometryData {
  if (cutouts.length === 0) {
    return createEmptySplineWallComputePrototypeGeometryData()
  }

  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  cutouts.forEach((cutout) => {
    const profilePath = buildSplineWallComputePrototypeCutoutProfilePath(cutout)
    if (profilePath.length < 2) {
      return
    }

    const wallThicknessV = (cutout.halfThickness * 2) / uvScale
    let profileDistance = 0

    for (let index = 0; index < profilePath.length - 1; index += 1) {
      const current = profilePath[index]
      const next = profilePath[index + 1]
      if (!current || !next) {
        continue
      }

      const segmentLength = Math.hypot(
        next.distance - current.distance,
        next.height - current.height,
      )
      if (segmentLength <= SPLINE_WALL_GEOMETRY_EPSILON) {
        continue
      }

      const segmentStartV = profileDistance / uvScale
      const segmentEndV = (profileDistance + segmentLength) / uvScale
      appendSplineWallComputePrototypeWorldQuad(
        positions,
        normals,
        uvs,
        indices,
        getSplineWallComputePrototypeCutoutWorldPoint(
          cutout,
          current.distance,
          cutout.halfThickness,
          current.height,
        ),
        getSplineWallComputePrototypeCutoutWorldPoint(
          cutout,
          next.distance,
          cutout.halfThickness,
          next.height,
        ),
        getSplineWallComputePrototypeCutoutWorldPoint(
          cutout,
          current.distance,
          -cutout.halfThickness,
          current.height,
        ),
        getSplineWallComputePrototypeCutoutWorldPoint(
          cutout,
          next.distance,
          -cutout.halfThickness,
          next.height,
        ),
        [0, segmentStartV],
        [0, segmentEndV],
        [wallThicknessV, segmentStartV],
        [wallThicknessV, segmentEndV],
      )

      profileDistance += segmentLength
    }
  })

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: new Uint32Array(indices),
  }
}

function buildSplineWallComputePrototypeCutoutProfilePath(
  cutout: SplineWallComputePrototypeCutout,
) {
  const profilePath: Array<{ distance: number, height: number }> = []

  appendUniqueSplineWallComputeProfilePoint(profilePath, cutout.startDistance, cutout.bottomHeight)
  if (
    cutout.shapeType === SPLINE_WALL_COLLAPSE_SHAPE_ARCHED
    && cutout.radius > SPLINE_WALL_GEOMETRY_EPSILON
  ) {
    if (cutout.archBaseHeight > cutout.bottomHeight + SPLINE_WALL_GEOMETRY_EPSILON) {
      appendUniqueSplineWallComputeProfilePoint(profilePath, cutout.startDistance, cutout.archBaseHeight)
    }

    const centerDistance = (cutout.startDistance + cutout.endDistance) / 2
    for (let step = 1; step < DEFAULT_SPLINE_WALL_COLLAPSE_ARCH_SLICES; step += 1) {
      const angle = Math.PI - ((step / DEFAULT_SPLINE_WALL_COLLAPSE_ARCH_SLICES) * Math.PI)
      appendUniqueSplineWallComputeProfilePoint(
        profilePath,
        centerDistance + (Math.cos(angle) * cutout.radius),
        cutout.archBaseHeight + (Math.sin(angle) * cutout.radius),
      )
    }

    appendUniqueSplineWallComputeProfilePoint(profilePath, cutout.endDistance, cutout.archBaseHeight)
    appendUniqueSplineWallComputeProfilePoint(profilePath, cutout.endDistance, cutout.bottomHeight)
  } else {
    appendUniqueSplineWallComputeProfilePoint(profilePath, cutout.startDistance, cutout.topHeight)
    appendUniqueSplineWallComputeProfilePoint(profilePath, cutout.endDistance, cutout.topHeight)
    appendUniqueSplineWallComputeProfilePoint(profilePath, cutout.endDistance, cutout.bottomHeight)
  }

  if (cutout.bottomHeight > SPLINE_WALL_GEOMETRY_EPSILON) {
    appendUniqueSplineWallComputeProfilePoint(profilePath, cutout.startDistance, cutout.bottomHeight)
  }

  return profilePath
}

function buildSplineWallComputePrototypeCutoutDistanceSamples(
  cutout: SplineWallComputePrototypeCutout,
) {
  const distances = [cutout.startDistance, cutout.endDistance]

  if (
    cutout.shapeType === SPLINE_WALL_COLLAPSE_SHAPE_ARCHED
    && cutout.radius > SPLINE_WALL_GEOMETRY_EPSILON
  ) {
    const centerDistance = (cutout.startDistance + cutout.endDistance) / 2
    for (let step = 1; step < DEFAULT_SPLINE_WALL_COLLAPSE_ARCH_SLICES; step += 1) {
      const angle = Math.PI - ((step / DEFAULT_SPLINE_WALL_COLLAPSE_ARCH_SLICES) * Math.PI)
      distances.push(centerDistance + (Math.cos(angle) * cutout.radius))
    }
  }

  return [...distances]
    .sort((left, right) => left - right)
    .filter((distance, index, values) =>
      index === 0 || Math.abs(distance - (values[index - 1] ?? distance)) > SPLINE_WALL_GEOMETRY_EPSILON)
}

function getSplineWallComputePrototypeCutoutWorldPoint(
  cutout: SplineWallComputePrototypeCutout,
  distance: number,
  depth: number,
  height: number,
): [number, number, number] {
  const sample = sampleSplineWallComputePrototypeCutoutPath(cutout, distance)
  return [
    sample.position[0] + (sample.normal[0] * depth),
    height,
    sample.position[1] + (sample.normal[1] * depth),
  ]
}

function sampleSplineWallComputePrototypeCutoutPath(
  cutout: SplineWallComputePrototypeCutout,
  distance: number,
): {
  position: readonly [number, number]
  tangent: readonly [number, number]
  normal: readonly [number, number]
} {
  const edge = findSplineWallComputePrototypeCutoutPathEdgeAtDistance(cutout, distance)
  if (!edge) {
    const normal: [number, number] = [-cutout.tangent[1], cutout.tangent[0]]
    return {
      position: [
        cutout.origin[0] + (cutout.tangent[0] * distance),
        cutout.origin[1] + (cutout.tangent[1] * distance),
      ],
      tangent: cutout.tangent,
      normal,
    }
  }

  const edgeLength = edge.endDistance - edge.startDistance
  const localRatio = edgeLength <= SPLINE_WALL_GEOMETRY_EPSILON
    ? 0
    : clampSplineWallComputeValue((distance - edge.startDistance) / edgeLength, 0, 1)
  return {
    position: [
      edge.start[0] + ((edge.end[0] - edge.start[0]) * localRatio),
      edge.start[1] + ((edge.end[1] - edge.start[1]) * localRatio),
    ],
    tangent: edge.tangent,
    normal: edge.normal,
  }
}

function findSplineWallComputePrototypeCutoutPathEdgeAtDistance(
  cutout: SplineWallComputePrototypeCutout,
  distance: number,
) {
  if (cutout.pathEdges.length === 0) {
    return null
  }

  const clampedDistance = clampSplineWallComputeValue(distance, 0, cutout.segmentLength)
  return (
    cutout.pathEdges.find((edge) =>
      clampedDistance >= edge.startDistance - SPLINE_WALL_GEOMETRY_EPSILON
      && clampedDistance <= edge.endDistance + SPLINE_WALL_GEOMETRY_EPSILON)
    ?? cutout.pathEdges.at(-1)
    ?? null
  )
}

function appendUniqueSplineWallComputeProfilePoint(
  target: Array<{ distance: number, height: number }>,
  distance: number,
  height: number,
) {
  const previous = target.at(-1)
  if (
    previous
    && Math.abs(previous.distance - distance) <= SPLINE_WALL_GEOMETRY_EPSILON
    && Math.abs(previous.height - height) <= SPLINE_WALL_GEOMETRY_EPSILON
  ) {
    return
  }

  target.push({ distance, height })
}

function appendUniqueSplineWallComputeTargetPoint(
  target: Array<[number, number]>,
  point: [number, number],
) {
  const existing = target.find((entry) =>
    Math.abs(entry[0] - point[0]) <= SPLINE_WALL_GEOMETRY_EPSILON
    && Math.abs(entry[1] - point[1]) <= SPLINE_WALL_GEOMETRY_EPSILON)
  if (existing) {
    return
  }

  target.push(point)
}

function appendSplineWallComputePrototypeWorldQuad(
  positions: number[],
  normals: number[],
  uvs: number[],
  indices: number[],
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  c: readonly [number, number, number],
  d: readonly [number, number, number],
  uvA: readonly [number, number],
  uvB: readonly [number, number],
  uvC: readonly [number, number],
  uvD: readonly [number, number],
) {
  const normal = normalizeSplineWallComputeVector3([
    ((c[1] - a[1]) * (b[2] - a[2])) - ((c[2] - a[2]) * (b[1] - a[1])),
    ((c[2] - a[2]) * (b[0] - a[0])) - ((c[0] - a[0]) * (b[2] - a[2])),
    ((c[0] - a[0]) * (b[1] - a[1])) - ((c[1] - a[1]) * (b[0] - a[0])),
  ], [0, 1, 0])
  const baseIndex = positions.length / 3

  positions.push(...a, ...b, ...c, ...d)
  normals.push(...normal, ...normal, ...normal, ...normal)
  uvs.push(...uvA, ...uvB, ...uvC, ...uvD)
  indices.push(
    baseIndex + 0,
    baseIndex + 2,
    baseIndex + 1,
    baseIndex + 1,
    baseIndex + 2,
    baseIndex + 3,
  )
}

function mergeSplineWallComputePrototypeGeometryData(
  geometries: readonly SplineWallGeometryData[],
): SplineWallGeometryData {
  const totalPositions = geometries.reduce((sum, geometry) => sum + geometry.positions.length, 0)
  const totalNormals = geometries.reduce((sum, geometry) => sum + geometry.normals.length, 0)
  const totalUvs = geometries.reduce((sum, geometry) => sum + geometry.uvs.length, 0)
  const totalIndices = geometries.reduce((sum, geometry) => sum + geometry.indices.length, 0)

  const positions = new Float32Array(totalPositions)
  const normals = new Float32Array(totalNormals)
  const uvs = new Float32Array(totalUvs)
  const indices = new Uint32Array(totalIndices)

  let positionOffset = 0
  let normalOffset = 0
  let uvOffset = 0
  let indexOffset = 0
  let vertexOffset = 0

  geometries.forEach((geometry) => {
    positions.set(geometry.positions, positionOffset)
    normals.set(geometry.normals, normalOffset)
    uvs.set(geometry.uvs, uvOffset)
    geometry.indices.forEach((index, localIndex) => {
      indices[indexOffset + localIndex] = index + vertexOffset
    })

    positionOffset += geometry.positions.length
    normalOffset += geometry.normals.length
    uvOffset += geometry.uvs.length
    indexOffset += geometry.indices.length
    vertexOffset += geometry.positions.length / 3
  })

  return {
    positions,
    normals,
    uvs,
    indices,
  }
}

function createEmptySplineWallComputePrototypeGeometryData(): SplineWallGeometryData {
  return {
    positions: new Float32Array(0),
    normals: new Float32Array(0),
    uvs: new Float32Array(0),
    indices: new Uint32Array(0),
  }
}

function clampSplineWallComputeValue(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

function normalizeSplineWallComputePoint(
  point: readonly [number, number],
  fallback: readonly [number, number],
): [number, number] {
  const length = Math.hypot(point[0], point[1])
  if (length <= SPLINE_WALL_GEOMETRY_EPSILON) {
    return [fallback[0], fallback[1]]
  }

  return [point[0] / length, point[1] / length]
}

function normalizeSplineWallComputeVector3(
  point: readonly [number, number, number],
  fallback: readonly [number, number, number],
): [number, number, number] {
  const length = Math.hypot(point[0], point[1], point[2])
  if (length <= SPLINE_WALL_GEOMETRY_EPSILON) {
    return [fallback[0], fallback[1], fallback[2]]
  }

  return [point[0] / length, point[1] / length, point[2] / length]
}

function toSplineWallComputeWorldPoint(point: readonly [number, number]): [number, number] {
  return [point[0] * GRID_SIZE, point[1] * GRID_SIZE]
}

function appendSplineWallComputeNumberArray(
  target: number[],
  source: readonly number[],
) {
  for (let index = 0; index < source.length; index += 1) {
    target.push(source[index] ?? 0)
  }
}

function getStorageBufferAttribute(node: unknown) {
  return (node as { value: StorageBufferAttribute }).value
}

function buildSplineWallComputeChainGeometry(
  chain: SplineWallComputePrototypeChain,
  pathOffset: number,
  vertexOffset: number,
  options: SplineWallComputePrototypeOptions,
  cutouts: readonly SplineWallComputePrototypeCutout[],
): SplineWallComputePrototypeChainGeometry {
  const wallBaseHeight = chain.wallBaseHeight ?? 0
  const wallHeight = chain.wallHeight ?? options.wallHeight ?? DEFAULT_SPLINE_WALL_HEIGHT
  const wallTopHeight = wallBaseHeight + wallHeight
  const wallThickness = options.wallThickness ?? DEFAULT_SPLINE_WALL_THICKNESS
  const uvScale = Math.max(options.uvScale ?? DEFAULT_SPLINE_WALL_UV_SCALE, SPLINE_WALL_GEOMETRY_EPSILON)
  const halfThickness = wallThickness / 2
  const wallBaseV = wallBaseHeight / uvScale
  const wallTopV = wallTopHeight / uvScale
  const heightLevels = cutouts.length > 0
    ? buildSplineWallComputeHeightLevels(wallBaseHeight, wallTopHeight, cutouts)
    : [wallBaseHeight, wallTopHeight]
  const vertexPathData: number[] = []
  const vertexSurfaceData: number[] = []
  const vertexNormalData: number[] = []
  const indexData: number[] = []
  const cutoutFaceGroups = buildSplineWallComputePrototypeCutoutFaceGroups(cutouts)

  const appendVertex = (descriptor: SplineWallComputePrototypeVertexDescriptor) => {
    vertexPathData.push(descriptor.pathIndex, 0, 0, 0)
    vertexSurfaceData.push(descriptor.lateralOffset, descriptor.height, descriptor.u, descriptor.v)
    vertexNormalData.push(...descriptor.normalBasis, 0)
  }

  const appendQuad = (
    a: SplineWallComputePrototypeVertexDescriptor,
    b: SplineWallComputePrototypeVertexDescriptor,
    c: SplineWallComputePrototypeVertexDescriptor,
    d: SplineWallComputePrototypeVertexDescriptor,
  ) => {
    const baseIndex = vertexOffset + vertexPathData.length / 4
    appendVertex(a)
    appendVertex(b)
    appendVertex(c)
    appendVertex(d)
    indexData.push(
      baseIndex + 0,
      baseIndex + 2,
      baseIndex + 1,
      baseIndex + 1,
      baseIndex + 2,
      baseIndex + 3,
    )
  }

  const segmentCount = chain.closed ? chain.frames.length : chain.frames.length - 1
  for (let index = 0; index < segmentCount; index += 1) {
    const currentIndex = index
    const nextIndex = (index + 1) % chain.frames.length
    const currentFrame = chain.frames[currentIndex]
    const nextFrame = chain.frames[nextIndex]
    if (!currentFrame || !nextFrame) {
      continue
    }

    const segmentLength = distanceBetweenFrames(currentFrame, nextFrame)
    if (segmentLength <= SPLINE_WALL_GEOMETRY_EPSILON) {
      continue
    }

    const currentPathIndex = pathOffset + currentIndex
    const nextPathIndex = pathOffset + nextIndex
    const startU = currentFrame.distance / uvScale
    const endU = startU + segmentLength / uvScale
    const wallThicknessV = wallThickness / uvScale
    const currentHalfThickness = halfThickness * currentFrame.offsetScale
    const nextHalfThickness = halfThickness * nextFrame.offsetScale
    const cutoutFaceGroup = findSplineWallComputePrototypeCutoutFaceGroupForFrames(
      currentFrame,
      nextFrame,
      cutoutFaceGroups,
    )
    const currentLocalProjection = cutoutFaceGroup
      ? projectPointOntoSplineWallComputePrototypePathEdges(
          cutoutFaceGroup.pathEdges,
          currentFrame.position,
        )
      : null
    const nextLocalProjection = cutoutFaceGroup
      ? projectPointOntoSplineWallComputePrototypePathEdges(
          cutoutFaceGroup.pathEdges,
          nextFrame.position,
        )
      : null

    for (let bandIndex = 0; bandIndex < heightLevels.length - 1; bandIndex += 1) {
      const bandBaseHeight = heightLevels[bandIndex] ?? wallBaseHeight
      const bandTopHeight = heightLevels[bandIndex + 1] ?? wallTopHeight
      if (bandTopHeight - bandBaseHeight <= SPLINE_WALL_GEOMETRY_EPSILON) {
        continue
      }

      const bandBaseV = bandBaseHeight / uvScale
      const bandTopV = bandTopHeight / uvScale
      const sampleHeight = (bandBaseHeight + bandTopHeight) / 2
      const spanIntersectsOpenInterval = cutoutFaceGroup
        && currentLocalProjection
        && nextLocalProjection
        ? doesSplineWallComputePrototypeSpanIntersectOpenInterval(
            cutoutFaceGroup,
            sampleHeight,
            currentLocalProjection.distance,
            nextLocalProjection.distance,
          )
        : false

      if (!spanIntersectsOpenInterval) {
        appendQuad(
          {
            pathIndex: currentPathIndex,
            lateralOffset: currentHalfThickness,
            height: bandBaseHeight,
            u: startU,
            v: bandBaseV,
            normalBasis: [1, 0, 0],
          },
          {
            pathIndex: currentPathIndex,
            lateralOffset: currentHalfThickness,
            height: bandTopHeight,
            u: startU,
            v: bandTopV,
            normalBasis: [1, 0, 0],
          },
          {
            pathIndex: nextPathIndex,
            lateralOffset: nextHalfThickness,
            height: bandBaseHeight,
            u: endU,
            v: bandBaseV,
            normalBasis: [1, 0, 0],
          },
          {
            pathIndex: nextPathIndex,
            lateralOffset: nextHalfThickness,
            height: bandTopHeight,
            u: endU,
            v: bandTopV,
            normalBasis: [1, 0, 0],
          },
        )

        appendQuad(
          {
            pathIndex: nextPathIndex,
            lateralOffset: -nextHalfThickness,
            height: bandBaseHeight,
            u: endU,
            v: bandBaseV,
            normalBasis: [-1, 0, 0],
          },
          {
            pathIndex: nextPathIndex,
            lateralOffset: -nextHalfThickness,
            height: bandTopHeight,
            u: endU,
            v: bandTopV,
            normalBasis: [-1, 0, 0],
          },
          {
            pathIndex: currentPathIndex,
            lateralOffset: -currentHalfThickness,
            height: bandBaseHeight,
            u: startU,
            v: bandBaseV,
            normalBasis: [-1, 0, 0],
          },
          {
            pathIndex: currentPathIndex,
            lateralOffset: -currentHalfThickness,
            height: bandTopHeight,
            u: startU,
            v: bandTopV,
            normalBasis: [-1, 0, 0],
          },
        )
      }
    }

    appendQuad(
      {
        pathIndex: currentPathIndex,
        lateralOffset: -currentHalfThickness,
        height: wallTopHeight,
        u: startU,
        v: 0,
        normalBasis: [0, 0, 1],
      },
      {
        pathIndex: nextPathIndex,
        lateralOffset: -nextHalfThickness,
        height: wallTopHeight,
        u: endU,
        v: 0,
        normalBasis: [0, 0, 1],
      },
      {
        pathIndex: currentPathIndex,
        lateralOffset: currentHalfThickness,
        height: wallTopHeight,
        u: startU,
        v: wallThicknessV,
        normalBasis: [0, 0, 1],
      },
      {
        pathIndex: nextPathIndex,
        lateralOffset: nextHalfThickness,
        height: wallTopHeight,
        u: endU,
        v: wallThicknessV,
        normalBasis: [0, 0, 1],
      },
    )

    if (wallBaseHeight > SPLINE_WALL_GEOMETRY_EPSILON) {
      appendQuad(
        {
          pathIndex: currentPathIndex,
          lateralOffset: currentHalfThickness,
          height: wallBaseHeight,
          u: startU,
          v: 0,
          normalBasis: [0, 0, -1],
        },
        {
          pathIndex: nextPathIndex,
          lateralOffset: nextHalfThickness,
          height: wallBaseHeight,
          u: endU,
          v: 0,
          normalBasis: [0, 0, -1],
        },
        {
          pathIndex: currentPathIndex,
          lateralOffset: -currentHalfThickness,
          height: wallBaseHeight,
          u: startU,
          v: wallThicknessV,
          normalBasis: [0, 0, -1],
        },
        {
          pathIndex: nextPathIndex,
          lateralOffset: -nextHalfThickness,
          height: wallBaseHeight,
          u: endU,
          v: wallThicknessV,
          normalBasis: [0, 0, -1],
        },
      )
    }
  }

  if (!chain.closed) {
    const firstPathIndex = pathOffset
    const lastPathIndex = pathOffset + chain.frames.length - 1
    const firstHalfThickness = halfThickness * (chain.frames[0]?.offsetScale ?? 1)
    const lastHalfThickness = halfThickness * (chain.frames.at(-1)?.offsetScale ?? 1)
    const wallThicknessV = wallThickness / uvScale

    appendQuad(
      {
        pathIndex: firstPathIndex,
        lateralOffset: -firstHalfThickness,
        height: wallBaseHeight,
        u: 0,
        v: wallBaseV,
        normalBasis: [0, -1, 0],
      },
      {
        pathIndex: firstPathIndex,
        lateralOffset: -firstHalfThickness,
        height: wallTopHeight,
        u: 0,
        v: wallTopV,
        normalBasis: [0, -1, 0],
      },
      {
        pathIndex: firstPathIndex,
        lateralOffset: firstHalfThickness,
        height: wallBaseHeight,
        u: wallThicknessV,
        v: wallBaseV,
        normalBasis: [0, -1, 0],
      },
      {
        pathIndex: firstPathIndex,
        lateralOffset: firstHalfThickness,
        height: wallTopHeight,
        u: wallThicknessV,
        v: wallTopV,
        normalBasis: [0, -1, 0],
      },
    )

    appendQuad(
      {
        pathIndex: lastPathIndex,
        lateralOffset: lastHalfThickness,
        height: wallBaseHeight,
        u: 0,
        v: wallBaseV,
        normalBasis: [0, 1, 0],
      },
      {
        pathIndex: lastPathIndex,
        lateralOffset: lastHalfThickness,
        height: wallTopHeight,
        u: 0,
        v: wallTopV,
        normalBasis: [0, 1, 0],
      },
      {
        pathIndex: lastPathIndex,
        lateralOffset: -lastHalfThickness,
        height: wallBaseHeight,
        u: wallThicknessV,
        v: wallBaseV,
        normalBasis: [0, 1, 0],
      },
      {
        pathIndex: lastPathIndex,
        lateralOffset: -lastHalfThickness,
        height: wallTopHeight,
        u: wallThicknessV,
        v: wallTopV,
        normalBasis: [0, 1, 0],
      },
    )
  }

  return {
    vertexPathData,
    vertexSurfaceData,
    vertexNormalData,
    indexData,
    vertexCount: vertexPathData.length / 4,
    indexCount: indexData.length,
  }
}

function doesSplineWallComputePrototypeSpanIntersectOpenInterval(
  group: SplineWallComputePrototypeCutoutFaceGroup,
  sampleHeight: number,
  startDistance: number,
  endDistance: number,
) {
  const spanStart = Math.min(startDistance, endDistance)
  const spanEnd = Math.max(startDistance, endDistance)
  const mergedIntervals = buildSplineWallComputePrototypeMergedOpenIntervalsForFaceBand(group, sampleHeight)
  return mergedIntervals.some((interval) =>
    interval.start < spanEnd - SPLINE_WALL_GEOMETRY_EPSILON
    && interval.end > spanStart + SPLINE_WALL_GEOMETRY_EPSILON)
}

function findSplineWallComputePrototypeCutoutFaceGroupForFrames(
  currentFrame: SampledSplineWallFrame,
  nextFrame: SampledSplineWallFrame,
  faceGroups: readonly SplineWallComputePrototypeCutoutFaceGroup[],
) {
  if (faceGroups.length === 0) {
    return null
  }

  const midpoint: [number, number] = [
    (currentFrame.position[0] + nextFrame.position[0]) / 2,
    (currentFrame.position[1] + nextFrame.position[1]) / 2,
  ]

  for (const group of faceGroups) {
    const projection = projectPointOntoSplineWallComputePrototypePathEdges(
      group.pathEdges,
      midpoint,
    )
    if (!projection) {
      continue
    }

    if (
      projection.distance >= -SPLINE_WALL_GEOMETRY_EPSILON
      && projection.distance <= group.segmentLength + SPLINE_WALL_GEOMETRY_EPSILON
      && Math.abs(projection.depth) <= 1e-4
    ) {
      return group
    }
  }

  return null
}

function distanceBetweenFrames(left: SampledSplineWallFrame, right: SampledSplineWallFrame) {
  return Math.hypot(
    left.position[0] - right.position[0],
    left.position[1] - right.position[1],
  )
}

function projectPointOntoSplineWallComputePrototypeCutoutPath(
  cutout: SplineWallComputePrototypeCutout,
  point: readonly [number, number],
) {
  const projection = projectPointOntoSplineWallComputePrototypePathEdges(cutout.pathEdges, point)
  if (projection) {
    return projection
  }

  const localX = point[0] - cutout.origin[0]
  const localZ = point[1] - cutout.origin[1]
  return {
    distance: (localX * cutout.tangent[0]) + (localZ * cutout.tangent[1]),
    depth: (localX * -cutout.tangent[1]) + (localZ * cutout.tangent[0]),
  }
}

function projectPointOntoSplineWallComputePrototypePathEdges(
  pathEdges: readonly SplineWallComputePrototypeCutoutPathEdge[],
  point: readonly [number, number],
) {
  let nearest: { distance: number, depth: number, distanceSq: number } | null = null

  for (const edge of pathEdges) {
    const edgeVectorX = edge.end[0] - edge.start[0]
    const edgeVectorZ = edge.end[1] - edge.start[1]
    const edgeLengthSq = (edgeVectorX * edgeVectorX) + (edgeVectorZ * edgeVectorZ)
    if (edgeLengthSq <= SPLINE_WALL_GEOMETRY_EPSILON) {
      continue
    }

    const pointVectorX = point[0] - edge.start[0]
    const pointVectorZ = point[1] - edge.start[1]
    const localRatio = clampSplineWallComputeValue(
      ((pointVectorX * edgeVectorX) + (pointVectorZ * edgeVectorZ)) / edgeLengthSq,
      0,
      1,
    )
    const projectedX = edge.start[0] + (edgeVectorX * localRatio)
    const projectedZ = edge.start[1] + (edgeVectorZ * localRatio)
    const depthX = point[0] - projectedX
    const depthZ = point[1] - projectedZ
    const distanceSq = (depthX * depthX) + (depthZ * depthZ)
    if (nearest && distanceSq >= nearest.distanceSq) {
      continue
    }

    nearest = {
      distance: edge.startDistance + ((edge.endDistance - edge.startDistance) * localRatio),
      depth: (depthX * edge.normal[0]) + (depthZ * edge.normal[1]),
      distanceSq,
    }
  }

  return nearest
}
