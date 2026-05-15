import * as THREE from 'three'
import { FORWARD_PLUS_TILE_SIZE, MAX_FORWARD_PLUS_POINT_LIGHTS } from './forwardPlusConfig'
import { requireWebGpu } from './webgpuSupport'
import type { TiledLighting as TiledLightingType } from './TiledLighting'

type WebGpuRuntime = {
  MeshStandardNodeMaterial: (typeof import('three/webgpu'))['MeshStandardNodeMaterial']
  WebGPURenderer: (typeof import('three/webgpu'))['WebGPURenderer']
  TiledLighting: typeof TiledLightingType
  registerMeshStandardNodeMaterial: typeof import('./nodeMaterialUtils')['registerMeshStandardNodeMaterial']
  registerGLTFRenderer: typeof import('./useGLTF')['registerGLTFRenderer']
}

let webGpuRuntimePromise: Promise<WebGpuRuntime> | null = null

function enableLocalClipping(renderer: object) {
  Reflect.set(renderer, 'localClippingEnabled', true)
}

function loadWebGpuRuntime() {
  if (!webGpuRuntimePromise) {
    webGpuRuntimePromise = Promise.all([
      import('three/webgpu'),
      import('./TiledLighting'),
      import('./nodeMaterialUtils'),
      import('./useGLTF'),
    ]).then(([threeWebGpu, tiledLightingModule, nodeMaterialUtilsModule, gltfModule]) => {
      nodeMaterialUtilsModule.registerMeshStandardNodeMaterial(threeWebGpu.MeshStandardNodeMaterial)
      return {
        MeshStandardNodeMaterial: threeWebGpu.MeshStandardNodeMaterial,
        WebGPURenderer: threeWebGpu.WebGPURenderer,
        TiledLighting: tiledLightingModule.TiledLighting,
        registerMeshStandardNodeMaterial: nodeMaterialUtilsModule.registerMeshStandardNodeMaterial,
        registerGLTFRenderer: gltfModule.registerGLTFRenderer,
      }
    })
  }

  return webGpuRuntimePromise
}

export async function createWebGpuRenderer(props: THREE.WebGLRendererParameters) {
  const { WebGPURenderer, TiledLighting, registerGLTFRenderer } = await loadWebGpuRuntime()
  const powerPreference =
    props.powerPreference === 'high-performance' ? 'high-performance' : 'low-power'

  const canvas = props.canvas as HTMLCanvasElement | undefined
  const gpu = requireWebGpu()
  const adapter = await gpu.requestAdapter({ powerPreference })

  if (!adapter) {
    throw new Error('WebGPU is available, but no compatible GPU adapter was found.')
  }

  const requiredLimits: Record<string, number> = {
    maxSampledTexturesPerShaderStage: adapter.limits.maxSampledTexturesPerShaderStage,
  }

  const renderer = new WebGPURenderer({
    canvas,
    antialias: props.antialias ?? true,
    alpha: props.alpha ?? true,
    powerPreference,
    requiredLimits,
  } as ConstructorParameters<typeof WebGPURenderer>[0])

  try {
    await renderer.init()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown renderer initialization error.'
    throw new Error(`WebGPU renderer initialization failed: ${message}`)
  }

  renderer.lighting = new TiledLighting(MAX_FORWARD_PLUS_POINT_LIGHTS, FORWARD_PLUS_TILE_SIZE)
  enableLocalClipping(renderer)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight, false)
  registerGLTFRenderer(renderer)
  return renderer
}
