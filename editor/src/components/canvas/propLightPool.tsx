import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { FORWARD_PLUS_LOCAL_LIGHT_SHADOWS } from '../../rendering/forwardPlusConfig'
import {
  classifyDynamicLightSources,
  resolveRegisteredLightSources,
} from '../../rendering/dungeonLightField'
import { useDungeonStore } from '../../store/useDungeonStore'
import { releaseContinuousRender, requestContinuousRender } from '../../rendering/renderActivity'
import type { PlayVisibility } from './playVisibility'
import { shouldRunContinuousSceneEffects } from './effectAnimationMode'
import { shouldRenderLineOfSightLight } from './losRendering'
import { useRegisteredLightSources } from './objectSourceRegistry'
import {
  DEFAULT_POOLED_PROP_LIGHTS,
  applyPropLightPoolAssignment,
  getCameraFrustum,
  getCameraPosition,
  getPropLightRenderCapacity,
  hasCameraChanged,
} from './propLightPoolShared'

export function PropLightPool({
  scopeKey,
  visibility,
  maxLights = DEFAULT_POOLED_PROP_LIGHTS,
}: {
  scopeKey: string
  visibility: PlayVisibility
  maxLights?: number
}) {
  const { camera, invalidate, scene } = useThree()
  const refs = useRef<Array<THREE.PointLight | null>>([])
  const lightFlickerEnabled = useDungeonStore((state) => state.lightFlickerEnabled)
  const selection = useDungeonStore((state) => state.selection)
  const tool = useDungeonStore((state) => state.tool)
  const objectLightPreviewOverrides = useDungeonStore((state) => state.objectLightPreviewOverrides)
  const registeredLightSources = useRegisteredLightSources(scopeKey)
  const runContinuousEffects = shouldRunContinuousSceneEffects(tool)
  const lightSources = useMemo(
    () => resolveRegisteredLightSources(registeredLightSources, objectLightPreviewOverrides),
    [objectLightPreviewOverrides, registeredLightSources],
  )
  const visibleLightSources = useMemo(
    () =>
      lightSources.filter((lightSource) =>
        shouldRenderLineOfSightLight(
          visibility.getObjectVisibility(lightSource.object),
          visibility.active,
        )),
    [lightSources, visibility],
  )
  const selectedLightKeys = useMemo(
    () => (selection ? new Set([selection]) : new Set<string>()),
    [selection],
  )
  const previewLightKeys = useMemo(
    () => new Set(Object.keys(objectLightPreviewOverrides)),
    [objectLightPreviewOverrides],
  )
  const hasFlicker = useMemo(
    () => lightFlickerEnabled && visibleLightSources.some((assignment) => assignment.light.flicker),
    [lightFlickerEnabled, visibleLightSources],
  )
  const renderCapacity = useMemo(() => getPropLightRenderCapacity(maxLights), [maxLights])
  const lastCameraMatrixElementsRef = useRef<Float32Array | null>(null)
  const lastProjectionMatrixElementsRef = useRef<Float32Array | null>(null)

  const publishAssignments = useCallback((elapsedTime: number) => {
    const { dynamicLightSources } = classifyDynamicLightSources({
      lightSources: visibleLightSources,
      selectedKeys: selectedLightKeys,
      previewKeys: previewLightKeys,
      cameraPosition: getCameraPosition(camera),
      cameraFrustum: getCameraFrustum(camera),
      maxDynamicLights: renderCapacity,
    })
    const cameraAwareAssignments = dynamicLightSources.map((lightSource) => ({
      key: lightSource.key,
      position: lightSource.position,
      light: lightSource.light,
    }))

    for (let index = 0; index < renderCapacity; index += 1) {
      const pooledLight = refs.current[index]
      if (!pooledLight) {
        continue
      }

      applyPropLightPoolAssignment(pooledLight, cameraAwareAssignments[index], elapsedTime, lightFlickerEnabled)
    }
  }, [camera, lightFlickerEnabled, previewLightKeys, renderCapacity, selectedLightKeys, visibleLightSources])

  useLayoutEffect(() => {
    while (refs.current.length < renderCapacity) {
      const pooledLight = new THREE.PointLight('#000000', 0, 0, 2)
      pooledLight.castShadow = FORWARD_PLUS_LOCAL_LIGHT_SHADOWS
      applyPropLightPoolAssignment(pooledLight, undefined, 0)
      refs.current.push(pooledLight)
      scene.add(pooledLight)
    }

    while (refs.current.length > renderCapacity) {
      const pooledLight = refs.current.pop()
      if (!pooledLight) {
        continue
      }
      scene.remove(pooledLight)
    }

    return () => {
      refs.current.forEach((pooledLight) => {
        if (pooledLight) {
          scene.remove(pooledLight)
        }
      })
      refs.current = []
    }
  }, [renderCapacity, scene])

  useLayoutEffect(() => {
    publishAssignments(0)
    invalidate()
  }, [invalidate, publishAssignments])

  useLayoutEffect(() => {
    if (hasFlicker && runContinuousEffects) {
      requestContinuousRender('prop-light-flicker')
      return () => releaseContinuousRender('prop-light-flicker')
    }

    releaseContinuousRender('prop-light-flicker')
    return undefined
  }, [hasFlicker, runContinuousEffects])

  useFrame(({ clock }) => {
    const cameraChanged = hasCameraChanged(
      camera,
      lastCameraMatrixElementsRef,
      lastProjectionMatrixElementsRef,
    )

    if ((!hasFlicker || !runContinuousEffects) && !cameraChanged) {
      return
    }

    publishAssignments(clock.elapsedTime)
    invalidate()
  })

  return null
}
