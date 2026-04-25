import { useSyncExternalStore } from 'react'
import { getContentPackAssetById } from '../../content-packs/registry'
import type { ContentPackEffect, PropLight } from '../../content-packs/types'
import type { DungeonObjectRecord } from '../../store/useDungeonStore'

export type RegisteredLightSource = {
  key: string
  object: DungeonObjectRecord
  light: PropLight
}

export type RegisteredEffectSource = {
  key: string
  object: DungeonObjectRecord
  effect: ContentPackEffect
}

type ScopeRegistry = {
  lights: Map<string, RegisteredLightSource>
  effects: Map<string, RegisteredEffectSource>
}

const scopeRegistry = new Map<string, ScopeRegistry>()
const listeners = new Set<() => void>()
let version = 0

function getOrCreateScope(scopeKey: string) {
  const existing = scopeRegistry.get(scopeKey)
  if (existing) {
    return existing
  }

  const created: ScopeRegistry = {
    lights: new Map(),
    effects: new Map(),
  }
  scopeRegistry.set(scopeKey, created)
  return created
}

function notifyRegistryChanged() {
  version += 1
  listeners.forEach((listener) => listener())
}

export function registerObjectSources(scopeKey: string, object: DungeonObjectRecord) {
  const scope = getOrCreateScope(scopeKey)
  const asset = object.assetId ? getContentPackAssetById(object.assetId) : null
  const light = asset?.getLight?.(object.props) ?? asset?.metadata?.light ?? null
  const effect = asset?.getEffect?.(object.props) ?? null

  const previousLight = scope.lights.get(object.id)
  const previousEffect = scope.effects.get(object.id)

  if (light) {
    scope.lights.set(object.id, {
      key: object.id,
      object,
      light,
    })
  } else {
    scope.lights.delete(object.id)
  }

  if (effect) {
    scope.effects.set(object.id, {
      key: object.id,
      object,
      effect,
    })
  } else {
    scope.effects.delete(object.id)
  }

  const lightChanged = previousLight?.object !== object || previousLight?.light !== light
  const effectChanged = previousEffect?.object !== object || previousEffect?.effect !== effect
  const lightAddedOrRemoved = Boolean(previousLight) !== Boolean(light)
  const effectAddedOrRemoved = Boolean(previousEffect) !== Boolean(effect)

  if (lightChanged || effectChanged || lightAddedOrRemoved || effectAddedOrRemoved) {
    notifyRegistryChanged()
  }
}

export function unregisterObjectSources(scopeKey: string, objectId: string) {
  const scope = scopeRegistry.get(scopeKey)
  if (!scope) {
    return
  }

  const removedLight = scope.lights.delete(objectId)
  const removedEffect = scope.effects.delete(objectId)
  if (!removedLight && !removedEffect) {
    return
  }

  if (scope.lights.size === 0 && scope.effects.size === 0) {
    scopeRegistry.delete(scopeKey)
  }

  notifyRegistryChanged()
}

export function getRegisteredLightSources(scopeKey: string) {
  return [...(scopeRegistry.get(scopeKey)?.lights.values() ?? [])]
}

export function getRegisteredEffectSources(scopeKey: string) {
  return [...(scopeRegistry.get(scopeKey)?.effects.values() ?? [])]
}

export function getRegisteredLightSourceCount(scopeKey: string) {
  return scopeRegistry.get(scopeKey)?.lights.size ?? 0
}

export function useObjectSourceRegistryVersion() {
  return useSyncExternalStore(subscribeToRegistry, getRegistryVersion)
}

export function useRegisteredLightSources(scopeKey: string) {
  useObjectSourceRegistryVersion()
  return getRegisteredLightSources(scopeKey)
}

export function useRegisteredEffectSources(scopeKey: string) {
  useObjectSourceRegistryVersion()
  return getRegisteredEffectSources(scopeKey)
}

function subscribeToRegistry(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getRegistryVersion() {
  return version
}
