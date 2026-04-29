import * as THREE from 'three'

export const SELECTION_OUTLINE_IGNORE_USER_DATA = 'selectionOutlineIgnore'
const selectionOutlineProxyPosition = new THREE.Vector3()
const selectionOutlineProxyQuaternion = new THREE.Quaternion()
const selectionOutlineProxyScale = new THREE.Vector3()

export function createSelectionOutlineProxy(root: THREE.Object3D | null | undefined) {
  if (!root) {
    return null
  }

  const proxyMaterial = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    side: THREE.DoubleSide,
    colorWrite: false,
    depthWrite: true,
    toneMapped: false,
  })
  const proxyRoot = root.clone(true)
  root.updateWorldMatrix(true, true)
  root.getWorldPosition(selectionOutlineProxyPosition)
  root.getWorldQuaternion(selectionOutlineProxyQuaternion)
  root.getWorldScale(selectionOutlineProxyScale)
  proxyRoot.position.copy(selectionOutlineProxyPosition)
  proxyRoot.quaternion.copy(selectionOutlineProxyQuaternion)
  proxyRoot.scale.copy(selectionOutlineProxyScale)

  let hasRenderableMesh = false
  proxyRoot.traverse((object) => {
    if (object.userData?.[SELECTION_OUTLINE_IGNORE_USER_DATA]) {
      object.visible = false
      return
    }

    if ((object as THREE.Mesh).isMesh) {
      const mesh = object as THREE.Mesh
      mesh.material = proxyMaterial
      mesh.castShadow = false
      mesh.receiveShadow = false
      hasRenderableMesh = true
      return
    }

    if ((object as THREE.Line).isLine || (object as THREE.Points).isPoints || (object as THREE.Sprite).isSprite) {
      object.visible = false
    }
  })

  proxyRoot.updateMatrixWorld(true)

  if (!hasRenderableMesh) {
    proxyMaterial.dispose()
    return null
  }

  return {
    object: proxyRoot,
    dispose: () => {
      proxyMaterial.dispose()
    },
  }
}
