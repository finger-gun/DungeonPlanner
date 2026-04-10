/**
 * WebGPU-native post-processing: tilt-shift DoF + selection outline.
 * Imports only from three/tsl and three/webgpu (proper package exports).
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
  const syncCameraRef = useRef<((src: THREE.Camera) => void) | null>(null)

  const focusCenterUniform = useRef(uniform(0.5))
  const focusRangeUniform  = useRef(uniform(0.15))
  const blurRadiusUniform  = useRef(uniform(6))

  const settings  = useDungeonStore((state) => state.postProcessing)
  const selection = useDungeonStore((state) => state.selection)

  // Maintain the selection layer on the selected object's meshes
  useEffect(() => {
    // Clear layer 31 from everything first
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        ;(obj as any).layers.disable(SELECTION_OUTLINE_LAYER)
      }
    })
    if (selection) {
      const group = getRegisteredObject(selection)
      group?.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          ;(obj as any).layers.enable(SELECTION_OUTLINE_LAYER)
        }
      })
    }
  }, [selection, scene])

  // Build / rebuild the TSL pipeline
  useEffect(() => {
    if (!renderer || !scene || !camera) return

    const tiltShiftNode = tiltShift(scene, camera, {
      focusCenter: focusCenterUniform.current,
      focusRange:  focusRangeUniform.current,
      blurRadius:  blurRadiusUniform.current,
    })

    const { node: outlineNode, syncCamera } = selectionOutline(scene, camera)
    syncCameraRef.current = syncCamera

    const postProcessing = new THREE.PostProcessing(
      renderer as unknown as THREE.WebGPURenderer,
    )
    // Composite: outline pixels over the tilt-shift scene
    postProcessing.outputNode = alphaOver(tiltShiftNode, outlineNode)
    postProcessingRef.current = postProcessing

    return () => {
      postProcessingRef.current = null
      syncCameraRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderer, scene, camera, size])

  useFrame(({ camera: cam }) => {
    if (!postProcessingRef.current) return

    // Keep outline camera in sync with the live render camera
    syncCameraRef.current?.(cam)

    focusCenterUniform.current.value = settings.focusDistance
    focusRangeUniform.current.value  = Math.max(0.02, settings.focalLength / 30)
    blurRadiusUniform.current.value  = settings.bokehScale * 4

    postProcessingRef.current.render()
  }, 1)

  return null
}

