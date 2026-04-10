/**
 * WebGPU-native post-processing using Three.js TSL nodes.
 * Renders DoF (tilt-shift miniature) + Outline (selection highlight).
 *
 * Must run inside a R3F Canvas that uses WebGPURenderer.
 */
import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { pass, uniform, color } from 'three/tsl'
import { dof } from 'three/examples/jsm/tsl/display/DepthOfFieldNode.js'
import { outline } from 'three/examples/jsm/tsl/display/OutlineNode.js'
import { useDungeonStore } from '../../store/useDungeonStore'
import { getRegisteredObject } from './objectRegistry'

export function WebGPUPostProcessing() {
  const { gl: renderer, scene, camera, size } = useThree()
  const postProcessingRef = useRef<THREE.PostProcessing | null>(null)

  // Uniforms — updated each frame from store without re-creating the pipeline
  const focusDistanceUniform = useRef(uniform(8))
  const focalLengthUniform = useRef(uniform(3))
  const bokehScaleUniform = useRef(uniform(2))
  const edgeStrengthUniform = useRef(uniform(3.0))

  // Mutable ref to the selectedObjects array used by the outline pass
  const selectedObjectsRef = useRef<THREE.Object3D[]>([])

  const settings = useDungeonStore((state) => state.postProcessing)
  const selection = useDungeonStore((state) => state.selection)

  // Keep selectedObjects in sync with current selection (mutate in-place — the
  // OutlineNode holds a reference to this same array)
  useEffect(() => {
    selectedObjectsRef.current.length = 0
    if (selection) {
      const obj = getRegisteredObject(selection)
      if (obj) selectedObjectsRef.current.push(obj)
    }
  }, [selection])

  // Build / rebuild the TSL pipeline when renderer/scene/camera/size change
  useEffect(() => {
    if (!renderer || !scene || !camera) return

    const scenePass = pass(scene, camera)

    // Depth of field
    const viewZ = scenePass.getViewZNode()
    const dofPass = dof(
      scenePass,
      viewZ,
      focusDistanceUniform.current,
      focalLengthUniform.current,
      bokehScaleUniform.current,
    )

    // Outline (selection highlight)
    const outlinePass = outline(scene, camera, {
      selectedObjects: selectedObjectsRef.current,
      edgeThickness: uniform(1.5),
      edgeGlow: uniform(0.3),
    })
    const { visibleEdge } = outlinePass
    const outlineColor = visibleEdge
      .mul(color(0x7dd3fc))
      .mul(edgeStrengthUniform.current)

    // Compose: DoF base + sharp outline on top
    const postProcessing = new THREE.PostProcessing(renderer as unknown as THREE.WebGPURenderer)
    postProcessing.outputNode = outlineColor.add(dofPass)
    postProcessingRef.current = postProcessing

    return () => {
      postProcessingRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderer, scene, camera, size])

  // Sync uniform values from store every frame (no pipeline rebuild needed)
  useFrame(() => {
    if (!postProcessingRef.current) return

    focusDistanceUniform.current.value = settings.focusDistance
    focalLengthUniform.current.value = settings.focalLength
    bokehScaleUniform.current.value = settings.bokehScale

    postProcessingRef.current.render()
  }, 1)

  return null
}
