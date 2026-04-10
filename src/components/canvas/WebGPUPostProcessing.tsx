/**
 * WebGPU-native post-processing: tilt-shift DoF.
 * Imports only from three/tsl and three/webgpu (proper package exports).
 *
 * The selection outline is handled separately by the inverted-hull technique
 * in ContentPackInstance (always visible regardless of postprocessing state).
 * toonOutlinePass compositing was removed because ToonOutlinePassNode renders
 * with a solid background — alphaOver then painted the whole scene dark.
 */
import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { uniform } from 'three/tsl'
import { tiltShift } from '../../postprocessing/tiltShift'
import { useDungeonStore } from '../../store/useDungeonStore'

export function WebGPUPostProcessing() {
  const { gl: renderer, scene, camera, size } = useThree()
  const postProcessingRef = useRef<THREE.PostProcessing | null>(null)

  const focusCenterUniform = useRef(uniform(0.5))
  const focusRangeUniform  = useRef(uniform(0.15))
  const blurRadiusUniform  = useRef(uniform(6))

  const settings = useDungeonStore((state) => state.postProcessing)

  // Build / rebuild the TSL pipeline when renderer/scene/camera/size change
  useEffect(() => {
    if (!renderer || !scene || !camera) return

    const tiltShiftNode = tiltShift(scene, camera, {
      focusCenter: focusCenterUniform.current,
      focusRange:  focusRangeUniform.current,
      blurRadius:  blurRadiusUniform.current,
    })

    const postProcessing = new THREE.PostProcessing(
      renderer as unknown as THREE.WebGPURenderer,
    )
    postProcessing.outputNode = tiltShiftNode
    postProcessingRef.current = postProcessing

    return () => {
      postProcessingRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderer, scene, camera, size])

  // Priority=1: R3F skips its own gl.render(); we drive the frame.
  useFrame(() => {
    if (!postProcessingRef.current) return

    focusCenterUniform.current.value = settings.focusDistance
    focusRangeUniform.current.value  = Math.max(0.02, settings.focalLength / 30)
    blurRadiusUniform.current.value  = settings.bokehScale * 4

    postProcessingRef.current.render()
  }, 1)

  return null
}
