import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { FpsMeterNode } from './FpsCounter'
import { Grid } from './Grid'
import { Controls } from './Controls'
import { FloorTransitionController } from './FloorTransitionController'
import { CameraPresetManager } from './CameraPresetManager'
import { DungeonObject } from './DungeonObject'
import { PlayerSelectionRing } from './DungeonObject'
import { DungeonRoom } from './DungeonRoom'
import {
  distributeForwardPlusLightBudget,
  MAX_DYNAMIC_PROP_LIGHTS,
  PropLightPool,
} from './propLightPool'
import { useDungeonStore, type DungeonObjectRecord } from '../../store/useDungeonStore'
import { usePlayVisibility } from './playVisibility'
import { ContentPackInstance } from './ContentPackInstance'
import { getCellKey, snapWorldPointToGrid } from '../../hooks/useSnapToGrid'
import { createPlayDragState, updatePlayDragState, type PlayDragState } from './playDrag'
import { MovementRangeOverlay } from './MovementRangeOverlay'
import { buildMovementRange, type MovementRange } from './playMovement'
import { RoomResizeOverlay } from './RoomResizeOverlay'
import { getEffectiveFloorViewMode } from './floorViewMode'
import type { DungeonRoomData } from './DungeonRoom'
import { isDownStairAssetId } from '../../store/stairAssets'
import { OutdoorGround } from './OutdoorGround'
import { getEnvironmentLightingState } from './environmentLighting'
import { createWebGpuRenderer } from '../../rendering/createWebGpuRenderer'
import { MAX_FORWARD_PLUS_POINT_LIGHTS } from '../../rendering/forwardPlusConfig'
import { FogOfWarProvider } from './fogOfWar'
import {
  getRegisteredLightSourceCount,
  useObjectSourceRegistryVersion,
} from './objectSourceRegistry'
import { registerDebugCameraPoseReader, registerDebugWorldProjector } from './debugCameraBridge'
import { getOrBuildBakedFloorLightField, resolveObjectLightSources, type BakedFloorLightField } from '../../rendering/dungeonLightField'
import { setBakedLightFlickerTime } from './bakedLightMaterial'
import { useBakedFloorLightField } from '../../rendering/useBakedFloorLightField'

const WebGPUPostProcessing = lazy(() =>
  import('./WebGPUPostProcessing').then((module) => ({
    default: module.WebGPUPostProcessing,
  })),
)

const FireParticleSystem = lazy(() =>
  import('./effects/fireParticleSystem').then((module) => ({
    default: module.FireParticleSystem,
  })),
)

const SCENE_OVERVIEW_FLOOR_HEIGHT_UNIT = 3
const PLAYER_ANIMATION_MS = {
  pickup: 520,
  release: 520,
} as const
const DRAG_GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

const ALWAYS_VISIBLE: ReturnType<typeof usePlayVisibility> = {
  active: false,
  getCellVisibility: () => 'visible',
  getObjectVisibility: () => 'visible',
  getWallVisibility: () => 'visible',
  visibleCellKeys: [],
  playerOrigins: [],
}

