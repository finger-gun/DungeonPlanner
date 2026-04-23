import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { FpsMeterNode } from './FpsCounter'
import { Grid } from './Grid'
import { Controls } from './Controls'
import { FloorTransitionController } from './FloorTransitionController'
import { CameraPresetManager } from './CameraPresetManager'
import { DungeonObject } from './DungeonObject'
import { PlayerSelectionRing } from './DungeonObject'
import { DungeonRoom } from './DungeonRoom'
import { WebGPUPostProcessing } from './WebGPUPostProcessing'
import { FireParticleSystem } from './effects/fireParticleSystem'
import {
  distributeForwardPlusLightBudget,
  getDesiredPropLightPoolSize,
  precomputeLightSources,
  PropLightPool,
} from './propLightPool'
import { useDungeonStore, type DungeonObjectRecord } from '../../store/useDungeonStore'
import { usePlayVisibility } from './playVisibility'
import { ContentPackInstance } from './ContentPackInstance'
import { getCellKey, snapWorldPointToGrid } from '../../hooks/useSnapToGrid'
import { createPlayDragState, updatePlayDragState, type PlayDragState } from './playDrag'
import { RoomResizeOverlay } from './RoomResizeOverlay'
import { getEffectiveFloorViewMode } from './floorViewMode'
import type { DungeonRoomData } from './DungeonRoom'
import { isDownStairAssetId } from '../../store/stairAssets'
import { OutdoorGround } from './OutdoorGround'
import { getEnvironmentLightingState } from './environmentLighting'
import { createWebGpuRenderer } from '../../rendering/createWebGpuRenderer'
import { MAX_FORWARD_PLUS_POINT_LIGHTS } from '../../rendering/forwardPlusConfig'
import { FogOfWarProvider } from './fogOfWar'

const SCENE_OVERVIEW_FLOOR_HEIGHT_UNIT = 3
const PLAYER_ANIMATION_MS = {
  pickup: 520,
  release: 520,
} as const

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
  const outdoorGroundTextureCells = useDungeonStore((state) => state.outdoorGroundTextureCells)
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

  return (
    <>
      {mapMode === 'outdoor' && (
        <OutdoorGround
          outdoorBlend={outdoorBlend}
          outdoorGroundTextureCells={outdoorGroundTextureCells}
          outdoorTerrainHeights={outdoorTerrainHeights}
        />
      )}
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[skyColor, fogNear, fogFar]} />
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

