import { useEffect, useMemo, useState } from 'react'
import type {
  DragonbaneBundledPackRegistry,
  DragonbaneRulesPackDomains,
  DragonbaneRulesPackPayload,
  DragonbaneSourceProvenance,
} from '@dungeonplanner/shared/dragonbane/rulesPack'
import {
  validateDragonbaneBundledPackRegistry,
  validateDragonbaneRulesPackManifest,
} from '@dungeonplanner/shared/dragonbane/validation'
import type { Id } from '../../convex/_generated/dataModel'
import { resolveBackendApiBaseUrl } from './backendAuthApi'

export type WorkspaceRulesPackRecord = {
  _id: Id<'packs'>
  packId: string
  name: string
  kind: 'asset' | 'rules'
  version: string
  visibility: 'global' | 'public' | 'private'
  description?: string | null
  isActive: boolean
  manifestStorageId?: Id<'_storage'> | null
  thumbnailStorageId?: Id<'_storage'> | null
  defaultAssetRefs?: {
    floor?: string
    wall?: string
    opening?: string
    prop?: string
    player?: string
  } | null
  domains?: DragonbaneRulesPackDomains | null
  sourceProvenance?: DragonbaneSourceProvenance | null
  entries: DragonbaneRulesPackPayload['entries']
}

export type RuntimeRulesPackRecord = {
  _id?: string | Id<'packs'>
  packId: string
  name: string
  kind: 'rules'
  version: string
  visibility: 'global' | 'public' | 'private'
  description?: string | null
  isActive: boolean
  alwaysActive: boolean
  bundled: boolean
  domains: DragonbaneRulesPackDomains
  sourceProvenance: DragonbaneSourceProvenance
  entries: DragonbaneRulesPackPayload['entries']
}

const BUNDLED_PACK_REGISTRY_PATH = '/api/content-packs/registry.json'

function getBundledPackBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:2567'
  }

  return resolveBackendApiBaseUrl(window.location, import.meta.env.VITE_BACKEND_URL)
}

function resolvePackUrl(path: string, baseUrl = getBundledPackBaseUrl()) {
  try {
    return new URL(path).toString()
  } catch {
    return new URL(path, `${baseUrl}/`).toString()
  }
}

async function fetchJson(url: string, fetchImpl: typeof fetch = fetch) {
  const response = await fetchImpl(resolvePackUrl(url), { credentials: 'omit' })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}.`)
  }

  return response.json()
}

export async function loadBundledPackRegistry(fetchImpl: typeof fetch = fetch): Promise<DragonbaneBundledPackRegistry> {
  return validateDragonbaneBundledPackRegistry(await fetchJson(BUNDLED_PACK_REGISTRY_PATH, fetchImpl))
}

export async function loadBundledPackManifest(
  path: string,
  fetchImpl: typeof fetch = fetch,
): Promise<DragonbaneRulesPackPayload> {
  return validateDragonbaneRulesPackManifest(await fetchJson(path, fetchImpl))
}

export function useBundledDragonbanePacks() {
  const [registry, setRegistry] = useState<DragonbaneBundledPackRegistry | null>(null)
  const [packs, setPacks] = useState<DragonbaneRulesPackPayload[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const nextRegistry = await loadBundledPackRegistry()
        const nextPacks = await Promise.all(nextRegistry.packs.map((entry) => loadBundledPackManifest(entry.path)))

        if (!cancelled) {
          setRegistry(nextRegistry)
          setPacks(nextPacks)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load bundled packs.')
          setRegistry(null)
          setPacks([])
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const alwaysActivePacks = useMemo(
    () => packs.filter((pack) => pack.alwaysActive),
    [packs],
  )

  return {
    registry,
    packs,
    alwaysActivePacks,
    error,
    isLoading,
  }
}

export function toRuntimeRulesPackRecord(pack: DragonbaneRulesPackPayload): RuntimeRulesPackRecord {
  return {
    packId: pack.packId,
    name: pack.name,
    kind: 'rules',
    version: pack.version,
    visibility: pack.visibility,
    description: pack.description ?? null,
    isActive: pack.isActive,
    alwaysActive: pack.alwaysActive,
    bundled: pack.bundled,
    domains: pack.domains,
    sourceProvenance: pack.sourceProvenance,
    entries: pack.entries,
  }
}

export function toWorkspaceRulesPackSaveInput(pack: DragonbaneRulesPackPayload) {
  return {
    packId: pack.packId,
    name: pack.name,
    kind: 'rules' as const,
    version: pack.version,
    visibility: pack.visibility,
    description: pack.description,
    isActive: pack.alwaysActive ? true : pack.isActive,
    defaultAssetRefs: undefined,
    domains: pack.domains,
    sourceProvenance: pack.sourceProvenance,
    entries: pack.entries,
  }
}

export function mergeRuntimeRulesPacks(
  bundledPacks: DragonbaneRulesPackPayload[],
  workspacePacks: WorkspaceRulesPackRecord[] | undefined,
) {
  const merged = new Map<string, RuntimeRulesPackRecord>()

  for (const pack of bundledPacks) {
    merged.set(pack.packId, toRuntimeRulesPackRecord(pack))
  }

  for (const pack of workspacePacks ?? []) {
    if (pack.kind !== 'rules' || !pack.domains || !pack.sourceProvenance) {
      continue
    }

    const bundledPack = merged.get(pack.packId)
    merged.set(pack.packId, {
      _id: pack._id,
      packId: pack.packId,
      name: pack.name,
      kind: 'rules',
      version: pack.version,
      visibility: pack.visibility,
      description: pack.description ?? null,
      isActive: bundledPack?.alwaysActive ? true : pack.isActive,
      alwaysActive: bundledPack?.alwaysActive ?? false,
      bundled: bundledPack?.bundled ?? false,
      domains: pack.domains,
      sourceProvenance: pack.sourceProvenance,
      entries: pack.entries,
    })
  }

  return [...merged.values()]
}