export function Scene() {
  const activeFloorId = useDungeonStore((state) => state.activeFloorId)
  const floors        = useDungeonStore((state) => state.floors)
  const floorViewMode = useDungeonStore((state) => state.floorViewMode)
  const tool          = useDungeonStore((state) => state.tool)
  const effectiveFloorViewMode = getEffectiveFloorViewMode(floorViewMode, tool)

  // Track previous floor so we can compute direction before FloorContent remounts.
  // Mutating a ref during render is intentional here — it runs in the same cycle
  // as the key change, so the new FloorContent receives the correct startY.
  const prevFloorIdRef    = useRef(activeFloorId)
  const floorAnimStartY   = useRef(0)

  if (prevFloorIdRef.current !== activeFloorId) {
    const prevLevel = floors[prevFloorIdRef.current]?.level ?? 0
    const nextLevel = floors[activeFloorId]?.level ?? 0
    // Going UP to a higher level: new floor slides down from above (+Y), camera bumped up
    // Going DOWN to a lower level: new floor slides up from below (-Y), camera bumped down
    floorAnimStartY.current =
      nextLevel > prevLevel ?  2 :
      nextLevel < prevLevel ? -2 :
      0
    prevFloorIdRef.current = activeFloorId
  }

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [9, 11, 9], fov: 42, near: 0.1, far: 140 }}
      gl={createWebGpuRenderer}
      frameloop="demand"
    >
      <Suspense fallback={null}>
        {/* Global scene elements — never remount on floor switch */}
        <GlobalContent />
        {/* Floor-specific content — remounts when active floor changes */}
        {effectiveFloorViewMode === 'scene' ? (
          <SceneOverviewContent />
        ) : (
          <FloorContent key={activeFloorId} startY={floorAnimStartY.current} />
        )}
      </Suspense>
    </Canvas>
  )
}

export default Scene

/** Camera, controls, lighting, grid — shared across all floors. */
function GlobalContent() {
  const lightIntensity = useDungeonStore((state) => state.sceneLighting.intensity)
  const mapMode = useDungeonStore((state) => state.mapMode)
  const defaultOutdoorTerrainStyle = useDungeonStore((state) => state.defaultOutdoorTerrainStyle)
  const outdoorTerrainStyleCells = useDungeonStore((state) => state.outdoorTerrainStyleCells)
  const outdoorTerrainHeights = useDungeonStore((state) => state.outdoorTerrainHeights)
  const outdoorTimeOfDay = useDungeonStore((state) => state.outdoorTimeOfDay)
  const tool = useDungeonStore((state) => state.tool)
  const floorViewMode = useDungeonStore((state) => state.floorViewMode)
  const effectiveFloorViewMode = getEffectiveFloorViewMode(floorViewMode, tool)
  const outdoorBlend = outdoorTimeOfDay
  const {
    ambientColor,
    keyColor,
    fillColor,
    skyColor,
    fogNear,
    fogFar,
    keyMultiplier,
    fillMultiplier,
  } = useMemo(
    () => getEnvironmentLightingState(mapMode, outdoorBlend),
    [mapMode, outdoorBlend],
  )
  const sunPosition = useMemo(() => {
    const angle = outdoorBlend * Math.PI
    return [
      Math.cos(angle) * 48,
      Math.sin(angle) * 38 + 4,
      -22,
    ] as [number, number, number]
  }, [outdoorBlend])
  const sceneRigEnabled = lightIntensity > 0.0001

  return (
    <>
      {mapMode === 'outdoor' && (
        <OutdoorGround
          defaultOutdoorTerrainStyle={defaultOutdoorTerrainStyle}
          outdoorTerrainStyleCells={outdoorTerrainStyleCells}
          outdoorTerrainHeights={outdoorTerrainHeights}
        />
      )}
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[skyColor, fogNear, fogFar]} />
      {sceneRigEnabled && (
        <>
          <ambientLight intensity={1.6 * lightIntensity} color={ambientColor} />
          <directionalLight
            castShadow
            intensity={keyMultiplier * lightIntensity}
            color={keyColor}
            position={mapMode === 'outdoor' ? sunPosition : [9, 14, 7]}
            shadow-mapSize={[2048, 2048]}
            shadow-camera-near={0.5}
            shadow-camera-far={80}
            shadow-camera-left={-30}
            shadow-camera-right={30}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
            shadow-bias={-0.001}
          />
          <directionalLight
            intensity={fillMultiplier * lightIntensity}
            color={fillColor}
            position={[-8, 7, -4]}
          />
        </>
      )}

      <BakedLightFlickerClock />
      <DebugCameraBridgeBinder />
      {effectiveFloorViewMode === 'active' && <Grid playMode={tool === 'play'} />}
      <pointLight
        position={[0, -1000, 0]}
        intensity={0.0001}
        distance={0.25}
        decay={2}
        color="#ff9944"
      />
      <Controls />
      <FloorTransitionController />
      <CameraPresetManager />
      <FpsMeterNode />
      <FrameDriver />
    </>
  )
}

