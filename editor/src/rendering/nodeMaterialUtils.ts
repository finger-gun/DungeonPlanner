import * as THREE from 'three'

type CompatibleNodeMaterial = THREE.Material & Pick<
  THREE.MeshStandardMaterial,
  | 'name'
  | 'color'
  | 'roughness'
  | 'metalness'
  | 'map'
  | 'lightMap'
  | 'lightMapIntensity'
  | 'aoMap'
  | 'aoMapIntensity'
  | 'emissive'
  | 'emissiveIntensity'
  | 'emissiveMap'
  | 'bumpMap'
  | 'bumpScale'
  | 'normalMap'
  | 'normalMapType'
  | 'normalScale'
  | 'displacementMap'
  | 'displacementScale'
  | 'displacementBias'
  | 'roughnessMap'
  | 'metalnessMap'
  | 'alphaMap'
  | 'envMap'
  | 'envMapIntensity'
  | 'wireframe'
  | 'flatShading'
  | 'fog'
  | 'transparent'
  | 'opacity'
  | 'alphaTest'
  | 'side'
  | 'blending'
  | 'blendSrc'
  | 'blendDst'
  | 'blendEquation'
  | 'premultipliedAlpha'
  | 'depthTest'
  | 'depthWrite'
  | 'polygonOffset'
  | 'polygonOffsetFactor'
  | 'polygonOffsetUnits'
  | 'dithering'
  | 'toneMapped'
  | 'visible'
  | 'vertexColors'
  | 'forceSinglePass'
  | 'shadowSide'
  | 'clipShadows'
  | 'clippingPlanes'
  | 'alphaToCoverage'
  | 'userData'
> & { type: string }

type MeshStandardNodeMaterialCtor = new () => CompatibleNodeMaterial

let registeredMeshStandardNodeMaterialCtor: MeshStandardNodeMaterialCtor | null = null

export function registerMeshStandardNodeMaterial(ctor: MeshStandardNodeMaterialCtor) {
  registeredMeshStandardNodeMaterialCtor = ctor
}

export function cloneSceneWithNodeMaterials<TObject extends THREE.Object3D>(source: TObject) {
  const clone = source.clone(true) as TObject
  upgradeStandardMaterialsToNodeMaterials(clone)
  return clone
}

export function upgradeStandardMaterialsToNodeMaterials(root: THREE.Object3D) {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return
    }

    if (Array.isArray(child.material)) {
      child.material = child.material.map((material) => upgradeStandardMaterial(material))
      return
    }

    if (child.material instanceof THREE.Material) {
      child.material = upgradeStandardMaterial(child.material)
    }
  })

  return root
}

export function cloneMaterialWithNodeCompatibility(material: THREE.Material) {
  if (!isPlainMeshStandardMaterial(material)) {
    return material.clone()
  }

  return createMeshStandardNodeMaterial(material)
}

export function createStandardCompatibleMaterial(parameters: THREE.MeshStandardMaterialParameters) {
  const source = new THREE.MeshStandardMaterial(parameters)
  const material = cloneMaterialWithNodeCompatibility(source)
  source.dispose()
  return material
}

function upgradeStandardMaterial(material: THREE.Material) {
  if (!isPlainMeshStandardMaterial(material)) {
    return material
  }

  return createMeshStandardNodeMaterial(material)
}

function createMeshStandardNodeMaterial(material: THREE.MeshStandardMaterial) {
  const NodeMaterialCtor = getMeshStandardNodeMaterialCtor()
  const upgraded = new NodeMaterialCtor()
  upgraded.name = material.name
  upgraded.color.copy(material.color)
  upgraded.roughness = material.roughness
  upgraded.metalness = material.metalness
  upgraded.map = material.map
  upgraded.lightMap = material.lightMap
  upgraded.lightMapIntensity = material.lightMapIntensity
  upgraded.aoMap = material.aoMap
  upgraded.aoMapIntensity = material.aoMapIntensity
  upgraded.emissive.copy(material.emissive)
  upgraded.emissiveIntensity = material.emissiveIntensity
  upgraded.emissiveMap = material.emissiveMap
  upgraded.bumpMap = material.bumpMap
  upgraded.bumpScale = material.bumpScale
  upgraded.normalMap = material.normalMap
  upgraded.normalMapType = material.normalMapType
  upgraded.normalScale.copy(material.normalScale)
  upgraded.displacementMap = material.displacementMap
  upgraded.displacementScale = material.displacementScale
  upgraded.displacementBias = material.displacementBias
  upgraded.roughnessMap = material.roughnessMap
  upgraded.metalnessMap = material.metalnessMap
  upgraded.alphaMap = material.alphaMap
  upgraded.envMap = material.envMap
  upgraded.envMapIntensity = material.envMapIntensity
  upgraded.wireframe = material.wireframe
  upgraded.flatShading = material.flatShading
  upgraded.fog = material.fog
  upgraded.transparent = material.transparent
  upgraded.opacity = material.opacity
  upgraded.alphaTest = material.alphaTest
  upgraded.side = material.side
  upgraded.blending = material.blending
  upgraded.blendSrc = material.blendSrc
  upgraded.blendDst = material.blendDst
  upgraded.blendEquation = material.blendEquation
  upgraded.premultipliedAlpha = material.premultipliedAlpha
  upgraded.depthTest = material.depthTest
  upgraded.depthWrite = material.depthWrite
  upgraded.polygonOffset = material.polygonOffset
  upgraded.polygonOffsetFactor = material.polygonOffsetFactor
  upgraded.polygonOffsetUnits = material.polygonOffsetUnits
  upgraded.dithering = material.dithering
  upgraded.toneMapped = material.toneMapped
  upgraded.visible = material.visible
  upgraded.vertexColors = material.vertexColors
  upgraded.forceSinglePass = material.forceSinglePass
  upgraded.shadowSide = material.shadowSide
  upgraded.clipShadows = material.clipShadows
  upgraded.clippingPlanes = material.clippingPlanes
  upgraded.alphaToCoverage = material.alphaToCoverage
  upgraded.userData = { ...material.userData }
  return upgraded
}

function getMeshStandardNodeMaterialCtor() {
  if (registeredMeshStandardNodeMaterialCtor) {
    return registeredMeshStandardNodeMaterialCtor
  }

  return MeshStandardNodeMaterialFallback
}

function isPlainMeshStandardMaterial(material: THREE.Material): material is THREE.MeshStandardMaterial {
  return material.type === 'MeshStandardMaterial'
}

class MeshStandardNodeMaterialFallback extends THREE.MeshStandardMaterial {
  constructor() {
    super()
    this.type = 'MeshStandardNodeMaterial'
  }
}
