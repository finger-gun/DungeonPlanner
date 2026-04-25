import { useSyncExternalStore } from 'react'
import type * as THREE from 'three'

/** Module-level registry mapping dungeon object IDs → their Three.js scene groups.
 *  Used by WebGPUPostProcessing to resolve the selected object for the outline pass. */
const registry = new Map<string, THREE.Object3D>()
const listeners = new Set<() => void>()
let version = 0

function notifyRegistryChanged() {
  version += 1
  listeners.forEach((listener) => listener())
}

export function registerObject(id: string, obj: THREE.Object3D) {
  registry.set(id, obj)
  notifyRegistryChanged()
}

export function unregisterObject(id: string) {
  if (registry.delete(id)) {
    notifyRegistryChanged()
  }
}

export function getRegisteredObject(id: string): THREE.Object3D | undefined {
  return registry.get(id)
}

export function useObjectRegistryVersion() {
  return useSyncExternalStore(subscribeToObjectRegistry, getObjectRegistryVersion)
}

function subscribeToObjectRegistry(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getObjectRegistryVersion() {
  return version
}
