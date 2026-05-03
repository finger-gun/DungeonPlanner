import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { buildBatchDescriptors } from './batchDescriptors'
import type { StaticTileEntry } from './BatchedTileEntries'
import { shouldRenderLineOfSightGeometry } from './losRendering'
import { applyFogOfWarToMaterial, useFogOfWarRuntime } from './fogOfWar'
import { applyBakedLightToMaterial } from './bakedLightMaterial'
import { applyBuildAnimationToMaterial, getBelowGroundClipMinY } from './buildAnimationMaterial'
import { useGLTF } from '../../rendering/useGLTF'
import {
  disposeInstancedMeshEntries,
  makeInstancedMeshEntries,
  updateInstancedMeshEntries,
} from './instancedTileMesh'
import { startBuildPerfSpan, traceBuildPerf } from '../../performance/runtimeBuildTrace'
import {
  getHeldBuildBatchState,
  releaseHeldBuildAnimations,
  useBuildAnimationVersion,
} from '../../store/buildAnimations'
import { useDungeonStore } from '../../store/useDungeonStore'

type CompileAsyncRenderer = {
  clear: () => void
  compileAsync: (scene: THREE.Object3D, camera: THREE.Camera, targetScene?: THREE.Object3D | null) => Promise<void>
  getRenderTarget: () => THREE.RenderTarget | null
  initRenderTarget?: (target: THREE.RenderTarget) => void
  render: (scene: THREE.Object3D, camera: THREE.Camera) => void
  setRenderTarget: (target: THREE.RenderTarget | null) => void
}

const BUILD_BUCKET_PREWARM_TIMEOUT_MS = 1500

