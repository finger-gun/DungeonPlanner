/**
 * WebGPU-native post-processing: tilt-shift DoF + selection outline.
 * Imports only from three/tsl and three/webgpu (proper package exports).
 *
 * Outline uses depth-buffer edge detection (silhouette pixels only),
 * so alphaOver compositing is correct — non-edge pixels are transparent.
 */
import { useEffect, useLayoutEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { pass, uniform } from 'three/tsl'
import { tiltShift } from '../../postprocessing/tiltShift'
import { DEFAULT_AUTOFOCUS_SMOOTH_TIME } from '../../postprocessing/tiltShiftMath'
import { selectionOutline, alphaOver, SELECTION_OUTLINE_LAYER } from '../../postprocessing/selectionOutline'
import {
  EXPLORED_MEMORY_MASK_LAYER,
  applyLineOfSightMask,
  geometryLayerMask,
  LINE_OF_SIGHT_MASK_LAYER,
} from '../../postprocessing/lineOfSightMask'
import { useDungeonStore } from '../../store/useDungeonStore'
import { getRegisteredObject } from './objectRegistry'
import { resolveAutofocusTarget } from './autofocusTarget'

export { SELECTION_OUTLINE_LAYER }

export function WebGPUPostProcessing({
  lineOfSightActive = false,
}: {
  lineOfSightActive?: boolean
}) {
  const { gl: renderer, scene, camera, size } = useThree()
  const postProcessingRef = useRef<THREE.PostProcessing | null>(null)
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
  // Uses the object registry for O(1) lookup instead of scene.traverse() for O(n).
  useEffect(() => {
    const prev = prevSelectionRef.current
    if (prev !== selection) {
      // Disable outline on previously selected object
      if (prev) {
        getRegisteredObject(prev)?.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) (obj as any).layers.disable(SELECTION_OUTLINE_LAYER)
        })
      }
      // Enable outline on newly selected object
      if (selection) {
        getRegisteredObject(selection)?.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) (obj as any).layers.enable(SELECTION_OUTLINE_LAYER)
        })
      }
      prevSelectionRef.current = selection
    }
  }, [selection])

  // Build / rebuild the TSL pipeline when renderer / scene / camera / size change
  useLayoutEffect(() => {
    if (!renderer || !scene || !camera) return

    const baseScenePass = pass(scene as any, camera as any) as any
    const baseSceneDepth = baseScenePass.getTextureNode('depth') as any
    const shouldApplyBlur = settings.enabled && activeCameraMode !== 'top-down'
    let outputNode = shouldApplyBlur
      ? tiltShift(scene, camera, {
          focusDistance: focusDistanceUniform.current,
          nearFocusRange: nearFocusRangeUniform.current,
          farFocusRange: farFocusRangeUniform.current,
          blurRadius: blurRadiusUniform.current,
        })
      : baseScenePass.getTextureNode()

    const outlineCamera = (camera as any).clone() as THREE.Camera
    ;(outlineCamera as any).layers.disableAll()
    ;(outlineCamera as any).layers.enable(SELECTION_OUTLINE_LAYER)
    outlineCameraRef.current = outlineCamera

    if (settings.enabled) {
      outputNode = alphaOver(outputNode, selectionOutline(scene, outlineCamera))
    }

    if (lineOfSightActive) {
      const visibleLosCamera = (camera as any).clone() as THREE.Camera
      ;(visibleLosCamera as any).layers.disableAll()
      ;(visibleLosCamera as any).layers.enable(LINE_OF_SIGHT_MASK_LAYER)
      visibleLosCameraRef.current = visibleLosCamera

      const exploredLosCamera = (camera as any).clone() as THREE.Camera
      ;(exploredLosCamera as any).layers.disableAll()
      ;(exploredLosCamera as any).layers.enable(EXPLORED_MEMORY_MASK_LAYER)
      exploredLosCameraRef.current = exploredLosCamera

      outputNode = applyLineOfSightMask(
        outputNode,
        geometryLayerMask(scene, visibleLosCamera, baseSceneDepth),
        geometryLayerMask(scene, exploredLosCamera, baseSceneDepth),
      )
    } else {
      visibleLosCameraRef.current = null
      exploredLosCameraRef.current = null
    }

    const postProcessing = new THREE.PostProcessing(
      renderer as unknown as THREE.WebGPURenderer,
    )
    postProcessing.outputNode = outputNode
    postProcessingRef.current = postProcessing

    return () => {
      postProcessingRef.current = null
      outlineCameraRef.current  = null
      visibleLosCameraRef.current = null
      exploredLosCameraRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, lineOfSightActive, renderer, scene, settings.enabled, activeCameraMode, size])

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
    if (!postProcessingRef.current) {
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
        cam.position.distanceTo(focusPointRef.current),
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
