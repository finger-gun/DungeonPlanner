/**
 * WebGPU-native post-processing: tilt-shift DoF + selection outline.
 * Imports only from three/tsl and three/webgpu (proper package exports).
 *
 * Outline uses depth-buffer edge detection (silhouette pixels only),
 * so alphaOver compositing is correct — non-edge pixels are transparent.
 */
import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { pass, uniform } from 'three/tsl'
import { tiltShift } from '../../postprocessing/tiltShift'
import { depthFocusRangeFromFocalLength } from '../../postprocessing/tiltShiftMath'
import { selectionOutline, alphaOver, SELECTION_OUTLINE_LAYER } from '../../postprocessing/selectionOutline'
import {
  EXPLORED_MEMORY_MASK_LAYER,
  applyLineOfSightMask,
  geometryLayerMask,
  LINE_OF_SIGHT_MASK_LAYER,
} from '../../postprocessing/lineOfSightMask'
import { useDungeonStore } from '../../store/useDungeonStore'
import { getRegisteredObject } from './objectRegistry'

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

  const focusCenterUniform = useRef(uniform(0.5))
  const focusRangeUniform  = useRef(uniform(0.15))
  const blurRadiusUniform  = useRef(uniform(6))

  const settings  = useDungeonStore((state) => state.postProcessing)
  const selection = useDungeonStore((state) => state.selection)

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
  useEffect(() => {
    if (!renderer || !scene || !camera) return

    const baseScenePass = pass(scene as any, camera as any) as any
    const baseSceneDepth = baseScenePass.getTextureNode('depth') as any
    let outputNode = settings.enabled
      ? tiltShift(scene, camera, {
          focusCenter: focusCenterUniform.current,
          focusRange: focusRangeUniform.current,
          blurRadius: blurRadiusUniform.current,
        })
      : baseScenePass.getTextureNode()

    // Clone camera restricted to layer 31 for the selection outline pass
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

    // Pre-warm all material pipelines currently in the scene so Three.js
    // doesn't try to compile them for the first time mid-postprocessing-render
    // (which triggers the WebGPU "PipelineLayout with '' label" error on Firefox).
    ;(renderer as any).compileAsync?.(scene, camera).catch(() => {/* best-effort */})

    return () => {
      postProcessingRef.current = null
      outlineCameraRef.current  = null
      visibleLosCameraRef.current = null
      exploredLosCameraRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, lineOfSightActive, renderer, scene, settings.enabled, size])

  // Update shader uniforms only when settings actually change — not every frame.
  useEffect(() => {
    focusCenterUniform.current.value = settings.focusDistance
    focusRangeUniform.current.value  = depthFocusRangeFromFocalLength(settings.focalLength)
    blurRadiusUniform.current.value  = settings.bokehScale * 4
  }, [settings.focusDistance, settings.focalLength, settings.bokehScale])

  // Priority=1: R3F skips its own gl.render(); we drive the frame.
  useFrame(({ camera: cam }) => {
    if (!postProcessingRef.current) return

    // Sync outline camera to live camera before render
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

    postProcessingRef.current.render()
  }, 1)

  return null
}