function BakedLightFlickerClock() {
  useFrame(({ clock }) => {
    setBakedLightFlickerTime(clock.elapsedTime)
  })

  return null
}

function DebugCameraBridgeBinder() {
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }

    registerDebugCameraPoseReader(() => {
      const direction = new THREE.Vector3()
      camera.getWorldDirection(direction)

      return {
        position: [camera.position.x, camera.position.y, camera.position.z] as const,
        target: [
          camera.position.x + direction.x * 10,
          camera.position.y + direction.y * 10,
          camera.position.z + direction.z * 10,
        ] as const,
      }
    })
    registerDebugWorldProjector((point) => {
      const vector = new THREE.Vector3(point[0], point[1], point[2]).project(camera)
      const rect = gl.domElement.getBoundingClientRect()
      return {
        x: rect.left + ((vector.x + 1) * 0.5 * rect.width),
        y: rect.top + ((1 - vector.y) * 0.5 * rect.height),
      }
    })

    return () => {
      registerDebugCameraPoseReader(null)
      registerDebugWorldProjector(null)
    }
  }, [camera, gl])

  return null
}

type FloorRenderEntry = {
  id: string
  level: number
  data: DungeonRoomData
  bakedLightField: BakedFloorLightField
  objects: DungeonObjectRecord[]
  topLevelObjects: DungeonObjectRecord[]
  childrenByParent: Record<string, DungeonObjectRecord[]>
}

function getTopLevelObjects(objects: DungeonObjectRecord[]) {
  const objectIds = new Set(objects.map((object) => object.id))
  return objects.filter((object) => !object.parentObjectId || !objectIds.has(object.parentObjectId))
}

function buildObjectChildrenIndex(objects: DungeonObjectRecord[]) {
  const childrenByParent: Record<string, DungeonObjectRecord[]> = {}

  objects.forEach((object) => {
    if (!object.parentObjectId) {
      return
    }

    if (!childrenByParent[object.parentObjectId]) {
      childrenByParent[object.parentObjectId] = []
    }

    childrenByParent[object.parentObjectId].push(object)
  })

  return childrenByParent
}

