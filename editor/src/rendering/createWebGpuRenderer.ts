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

type WebGpuBackendLike = {
  device: GPUDevice
  get: (value: unknown) => Record<string, unknown>
  bindingUtils?: {
    createBindGroup: (bindGroup: WebGpuBindGroupLike, layoutGPU: GPUBindGroupLayout) => GPUBindGroup
  }
}

type WebGpuBindGroupLike = {
  name: string
  bindings: WebGpuBindingLike[]
}

type WebGpuGlobals = typeof globalThis & {
  GPUBufferUsage: { UNIFORM: number; COPY_DST: number }
  GPUShaderStage: { VERTEX: number; FRAGMENT: number; COMPUTE: number }
}

type WebGpuBindingLike = {
  id: number
  name: string
  visibility: number
  isUniformBuffer?: boolean
  isStorageBuffer?: boolean
  isSampledTexture?: boolean
  isSampledCubeTexture?: boolean
  isSampledTexture3D?: boolean
  isSampler?: boolean
  store?: boolean
  mipLevel?: number
  byteLength?: number
  buffer?: ArrayBufferLike | ArrayBufferView
  attribute?: unknown
  texture?: THREE.Texture & {
    isDepthTexture?: boolean
    isArrayTexture?: boolean
    isDataArrayTexture?: boolean
    isCompressedArrayTexture?: boolean
  }
}

function enableLocalClipping(renderer: object) {
  Reflect.set(renderer, 'localClippingEnabled', true)
}

export function getSampledTextureViewAspect(texture: Pick<NonNullable<WebGpuBindingLike['texture']>, 'isDepthTexture'>) {
  return texture.isDepthTexture ? 'depth-only' : 'all'
}

