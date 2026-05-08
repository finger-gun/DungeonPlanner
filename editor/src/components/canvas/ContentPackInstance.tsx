import { Suspense, useEffect, useLayoutEffect, useRef, useMemo, useState } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { getContentPackAssetById } from '../../content-packs/registry'
import type { ComponentType } from 'react'
import type { ContentPackComponentProps } from '../../content-packs/types'
import { GRID_SIZE } from '../../hooks/useSnapToGrid'
import type { PlayVisibilityState } from './playVisibility'
import { shouldRenderLineOfSightGeometry } from './losRendering'
import {
  cloneSceneWithNodeMaterials,
  createStandardCompatibleMaterial,
  upgradeStandardMaterialsToNodeMaterials,
} from '../../rendering/nodeMaterialUtils'
import { useGLTF } from '../../rendering/useGLTF'
import { useFogOfWarRuntime } from './fogOfWarHooks'
import { applyFogOfWarToMaterial, applyFogOfWarToObject } from './fogOfWarShared'
import {
  applyBakedLightToMaterial,
  applyBakedLightToObject,
  applyPropBakedLightToMaterial,
  applyPropBakedLightToObject,
} from './bakedLightMaterial'
import { applyBelowGroundClipToObject, getBelowGroundClipMinY } from './buildAnimationMaterial'
import type { BakedFloorLightField } from '../../rendering/dungeonLightField'
import {
  getCachedObjectLocalBounds,
} from '../../rendering/runtimePropProbe'
import {
  getCachedRuntimePropBakedLightProbe,
  releaseCachedRuntimePropLightingProbe,
} from '../../rendering/propLightingCache'
import { useDungeonStore } from '../../store/useDungeonStore'
import { shouldUseRuntimePropProbe } from './runtimePropProbeMode'
import {
  applyAtlasColorVariantToObject,
  resolveAtlasColorVariant,
  type ResolvedAtlasColorVariant,
} from '../../rendering/atlasColorVariants'
import { buildPropDescriptorKey } from './ContentPackInstanceShared'
import { applyRoomFloorMaskToMaterial, applyRoomFloorMaskToObject } from './roomFloorMaskMaterial'
import type { RoomFloorMaskRuntime } from './roomFloorMaskRuntime'
import { useRegisteredLightSources } from './objectSourceRegistry'

function shouldUseGpuFog(variant: ContentPackInstanceVariant, fogOfWar: ReturnType<typeof useFogOfWarRuntime>) {
  return fogOfWar !== null && variant === 'floor'
}

type ContentPackInstanceVariant = 'floor' | 'wall' | 'prop'
type SurfaceBakedLightDirection = readonly [number, number, number]

/** Semi-transparent colour overlay — clones the geometry with a translucent material. */
function TintOverlay({
  source,
  color,
  opacity = 0.42,
  refreshKey,
}: {
  source: THREE.Object3D
  color: string
  opacity?: number
  refreshKey?: string
}) {
  const overlay = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      side: THREE.FrontSide,
    })
    const clone = SkeletonUtils.clone(source)
    clone.name = refreshKey ? `tint-overlay:${refreshKey}` : 'tint-overlay'
    clone.visible = true
    clone.traverse((obj) => {
      obj.visible = true
      if (obj instanceof THREE.Mesh) {
        obj.material = mat
        obj.renderOrder = 1
        obj.castShadow = false
        obj.receiveShadow = false
      }
    })
    markIgnoreLosRaycast(clone)
    disableRaycast(clone)
    return clone
  }, [source, color, opacity, refreshKey])

  return <primitive object={overlay} />
}

type ContentPackInstanceProps = ThreeElements['group'] & {
  assetId: string | null
  selected?: boolean
  poseSelected?: boolean
  playerAnimationState?: 'default' | 'selected' | 'pickup' | 'holding' | 'release'
  tint?: string
  tintOpacity?: number
  overlayOnly?: boolean
  visibility?: PlayVisibilityState
  useLineOfSightPostMask?: boolean
  useRoomFloorMask?: boolean
  roomFloorMaskRuntime?: RoomFloorMaskRuntime | null
  dynamicPointLightsActive?: boolean
  variant: ContentPackInstanceVariant
  variantKey?: string
  objectProps?: Record<string, unknown>
  propInstanceKey?: string
  bakedLightField?: BakedFloorLightField | null
  bakedLightDirection?: SurfaceBakedLightDirection
  bakedLightDirectionSecondary?: SurfaceBakedLightDirection
  disableBakedLight?: boolean
  clipBelowGround?: boolean
}

