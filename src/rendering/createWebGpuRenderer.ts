import * as THREE from 'three'
import { MeshStandardNodeMaterial, WebGPURenderer } from 'three/webgpu'
import { TiledLighting } from './TiledLighting'
import { registerMeshStandardNodeMaterial } from './nodeMaterialUtils'
import { FORWARD_PLUS_TILE_SIZE, MAX_FORWARD_PLUS_POINT_LIGHTS } from './forwardPlusConfig'
import { requireWebGpu } from './webgpuSupport'

registerMeshStandardNodeMaterial(MeshStandardNodeMaterial)

export async function createWebGpuRenderer(props: THREE.WebGLRendererParameters) {
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
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight, false)
  return renderer
}
