import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { getThumbnailLayout } from './thumbnail/thumbnailLayout'
import { upgradeStandardMaterialsToNodeMaterials } from './rendering/nodeMaterialUtils'
import { RendererErrorBoundary } from './components/RendererErrorBoundary'
import { createWebGpuRenderer } from './rendering/createWebGpuRenderer'
import { useGLTF } from './rendering/useGLTF'
import { registerGLTFRenderer } from './rendering/useGLTF'

function getRenderableBounds(root: THREE.Object3D) {
  root.updateWorldMatrix(true, true)

  const bounds = new THREE.Box3()
  const meshBounds = new THREE.Box3()
  const hasBounds = { current: false }

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.geometry) {
      return
    }

    const geometry = child.geometry
    geometry.computeBoundingBox()

    if (!geometry.boundingBox) {
      return
    }

    meshBounds.copy(geometry.boundingBox).applyMatrix4(child.matrixWorld)

    if (!hasBounds.current) {
      bounds.copy(meshBounds)
      hasBounds.current = true
      return
    }

    bounds.union(meshBounds)
  })

  return hasBounds.current ? bounds : new THREE.Box3().setFromObject(root)
}

declare global {
  interface Window {
    __THUMBNAIL_READY__?: boolean
    __THUMBNAIL_ERROR__?: string
  }
}

function ThumbnailModel({
  assetUrl,
  useNodeMaterials,
}: {
  assetUrl: string
  useNodeMaterials: boolean
}) {
  const gltf = useGLTF(assetUrl)
  const scene = useMemo(
    () => (
      useNodeMaterials
        ? upgradeStandardMaterialsToNodeMaterials(SkeletonUtils.clone(gltf.scene))
        : SkeletonUtils.clone(gltf.scene)
    ),
    [gltf.scene, useNodeMaterials],
  )
  const groupRef = useRef<THREE.Group>(null)
  const renderedFramesRef = useRef(-1)
  const { camera, invalidate, size } = useThree()

  useEffect(() => {
    const group = groupRef.current
    if (!group || !(camera instanceof THREE.OrthographicCamera)) {
      return
    }

    const bounds = getRenderableBounds(group)
    const layout = getThumbnailLayout({
      min: [bounds.min.x, bounds.min.y, bounds.min.z],
      max: [bounds.max.x, bounds.max.y, bounds.max.z],
    }, size.width / Math.max(size.height, 1))

    group.position.set(...layout.modelPosition)
    group.updateWorldMatrix(true, true)
    camera.position.set(...layout.cameraPosition)
    camera.up.set(...layout.cameraUp)
    camera.lookAt(...layout.target)
    camera.near = 0.1
    camera.far = layout.far
    camera.zoom = layout.zoom
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld()
    renderedFramesRef.current = 0
    invalidate()
  }, [camera, invalidate, scene, size.height, size.width])

  useFrame(() => {
    if (renderedFramesRef.current < 0 || window.__THUMBNAIL_READY__) {
      return
    }

    renderedFramesRef.current += 1
    if (renderedFramesRef.current < 3) {
      invalidate()
      return
    }

    window.__THUMBNAIL_READY__ = true
  })

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  )
}

function createThumbnailWebGlRenderer(props: THREE.WebGLRendererParameters) {
  const renderer = new THREE.WebGLRenderer({
    canvas: props.canvas as HTMLCanvasElement | undefined,
    antialias: props.antialias ?? true,
    alpha: props.alpha ?? true,
    preserveDrawingBuffer: true,
    powerPreference: props.powerPreference,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight, false)
  registerGLTFRenderer(renderer)
  return renderer
}

function ThumbnailViewport({
  assetUrl,
  useWebGpu,
}: {
  assetUrl: string
  useWebGpu: boolean
}) {
  return (
    <Canvas
      data-testid="thumbnail-canvas"
      gl={useWebGpu ? createWebGpuRenderer : createThumbnailWebGlRenderer}
      dpr={1}
    >
      <OrthographicCamera
        makeDefault
        position={[3, 2, 3]}
        left={-1}
        right={1}
        top={1}
        bottom={-1}
        zoom={1}
      />
      <ambientLight intensity={1.5} />
      <directionalLight position={[6, 8, 6]} intensity={2.2} />
      <directionalLight position={[-4, 5, 3]} intensity={0.8} />
      <Suspense fallback={null}>
        <ThumbnailModel assetUrl={assetUrl} useNodeMaterials={useWebGpu} />
      </Suspense>
    </Canvas>
  )
}

export default function ThumbnailRendererApp() {
  const params = new URLSearchParams(window.location.search)
  const assetUrl = params.get('asset')
  const [useWebGpu, setUseWebGpu] = useState<boolean | null>(null)

  useEffect(() => {
    window.__THUMBNAIL_READY__ = false
    window.__THUMBNAIL_ERROR__ = assetUrl ? undefined : 'Missing asset query parameter.'
  }, [assetUrl])

  useEffect(() => {
    if (!assetUrl) {
      setUseWebGpu(false)
      return
    }

    let cancelled = false

    async function resolveRendererMode() {
      if (typeof navigator === 'undefined' || !navigator.gpu) {
        if (!cancelled) {
          setUseWebGpu(false)
        }
        return
      }

      try {
        const adapter = await navigator.gpu.requestAdapter()
        if (!cancelled) {
          setUseWebGpu(Boolean(adapter))
        }
      } catch {
        if (!cancelled) {
          setUseWebGpu(false)
        }
      }
    }

    void resolveRendererMode()

    return () => {
      cancelled = true
    }
  }, [assetUrl])

  if (!assetUrl) {
    return null
  }

  if (useWebGpu === null) {
    return null
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-transparent">
      <div className="h-[320px] w-[320px]">
        <RendererErrorBoundary
          title="Thumbnail renderer unavailable"
          onError={(error) => {
            window.__THUMBNAIL_ERROR__ = error.message
          }}
        >
          <ThumbnailViewport assetUrl={assetUrl} useWebGpu={useWebGpu} />
        </RendererErrorBoundary>
      </div>
    </div>
  )
}