export function ContentPackInstance({
  assetId,
  castShadow: castShadowOverride,
  selected = false,
  poseSelected = false,
  playerAnimationState = poseSelected ? 'selected' : 'default',
  tint,
  tintOpacity,
  overlayOnly = false,
  visibility = 'visible',
  useLineOfSightPostMask = false,
  useRoomFloorMask = false,
  roomFloorMaskRuntime = null,
  dynamicPointLightsActive: dynamicPointLightsActiveOverride,
  variant,
  variantKey,
  objectProps,
  propInstanceKey,
  bakedLightField = null,
  bakedLightDirection,
  bakedLightDirectionSecondary,
  disableBakedLight = false,
  clipBelowGround = false,
  ...groupProps
}: ContentPackInstanceProps) {
  const asset = assetId ? getContentPackAssetById(assetId) : null
  const assetPath = asset?.batchRender?.getAssetUrl?.(variantKey, objectProps) ?? asset?.assetUrl
  const AssetComponent = asset?.Component ?? null
  const castShadow = castShadowOverride ?? (asset?.metadata?.castShadow !== false)
  const receiveShadow = asset?.metadata?.receiveShadow !== false
  const atlasColorVariant = useMemo(
    () => resolveAtlasColorVariant(asset?.metadata, objectProps),
    [asset?.metadata, objectProps],
  )
  const registeredLightSources = useRegisteredLightSources(bakedLightField?.floorId ?? '__content-pack-instance__')
  const dynamicPointLightsActive = dynamicPointLightsActiveOverride ?? registeredLightSources.length > 0
  const tool = useDungeonStore((state) => state.tool)
  const showPropProbeDebug = useDungeonStore((state) => state.showPropProbeDebug)
  const useRuntimePropProbe = shouldUseRuntimePropProbe({
    tool,
    showPropProbeDebug,
  })
  const propFieldLightWeight = 1
  const suppressTopSurfacePropBakedLight = false
  const propDescriptorKey = useMemo(
    () => buildPropDescriptorKey({
      assetId,
      assetPath,
      hasComponent: Boolean(AssetComponent),
      objectProps,
      variant,
      variantKey,
    }),
    [AssetComponent, assetId, assetPath, objectProps, variant, variantKey],
  )
  const propLightingFloorId = variant === 'prop' ? (bakedLightField?.floorId ?? null) : null

  useEffect(() => {
    if (!propLightingFloorId || !propInstanceKey) {
      return
    }

    return () => {
      releaseCachedRuntimePropLightingProbe(propLightingFloorId, propInstanceKey)
    }
  }, [propInstanceKey, propLightingFloorId])

  useEffect(() => {
    if (assetPath && !AssetComponent) {
      useGLTF.preload(assetPath)
    }
  }, [AssetComponent, assetPath])

  if (!assetPath && !AssetComponent) {
    return (
      <group {...groupProps}>
        <FallbackMesh
          selected={selected}
          variant={variant}
          variantKey={variantKey}
          receiveShadow={receiveShadow}
          castShadow={castShadow}
          tint={tint}
          tintOpacity={tintOpacity}
          overlayOnly={overlayOnly}
          visibility={visibility}
          useLineOfSightPostMask={useLineOfSightPostMask}
          useRoomFloorMask={useRoomFloorMask}
          roomFloorMaskRuntime={roomFloorMaskRuntime}
          dynamicPointLightsActive={dynamicPointLightsActive}
          bakedLightField={bakedLightField}
          bakedLightDirection={bakedLightDirection}
          bakedLightDirectionSecondary={bakedLightDirectionSecondary}
          disableBakedLight={disableBakedLight}
          clipBelowGround={clipBelowGround}
          propInstanceKey={propInstanceKey}
          useRuntimePropProbe={useRuntimePropProbe}
          propFieldLightWeight={propFieldLightWeight}
          suppressTopSurfacePropBakedLight={suppressTopSurfacePropBakedLight}
        />
      </group>
    )
  }

  return (
    <Suspense
      fallback={
        <group {...groupProps}>
            <FallbackMesh
            selected={selected}
            variant={variant}
            variantKey={variantKey}
            receiveShadow={receiveShadow}
            castShadow={castShadow}
            tint={tint}
             tintOpacity={tintOpacity}
             overlayOnly={overlayOnly}
               visibility={visibility}
               useLineOfSightPostMask={useLineOfSightPostMask}
               useRoomFloorMask={useRoomFloorMask}
               roomFloorMaskRuntime={roomFloorMaskRuntime}
               dynamicPointLightsActive={dynamicPointLightsActive}
               bakedLightField={bakedLightField}
             bakedLightDirection={bakedLightDirection}
             bakedLightDirectionSecondary={bakedLightDirectionSecondary}
              disableBakedLight={disableBakedLight}
              clipBelowGround={clipBelowGround}
              propInstanceKey={propInstanceKey}
              useRuntimePropProbe={useRuntimePropProbe}
              propFieldLightWeight={propFieldLightWeight}
              suppressTopSurfacePropBakedLight={suppressTopSurfacePropBakedLight}
            />
        </group>
      }
    >
      {AssetComponent ? (
        <ComponentAsset
          Component={AssetComponent}
          componentProps={getComponentProps(
            variantKey,
            objectProps,
            poseSelected,
            playerAnimationState,
          )}
          receiveShadow={receiveShadow}
          castShadow={castShadow}
          selected={selected}
          tint={tint}
          tintOpacity={tintOpacity}
          overlayOnly={overlayOnly}
          visibility={visibility}
          useLineOfSightPostMask={useLineOfSightPostMask}
          useRoomFloorMask={useRoomFloorMask}
          roomFloorMaskRuntime={roomFloorMaskRuntime}
          dynamicPointLightsActive={dynamicPointLightsActive}
          variant={variant}
          bakedLightField={bakedLightField}
           bakedLightDirection={bakedLightDirection}
          bakedLightDirectionSecondary={bakedLightDirectionSecondary}
          disableBakedLight={disableBakedLight}
          clipBelowGround={clipBelowGround}
          atlasColorVariant={atlasColorVariant}
          propDescriptorKey={propDescriptorKey}
          propInstanceKey={propInstanceKey}
          useRuntimePropProbe={useRuntimePropProbe}
          propFieldLightWeight={propFieldLightWeight}
          suppressTopSurfacePropBakedLight={suppressTopSurfacePropBakedLight}
          {...groupProps}
        />
      ) : (
        <GLTFModel
          assetPath={assetPath!}
          receiveShadow={receiveShadow}
          castShadow={castShadow}
          selected={selected}
          tint={tint}
          tintOpacity={tintOpacity}
          overlayOnly={overlayOnly}
          visibility={visibility}
          useLineOfSightPostMask={useLineOfSightPostMask}
          useRoomFloorMask={useRoomFloorMask}
          roomFloorMaskRuntime={roomFloorMaskRuntime}
          dynamicPointLightsActive={dynamicPointLightsActive}
          variantKey={variantKey}
          variant={variant}
          bakedLightField={bakedLightField}
           bakedLightDirection={bakedLightDirection}
          bakedLightDirectionSecondary={bakedLightDirectionSecondary}
            disableBakedLight={disableBakedLight}
            clipBelowGround={clipBelowGround}
            atlasColorVariant={atlasColorVariant}
            propDescriptorKey={propDescriptorKey}
            propInstanceKey={propInstanceKey}
            useRuntimePropProbe={useRuntimePropProbe}
            propFieldLightWeight={propFieldLightWeight}
            suppressTopSurfacePropBakedLight={suppressTopSurfacePropBakedLight}
            {...groupProps}
          />
      )}
    </Suspense>
  )
}

