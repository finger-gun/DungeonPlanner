import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { FpsMeterNode } from './FpsCounter'
import { Grid } from './Grid'
import { Controls } from './Controls'
import { FloorTransitionController } from './FloorTransitionController'
import { CameraPresetManager } from './CameraPresetManager'
import { DungeonObject } from './DungeonObject'
import { DungeonRoom } from './DungeonRoom'
import { WebGPUPostProcessing } from './WebGPUPostProcessing'
import { EntityLayer } from './EntityLayer'
import { FogOfWar } from './FogOfWar'
import { useDungeonStore } from '../../store/useDungeonStore'

async function createPreferredRenderer(props: THREE.WebGLRendererParameters) {
  const powerPreference =
    props.powerPreference === 'high-performance' ? 'high-performance' : 'low-power'

  const canvas = props.canvas as HTMLCanvasElement | undefined

  // Query the WebGPU adapter for its actual texture-binding limit before
  // creating the renderer. The WebGPU default (16) is too low for scenes with
  // many shadow-casting point lights + PBR textures. Modern GPUs support 96+.
  const requiredLimits: Record<string, number> = {}
  try {
    const adapter = await navigator.gpu?.requestAdapter({ powerPreference })
    if (adapter) {
      const max = adapter.limits.maxSampledTexturesPerShaderStage
      // Request the full adapter maximum so shadow maps don't consume all slots
      requiredLimits.maxSampledTexturesPerShaderStage = max
    }
  } catch {
    // Non-WebGPU environment — limit is irrelevant for the WebGL fallback
  }

  try {
    const renderer = new WebGPURenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference,
      requiredLimits,
    } as ConstructorParameters<typeof WebGPURenderer>[0])

    await renderer.init()
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight, false)
    return renderer
  } catch {
    // WebGPU not available — fall back to the WebGL backend of WebGPURenderer
    // so that TSL NodeMaterials are still fully supported.
    console.warn('WebGPU unavailable, falling back to WebGL with node-material support.')
    const renderer = new WebGPURenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference,
      forceWebGL: true,
    } as ConstructorParameters<typeof WebGPURenderer>[0])

    await renderer.init()
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight, false)
    return renderer
  }
}

export function Scene() {
  const activeFloorId = useDungeonStore((state) => state.activeFloorId)
  const floors        = useDungeonStore((state) => state.floors)

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
      gl={createPreferredRenderer}
      frameloop="demand"
    >
      <Suspense fallback={null}>
        {/* Global scene elements — never remount on floor switch */}
        <GlobalContent />
        {/* Floor-specific content — remounts when active floor changes */}
        <FloorContent key={activeFloorId} startY={floorAnimStartY.current} />
      </Suspense>
    </Canvas>
  )
}

export default Scene

/** Camera, controls, lighting, grid — shared across all floors. */
function GlobalContent() {
  const lightIntensity = useDungeonStore((state) => state.sceneLighting.intensity)
  const postProcessingEnabled = useDungeonStore((state) => state.postProcessing.enabled)

  return (
    <>
      <color attach="background" args={['#120f0e']} />
      <fog attach="fog" args={['#120f0e', 26, 74]} />
      <ambientLight intensity={1.6 * lightIntensity} color="#ffe4c7" />
      <directionalLight
        castShadow
        intensity={2 * lightIntensity}
        color="#ffd29d"
        position={[9, 14, 7]}
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
        intensity={0.85 * lightIntensity}
        color="#89dceb"
        position={[-8, 7, -4]}
      />

      <Grid />
      <Controls />
      <FloorTransitionController />
      <CameraPresetManager />
      <FpsMeterNode />
      <FrameDriver />
      {postProcessingEnabled && <WebGPUPostProcessing />}
    </>
  )
}

/** Dungeon room tiles and props — remounts on floor switch for clean state. */
function FloorContent({ startY = 0 }: { startY?: number }) {
  const placedObjects = useDungeonStore((state) => state.placedObjects)
  const layers = useDungeonStore((state) => state.layers)

  const objects = useMemo(
    () => Object.values(placedObjects).filter((obj) => layers[obj.layerId]?.visible !== false),
    [placedObjects, layers],
  )

  const groupRef = useRef<THREE.Group>(null)
  const animYRef = useRef(startY)
  const { invalidate } = useThree()

  useFrame((_, delta) => {
    if (Math.abs(animYRef.current) < 0.002) {
      if (groupRef.current) groupRef.current.position.y = 0
      return
    }
    animYRef.current *= Math.exp(-10 * delta)
    if (groupRef.current) groupRef.current.position.y = animYRef.current
    invalidate()
  })

  return (
    <group ref={groupRef} position={[0, startY, 0]}>
      <DungeonRoom />
      {objects.map((object) => (
        <DungeonObject key={object.id} object={object} />
      ))}
      <FogOfWar />
      <EntityLayer />
    </group>
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
