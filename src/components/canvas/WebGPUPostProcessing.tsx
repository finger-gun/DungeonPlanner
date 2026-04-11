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
import { uniform } from 'three/tsl'
import { tiltShift } from '../../postprocessing/tiltShift'
import { selectionOutline, alphaOver, SELECTION_OUTLINE_LAYER } from '../../postprocessing/selectionOutline'
import { useDungeonStore } from '../../store/useDungeonStore'
import { getRegisteredObject } from './objectRegistry'

export { SELECTION_OUTLINE_LAYER }

export function WebGPUPostProcessing() {
  const { gl: renderer, scene, camera, size } = useThree()
  const postProcessingRef = useRef<THREE.PostProcessing | null>(null)
  const outlineCameraRef  = useRef<THREE.Camera | null>(null)

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

    // Clone camera restricted to layer 31 for the selection outline pass
    const outlineCamera = (camera as any).clone() as THREE.Camera
    ;(outlineCamera as any).layers.disableAll()
    ;(outlineCamera as any).layers.enable(SELECTION_OUTLINE_LAYER)
    outlineCameraRef.current = outlineCamera

    const tiltShiftNode = tiltShift(scene, camera, {
      focusCenter: focusCenterUniform.current,
      focusRange:  focusRangeUniform.current,
      blurRadius:  blurRadiusUniform.current,
    })

    const outlineNode = selectionOutline(scene, outlineCamera)

    const postProcessing = new THREE.PostProcessing(
      renderer as unknown as THREE.WebGPURenderer,
    )
    // Depth-based outline is transparent where no edge → safe to alphaOver
    postProcessing.outputNode = alphaOver(tiltShiftNode, outlineNode)
    postProcessingRef.current = postProcessing

    // Pre-warm all material pipelines currently in the scene so Three.js
    // doesn't try to compile them for the first time mid-postprocessing-render
    // (which triggers the WebGPU "PipelineLayout with '' label" error on Firefox).
    ;(renderer as any).compileAsync?.(scene, camera).catch(() => {/* best-effort */})

    return () => {
      postProcessingRef.current = null
      outlineCameraRef.current  = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderer, scene, camera, size])

  // Update shader uniforms only when settings actually change — not every frame.
  useEffect(() => {
    focusCenterUniform.current.value = settings.focusDistance
    focusRangeUniform.current.value  = Math.max(0.02, settings.focalLength / 30)
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

    postProcessingRef.current.render()
  }, 1)

  return null
}