function getComponentProps(
  variantKey?: string,
  objectProps?: Record<string, unknown>,
  poseSelected?: boolean,
  playerAnimationState?: 'default' | 'selected' | 'pickup' | 'holding' | 'release',
): ContentPackComponentProps {
  return {
    ...(variantKey ? { variantKey } : {}),
    ...(objectProps ? { objectProps } : {}),
    ...(poseSelected ? { poseSelected } : {}),
    ...(playerAnimationState ? { playerAnimationState } : {}),
  }
}

function getSurfaceBakedLightOptions(
  variant: ContentPackInstanceVariant,
  bakedLightField: BakedFloorLightField | null | undefined,
  bakedLightDirection?: SurfaceBakedLightDirection,
  bakedLightDirectionSecondary?: SurfaceBakedLightDirection,
) {
  if (!bakedLightField) {
    return null
  }
  const usesDirectionalSurfaceLighting =
    (variant === 'wall' || variant === 'prop') && Boolean(bakedLightDirection)
  if ((variant === 'wall' || variant === 'prop') && !usesDirectionalSurfaceLighting) {
    return null
  }

  return {
    useLightAttribute: true,
    useDirectionAttribute: usesDirectionalSurfaceLighting,
    useSecondaryDirectionAttribute: usesDirectionalSurfaceLighting && Boolean(bakedLightDirectionSecondary),
    useTopSurfaceMask: variant === 'floor',
    lightField: bakedLightField,
    ...(bakedLightDirection ? { direction: bakedLightDirection } : {}),
    ...(bakedLightDirectionSecondary ? { directionSecondary: bakedLightDirectionSecondary } : {}),
  }
}

