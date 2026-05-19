import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { cellToWorldPosition } from '../../hooks/useSnapToGrid'
import {
  buildSurfaceBakedLightProbe,
  getBakedLightSampleForCell,
  type BakedFloorLightField,
} from '../../rendering/dungeonLightField'
import { createSplineWallQueryCache } from '../../store/splineWallQueries'
import type { SplineWallGraph } from '../../store/splineWallGraph'
import { getOpeningSegments } from '../../store/openingSegments'
import { getOpeningWorldTransform } from '../../store/openingPlacement'
import { buildOpenWallSegmentSet } from '../../store/openWallSegments'
import type { OpeningRecord, PaintedCells } from '../../store/useDungeonStore'
import { collectBoundaryWallSegments } from '../../store/wallSegments'
import { getWallSpanSurfaceLightSamplePositions } from './wallLighting'

const lineMidpointScratch = new THREE.Vector3()
const lineTipScratch = new THREE.Vector3()
const noRaycast: THREE.Object3D['raycast'] = () => {}

type SurfaceProbeDebugOverlayProps = {
  bakedLightField: BakedFloorLightField
  paintedCells: PaintedCells
  visibleOpenings: readonly OpeningRecord[]
  splineWallGraph: SplineWallGraph
}

type SurfaceProbeDebugEntry = {
  key: string
  kind: 'floor' | 'wall' | 'opening'
  anchorPosition: [number, number, number]
  samplePositions: readonly (readonly [number, number, number])[]
  light: readonly [number, number, number]
  lightDirection?: readonly [number, number, number]
  directionalStrength?: number
}

export function SurfaceProbeDebugOverlay({
  bakedLightField,
  paintedCells,
  visibleOpenings,
  splineWallGraph,
}: SurfaceProbeDebugOverlayProps) {
  const queryCache = useMemo(
    () => createSplineWallQueryCache(splineWallGraph),
    [splineWallGraph],
  )
  const entries = useMemo(
    () => buildSurfaceProbeDebugEntries({
      bakedLightField,
      paintedCells,
      visibleOpenings,
      splineWallGraph,
      queryCache,
    }),
    [bakedLightField, paintedCells, queryCache, splineWallGraph, visibleOpenings],
  )

  if (entries.length === 0) {
    return null
  }

  return (
    <group renderOrder={40}>
      {entries.map((entry) => (
        <SurfaceProbeDebugEntryMesh key={entry.key} entry={entry} />
      ))}
    </group>
  )
}

function SurfaceProbeDebugEntryMesh({ entry }: { entry: SurfaceProbeDebugEntry }) {
  const overlay = useMemo(() => {
    const baseColor = buildProbeColor(entry.light)
    const directionPoints = buildDirectionPoints(entry)
    return {
      baseColor,
      directionPoints,
      sampleMarkerColor:
        entry.kind === 'floor'
          ? new THREE.Color('#38bdf8')
          : entry.kind === 'opening'
            ? new THREE.Color('#fb7185')
            : new THREE.Color('#22d3ee'),
    }
  }, [entry])

  return (
    <group>
      {entry.samplePositions.map((position, index) => (
        <mesh key={`${entry.key}:sample:${index}`} position={position} renderOrder={40} raycast={noRaycast}>
          <sphereGeometry args={[entry.kind === 'floor' ? 0.05 : 0.04, 10, 10]} />
          <meshBasicMaterial
            color={overlay.sampleMarkerColor}
            transparent
            opacity={entry.kind === 'floor' ? 0.75 : 0.95}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      ))}
      {overlay.directionPoints ? (
        <DebugLine points={overlay.directionPoints} color="#fbbf24" />
      ) : null}
      <mesh position={entry.anchorPosition} renderOrder={40} raycast={noRaycast}>
        <sphereGeometry args={[entry.kind === 'floor' ? 0.075 : 0.09, 12, 12]} />
        <meshBasicMaterial color={overlay.baseColor} depthWrite={false} depthTest={false} />
      </mesh>
    </group>
  )
}

function DebugLine({
  points,
  color,
}: {
  points: readonly [readonly [number, number, number], readonly [number, number, number]]
  color: string
}) {
  const geometry = useMemo(() => {
    const lineGeometry = new THREE.BufferGeometry()
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points.flat()), 3))
    return lineGeometry
  }, [points])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <lineSegments geometry={geometry} renderOrder={40} raycast={noRaycast}>
      <lineBasicMaterial color={color} transparent opacity={0.95} depthWrite={false} depthTest={false} />
    </lineSegments>
  )
}

