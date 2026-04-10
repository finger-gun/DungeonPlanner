import type * as THREE from 'three'

/** Module-level registry mapping dungeon object IDs → their Three.js scene groups.
 *  Used by WebGPUPostProcessing to resolve the selected object for the outline pass. */
const registry = new Map<string, THREE.Object3D>()

export function registerObject(id: string, obj: THREE.Object3D) {
  registry.set(id, obj)
}

export function unregisterObject(id: string) {
  registry.delete(id)
}

export function getRegisteredObject(id: string): THREE.Object3D | undefined {
  return registry.get(id)
}
