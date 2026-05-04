import * as THREE from 'three'

export type CompatibleNodeMaterial = THREE.Material & Pick<
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

export function synchronizeCompatibleMaterialProperties(
  source: CompatibleNodeMaterial,
  target: CompatibleNodeMaterial,
) {
  target.name = source.name
  target.color.copy(source.color)
  target.roughness = source.roughness
  target.metalness = source.metalness
  target.map = source.map
  target.lightMap = source.lightMap
  target.lightMapIntensity = source.lightMapIntensity
  target.aoMap = source.aoMap
  target.aoMapIntensity = source.aoMapIntensity
  target.emissive.copy(source.emissive)
  target.emissiveIntensity = source.emissiveIntensity
  target.emissiveMap = source.emissiveMap
  target.bumpMap = source.bumpMap
  target.bumpScale = source.bumpScale
  target.normalMap = source.normalMap
  target.normalMapType = source.normalMapType
  target.normalScale.copy(source.normalScale)
  target.displacementMap = source.displacementMap
  target.displacementScale = source.displacementScale
  target.displacementBias = source.displacementBias
  target.roughnessMap = source.roughnessMap
  target.metalnessMap = source.metalnessMap
  target.alphaMap = source.alphaMap
  target.envMap = source.envMap
  target.envMapIntensity = source.envMapIntensity
  target.wireframe = source.wireframe
  target.flatShading = source.flatShading
  target.fog = source.fog
  target.transparent = source.transparent
  target.opacity = source.opacity
  target.alphaTest = source.alphaTest
  target.side = source.side
  target.blending = source.blending
  target.blendSrc = source.blendSrc
  target.blendDst = source.blendDst
  target.blendEquation = source.blendEquation
  target.premultipliedAlpha = source.premultipliedAlpha
  target.depthTest = source.depthTest
  target.depthWrite = source.depthWrite
  target.polygonOffset = source.polygonOffset
  target.polygonOffsetFactor = source.polygonOffsetFactor
  target.polygonOffsetUnits = source.polygonOffsetUnits
  target.dithering = source.dithering
  target.toneMapped = source.toneMapped
  target.visible = source.visible
  target.vertexColors = source.vertexColors
  target.forceSinglePass = source.forceSinglePass
  target.shadowSide = source.shadowSide
  target.clipShadows = source.clipShadows
  target.clippingPlanes = source.clippingPlanes
  target.alphaToCoverage = source.alphaToCoverage
  target.userData = { ...source.userData }
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
  synchronizeCompatibleMaterialProperties(material, upgraded)
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