export function buildSurfaceProbeDebugEntries({
  bakedLightField,
  paintedCells,
  visibleOpenings,
  splineWallGraph,
  queryCache = createSplineWallQueryCache(splineWallGraph),
}: {
  bakedLightField: BakedFloorLightField
  paintedCells: PaintedCells
  visibleOpenings: readonly OpeningRecord[]
  splineWallGraph: SplineWallGraph
  queryCache?: ReturnType<typeof createSplineWallQueryCache>
}) {
  const floorEntries: SurfaceProbeDebugEntry[] = Object.values(paintedCells).map((record) => {
    const position = cellToWorldPosition(record.cell)
    const samplePosition: [number, number, number] = [position[0], 0.08, position[2]]
    return {
      key: `floor:${record.cell[0]}:${record.cell[1]}`,
      kind: 'floor',
      anchorPosition: samplePosition,
      samplePositions: [samplePosition],
      light: getBakedLightSampleForCell(bakedLightField, record.cell),
    }
  })

  const visibleOpeningsById = Object.fromEntries(visibleOpenings.map((opening) => [opening.id, opening]))
  const openWallKeys = buildOpenWallSegmentSet(visibleOpeningsById)
  const wallEntries: SurfaceProbeDebugEntry[] = collectBoundaryWallSegments(
    paintedCells,
    { suppressedWallKeys: openWallKeys },
  )
    .flatMap((segment) => {
      const samplePositions = getWallSpanSurfaceLightSamplePositions([segment.key], paintedCells)
      const probe = buildSurfaceBakedLightProbe(bakedLightField, samplePositions)
      if (samplePositions.length === 0 || !probe) {
        return []
      }

      return [{
        key: `wall:${segment.key}`,
        kind: 'wall',
        anchorPosition: getAverageProbePosition(samplePositions),
        samplePositions,
        light: probe.light,
        lightDirection: probe.lightDirection,
        directionalStrength: probe.directionalStrength,
      } satisfies SurfaceProbeDebugEntry]
    })

  const openingEntries: SurfaceProbeDebugEntry[] = visibleOpenings.flatMap((opening) => {
    const wallKeys = getOpeningWorldTransform(splineWallGraph, queryCache, opening)?.wallKeys
      ?? getOpeningSegments(opening.wallKey, opening.width)
    const samplePositions = getWallSpanSurfaceLightSamplePositions(wallKeys, paintedCells)
    const probe = buildSurfaceBakedLightProbe(bakedLightField, samplePositions)
    if (samplePositions.length === 0 || !probe) {
      return []
    }

    return [{
      key: `opening:${opening.id}`,
      kind: 'opening',
      anchorPosition: getAverageProbePosition(samplePositions),
      samplePositions,
      light: probe.light,
      lightDirection: probe.lightDirection,
      directionalStrength: probe.directionalStrength,
    } satisfies SurfaceProbeDebugEntry]
  })

  return [...floorEntries, ...wallEntries, ...openingEntries]
}

function getAverageProbePosition(samplePositions: readonly (readonly [number, number, number])[]) {
  const total = samplePositions.reduce(
    (accumulator, position) => {
      accumulator.x += position[0]
      accumulator.y += position[1]
      accumulator.z += position[2]
      return accumulator
    },
    { x: 0, y: 0, z: 0 },
  )
  return [
    total.x / samplePositions.length,
    total.y / samplePositions.length,
    total.z / samplePositions.length,
  ] as [number, number, number]
}

function buildDirectionPoints(entry: SurfaceProbeDebugEntry) {
  if (!entry.lightDirection || !entry.directionalStrength || entry.directionalStrength <= 1e-4) {
    return null
  }

  const directionOrigin = lineMidpointScratch
    .set(...entry.anchorPosition)
    .clone()
  const directionTip = lineTipScratch
    .set(...entry.lightDirection)
    .normalize()
    .multiplyScalar(0.2 + entry.directionalStrength * 0.7)
    .add(directionOrigin)
    .clone()

  return [
    directionOrigin.toArray() as [number, number, number],
    directionTip.toArray() as [number, number, number],
  ] as const
}

function buildProbeColor(sample: readonly [number, number, number]) {
  return new THREE.Color(
    clamp01(sample[0] * 1.2),
    clamp01(sample[1] * 1.2),
    clamp01(sample[2] * 1.2),
  )
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}