function GLTFModel({
  assetPath,
  receiveShadow,
  castShadow,
  selected: _selected,
  tint,
  tintOpacity,
  overlayOnly,
  visibility,
  useLineOfSightPostMask = false,
  useRoomFloorMask = false,
  roomFloorMaskRuntime = null,
  dynamicPointLightsActive = false,
  variantKey,
  variant,
  bakedLightField = null,
  bakedLightDirection,
  bakedLightDirectionSecondary,
  disableBakedLight = false,
  clipBelowGround = false,
  atlasColorVariant,
  propDescriptorKey,
  propInstanceKey,
  useRuntimePropProbe,
  propFieldLightWeight,
  suppressTopSurfacePropBakedLight,
  ...groupProps
}: ThreeElements['group'] & {
  assetPath: string
  receiveShadow: boolean
  castShadow: boolean
  selected?: boolean
  tint?: string
  tintOpacity?: number
  overlayOnly?: boolean
  visibility?: PlayVisibilityState
  useLineOfSightPostMask?: boolean
  useRoomFloorMask?: boolean
  roomFloorMaskRuntime?: RoomFloorMaskRuntime | null
  dynamicPointLightsActive?: boolean
  variantKey?: string
  variant: ContentPackInstanceVariant
  bakedLightField?: BakedFloorLightField | null
  bakedLightDirection?: SurfaceBakedLightDirection
  bakedLightDirectionSecondary?: SurfaceBakedLightDirection
  disableBakedLight?: boolean
  clipBelowGround?: boolean
  atlasColorVariant?: ResolvedAtlasColorVariant | null
  propDescriptorKey?: string | null
  propInstanceKey?: string
  useRuntimePropProbe: boolean
  propFieldLightWeight: number
  suppressTopSurfacePropBakedLight: boolean
}) {
  const gltf = useGLTF(assetPath)
  const fogOfWar = useFogOfWarRuntime()
  const usesGpuFog = shouldUseGpuFog(variant, fogOfWar)
  const fogCell = useMemo(
    () => (variant === 'floor' ? parseFogCellKey(variantKey) : null),
    [variant, variantKey],
  )
  const shouldRenderBase =
    !overlayOnly && (usesGpuFog || shouldRenderLineOfSightGeometry(visibility ?? 'visible', useLineOfSightPostMask))
  const canShowOverlay = (visibility ?? 'visible') !== 'hidden'
  const clipMinY = getBelowGroundClipMinY(variant)
  const surfaceBakedLightOptions = useMemo(
    () => getSurfaceBakedLightOptions(
      variant,
      bakedLightField,
      bakedLightDirection,
      bakedLightDirectionSecondary,
    ),
    [bakedLightDirection, bakedLightDirectionSecondary, bakedLightField, variant],
  )
  const scene = useMemo(() => {
    const clone = cloneSceneWithNodeMaterials(gltf.scene)
    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = castShadow
        obj.receiveShadow = receiveShadow
      }
    })
    return clone
  }, [castShadow, gltf.scene, receiveShadow])
  const propLocalBounds = useMemo(
    () => (variant === 'prop' ? getCachedObjectLocalBounds(propDescriptorKey, scene) : null),
    [propDescriptorKey, scene, variant],
  )

  useLayoutEffect(() => {
    if (!shouldRenderBase || disableBakedLight) {
      applyPropBakedLightToObject(scene, null)
      applyBakedLightToObject(scene, null)
      return
    }

    if (variant === 'prop' && surfaceBakedLightOptions?.useDirectionAttribute) {
      applyPropBakedLightToObject(scene, null)
      applyBakedLightToObject(scene, surfaceBakedLightOptions)
      return
    }

    if (variant === 'prop') {
      applyPropBakedLightToObject(scene, {
        lightField: bakedLightField,
        probe: useRuntimePropProbe
          ? getCachedRuntimePropBakedLightProbe({
            lightField: bakedLightField,
            instanceKey: propInstanceKey,
            object: scene,
            localBounds: propLocalBounds,
          })
          : null,
        fieldLightWeight: propFieldLightWeight,
        suppressTopSurfaceLight: suppressTopSurfacePropBakedLight,
      })
      applyBakedLightToObject(scene, null)
      return
    }

    applyPropBakedLightToObject(scene, null)
    applyBakedLightToObject(scene, surfaceBakedLightOptions)
  }, [
    bakedLightDirection,
    bakedLightDirectionSecondary,
    bakedLightField,
    disableBakedLight,
    scene,
    shouldRenderBase,
    surfaceBakedLightOptions,
    variant,
    variantKey,
    groupProps.position,
    groupProps.rotation,
    groupProps.scale,
    propLocalBounds,
    propInstanceKey,
    propFieldLightWeight,
    suppressTopSurfacePropBakedLight,
    useRuntimePropProbe,
  ])

  useLayoutEffect(() => {
    applyBelowGroundClipToObject(scene, clipBelowGround, clipMinY)
  }, [clipBelowGround, clipMinY, scene])

  useLayoutEffect(() => {
    applyFogOfWarToObject(scene, usesGpuFog ? fogOfWar : null, {
      variant,
      cell: fogCell,
    })
  }, [
    fogCell,
    fogOfWar,
    scene,
    usesGpuFog,
    variant,
  ])

  useLayoutEffect(() => {
    applyRoomFloorMaskToObject(
      scene,
      useRoomFloorMask && variant === 'floor' ? roomFloorMaskRuntime : null,
    )
  }, [clipBelowGround, fogOfWar, roomFloorMaskRuntime, scene, useRoomFloorMask, usesGpuFog, variant])

  useLayoutEffect(() => {
    if (variant !== 'wall') {
      return
    }

    markObjectMaterialsForUpdate(scene)
  }, [dynamicPointLightsActive, scene, variant])

  useLayoutEffect(() => {
    applyAtlasColorVariantToObject(scene, atlasColorVariant ?? null)
  }, [atlasColorVariant, scene])

  return (
    <group {...groupProps}>
      {shouldRenderBase && <primitive object={scene} />}
      {tint && shouldRenderBase && canShowOverlay && (
        <TintOverlay
          source={scene}
          color={tint}
          opacity={tintOpacity}
          refreshKey={variantKey ?? assetPath}
        />
      )}
      {!overlayOnly && !usesGpuFog && visibility === 'explored' && (
        <TintOverlay
          source={scene}
          color="#050609"
          opacity={0.6}
        />
      )}
    </group>
  )
}