function isCompileAsyncRenderer(renderer: unknown): renderer is CompileAsyncRenderer {
  return typeof renderer === 'object'
    && renderer !== null
    && typeof (renderer as CompileAsyncRenderer).compileAsync === 'function'
    && typeof (renderer as CompileAsyncRenderer).render === 'function'
    && typeof (renderer as CompileAsyncRenderer).setRenderTarget === 'function'
    && typeof (renderer as CompileAsyncRenderer).getRenderTarget === 'function'
    && typeof (renderer as CompileAsyncRenderer).clear === 'function'
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms.`))
    }, timeoutMs)

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId)
        resolve(value)
      },
      (error) => {
        window.clearTimeout(timeoutId)
        reject(error)
      },
    )
  })
}

export function BuildBucketPrewarmController({
  entries,
  useLineOfSightPostMask,
}: {
  entries: StaticTileEntry[]
  useLineOfSightPostMask: boolean
}) {
  const renderer = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)
  const scene = useThree((state) => state.scene)
  const invalidate = useThree((state) => state.invalidate)
  const fogOfWar = useFogOfWarRuntime()
  const lightFlickerEnabled = useDungeonStore((state) => state.lightFlickerEnabled)
  const buildAnimationVersion = useBuildAnimationVersion()
  const completedKeyRef = useRef<string | null>(null)
  const activeKeyRef = useRef<string | null>(null)

  const heldBuildBatch = getHeldBuildBatchState()
  const pendingEntries = useMemo(
    () => (!heldBuildBatch || heldBuildBatch.released
      ? []
      : entries.filter((entry) =>
        entry.buildAnimationStart !== undefined
        && entry.buildAnimationStart >= heldBuildBatch.startedAt - 0.5,
      )),
    [entries, heldBuildBatch],
  )
  const fogOfWarEnabled = fogOfWar !== null
  const descriptors = useMemo(
    () => buildBatchDescriptors(pendingEntries, fogOfWarEnabled),
    [fogOfWarEnabled, pendingEntries],
  )
  const assetUrls = useMemo(
    () => Array.from(new Set(descriptors.batched.map((descriptor) => descriptor.assetUrl))),
    [descriptors.batched],
  )
  const gltfs = useGLTF(assetUrls as string[])
  const scenesByUrl = useMemo(() => {
    const loaded = Array.isArray(gltfs) ? gltfs : [gltfs]
    return new Map(
      assetUrls.map((assetUrl, index) => [assetUrl, loaded[index]?.scene ?? null]),
    )
  }, [assetUrls, gltfs])
  const prewarmKey = useMemo(() => {
    if (!heldBuildBatch || heldBuildBatch.released || descriptors.batched.length === 0) {
      return null
    }

    return [
      heldBuildBatch.startedAt,
      ...descriptors.batched.map((descriptor) => [
        descriptor.bucketKey,
        descriptor.geometrySignature,
        descriptor.renderSignature,
      ].join('|')),
    ].join('::')
  }, [descriptors.batched, heldBuildBatch])

  useEffect(() => {
    void buildAnimationVersion

    if (!heldBuildBatch || heldBuildBatch.released) {
      activeKeyRef.current = null
      return
    }

    if (pendingEntries.length === 0 || descriptors.batched.length === 0) {
      releaseHeldBuildAnimations()
      invalidate()
      return
    }

    if (!isCompileAsyncRenderer(renderer)) {
      releaseHeldBuildAnimations()
      invalidate()
      return
    }

    if (!prewarmKey || completedKeyRef.current === prewarmKey || activeKeyRef.current === prewarmKey) {
      return
    }

    const missingAsset = descriptors.batched.some((descriptor) => !scenesByUrl.get(descriptor.assetUrl))
    if (missingAsset) {
      return
    }

    let cancelled = false
    activeKeyRef.current = prewarmKey

    const prewarmScene = new THREE.Scene()
    prewarmScene.environment = scene.environment
    prewarmScene.fog = scene.fog

    const prewarmCamera = camera.clone()
    prewarmCamera.layers.mask = camera.layers.mask
    prewarmCamera.updateMatrixWorld(true)

    const resourcesToDispose: Array<() => void> = []
    const offscreenTarget = new THREE.RenderTarget(4, 4)
    resourcesToDispose.push(() => offscreenTarget.dispose())

    scene.traverseVisible((object) => {
      if (!('isLight' in object) || object.isLight !== true || !object.layers.test(camera.layers)) {
        return
      }

      prewarmScene.add(object.clone())
    })

    descriptors.batched.forEach((descriptor) => {
      const sourceScene = scenesByUrl.get(descriptor.assetUrl)
      if (!sourceScene) {
        return
      }

      const descriptorMeshes = makeInstancedMeshEntries(sourceScene, descriptor.entries[0]!.transform)
      updateInstancedMeshEntries(descriptorMeshes, descriptor.entries)

      const firstEntry = descriptor.entries[0]!
      const useBuildAnimation = descriptor.entries.some((entry) => entry.buildAnimationStart !== undefined)
      const useBakedLight = descriptor.entries.some((entry) => entry.bakedLight || entry.bakedLightField)
      const bakedLightField = firstEntry.bakedLightField ?? null
      const useSecondaryDirectionAttribute = descriptor.entries.some((entry) => Boolean(entry.bakedLightDirectionSecondary))
      const shouldRenderBase =
        descriptor.usesGpuFog
        || shouldRenderLineOfSightGeometry(firstEntry.visibility, useLineOfSightPostMask)
      const useBakedFlicker = shouldRenderBase
        && lightFlickerEnabled
        && Boolean(bakedLightField?.flickerLightFieldTextures.some((texture) => texture))

      if (!shouldRenderBase) {
        disposeInstancedMeshEntries(descriptorMeshes)
        return
      }

      descriptorMeshes.forEach((meshEntry) => {
        const material = Array.isArray(meshEntry.instancedMesh.material)
          ? meshEntry.instancedMesh.material[0]!
          : meshEntry.instancedMesh.material
        applyBuildAnimationToMaterial(
          material,
          useBuildAnimation,
          getBelowGroundClipMinY(firstEntry.variant),
        )
        applyBakedLightToMaterial(
          material,
          useBakedLight
            ? {
              useLightAttribute: true,
              useDirectionAttribute: firstEntry.variant === 'wall',
              useSecondaryDirectionAttribute:
                firstEntry.variant === 'wall' && useSecondaryDirectionAttribute,
              useTopSurfaceMask: firstEntry.variant === 'floor',
              useFlicker: useBakedFlicker,
              lightField: bakedLightField,
            }
            : null,
        )
        applyFogOfWarToMaterial(
          material,
          descriptor.usesGpuFog ? fogOfWar : null,
          {
            variant: firstEntry.variant,
            useCellAttribute: descriptor.usesGpuFog && firstEntry.variant === 'floor',
          },
        )

        const prewarmMesh = meshEntry.instancedMesh
        prewarmMesh.castShadow = !useBuildAnimation
        prewarmMesh.receiveShadow = firstEntry.receiveShadow
        prewarmMesh.frustumCulled = false

        if (prewarmMesh.castShadow) {
          const depthMaterial = new THREE.MeshDepthMaterial()
          depthMaterial.depthPacking = THREE.RGBADepthPacking
          prewarmMesh.customDepthMaterial = depthMaterial
          resourcesToDispose.push(() => depthMaterial.dispose())
        }

        prewarmScene.add(prewarmMesh)
      })
      resourcesToDispose.push(() => disposeInstancedMeshEntries(descriptorMeshes))
    })

    const runPrewarm = async () => {
      try {
        const endCompileTrace = startBuildPerfSpan('build-prewarm-compile', {
          bucketCount: descriptors.batched.length,
          entryCount: pendingEntries.length,
        })
        await withTimeout(
          renderer.compileAsync(prewarmScene, prewarmCamera, scene),
          BUILD_BUCKET_PREWARM_TIMEOUT_MS,
          'Merged bucket prewarm compilation',
        )
        endCompileTrace({
          bucketCount: descriptors.batched.length,
          entryCount: pendingEntries.length,
        })

        traceBuildPerf('build-prewarm-render', {
          bucketCount: descriptors.batched.length,
          entryCount: pendingEntries.length,
        }, () => {
          renderer.initRenderTarget?.(offscreenTarget)
          const previousTarget = renderer.getRenderTarget()
          renderer.setRenderTarget(offscreenTarget)
          renderer.clear()
          renderer.render(prewarmScene, prewarmCamera)
          renderer.setRenderTarget(previousTarget)
        })

        if (!cancelled) {
          completedKeyRef.current = prewarmKey
          releaseHeldBuildAnimations()
          invalidate()
        }
      } catch (error) {
        console.error('Failed to prewarm pending merged room buckets.', error)
        if (!cancelled) {
          releaseHeldBuildAnimations()
          invalidate()
        }
      } finally {
        activeKeyRef.current = null
        resourcesToDispose.forEach((dispose) => dispose())
      }
    }

    void runPrewarm()

    return () => {
      cancelled = true
    }
  }, [
    buildAnimationVersion,
    camera,
    descriptors.batched,
    fogOfWar,
    heldBuildBatch,
    invalidate,
    lightFlickerEnabled,
    pendingEntries,
    prewarmKey,
    renderer,
    scene,
    scenesByUrl,
    useLineOfSightPostMask,
  ])

  return null
}
