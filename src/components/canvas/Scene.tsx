import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { Grid } from './Grid'
import { Controls } from './Controls'
import { CameraPresetManager } from './CameraPresetManager'
import { DungeonObject } from './DungeonObject'
import { DungeonRoom } from './DungeonRoom'
import { useDungeonStore } from '../../store/useDungeonStore'

async function createPreferredRenderer(props: THREE.WebGLRendererParameters) {
  const powerPreference =
    props.powerPreference === 'high-performance' ? 'high-performance' : 'low-power'

  const canvas = props.canvas as HTMLCanvasElement | undefined

  try {
    const renderer = new WebGPURenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference,
    })

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
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [9, 11, 9], fov: 42, near: 0.1, far: 140 }}
      gl={createPreferredRenderer}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  )
}

export default Scene

function SceneContent() {
  const placedObjects = useDungeonStore((state) => state.placedObjects)
  const layers = useDungeonStore((state) => state.layers)
  const lightIntensity = useDungeonStore((state) => state.sceneLighting.intensity)
  const groundPlane = useDungeonStore((state) => state.groundPlane)

  const objects = useMemo(
    () => Object.values(placedObjects).filter((obj) => layers[obj.layerId]?.visible !== false),
    [placedObjects, layers],
  )

  const groundColor =
    groundPlane === 'black' ? '#0e0e0e' :
    /* green */ '#2a4a1a'

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

      {/* Ground plane — rendered at y=-0.01 so the grid helper at y=0.001 stays on top */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} renderOrder={-1} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color={groundColor} roughness={1} metalness={0} />
      </mesh>

      <Grid />
      <DungeonRoom />
      {objects.map((object) => (
        <DungeonObject key={object.id} object={object} />
      ))}

      <Controls />
      <CameraPresetManager />
    </>
  )
}