function ComponentAsset({
  Component,
  componentProps,
  receiveShadow,
  castShadow,
  selected: _selected,
  tint,
  tintOpacity,
  overlayOnly,
  visibility,
  useLineOfSightPostMask = false,
  useRoomFloorMask = false,
  roomFloorMaskRuntime = null,
  dynamicPointLightsActive = false,
  variant,
  bakedLightField = null,
  bakedLightDirection,
  bakedLightDirectionSecondary,
  disableBakedLight = false,
  clipBelowGround = false,
  atlasColorVariant,
  propDescriptorKey,
  propInstanceKey,
  useRuntimePropProbe,
  propFieldLightWeight,
  suppressTopSurfacePropBakedLight,
  ...groupProps
}: ThreeElements['group'] & {
  Component: ComponentType<ContentPackComponentProps>
  componentProps: ContentPackComponentProps
  receiveShadow: boolean
  castShadow: boolean
  selected?: boolean
  tint?: string
  tintOpacity?: number
  overlayOnly?: boolean
  visibility?: PlayVisibilityState
  useLineOfSightPostMask?: boolean
  useRoomFloorMask?: boolean
  roomFloorMaskRuntime?: RoomFloorMaskRuntime | null
  dynamicPointLightsActive?: boolean
  variant: ContentPackInstanceVariant
  bakedLightField?: BakedFloorLightField | null
  bakedLightDirection?: SurfaceBakedLightDirection
  bakedLightDirectionSecondary?: SurfaceBakedLightDirection
  disableBakedLight?: boolean
  clipBelowGround?: boolean
  atlasColorVariant?: ResolvedAtlasColorVariant | null
  propDescriptorKey?: string | null
  propInstanceKey?: string
  useRuntimePropProbe: boolean
  propFieldLightWeight: number
  suppressTopSurfacePropBakedLight: boolean
}) {
  const contentRef = useRef<THREE.Group>(null)
  const [overlaySource, setOverlaySource] = useState<THREE.Group | null>(null)
  const [propLocalBounds, setPropLocalBounds] = useState<THREE.Box3 | null>(null)
  const fogOfWar = useFogOfWarRuntime()
  const usesGpuFog = shouldUseGpuFog(variant, fogOfWar)
  const fogCell = useMemo(
    () => (variant === 'floor' ? parseFogCellKey(componentProps.variantKey) : null),
    [componentProps.variantKey, variant],
  )
  const shouldRenderBase =
    !overlayOnly && (usesGpuFog || shouldRenderLineOfSightGeometry(visibility ?? 'visible', useLineOfSightPostMask))
  const canShowOverlay = (visibility ?? 'visible') !== 'hidden'
  const clipMinY = getBelowGroundClipMinY(variant)
  const surfaceBakedLightOptions = useMemo(
    () => getSurfaceBakedLightOptions(
      variant,
      bakedLightField,
      bakedLightDirection,
      bakedLightDirectionSecondary,
    ),
    [bakedLightDirection, bakedLightDirectionSecondary, bakedLightField, variant],
  )

  useLayoutEffect(() => {
    if (contentRef.current) {
      upgradeStandardMaterialsToNodeMaterials(contentRef.current)
      setOverlaySource(contentRef.current)
    }
  }, [])

  useEffect(() => {
    contentRef.current?.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = castShadow
        obj.receiveShadow = receiveShadow
      }
    })
  }, [castShadow, receiveShadow])

  useLayoutEffect(() => {
    if (variant !== 'prop' || !contentRef.current) {
      setPropLocalBounds(null)
      return
    }

    setPropLocalBounds(getCachedObjectLocalBounds(propDescriptorKey, contentRef.current))
  }, [Component, componentProps.variantKey, propDescriptorKey, variant])

  useLayoutEffect(() => {
    if (!contentRef.current) {
      return
    }

    if (!shouldRenderBase || disableBakedLight) {
      applyPropBakedLightToObject(contentRef.current, null)
      applyBakedLightToObject(contentRef.current, null)
      return
    }

    if (variant === 'prop' && surfaceBakedLightOptions?.useDirectionAttribute) {
      applyPropBakedLightToObject(contentRef.current, null)
      applyBakedLightToObject(contentRef.current, surfaceBakedLightOptions)
      return
    }

    if (variant === 'prop') {
      applyPropBakedLightToObject(contentRef.current, {
        lightField: bakedLightField,
        probe: useRuntimePropProbe
          ? getCachedRuntimePropBakedLightProbe({
            lightField: bakedLightField,
            instanceKey: propInstanceKey,
            object: contentRef.current,
            localBounds: propLocalBounds,
          })
          : null,
        fieldLightWeight: propFieldLightWeight,
        suppressTopSurfaceLight: suppressTopSurfacePropBakedLight,
      })
      applyBakedLightToObject(contentRef.current, null)
      return
    }

    applyPropBakedLightToObject(contentRef.current, null)
    applyBakedLightToObject(contentRef.current, surfaceBakedLightOptions)
  }, [
    bakedLightDirection,
    bakedLightDirectionSecondary,
    bakedLightField,
    disableBakedLight,
    componentProps,
    groupProps.position,
    groupProps.rotation,
    groupProps.scale,
    propLocalBounds,
    propInstanceKey,
    propFieldLightWeight,
    shouldRenderBase,
    suppressTopSurfacePropBakedLight,
    surfaceBakedLightOptions,
    useRuntimePropProbe,
    variant,
  ])

  useLayoutEffect(() => {
    if (!contentRef.current) {
      return
    }

    applyBelowGroundClipToObject(contentRef.current, clipBelowGround, clipMinY)
  }, [clipBelowGround, clipMinY])

  useLayoutEffect(() => {
    if (!contentRef.current) {
      return
    }

    applyFogOfWarToObject(contentRef.current, usesGpuFog ? fogOfWar : null, {
      variant,
      cell: fogCell,
    })
  }, [
    fogCell,
    fogOfWar,
    usesGpuFog,
    variant,
  ])

  useLayoutEffect(() => {
    if (!contentRef.current) {
      return
    }
    applyRoomFloorMaskToObject(
      contentRef.current,
      useRoomFloorMask && variant === 'floor' ? roomFloorMaskRuntime : null,
    )
  }, [Component, clipBelowGround, componentProps, fogOfWar, roomFloorMaskRuntime, useRoomFloorMask, usesGpuFog, variant])

  useLayoutEffect(() => {
    if (!contentRef.current || variant !== 'wall') {
      return
    }

    markObjectMaterialsForUpdate(contentRef.current)
  }, [Component, componentProps, dynamicPointLightsActive, variant])

  useLayoutEffect(() => {
    if (!contentRef.current) {
      return
    }

    applyAtlasColorVariantToObject(contentRef.current, atlasColorVariant ?? null)
  }, [atlasColorVariant, componentProps, Component])

  return (
    <group {...groupProps}>
      <group ref={contentRef} visible={shouldRenderBase}>
        <Component {...componentProps} />
      </group>
      {tint && overlaySource && shouldRenderBase && canShowOverlay && (
        <TintOverlay
          source={overlaySource}
          color={tint}
          opacity={tintOpacity}
          refreshKey={componentProps.variantKey}
        />
      )}
      {!overlayOnly && !usesGpuFog && visibility === 'explored' && overlaySource && (
        <TintOverlay
          source={overlaySource}
          color="#050609"
          opacity={0.6}
        />
      )}
    </group>
  )
}

