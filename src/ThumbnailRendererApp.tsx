import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrthographicCamera, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { getThumbnailLayout } from './thumbnail/thumbnailLayout'

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
}: {
  assetUrl: string
}) {
  const gltf = useGLTF(assetUrl)
  const scene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene])
  const groupRef = useRef<THREE.Group>(null)
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
    invalidate()

    let settleFrame = 0
    const frame = window.requestAnimationFrame(() => {
      invalidate()
      settleFrame = window.requestAnimationFrame(() => {
        window.__THUMBNAIL_READY__ = true
      })
    })

    return () => {
      window.cancelAnimationFrame(frame)
      window.cancelAnimationFrame(settleFrame)
    }
  }, [camera, invalidate, scene, size.height, size.width])

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  )
}

function ThumbnailViewport({ assetUrl }: { assetUrl: string }) {
  return (
    <Canvas
      data-testid="thumbnail-canvas"
      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
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
        <ThumbnailModel assetUrl={assetUrl} />
      </Suspense>
    </Canvas>
  )
}

export default function ThumbnailRendererApp() {
  const params = new URLSearchParams(window.location.search)
  const assetUrl = params.get('asset')

  useEffect(() => {
    window.__THUMBNAIL_READY__ = false
    window.__THUMBNAIL_ERROR__ = assetUrl ? undefined : 'Missing asset query parameter.'
  }, [assetUrl])

  if (!assetUrl) {
    return null
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-transparent">
      <div className="h-[320px] w-[320px]">
        <ThumbnailViewport assetUrl={assetUrl} />
      </div>
    </div>
  )
}