function SceneOverviewContent() {
  const floors = useDungeonStore((state) => state.floors)
  const floorOrder = useDungeonStore((state) => state.floorOrder)
  const activeFloorId = useDungeonStore((state) => state.activeFloorId)
  const lightEffectsEnabled = useDungeonStore((state) => state.lightEffectsEnabled)
  const postProcessingEnabled = useDungeonStore((state) =>
    state.postProcessing.enabled || state.postProcessing.pixelateEnabled,
  )
  const paintedCells = useDungeonStore((state) => state.paintedCells)
  const layers = useDungeonStore((state) => state.layers)
  const rooms = useDungeonStore((state) => state.rooms)
  const wallOpenings = useDungeonStore((state) => state.wallOpenings)
  const wallSurfaceProps = useDungeonStore((state) => state.wallSurfaceProps)
  const innerWalls = useDungeonStore((state) => state.innerWalls)
  const placedObjects = useDungeonStore((state) => state.placedObjects)
  const floorTileAssetIds = useDungeonStore((state) => state.floorTileAssetIds)
  const wallSurfaceAssetIds = useDungeonStore((state) => state.wallSurfaceAssetIds)
  const globalFloorAssetId = useDungeonStore((state) => state.selectedAssetIds.floor)
  const globalWallAssetId = useDungeonStore((state) => state.selectedAssetIds.wall)
  const objectSourceRegistryVersion = useObjectSourceRegistryVersion()
  const floorEntries = useMemo<FloorRenderEntry[]>(() => {
    const sortedFloorIds = [...floorOrder].sort(
      (left, right) => (floors[right]?.level ?? 0) - (floors[left]?.level ?? 0),
    )

    return sortedFloorIds.flatMap((floorId) => {
      const floor = floors[floorId]
      if (!floor) {
        return []
      }

      if (floorId === activeFloorId) {
        const visibleObjects = Object.values(placedObjects).filter(
          (object) => layers[object.layerId]?.visible !== false,
        )
        const visiblePaintedCells = Object.fromEntries(
          Object.entries(paintedCells).filter(([, record]) => layers[record.layerId]?.visible !== false),
        )
          return [{
            id: floorId,
            level: floor.level,
            data: {
              floorId,
              paintedCells,
              layers,
              rooms,
            wallOpenings,
            innerWalls,
            placedObjects,
            floorTileAssetIds,
            wallSurfaceAssetIds,
            wallSurfaceProps,
            globalFloorAssetId,
            globalWallAssetId,
          },
          bakedLightField: getOrBuildBakedFloorLightField({
            floorId,
            floorCells: Object.values(visiblePaintedCells).map((record) => record.cell),
            staticLightSources: resolveObjectLightSources(visibleObjects),
            occlusionInput: {
              paintedCells: visiblePaintedCells,
              wallOpenings,
              innerWalls,
              wallSurfaceProps,
            },
          }),
          objects: visibleObjects,
          topLevelObjects: getTopLevelObjects(visibleObjects),
          childrenByParent: buildObjectChildrenIndex(visibleObjects),
        }]
      }

      const snapshot = floor.snapshot
      const visibleObjects = Object.values(snapshot.placedObjects).filter(
        (object) => snapshot.layers[object.layerId]?.visible !== false,
      )
      const visiblePaintedCells = Object.fromEntries(
        Object.entries(snapshot.paintedCells).filter(([, record]) => snapshot.layers[record.layerId]?.visible !== false),
      )
        return [{
          id: floorId,
          level: floor.level,
          data: {
            floorId,
            paintedCells: snapshot.paintedCells,
              layers: snapshot.layers,
             rooms: snapshot.rooms,
             wallOpenings: snapshot.wallOpenings,
             innerWalls: snapshot.innerWalls,
             placedObjects: snapshot.placedObjects,
             floorTileAssetIds: snapshot.floorTileAssetIds,
             wallSurfaceAssetIds: snapshot.wallSurfaceAssetIds,
              wallSurfaceProps: snapshot.wallSurfaceProps,
              globalFloorAssetId: snapshot.selectedAssetIds.floor,
              globalWallAssetId: snapshot.selectedAssetIds.wall,
            },
          bakedLightField: getOrBuildBakedFloorLightField({
            floorId,
            floorCells: Object.values(visiblePaintedCells).map((record) => record.cell),
            staticLightSources: resolveObjectLightSources(visibleObjects),
            occlusionInput: {
              paintedCells: visiblePaintedCells,
              wallOpenings: snapshot.wallOpenings,
              innerWalls: snapshot.innerWalls,
              wallSurfaceProps: snapshot.wallSurfaceProps,
            },
          }),
          objects: visibleObjects,
          topLevelObjects: getTopLevelObjects(visibleObjects),
          childrenByParent: buildObjectChildrenIndex(visibleObjects),
      }]
    })
  }, [
    activeFloorId,
    floorOrder,
    floors,
    globalFloorAssetId,
    globalWallAssetId,
    layers,
    paintedCells,
    placedObjects,
    floorTileAssetIds,
    rooms,
    wallOpenings,
    innerWalls,
    wallSurfaceAssetIds,
    wallSurfaceProps,
  ])
  const floorLightBudgets = useMemo(
    () => {
      void objectSourceRegistryVersion
      return distributeForwardPlusLightBudget(
        floorEntries.map((entry) => (lightEffectsEnabled ? getRegisteredLightSourceCount(entry.id) : 0)),
        Math.min(MAX_DYNAMIC_PROP_LIGHTS, MAX_FORWARD_PLUS_POINT_LIGHTS),
      )
    },
    [floorEntries, lightEffectsEnabled, objectSourceRegistryVersion],
  )

  return (
    <>
      {postProcessingEnabled && (
        <Suspense fallback={null}>
          <WebGPUPostProcessing />
        </Suspense>
      )}
      {floorEntries.map((entry, index) => (
        <group key={entry.id} position={[0, entry.level * SCENE_OVERVIEW_FLOOR_HEIGHT_UNIT, 0]}>
          <DungeonRoom data={entry.data} visibility={ALWAYS_VISIBLE} enableBuildAnimation={false} />
          {floorLightBudgets[index] > 0 && (
            <PropLightPool
              scopeKey={entry.id}
              visibility={ALWAYS_VISIBLE}
              maxLights={floorLightBudgets[index]}
            />
          )}
          {entry.topLevelObjects
            .filter((object) => !isDownStairAssetId(object.assetId))
            .map((object) => (
                <DungeonObject
                  key={object.id}
                  object={object}
                  visibility={ALWAYS_VISIBLE}
                  sourceScopeKey={entry.id}
                  bakedLightField={entry.bakedLightField}
                  childrenByParent={entry.childrenByParent}
                />
              ))}
        </group>
      ))}
    </>
  )
}