type FloorRenderEntry = {
  id: string
  level: number
  data: DungeonRoomData
  objects: DungeonObjectRecord[]
  lightSourceCount: number
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
  const postProcessingEnabled = useDungeonStore((state) =>
    state.postProcessing.enabled || state.postProcessing.pixelateEnabled,
  )
  const paintedCells = useDungeonStore((state) => state.paintedCells)
  const layers = useDungeonStore((state) => state.layers)
  const rooms = useDungeonStore((state) => state.rooms)
  const wallOpenings = useDungeonStore((state) => state.wallOpenings)
  const innerWalls = useDungeonStore((state) => state.innerWalls)
  const placedObjects = useDungeonStore((state) => state.placedObjects)
  const floorTileAssetIds = useDungeonStore((state) => state.floorTileAssetIds)
  const wallSurfaceAssetIds = useDungeonStore((state) => state.wallSurfaceAssetIds)
  const globalFloorAssetId = useDungeonStore((state) => state.selectedAssetIds.floor)
  const globalWallAssetId = useDungeonStore((state) => state.selectedAssetIds.wall)
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
        return [{
          id: floorId,
          level: floor.level,
          data: {
            paintedCells,
            layers,
            rooms,
            wallOpenings,
            innerWalls,
            placedObjects,
            floorTileAssetIds,
            wallSurfaceAssetIds,
            globalFloorAssetId,
            globalWallAssetId,
          },
          objects: visibleObjects,
          lightSourceCount: precomputeLightSources(visibleObjects).length,
          topLevelObjects: getTopLevelObjects(visibleObjects),
          childrenByParent: buildObjectChildrenIndex(visibleObjects),
        }]
      }

      const snapshot = floor.snapshot
      const visibleObjects = Object.values(snapshot.placedObjects).filter(
        (object) => snapshot.layers[object.layerId]?.visible !== false,
      )
      return [{
        id: floorId,
        level: floor.level,
        data: {
          paintedCells: snapshot.paintedCells,
            layers: snapshot.layers,
             rooms: snapshot.rooms,
             wallOpenings: snapshot.wallOpenings,
             innerWalls: snapshot.innerWalls,
             placedObjects: snapshot.placedObjects,
            floorTileAssetIds: snapshot.floorTileAssetIds,
            wallSurfaceAssetIds: snapshot.wallSurfaceAssetIds,
             globalFloorAssetId: snapshot.selectedAssetIds.floor,
             globalWallAssetId: snapshot.selectedAssetIds.wall,
        },
        objects: visibleObjects,
        lightSourceCount: precomputeLightSources(visibleObjects).length,
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
  ])
  const floorLightBudgets = useMemo(
    () => distributeForwardPlusLightBudget(
      floorEntries.map((entry) => getDesiredPropLightPoolSize(entry.lightSourceCount)),
      MAX_FORWARD_PLUS_POINT_LIGHTS,
    ),
    [floorEntries],
  )

  return (
    <>
      {postProcessingEnabled && <WebGPUPostProcessing />}
      {floorEntries.map((entry, index) => (
        <group key={entry.id} position={[0, entry.level * SCENE_OVERVIEW_FLOOR_HEIGHT_UNIT, 0]}>
          <DungeonRoom data={entry.data} visibility={ALWAYS_VISIBLE} enableBuildAnimation={false} />
          {floorLightBudgets[index] > 0 && (
            <PropLightPool
              objects={entry.objects}
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
  const placedObjects = useDungeonStore((state) => state.placedObjects)
  const paintedCells = useDungeonStore((state) => state.paintedCells)
  const blockedCells = useDungeonStore((state) => state.blockedCells)
  const outdoorTerrainHeights = useDungeonStore((state) => state.outdoorTerrainHeights)
  const mapMode = useDungeonStore((state) => state.mapMode)
  const occupancy = useDungeonStore((state) => state.occupancy)
  const layers = useDungeonStore((state) => state.layers)
  const tool = useDungeonStore((state) => state.tool)
  const showLensFocusDebugPoint = useDungeonStore((state) => state.showLensFocusDebugPoint)
  const moveObject = useDungeonStore((state) => state.moveObject)
  const selectObject = useDungeonStore((state) => state.selectObject)
  const setObjectDragActive = useDungeonStore((state) => state.setObjectDragActive)
  const postProcessingEnabled = useDungeonStore((state) => state.postProcessing.enabled)
  const pixelateEnabled = useDungeonStore((state) => state.postProcessing.pixelateEnabled)
  const visibility = usePlayVisibility()
  const [releaseAnimationIds, setReleaseAnimationIds] = useState<Record<string, true>>({})

  const objects = useMemo(
    () => Object.values(placedObjects).filter((obj) => layers[obj.layerId]?.visible !== false),
    [placedObjects, layers],
  )
  const objectLightCount = useMemo(() => precomputeLightSources(objects).length, [objects])
  const topLevelObjects = useMemo(() => getTopLevelObjects(objects), [objects])
  const childrenByParent = useMemo(() => buildObjectChildrenIndex(objects), [objects])
  const [propLightBudget] = useMemo(
    () => distributeForwardPlusLightBudget(
      [
        getDesiredPropLightPoolSize(objectLightCount),
      ],
      MAX_FORWARD_PLUS_POINT_LIGHTS,
    ),
    [objectLightCount],
  )
  const showPostProcessing = postProcessingEnabled || pixelateEnabled || showLensFocusDebugPoint
  const postProcessingKey = `${postProcessingEnabled ? 'post' : 'raw'}:${pixelateEnabled ? 'pixel' : 'clean'}:${showLensFocusDebugPoint ? 'focus' : 'nofocus'}`

  const groupRef = useRef<THREE.Group>(null)
  const animYRef = useRef(startY)
  const dragStateRef = useRef<PlayDragState | null>(null)
  const { camera, gl, invalidate } = useThree()
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
  }, [dragState?.animationState, dragState?.objectId, invalidate])

  const stopDrag = useCallback(() => {
    setDragState(null)
    dragStateRef.current = null
    setObjectDragActive(false)
    invalidate()
  }, [invalidate, setObjectDragActive])

  const startDrag = useCallback((object: DungeonObjectRecord, event: ThreeEvent<PointerEvent>) => {
    if (tool !== 'play' || object.type !== 'player') {
      return
    }

    const pointerPoint = event.ray.intersectPlane(
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      new THREE.Vector3(),
    )
    const nextState = createPlayDragState(
      object,
      pointerPoint,
      mapMode === 'outdoor' ? outdoorTerrainHeights : undefined,
    )

    selectObject(object.id)
    setDragState(nextState)
    dragStateRef.current = nextState
    setObjectDragActive(true)
    invalidate()
  }, [invalidate, mapMode, outdoorTerrainHeights, selectObject, setObjectDragActive, tool])

  useEffect(() => {
    if (!dragState) {
      return
    }

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const point = new THREE.Vector3()

    function updateDrag(clientX: number, clientY: number) {
      const rect = gl.domElement.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        return
      }

      ndc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      )

      raycaster.setFromCamera(ndc, camera)
      if (!raycaster.ray.intersectPlane(plane, point)) {
        return
      }

      const current = dragStateRef.current
      if (!current) {
        return
      }

      const nextDisplayX = point.x + current.grabOffset[0]
      const nextDisplayZ = point.z + current.grabOffset[1]
      const snapped = snapWorldPointToGrid({ x: nextDisplayX, y: point.y, z: nextDisplayZ })
      const targetKey = getCellKey(snapped.cell)
      const anchorKey = `${targetKey}:floor`
      const occupantId = occupancy[anchorKey]

      setDragState((current) => current
        ? updatePlayDragState(
            current,
            point,
            mapMode === 'outdoor'
              ? !blockedCells[targetKey]
              : Boolean(paintedCells[targetKey]),
            occupantId,
            mapMode === 'outdoor' ? outdoorTerrainHeights : undefined,
          )
        : current)
      invalidate()
    }

    function handlePointerMove(event: PointerEvent) {
      updateDrag(event.clientX, event.clientY)
    }

    function handlePointerUp() {
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
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp, { once: true })

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [
    blockedCells,
    camera,
    dragState,
    gl,
    invalidate,
    mapMode,
    moveObject,
    occupancy,
    outdoorTerrainHeights,
    paintedCells,
    stopDrag,
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
          <WebGPUPostProcessing
            key={postProcessingKey}
          />
        )}
        <DungeonRoom visibility={visibility} />
        <RoomResizeOverlay />
        {propLightBudget > 0 && (
          <PropLightPool objects={objects} visibility={visibility} maxLights={propLightBudget} />
        )}
        {topLevelObjects.map((object) => (
          dragState?.objectId === object.id ? null : (
            <DungeonObject
              key={object.id}
              object={object}
              visibility={visibility}
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
        <FireParticleSystem objects={objects} visibility={visibility} />
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
