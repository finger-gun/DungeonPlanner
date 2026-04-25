import { useGLTF as useDreiGLTF } from '@react-three/drei'
import type { WebGLRenderer } from 'three'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import type { WebGPURenderer } from 'three/webgpu'

const KTX2_TRANSCODER_PATH = '/three/basis/'

type SupportedRenderer = WebGLRenderer | WebGPURenderer
type ExtendLoader = NonNullable<Parameters<typeof useDreiGLTF>[3]>
type LoaderInstance = Parameters<ExtendLoader>[0]

const ktx2Loaders = new WeakMap<SupportedRenderer, KTX2Loader>()
const queuedPreloads: Parameters<typeof useDreiGLTF.preload>[] = []
let activeRenderer: SupportedRenderer | null = null

function getKtx2Loader(renderer: SupportedRenderer) {
  const existing = ktx2Loaders.get(renderer)
  if (existing) {
    return existing
  }

  const loader = new KTX2Loader()
  loader.setTranscoderPath(KTX2_TRANSCODER_PATH)
  loader.detectSupport(renderer)
  ktx2Loaders.set(renderer, loader)
  return loader
}

function extendKtx2Loader(
  extendLoader?: Parameters<typeof useDreiGLTF>[3],
): ExtendLoader {
  return (loader: LoaderInstance) => {
    if (activeRenderer) {
      // drei types the GLTFLoader bridge against three-stdlib's KTX2Loader shape,
      // but the WebGPU-safe runtime implementation lives in three/examples.
      loader.setKTX2Loader(
        getKtx2Loader(activeRenderer) as unknown as Parameters<LoaderInstance['setKTX2Loader']>[0],
      )
    }
    extendLoader?.(loader)
  }
}

function runPreload(...args: Parameters<typeof useDreiGLTF.preload>) {
  const [path, useDraco, useMeshOpt, extendLoader] = args
  return useDreiGLTF.preload(path, useDraco, useMeshOpt, extendKtx2Loader(extendLoader))
}

const useGLTFWithKtx2 = ((...args: Parameters<typeof useDreiGLTF>) => {
  const [path, useDraco, useMeshOpt, extendLoader] = args
  return useDreiGLTF(path, useDraco, useMeshOpt, extendKtx2Loader(extendLoader))
}) as typeof useDreiGLTF

useGLTFWithKtx2.preload = ((...args: Parameters<typeof useDreiGLTF.preload>) => {
  if (!activeRenderer) {
    queuedPreloads.push(args)
    return
  }

  return runPreload(...args)
}) as typeof useDreiGLTF.preload

export const useGLTF = useGLTFWithKtx2

export function registerGLTFRenderer(renderer: SupportedRenderer) {
  if (activeRenderer === renderer) {
    return
  }

  activeRenderer = renderer

  while (queuedPreloads.length > 0) {
    const next = queuedPreloads.shift()
    if (!next) {
      break
    }
    runPreload(...next)
  }
}