function disableRaycast(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.raycast = () => {}
    }
  })
}

function markIgnoreLosRaycast(object: THREE.Object3D) {
  object.traverse((child) => {
    child.userData.ignoreLosRaycast = true
  })
}

function markMaterialForUpdate(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    material.forEach((entry) => {
      entry.needsUpdate = true
    })
    return
  }

  material.needsUpdate = true
}

function markObjectMaterialsForUpdate(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      markMaterialForUpdate(child.material)
    }
  })
}

function FallbackMesh({
  selected,
  tint,
  tintOpacity,
  overlayOnly,
  variant,
  variantKey,
  receiveShadow,
  castShadow = true,
  visibility = 'visible',
  useLineOfSightPostMask = false,
  useRoomFloorMask = false,
  roomFloorMaskRuntime = null,
  dynamicPointLightsActive = false,
  bakedLightField = null,
  bakedLightDirection,
  bakedLightDirectionSecondary,
  disableBakedLight = false,
  clipBelowGround = false,
  propInstanceKey,
  useRuntimePropProbe,
  propFieldLightWeight,
  suppressTopSurfacePropBakedLight,
}: {
  selected: boolean
  tint?: string
  tintOpacity?: number
  overlayOnly?: boolean
  variant: ContentPackInstanceVariant
  variantKey?: string
  receiveShadow: boolean
  castShadow?: boolean
  visibility?: PlayVisibilityState
  useLineOfSightPostMask?: boolean
  useRoomFloorMask?: boolean
  roomFloorMaskRuntime?: RoomFloorMaskRuntime | null
  dynamicPointLightsActive?: boolean
  bakedLightField?: BakedFloorLightField | null
  bakedLightDirection?: SurfaceBakedLightDirection
  bakedLightDirectionSecondary?: SurfaceBakedLightDirection
  disableBakedLight?: boolean
  clipBelowGround?: boolean
  propInstanceKey?: string
  useRuntimePropProbe: boolean
  propFieldLightWeight: number
  suppressTopSurfacePropBakedLight: boolean
}) {
  const baseColor =
    variant === 'floor' ? '#34d399' : variant === 'wall' ? '#fbbf24' : '#7dd3fc'
  const color = tint ?? baseColor
  const emissive =
    variant === 'floor' ? '#059669' : variant === 'wall' ? '#d97706' : '#0ea5e9'
  const geometry =
    variant === 'floor'
      ? ([GRID_SIZE * 0.98, 0.06, GRID_SIZE * 0.98] as const)
      : variant === 'wall'
        ? ([GRID_SIZE * 0.96, 3, GRID_SIZE * 0.12] as const)
        : ([0.5, 0.9, 0.5] as const)
  const geometryWidth = geometry[0]
  const geometryHeight = geometry[1]
  const geometryDepth = geometry[2]
  const yOffset = variant === 'floor' ? 0.03 : variant === 'wall' ? 1.5 : 0
  const meshRef = useRef<THREE.Mesh>(null)
  const fogOfWar = useFogOfWarRuntime()
  const usesGpuFog = shouldUseGpuFog(variant, fogOfWar)
  const opacity = usesGpuFog
    ? 1
    : visibility === 'hidden'
      ? 0.08
      : visibility === 'explored'
        ? 0.45
        : 1
  const fogCell = useMemo(
    () => (variant === 'floor' ? parseFogCellKey(variantKey) : null),
    [variant, variantKey],
  )
  const clipMinY = getBelowGroundClipMinY(variant)
  const surfaceBakedLightOptions = useMemo(
    () => getSurfaceBakedLightOptions(
      variant,
      bakedLightField,
      bakedLightDirection,
      bakedLightDirectionSecondary,
    ),
    [bakedLightDirection, bakedLightDirectionSecondary, bakedLightField, variant],
  )
  const material = useMemo(
    () => createStandardCompatibleMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      roughness: 0.45,
      metalness: 0.05,
      emissive: selected ? emissive : '#000000',
      emissiveIntensity: selected ? 0.18 : 0,
    }),
    [color, emissive, opacity, selected],
  )
  const propLocalBounds = useMemo(
    () => {
      if (variant !== 'prop') {
        return null
      }

      return new THREE.Box3(
        new THREE.Vector3(-geometryWidth * 0.5, -geometryHeight * 0.5, -geometryDepth * 0.5),
        new THREE.Vector3(geometryWidth * 0.5, geometryHeight * 0.5, geometryDepth * 0.5),
      )
    },
    [geometryDepth, geometryHeight, geometryWidth, variant],
  )

  useLayoutEffect(() => {
    if (!meshRef.current) {
      return
    }

    applyBelowGroundClipToObject(meshRef.current, clipBelowGround, clipMinY)
  }, [clipBelowGround, clipMinY])

  useLayoutEffect(() => {
    if (variant !== 'prop') {
      applyPropBakedLightToMaterial(material, null)
      applyBakedLightToMaterial(material, disableBakedLight ? null : surfaceBakedLightOptions)
      return
    }

    if (disableBakedLight) {
      applyPropBakedLightToMaterial(material, null)
      applyBakedLightToMaterial(material, null)
      return
    }

    if (surfaceBakedLightOptions?.useDirectionAttribute) {
      applyPropBakedLightToMaterial(material, null)
      applyBakedLightToMaterial(material, surfaceBakedLightOptions)
      return
    }

    applyPropBakedLightToMaterial(material, {
      lightField: bakedLightField,
      probe: useRuntimePropProbe
        ? getCachedRuntimePropBakedLightProbe({
          lightField: bakedLightField,
          instanceKey: propInstanceKey,
          object: meshRef.current,
          localBounds: propLocalBounds,
        })
        : null,
      fieldLightWeight: propFieldLightWeight,
      suppressTopSurfaceLight: suppressTopSurfacePropBakedLight,
    })
    applyBakedLightToMaterial(material, null)
  }, [
    bakedLightDirection,
    bakedLightDirectionSecondary,
    bakedLightField,
    disableBakedLight,
    material,
    propLocalBounds,
    propInstanceKey,
    propFieldLightWeight,
    suppressTopSurfacePropBakedLight,
    surfaceBakedLightOptions,
    useRuntimePropProbe,
    variant,
    variantKey,
  ])

  useLayoutEffect(() => {
    applyFogOfWarToMaterial(material, usesGpuFog ? fogOfWar : null, {
      variant,
      cell: fogCell,
    })
  }, [
    fogCell,
    fogOfWar,
    material,
    usesGpuFog,
    variant,
  ])

  useLayoutEffect(() => {
    applyRoomFloorMaskToMaterial(
      material,
      useRoomFloorMask && variant === 'floor' ? roomFloorMaskRuntime : null,
    )
  }, [clipBelowGround, fogOfWar, material, roomFloorMaskRuntime, useRoomFloorMask, usesGpuFog, variant])

  useLayoutEffect(() => {
    if (variant !== 'wall') {
      return
    }

    material.needsUpdate = true
  }, [dynamicPointLightsActive, material, variant])

  useEffect(() => () => material.dispose(), [material])

  if (!overlayOnly && !usesGpuFog && !shouldRenderLineOfSightGeometry(visibility, useLineOfSightPostMask)) {
    return null
  }

  return (
    <mesh
      ref={meshRef}
      position={[0, yOffset, 0]}
      castShadow={!overlayOnly && castShadow}
      receiveShadow={!overlayOnly && receiveShadow}
    >
      <boxGeometry args={geometry} />
      {overlayOnly ? (
        <meshBasicMaterial
          color={color}
          transparent
          opacity={tintOpacity ?? 0.42}
          depthWrite={false}
        />
      ) : (
        <primitive object={material} attach="material" />
      )}
    </mesh>
  )
}

function parseFogCellKey(cellKey?: string): [number, number] | null {
  if (!cellKey) {
    return null
  }

  const [xText, zText] = cellKey.split(':')
  const x = Number.parseInt(xText ?? '', 10)
  const z = Number.parseInt(zText ?? '', 10)
  return Number.isFinite(x) && Number.isFinite(z) ? [x, z] : null
}
