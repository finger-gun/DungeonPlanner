/**
 * WebGPU-native post-processing: tilt-shift DoF + selection outline.
 * Imports only from three/tsl and three/webgpu (proper package exports).
 *
 * Outline uses depth-buffer edge detection (silhouette pixels only),
 * so alphaOver compositing is correct — non-edge pixels are transparent.
 *
 * The entire pipeline shares a single pass(scene, camera) node. Each effect
 * reads color/depth/viewZ from that node rather than creating its own
 * pass(scene, camera). This avoids simultaneous shader compilation for two
 * separate scene render targets, which was causing GPU pipeline errors when
 * point lights were present.
 *
 * A one-frame RAF delay gates rendering after each pipeline rebuild to give
 * Three.js time to kick off initial shader compilation before the first draw.
 */
import { useEffect, useLayoutEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { orthographicDepthToViewZ, pass, uniform } from 'three/tsl'
import { pixelate } from '../../postprocessing/pixelate'
import { tiltShift } from '../../postprocessing/tiltShift'
import { DEFAULT_AUTOFOCUS_SMOOTH_TIME } from '../../postprocessing/tiltShiftMath'
import { selectionOutline, alphaOver, SELECTION_OUTLINE_LAYER } from '../../postprocessing/selectionOutline'
import { useDungeonStore } from '../../store/useDungeonStore'
import { getRegisteredObject } from './objectRegistry'
import { getAutofocusDistance, resolveAutofocusTarget } from './autofocusTarget'
import { getWebGpuPostProcessingPipeline } from './webgpuPostProcessingMode'

export { SELECTION_OUTLINE_LAYER }

export function WebGPUPostProcessing() {
  const { gl: renderer, scene, camera, invalidate } = useThree()
  const postProcessingRef = useRef<THREE.PostProcessing | null>(null)
  // Gates rendering for one RAF tick after each pipeline rebuild so Three.js
  // can begin shader compilation before the first draw. Avoids a black first
  // frame without touching the GPU directly (no compileAsync).
  const pipelineReadyRef = useRef(false)
  const outlineCameraRef  = useRef<THREE.Camera | null>(null)
  const visibleLosCameraRef = useRef<THREE.Camera | null>(null)
  const exploredLosCameraRef = useRef<THREE.Camera | null>(null)

  const focusDistanceUniform = useRef(uniform((camera as any).far ?? 100))
  const nearFocusRangeUniform = useRef(uniform(0.15))
  const farFocusRangeUniform = useRef(uniform(0.15))
  const blurRadiusUniform  = useRef(uniform(6))

  const settings  = useDungeonStore((state) => state.postProcessing)
  const activeCameraMode = useDungeonStore((state) => state.activeCameraMode)
  const selection = useDungeonStore((state) => state.selection)
  const showLensFocusDebugPoint = useDungeonStore((state) => state.showLensFocusDebugPoint)
  const focusMarkerRef = useRef<THREE.Group | null>(null)
  const focusRaycasterRef = useRef(new THREE.Raycaster())
  const focusNdcRef = useRef(new THREE.Vector2(0, 0))
  const focusPointRef = useRef(new THREE.Vector3())
  const focusTargetPointRef = useRef(new THREE.Vector3())
  const focusPointInitializedRef = useRef(false)

  // Track previous selection so we can disable layer 31 on it without a full scene.traverse()
  const prevSelectionRef = useRef<string | null>(null)

  // Keep layer-31 membership in sync with the current selection.
  useEffect(() => {
    const prev = prevSelectionRef.current
    if (prev !== selection) {
      if (prev) {
        getRegisteredObject(prev)?.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) (obj as any).layers.disable(SELECTION_OUTLINE_LAYER)
        })
      }
      if (selection) {
        getRegisteredObject(selection)?.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) (obj as any).layers.enable(SELECTION_OUTLINE_LAYER)
        })
      }
      prevSelectionRef.current = selection
    }
  }, [selection])

  // Build / rebuild the TSL pipeline when renderer / scene / camera / settings change.
  // NOTE: `size` is intentionally omitted — DepthOfFieldNode.updateBefore() calls setSize()
  // automatically each frame from texture dimensions, so resize is handled without a rebuild.
  useLayoutEffect(() => {
    if (!renderer || !scene || !camera) return

    // Single shared scene pass — tiltShift, LoS, and outline all read from
    // this one node so the scene is only rendered once per frame.
    const baseScenePass = pass(scene as any, camera as any) as any
    const baseSceneColor = baseScenePass.getTextureNode() as any
    const baseSceneDepth = baseScenePass.getTextureNode('depth') as any
    const baseSceneViewZ = (camera as any).isOrthographicCamera
      ? orthographicDepthToViewZ(
          baseSceneDepth,
          (camera as any).near ?? 0.1,
          (camera as any).far ?? 100,
        )
      : baseScenePass.getViewZNode()

    const { applyBlur, applyPixelate } = getWebGpuPostProcessingPipeline({
      activeCameraMode,
      lensEnabled: settings.enabled,
      pixelateEnabled: settings.pixelateEnabled,
    })
    let outputNode = baseSceneColor

    if (applyBlur) {
      outputNode = tiltShift(outputNode, baseSceneViewZ, {
        focusDistance: focusDistanceUniform.current,
        nearFocusRange: nearFocusRangeUniform.current,
        farFocusRange: farFocusRangeUniform.current,
        blurRadius: blurRadiusUniform.current,
      })
    }

    if (applyPixelate) {
      outputNode = pixelate(outputNode, baseSceneDepth, { pixelSize: settings.pixelSize })
    }

    const outlineCamera = (camera as any).clone() as THREE.Camera
    ;(outlineCamera as any).layers.disableAll()
    ;(outlineCamera as any).layers.enable(SELECTION_OUTLINE_LAYER)
    outlineCameraRef.current = outlineCamera

    outputNode = alphaOver(outputNode, selectionOutline(scene, outlineCamera))

    visibleLosCameraRef.current = null
    exploredLosCameraRef.current = null

    const postProcessing = new THREE.PostProcessing(
      renderer as unknown as THREE.WebGPURenderer,
    )
    postProcessing.outputNode = outputNode
    postProcessingRef.current = postProcessing
    pipelineReadyRef.current = false

    return () => {
      ;(postProcessing as unknown as { dispose?: () => void }).dispose?.()
      postProcessingRef.current = null
      pipelineReadyRef.current = false
      outlineCameraRef.current  = null
      visibleLosCameraRef.current = null
      exploredLosCameraRef.current = null
    }
  }, [camera, renderer, scene, settings.enabled, settings.pixelateEnabled, settings.pixelSize, activeCameraMode])

  // Multi-frame delay after each pipeline rebuild — lets Three.js begin WebGPU
  // shader compilation (especially for complex scenes with many lights) before
  // the first draw call. A single frame is often not enough when 12+ point
  // lights are present. While waiting, useFrame falls back to a plain
  // gl.render() so the canvas never goes black.
  useEffect(() => {
    pipelineReadyRef.current = false
    let remaining = 3
    let rafId: number
    const tick = () => {
      if (--remaining <= 0) {
        pipelineReadyRef.current = true
        invalidate()
      } else {
        rafId = requestAnimationFrame(tick)
      }
    }
    rafId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafId)
      pipelineReadyRef.current = false
    }
  }, [camera, renderer, scene, settings.enabled, settings.pixelateEnabled, settings.pixelSize, activeCameraMode, invalidate])

  // Update shader uniforms only when settings actually change — not every frame.
  useEffect(() => {
    nearFocusRangeUniform.current.value = settings.focalLength
    farFocusRangeUniform.current.value = settings.backgroundFocalLength
    blurRadiusUniform.current.value  = settings.bokehScale * 4
  }, [
    settings.focalLength,
    settings.backgroundFocalLength,
    settings.bokehScale,
  ])

  useFrame((frameState, delta) => {
    if (!postProcessingRef.current || !pipelineReadyRef.current) {
      // Priority-1 useFrame suppresses R3F's default render. Show plain scene
      // while the PostProcessing pipeline warms up to avoid a black canvas.
      ;(frameState.gl as any).render(frameState.scene, frameState.camera)
      return
    }

    const cam = frameState.camera as any

    const oc = outlineCameraRef.current as any
    if (oc) {
      const src = cam as any
      oc.position.copy(src.position)
      oc.quaternion.copy(src.quaternion)
      oc.matrix.copy(src.matrix)
      oc.matrixWorld.copy(src.matrixWorld)
      if (src.matrixWorldInverse) oc.matrixWorldInverse.copy(src.matrixWorldInverse)
      oc.projectionMatrix.copy(src.projectionMatrix)
      oc.projectionMatrixInverse.copy(src.projectionMatrixInverse)
    }

    const visibleCamera = visibleLosCameraRef.current as any
    if (visibleCamera) {
      const src = cam as any
      visibleCamera.position.copy(src.position)
      visibleCamera.quaternion.copy(src.quaternion)
      visibleCamera.matrix.copy(src.matrix)
      visibleCamera.matrixWorld.copy(src.matrixWorld)
      if (src.matrixWorldInverse) visibleCamera.matrixWorldInverse.copy(src.matrixWorldInverse)
      visibleCamera.projectionMatrix.copy(src.projectionMatrix)
      visibleCamera.projectionMatrixInverse.copy(src.projectionMatrixInverse)
    }

    const exploredCamera = exploredLosCameraRef.current as any
    if (exploredCamera) {
      const src = cam as any
      exploredCamera.position.copy(src.position)
      exploredCamera.quaternion.copy(src.quaternion)
      exploredCamera.matrix.copy(src.matrix)
      exploredCamera.matrixWorld.copy(src.matrixWorld)
      if (src.matrixWorldInverse) exploredCamera.matrixWorldInverse.copy(src.matrixWorldInverse)
      exploredCamera.projectionMatrix.copy(src.projectionMatrix)
      exploredCamera.projectionMatrixInverse.copy(src.projectionMatrixInverse)
    }

    const focusMarker = focusMarkerRef.current as any
    if (!settings.enabled) {
      focusPointInitializedRef.current = false
      if (focusMarker) {
        focusMarker.visible = false
      }
      postProcessingRef.current.render()
      return
    }

    const raycaster = focusRaycasterRef.current
    raycaster.layers.mask = (cam as any).layers.mask
    raycaster.setFromCamera(focusNdcRef.current, cam as any)

    const hit = raycaster
      .intersectObjects(scene.children, true)
      .find((intersection) => !intersection.object.userData?.ignoreLensFocusDebug)

    const controls = (frameState as any).controls as any
    const preferOrbitTarget = cam.isOrthographicCamera === true
    const orbitTarget = controls?.target
      ? { x: controls.target.x, y: controls.target.y, z: controls.target.z }
      : null
    const raycastTarget = hit
      ? { x: hit.point.x, y: hit.point.y, z: hit.point.z }
      : null
    const resolvedTarget = resolveAutofocusTarget(preferOrbitTarget, orbitTarget, raycastTarget)

    if (resolvedTarget) {
      focusTargetPointRef.current.set(resolvedTarget.x, resolvedTarget.y, resolvedTarget.z)

      if (!focusPointInitializedRef.current || delta <= 0) {
        focusPointRef.current.copy(focusTargetPointRef.current)
        focusPointInitializedRef.current = true
      } else {
        const alpha = 1 - Math.exp(-delta / DEFAULT_AUTOFOCUS_SMOOTH_TIME)
        focusPointRef.current.lerp(focusTargetPointRef.current, alpha)
      }

      focusDistanceUniform.current.value = Math.max(
        (cam as any).near ?? 0.01,
        getAutofocusDistance(cam, focusPointRef.current),
      )

      if (focusMarker) {
        if (showLensFocusDebugPoint) {
          focusMarker.visible = true
          focusMarker.position.copy(focusPointRef.current)
        } else {
          focusMarker.visible = false
        }
      }
    } else {
      focusPointInitializedRef.current = false
      if (focusMarker) {
        focusMarker.visible = false
      }
    }

    postProcessingRef.current.render()
  }, 1)

  return (
    <group
      ref={focusMarkerRef}
      visible={false}
      userData={{ ignoreLensFocusDebug: true }}
      renderOrder={10}
    >
      <mesh userData={{ ignoreLensFocusDebug: true }}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial
          color="#34d399"
          depthTest={false}
          depthWrite={false}
          transparent
          opacity={0.95}
        />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        userData={{ ignoreLensFocusDebug: true }}
      >
        <ringGeometry args={[0.18, 0.26, 32]} />
        <meshBasicMaterial
          color="#34d399"
          side={THREE.DoubleSide}
          depthTest={false}
          depthWrite={false}
          transparent
          opacity={0.75}
        />
      </mesh>
    </group>
  )
}