/** Dungeon room tiles and props — remounts on floor switch for clean state. */
function FloorContent({ startY = 0 }: { startY?: number }) {
  const activeFloorId = useDungeonStore((state) => state.activeFloorId)
  const placedObjects = useDungeonStore((state) => state.placedObjects)
  const paintedCells = useDungeonStore((state) => state.paintedCells)
  const blockedCells = useDungeonStore((state) => state.blockedCells)
  const outdoorTerrainHeights = useDungeonStore((state) => state.outdoorTerrainHeights)
  const mapMode = useDungeonStore((state) => state.mapMode)
  const occupancy = useDungeonStore((state) => state.occupancy)
  const layers = useDungeonStore((state) => state.layers)
  const tool = useDungeonStore((state) => state.tool)
  const selection = useDungeonStore((state) => state.selection)
  const wallOpenings = useDungeonStore((state) => state.wallOpenings)
  const wallSurfaceProps = useDungeonStore((state) => state.wallSurfaceProps)
  const innerWalls = useDungeonStore((state) => state.innerWalls)
  const showLensFocusDebugPoint = useDungeonStore((state) => state.showLensFocusDebugPoint)
  const moveObject = useDungeonStore((state) => state.moveObject)
  const selectObject = useDungeonStore((state) => state.selectObject)
  const setObjectDragActive = useDungeonStore((state) => state.setObjectDragActive)
  const lensEnabled = useDungeonStore((state) => state.postProcessing.enabled)
  const pixelateEnabled = useDungeonStore((state) => state.postProcessing.pixelateEnabled)
  const visibility = usePlayVisibility()
  const lightEffectsEnabled = useDungeonStore((state) => state.lightEffectsEnabled)
  const objectSourceRegistryVersion = useObjectSourceRegistryVersion()
  const [releaseAnimationIds, setReleaseAnimationIds] = useState<Record<string, true>>({})

  const objects = useMemo(
    () => Object.values(placedObjects).filter((obj) => layers[obj.layerId]?.visible !== false),
    [placedObjects, layers],
  )
  const visiblePaintedCells = useMemo(
    () =>
      Object.values(paintedCells)
        .filter((record) => layers[record.layerId]?.visible !== false)
        .map((record) => record.cell),
    [layers, paintedCells],
  )
  const visiblePaintedCellRecords = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(paintedCells).filter(([, record]) => layers[record.layerId]?.visible !== false),
      ),
    [layers, paintedCells],
  )
  const staticLightSources = useMemo(
    () => resolveObjectLightSources(objects),
    [objects],
  )
  const bakedLightBuildInput = useMemo(
    () => ({
      floorId: activeFloorId,
      floorCells: visiblePaintedCells,
      staticLightSources,
      occlusionInput: {
        paintedCells: visiblePaintedCellRecords,
        wallOpenings,
        wallSurfaceProps,
        innerWalls,
      },
    }),
    [activeFloorId, innerWalls, staticLightSources, visiblePaintedCellRecords, visiblePaintedCells, wallOpenings, wallSurfaceProps],
  )
  const bakedFloorLightField = useBakedFloorLightField(bakedLightBuildInput)
  const topLevelObjects = useMemo(() => getTopLevelObjects(objects), [objects])
  const childrenByParent = useMemo(() => buildObjectChildrenIndex(objects), [objects])
  const [propLightBudget] = useMemo(
    () => {
      void objectSourceRegistryVersion
      return distributeForwardPlusLightBudget(
        [lightEffectsEnabled ? getRegisteredLightSourceCount(activeFloorId) : 0],
        Math.min(MAX_DYNAMIC_PROP_LIGHTS, MAX_FORWARD_PLUS_POINT_LIGHTS),
      )
    },
    [activeFloorId, lightEffectsEnabled, objectSourceRegistryVersion],
  )
  const showPostProcessing = true
  const postProcessingKey = `${lensEnabled ? 'lens' : 'nolens'}:${pixelateEnabled ? 'pixel' : 'clean'}:${showLensFocusDebugPoint ? 'focus' : 'nofocus'}`

  const groupRef = useRef<THREE.Group>(null)
  const animYRef = useRef(startY)
  const dragStateRef = useRef<PlayDragState | null>(null)
  const movementRangeRef = useRef<MovementRange | null>(null)
  const dragCleanupRef = useRef<(() => void) | null>(null)
  const { camera, gl, invalidate, controls } = useThree()
  const [dragState, setDragState] = useState<PlayDragState | null>(null)

  useFrame((_, delta) => {
    if (Math.abs(animYRef.current) < 0.002) {
      if (groupRef.current) groupRef.current.position.y = 0
      return
    }
    animYRef.current *= Math.exp(-10 * delta)
    if (groupRef.current) groupRef.current.position.y = animYRef.current
    invalidate()
  })

  useEffect(() => {
    dragStateRef.current = dragState
  }, [dragState])

  const activeMovementObject = useMemo(() => {
    if (tool !== 'play') {
      return null
    }

    if (dragState) {
      return placedObjects[dragState.objectId] ?? null
    }

    if (!selection) {
      return null
    }

    const selectedObject = placedObjects[selection]
    return selectedObject?.type === 'player' ? selectedObject : null
  }, [dragState, placedObjects, selection, tool])

  const movementRange = useMemo(() => {
    if (!activeMovementObject) {
      return null
    }

    return buildMovementRange({
      object: activeMovementObject,
      originCell: dragState?.originCell ?? activeMovementObject.cell,
      mapMode,
      paintedCells,
      blockedCells,
      wallOpenings,
      wallSurfaceProps,
      innerWalls,
      occupancy,
      placedObjects,
    })
  }, [
    activeMovementObject,
    blockedCells,
    dragState?.originCell,
    innerWalls,
    mapMode,
    occupancy,
    paintedCells,
    placedObjects,
    wallOpenings,
    wallSurfaceProps,
  ])

  useEffect(() => {
    movementRangeRef.current = movementRange
  }, [movementRange])

  useEffect(() => {
    if (!dragState || dragState.animationState !== 'pickup') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setDragState((current) =>
        current && current.animationState === 'pickup'
          ? { ...current, animationState: 'holding' }
          : current,
      )
      invalidate()
    }, PLAYER_ANIMATION_MS.pickup)

    return () => window.clearTimeout(timeoutId)
  }, [dragState, invalidate])

  const clearDragListeners = useCallback(() => {
    dragCleanupRef.current?.()
    dragCleanupRef.current = null
  }, [])

  const stopDrag = useCallback(() => {
    clearDragListeners()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orbitControls = controls as any
    if (orbitControls && 'enabled' in orbitControls) {
      orbitControls.enabled = true
    }
    setDragState(null)
    dragStateRef.current = null
    setObjectDragActive(false)
    invalidate()
  }, [clearDragListeners, controls, invalidate, setObjectDragActive])

  const getDragPointerPoint = useCallback((ray: THREE.Ray) => (
    ray.intersectPlane(DRAG_GROUND_PLANE, new THREE.Vector3())
  ), [])

  const updateDragFromClientPosition = useCallback((clientX: number, clientY: number) => {
    const rect = gl.domElement.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      return
    }

    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    )
    raycaster.setFromCamera(ndc, camera)
    const nextPoint = getDragPointerPoint(raycaster.ray)
    if (!nextPoint) {
      return
    }

    const current = dragStateRef.current
    if (!current) {
      return
    }

    const nextDisplayX = nextPoint.x + current.grabOffset[0]
    const nextDisplayZ = nextPoint.z + current.grabOffset[1]
    const snapped = snapWorldPointToGrid({ x: nextDisplayX, y: nextPoint.y, z: nextDisplayZ })
      const targetKey = getCellKey(snapped.cell)
      const anchorKey = `${targetKey}:floor`
    const occupantId = occupancy[anchorKey]
    const occupant =
      occupantId && mapMode === 'outdoor'
        ? placedObjects[occupantId]
        : null
      const blockingOccupantId =
        occupant && occupant.props.generatedBy === 'surrounding-forest'
          ? undefined
          : occupantId
      const withinMovementRange = movementRangeRef.current?.reachableCellKeys.has(targetKey) ?? true

      setDragState((dragging) => dragging
        ? updatePlayDragState(
          dragging,
          nextPoint,
          (
            mapMode === 'outdoor'
              ? !blockedCells[targetKey]
              : Boolean(paintedCells[targetKey])
          ) && withinMovementRange,
          blockingOccupantId,
          mapMode === 'outdoor' ? outdoorTerrainHeights : undefined,
        )
        : dragging)
      invalidate()
  }, [blockedCells, camera, getDragPointerPoint, gl, invalidate, mapMode, occupancy, outdoorTerrainHeights, paintedCells, placedObjects])

  const commitDrag = useCallback(() => {
    const current = dragStateRef.current
    if (current?.valid) {
      moveObject(current.objectId, {
        position: current.position,
        cell: current.cell,
        cellKey: `${getCellKey(current.cell)}:floor`,
      })
      setReleaseAnimationIds((existing) => ({ ...existing, [current.objectId]: true }))
      window.setTimeout(() => {
        setReleaseAnimationIds((existing) => {
          if (!existing[current.objectId]) {
            return existing
          }

          const next = { ...existing }
          delete next[current.objectId]
          return next
        })
        invalidate()
      }, PLAYER_ANIMATION_MS.release)
    }
    stopDrag()
  }, [invalidate, moveObject, stopDrag])

  const startDrag = useCallback((object: DungeonObjectRecord, event: ThreeEvent<PointerEvent>) => {
    if (tool !== 'play' || object.type !== 'player') {
      return
    }

    const pointerPoint = getDragPointerPoint(event.ray)
    const nextState = createPlayDragState(
      object,
      pointerPoint,
      mapMode === 'outdoor' ? outdoorTerrainHeights : undefined,
    )
    movementRangeRef.current = buildMovementRange({
      object,
      originCell: object.cell,
      mapMode,
      paintedCells,
      blockedCells,
      wallOpenings,
      wallSurfaceProps,
      innerWalls,
      occupancy,
      placedObjects,
    })

    selectObject(object.id)
    setDragState(nextState)
    dragStateRef.current = nextState
    setObjectDragActive(true)
    clearDragListeners()
    const handlePointerMove = (pointerEvent: PointerEvent) => {
      updateDragFromClientPosition(pointerEvent.clientX, pointerEvent.clientY)
    }
    const handlePointerUp = () => {
      commitDrag()
    }
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp, { once: true })
    window.addEventListener('pointercancel', handlePointerUp, { once: true })
    dragCleanupRef.current = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
    // Disable orbit controls only after drag listeners are armed so quick taps cannot leave the scene locked.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orbitControls = controls as any
    if (orbitControls && 'enabled' in orbitControls) {
      orbitControls.enabled = false
    }
    invalidate()
  }, [
    blockedCells,
    clearDragListeners,
    commitDrag,
    controls,
    getDragPointerPoint,
    innerWalls,
    invalidate,
    mapMode,
    occupancy,
    outdoorTerrainHeights,
    paintedCells,
    placedObjects,
    selectObject,
    setObjectDragActive,
    tool,
    updateDragFromClientPosition,
    wallOpenings,
    wallSurfaceProps,
  ])

  useEffect(() => {
    if (tool === 'play') {
      return
    }

    stopDrag()
  }, [stopDrag, tool])

  return (
    <FogOfWarProvider visibility={visibility}>
      <group ref={groupRef} position={[0, startY, 0]}>
        {showPostProcessing && (
          <Suspense fallback={null}>
            <WebGPUPostProcessing key={postProcessingKey} />
          </Suspense>
        )}
        {movementRange && (
          <MovementRangeOverlay cells={movementRange.reachableCells} />
        )}
        <DungeonRoom visibility={visibility} bakedLightField={bakedFloorLightField} />
        <RoomResizeOverlay />
        {propLightBudget > 0 && (
          <PropLightPool scopeKey={activeFloorId} visibility={visibility} maxLights={propLightBudget} />
        )}
        {topLevelObjects.map((object) => (
          dragState?.objectId === object.id ? null : (
            <DungeonObject
              key={object.id}
              object={object}
              visibility={visibility}
              sourceScopeKey={activeFloorId}
              bakedLightField={bakedFloorLightField}
              childrenByParent={childrenByParent}
              onPlayDragStart={startDrag}
              playerAnimationState={releaseAnimationIds[object.id] ? 'release' : undefined}
            />
          )
        ))}
        {dragState && (
          <group position={dragState.displayPosition} rotation={dragState.rotation}>
            <ContentPackInstance
              assetId={dragState.assetId}
              playerAnimationState={dragState.animationState}
              variant="prop"
              visibility="visible"
            />
            <PlayerSelectionRing assetId={dragState.assetId} color={dragState.valid ? '#d4a72c' : '#ef4444'} />
          </group>
        )}
        <Suspense fallback={null}>
          <FireParticleSystem scopeKey={activeFloorId} visibility={visibility} />
        </Suspense>
      </group>
    </FogOfWarProvider>
  )
}

/**
 * Drives the demand-mode render loop at the configured FPS cap.
 * Pauses completely when the browser tab is hidden (Page Visibility API).
 */
function FrameDriver() {
  const { invalidate } = useThree()
  const fpsLimit = useDungeonStore((state) => state.fpsLimit)

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | number | undefined

    function start() {
      if (fpsLimit === 0) {
        let rafId: number
        const loop = () => { invalidate(); rafId = requestAnimationFrame(loop) }
        rafId = requestAnimationFrame(loop)
        id = rafId
      } else {
        id = setInterval(invalidate, 1000 / fpsLimit)
      }
    }

    function stop() {
      if (fpsLimit === 0) cancelAnimationFrame(id as number)
      else clearInterval(id as ReturnType<typeof setInterval>)
    }

    function onVisibilityChange() {
      if (document.hidden) stop()
      else start()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    if (!document.hidden) start()

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [fpsLimit, invalidate])

  return null
}
