import { useSyncExternalStore } from 'react'
import type * as THREE from 'three'

const registry = new Map<string, THREE.Mesh[]>()
const listeners = new Set<() => void>()
let version = 0

function notifyRegistryChanged() {
  version += 1
  listeners.forEach((listener) => listener())
}

export function registerDecalReceivers(id: string, meshes: THREE.Mesh[]) {
  registry.set(id, meshes)
  notifyRegistryChanged()
}

export function unregisterDecalReceivers(id: string) {
  if (registry.delete(id)) {
    notifyRegistryChanged()
  }
}

export function getDecalReceiverMeshes() {
  return Array.from(registry.values()).flat()
}

export function useDecalReceiverRegistryVersion() {
  return useSyncExternalStore(subscribeToDecalRegistry, getDecalReceiverRegistryVersion)
}

export function clearDecalReceiverRegistry() {
  if (registry.size === 0) {
    return
  }

  registry.clear()
  notifyRegistryChanged()
}

function subscribeToDecalRegistry(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getDecalReceiverRegistryVersion() {
  return version
}
