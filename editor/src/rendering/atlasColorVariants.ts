import * as THREE from 'three'
import type {
  AtlasColorVariantDefinition,
  AtlasColorVariantsConfig,
  ContentPackAssetMetadata,
} from '../content-packs/types'

type MeshStandardCompatibleWithMap = THREE.Material & {
  name?: string
  map?: THREE.Texture | null
  needsUpdate: boolean
  userData: Record<string, unknown>
}

type MaterialUserData = {
  atlasColorVariantBaseMap?: THREE.Texture | null
  atlasColorVariantMap?: THREE.Texture | null
}

export type ResolvedAtlasColorVariant = AtlasColorVariantDefinition & {
  propKey: string
  materialNames?: string[]
}

export function resolveAtlasColorVariant(
  metadata: ContentPackAssetMetadata | null | undefined,
  objectProps?: Record<string, unknown>,
): ResolvedAtlasColorVariant | null {
  const config = metadata?.atlasColorVariants
  if (!config) {
    return null
  }

  const rawVariantId = objectProps?.[config.propKey]
  if (typeof rawVariantId !== 'string') {
    return null
  }

  const variantId = rawVariantId.trim()
  if (!variantId) {
    return null
  }

  const variant = config.variants.find((entry) => entry.id === variantId)
  if (!variant) {
    return null
  }

  return {
    ...variant,
    propKey: config.propKey,
    ...(config.materialNames ? { materialNames: config.materialNames } : {}),
  }
}

export function applyAtlasColorVariantToObject(
  root: THREE.Object3D,
  selection: ResolvedAtlasColorVariant | null,
) {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return
    }

    if (Array.isArray(child.material)) {
      child.material.forEach((material) => applyAtlasColorVariantToMaterial(material, selection))
      return
    }

    if (child.material instanceof THREE.Material) {
      applyAtlasColorVariantToMaterial(child.material, selection)
    }
  })
}

export function hasAtlasColorVariants(metadata: ContentPackAssetMetadata | null | undefined): metadata is ContentPackAssetMetadata & {
  atlasColorVariants: AtlasColorVariantsConfig
} {
  return Boolean(metadata?.atlasColorVariants?.variants.length)
}

function applyAtlasColorVariantToMaterial(
  material: THREE.Material,
  selection: ResolvedAtlasColorVariant | null,
) {
  const compatibleMaterial = material as MeshStandardCompatibleWithMap
  if (selection?.materialNames?.length) {
    const materialName = compatibleMaterial.name?.trim()
    if (!materialName || !selection.materialNames.includes(materialName)) {
      restoreAtlasColorVariantTexture(compatibleMaterial)
      return
    }
  }

  const userData = compatibleMaterial.userData as MaterialUserData
  if (userData.atlasColorVariantBaseMap === undefined) {
    userData.atlasColorVariantBaseMap = compatibleMaterial.map ?? null
  }

  if (!selection) {
    restoreAtlasColorVariantTexture(compatibleMaterial)
    return
  }

  const baseMap = userData.atlasColorVariantBaseMap
  if (!(baseMap instanceof THREE.Texture)) {
    return
  }

  if (!(userData.atlasColorVariantMap instanceof THREE.Texture)) {
    userData.atlasColorVariantMap = baseMap.clone()
  }

  const variantMap = userData.atlasColorVariantMap
  variantMap.offset.set(selection.uvOffset[0], selection.uvOffset[1])
  variantMap.repeat.set(selection.uvScale?.[0] ?? 1, selection.uvScale?.[1] ?? 1)
  variantMap.needsUpdate = true
  compatibleMaterial.map = variantMap
  compatibleMaterial.needsUpdate = true
}

function restoreAtlasColorVariantTexture(material: MeshStandardCompatibleWithMap) {
  const userData = material.userData as MaterialUserData
  if (userData.atlasColorVariantBaseMap === undefined) {
    return
  }

  material.map = userData.atlasColorVariantBaseMap ?? null
  material.needsUpdate = true
}