function patchWebGpuDepthTextureBindingViews(renderer: object) {
  const backend = Reflect.get(renderer, 'backend') as WebGpuBackendLike | undefined
  const bindingUtils = backend?.bindingUtils
  if (!backend || !bindingUtils) {
    return
  }

  if (Reflect.get(bindingUtils as object, '__depthTextureViewPatchInstalled') === true) {
    return
  }

  const originalCreateBindGroup = bindingUtils.createBindGroup.bind(bindingUtils)

  bindingUtils.createBindGroup = (bindGroup, layoutGPU) => {
    if (!bindGroup.bindings.some((binding) => binding.isSampledTexture && binding.texture?.isDepthTexture)) {
      return originalCreateBindGroup(bindGroup, layoutGPU)
    }

    const { device } = backend
    const gpuBufferUsage = (globalThis as unknown as WebGpuGlobals).GPUBufferUsage
    const gpuShaderStage = (globalThis as unknown as WebGpuGlobals).GPUShaderStage
    let bindingPoint = 0
    const entriesGPU: GPUBindGroupEntry[] = []

    for (const binding of bindGroup.bindings) {
      if (binding.isUniformBuffer) {
        const bindingData = backend.get(binding)

        if (bindingData.buffer === undefined) {
          const byteLength = binding.byteLength ?? 0
          const visibilities: string[] = []
          if (binding.visibility & gpuShaderStage.VERTEX) {
            visibilities.push('vertex')
          }
          if (binding.visibility & gpuShaderStage.FRAGMENT) {
            visibilities.push('fragment')
          }
          if (binding.visibility & gpuShaderStage.COMPUTE) {
            visibilities.push('compute')
          }

          bindingData.buffer = device.createBuffer({
            label: `bindingBuffer${binding.id}_${binding.name}_(${visibilities.join(',')})`,
            size: byteLength,
            usage: gpuBufferUsage.UNIFORM | gpuBufferUsage.COPY_DST,
          })
        }

        entriesGPU.push({ binding: bindingPoint, resource: { buffer: bindingData.buffer as GPUBuffer } })
      } else if (binding.isStorageBuffer) {
        const buffer = backend.get(binding.attribute).buffer as GPUBuffer
        entriesGPU.push({ binding: bindingPoint, resource: { buffer } })
      } else if (binding.isSampledTexture && binding.texture) {
        const textureData = backend.get(binding.texture)
        let resourceGPU: GPUTextureView | GPUExternalTexture

        if (textureData.externalTexture !== undefined) {
          resourceGPU = device.importExternalTexture({
            source: textureData.externalTexture as HTMLVideoElement | VideoFrame,
          })
        } else {
          const textureGPU = textureData.texture as GPUTexture
          const mipLevelCount = binding.store ? 1 : textureGPU.mipLevelCount
          const baseMipLevel = binding.store ? (binding.mipLevel ?? 0) : 0
          const aspect = getSampledTextureViewAspect(binding.texture)
          let propertyName = `view-${textureGPU.width}-${textureGPU.height}`

          if (textureGPU.depthOrArrayLayers > 1) {
            propertyName += `-${textureGPU.depthOrArrayLayers}`
          }

          propertyName += `-${mipLevelCount}-${baseMipLevel}-${aspect}`
          const cachedView = textureData[propertyName] as GPUTextureView | undefined

          if (cachedView !== undefined) {
            resourceGPU = cachedView
          } else {
            const dimension: GPUTextureViewDimension =
              binding.isSampledCubeTexture
                ? 'cube'
                : binding.isSampledTexture3D
                  ? '3d'
                  : binding.texture.isArrayTexture || binding.texture.isDataArrayTexture || binding.texture.isCompressedArrayTexture
                    ? '2d-array'
                    : '2d'

            resourceGPU = textureData[propertyName] = textureGPU.createView({
              aspect,
              dimension,
              mipLevelCount,
              baseMipLevel,
            })
          }
        }

        entriesGPU.push({ binding: bindingPoint, resource: resourceGPU })
      } else if (binding.isSampler && binding.texture) {
        const textureGPU = backend.get(binding.texture)
        entriesGPU.push({ binding: bindingPoint, resource: textureGPU.sampler as GPUSampler })
      }

      bindingPoint += 1
    }

    return device.createBindGroup({
      label: `bindGroup_${bindGroup.name}`,
      layout: layoutGPU,
      entries: entriesGPU,
    })
  }

  Reflect.set(bindingUtils as object, '__depthTextureViewPatchInstalled', true)
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

export function buildWebGpuRendererOptions(
  props: THREE.WebGLRendererParameters,
  powerPreference: 'high-performance' | 'low-power',
  requiredLimits: Record<string, number>,
) {
  const canvas = props.canvas as HTMLCanvasElement | undefined
  return {
    canvas,
    antialias: props.antialias ?? true,
    alpha: props.alpha ?? true,
    depth: props.depth ?? true,
    stencil: true,
    powerPreference,
    requiredLimits,
  }
}

export async function createWebGpuRenderer(props: THREE.WebGLRendererParameters) {
  const { WebGPURenderer, TiledLighting, registerGLTFRenderer } = await loadWebGpuRuntime()
  const powerPreference =
    props.powerPreference === 'high-performance' ? 'high-performance' : 'low-power'

  const gpu = requireWebGpu()
  const adapter = await gpu.requestAdapter({ powerPreference })

  if (!adapter) {
    throw new Error('WebGPU is available, but no compatible GPU adapter was found.')
  }

  const requiredLimits: Record<string, number> = {
    maxSampledTexturesPerShaderStage: adapter.limits.maxSampledTexturesPerShaderStage,
  }

  const renderer = new WebGPURenderer(
    buildWebGpuRendererOptions(props, powerPreference, requiredLimits) as ConstructorParameters<typeof WebGPURenderer>[0],
  )

  try {
    await renderer.init()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown renderer initialization error.'
    throw new Error(`WebGPU renderer initialization failed: ${message}`)
  }

  renderer.lighting = new TiledLighting(MAX_FORWARD_PLUS_POINT_LIGHTS, FORWARD_PLUS_TILE_SIZE)
  patchWebGpuDepthTextureBindingViews(renderer)
  enableLocalClipping(renderer)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight, false)
  registerGLTFRenderer(renderer)
  return renderer
}
