import { useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '../../../rendering/useGLTF'
import { cloneSceneWithNodeMaterials } from '../../../rendering/nodeMaterialUtils'
import type { ContentPackComponentProps, ContentPackOpeningContext } from '../../types'
import { resolveDungeonModelAssetUrl } from '../shared/createDungeonAsset'

const MODEL_NAME = 'door_custom'
const FRAME_NODE_NAME = 'door_frame_bend'
const LEAF_NODE_NAME = 'door_leaf_rigid'
const DOOR_CUSTOM_SCALE = 0.5
const BEND_EPSILON = 1e-5
const assetUrl = resolveDungeonModelAssetUrl(MODEL_NAME)

type DoorCustomFrameBounds = {
  minX: number
  maxX: number
}

type DoorCustomBendPathSample = {
  position: readonly [number, number]
  tangent: readonly [number, number]
  normal: readonly [number, number]
  distance: number
}

export function DungeonDoorCustomVariant({ openingContext, ...props }: ContentPackComponentProps) {
  const gltf = useGLTF(assetUrl!)
  const scene = useMemo(
    () => createDoorCustomScene(gltf.scene, openingContext),
    [gltf.scene, openingContext],
  )

  return assetUrl ? (
    <group {...props}>
      <group scale={DOOR_CUSTOM_SCALE}>
        <primitive object={scene} />
      </group>
    </group>
  ) : <group {...props} />
}

export function createDoorCustomScene(
  sourceScene: THREE.Object3D,
  openingContext?: ContentPackOpeningContext,
) {
  const scene = cloneSceneWithNodeMaterials(sourceScene)
  if (!isDoorCustomBendContextRenderable(openingContext)) {
    return scene
  }

  const frameSource = scene.getObjectByName(FRAME_NODE_NAME)
  const leafSource = scene.getObjectByName(LEAF_NODE_NAME)
  const frameParent = frameSource?.parent
  if (!frameSource || !leafSource || !frameParent) {
    return scene
  }

  const bentFrame = createBentDoorCustomFrame(frameSource, openingContext)
  if (!bentFrame) {
    return scene
  }

  frameParent.add(bentFrame)
  frameParent.remove(frameSource)
  return scene
}

export function createBentDoorCustomFrame(
  frameSource: THREE.Object3D,
  openingContext: ContentPackOpeningContext,
) {
  const flattenedMeshes = collectFlattenedDoorCustomFrameMeshes(frameSource)
  if (flattenedMeshes.length === 0) {
    return null
  }

  const frameBounds = getDoorCustomFrameBounds(flattenedMeshes)
  if (!frameBounds) {
    return null
  }

  const bendPath = buildDoorCustomBendPath(openingContext, frameBounds, DOOR_CUSTOM_SCALE)
  if (!bendPath) {
    return null
  }

  const bentFrame = new THREE.Group()
  bentFrame.name = frameSource.name
  bentFrame.position.copy(frameSource.position)
  bentFrame.quaternion.copy(frameSource.quaternion)
  bentFrame.scale.copy(frameSource.scale)
  bentFrame.visible = frameSource.visible
  bentFrame.renderOrder = frameSource.renderOrder
  bentFrame.userData = { ...frameSource.userData }

  flattenedMeshes.forEach((mesh) => {
    mesh.geometry = bendDoorCustomFrameGeometry(mesh.geometry, bendPath, frameBounds)
    bentFrame.add(mesh)
  })

  return bentFrame
}

export function buildDoorCustomBendPath(
  openingContext: ContentPackOpeningContext,
  frameBounds: DoorCustomFrameBounds,
  scale: number,
): DoorCustomBendPathSample[] | null {
  if (!isDoorCustomBendContextRenderable(openingContext)) {
    return null
  }

  const clearSpanModel = openingContext.clearSpan / scale
  const frameWidthModel = frameBounds.maxX - frameBounds.minX
  if (frameWidthModel <= BEND_EPSILON) {
    return null
  }

  const basePath = openingContext.spanSamples.map((sample) => ({
    position: [sample.position[0] / scale, sample.position[2] / scale] as [number, number],
    tangent: normalizeDoorCustomVector2([sample.tangent[0], sample.tangent[2]], [1, 0]),
    normal: normalizeDoorCustomVector2([sample.normal[0], sample.normal[2]], [0, 1]),
    distance: sample.distance / scale,
  }))
  if (basePath.length < 2) {
    return null
  }

  const start = basePath[0]!
  const end = basePath.at(-1)!
  const marginModel = Math.max(0, (frameWidthModel - clearSpanModel) / 2)
  if (marginModel <= BEND_EPSILON) {
    return basePath
  }

  return [
    {
      position: [
        start.position[0] - (start.tangent[0] * marginModel),
        start.position[1] - (start.tangent[1] * marginModel),
      ],
      tangent: start.tangent,
      normal: start.normal,
      distance: 0,
    },
    ...basePath.map((sample) => ({
      ...sample,
      distance: sample.distance + marginModel,
    })),
    {
      position: [
        end.position[0] + (end.tangent[0] * marginModel),
        end.position[1] + (end.tangent[1] * marginModel),
      ],
      tangent: end.tangent,
      normal: end.normal,
      distance: end.distance + (marginModel * 2),
    },
  ]
}

export function bendDoorCustomFrameGeometry(
  sourceGeometry: THREE.BufferGeometry,
  bendPath: readonly DoorCustomBendPathSample[],
  frameBounds: DoorCustomFrameBounds,
) {
  const geometry = sourceGeometry.clone()
  const positionAttribute = geometry.getAttribute('position')
  if (!(positionAttribute instanceof THREE.BufferAttribute)) {
    return geometry
  }

  const normalAttribute = geometry.getAttribute('normal')
  const frameWidth = frameBounds.maxX - frameBounds.minX
  const totalDistance = bendPath.at(-1)?.distance ?? 0
  if (frameWidth <= BEND_EPSILON || totalDistance <= BEND_EPSILON) {
    return geometry
  }

  for (let index = 0; index < positionAttribute.count; index += 1) {
    const x = positionAttribute.getX(index)
    const y = positionAttribute.getY(index)
    const z = positionAttribute.getZ(index)
    const ratio = THREE.MathUtils.clamp((x - frameBounds.minX) / frameWidth, 0, 1)
    const sample = sampleDoorCustomBendPath(bendPath, ratio * totalDistance)

    positionAttribute.setXYZ(
      index,
      sample.position[0] + (sample.normal[0] * z),
      y,
      sample.position[1] + (sample.normal[1] * z),
    )

    if (normalAttribute instanceof THREE.BufferAttribute) {
      const normalX = normalAttribute.getX(index)
      const normalY = normalAttribute.getY(index)
      const normalZ = normalAttribute.getZ(index)
      const bentNormal = normalizeDoorCustomVector3([
        (sample.tangent[0] * normalX) + (sample.normal[0] * normalZ),
        normalY,
        (sample.tangent[1] * normalX) + (sample.normal[1] * normalZ),
      ], [0, 1, 0])
      normalAttribute.setXYZ(index, bentNormal[0], bentNormal[1], bentNormal[2])
    }
  }

  positionAttribute.needsUpdate = true
  if (normalAttribute instanceof THREE.BufferAttribute) {
    normalAttribute.needsUpdate = true
  } else {
    geometry.computeVertexNormals()
  }
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

export function isDoorCustomBendContextRenderable(
  openingContext?: ContentPackOpeningContext,
): openingContext is ContentPackOpeningContext {
  return Boolean(openingContext && openingContext.spanSamples.length >= 2)
}

function collectFlattenedDoorCustomFrameMeshes(frameSource: THREE.Object3D) {
  frameSource.updateWorldMatrix(true, true)
  const frameWorldInverse = new THREE.Matrix4().copy(frameSource.matrixWorld).invert()
  const meshes: THREE.Mesh[] = []

  frameSource.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return
    }

    const geometry = child.geometry.clone()
    geometry.applyMatrix4(
      new THREE.Matrix4().multiplyMatrices(frameWorldInverse, child.matrixWorld),
    )
    const mesh = new THREE.Mesh(geometry, child.material)
    mesh.name = child.name
    mesh.visible = child.visible
    mesh.renderOrder = child.renderOrder
    mesh.userData = { ...child.userData }
    meshes.push(mesh)
  })

  return meshes
}

function getDoorCustomFrameBounds(meshes: readonly THREE.Mesh[]) {
  const bounds = new THREE.Box3()
  meshes.forEach((mesh) => {
    mesh.geometry.computeBoundingBox()
    const geometryBounds = mesh.geometry.boundingBox
    if (geometryBounds) {
      bounds.union(geometryBounds)
    }
  })

  if (!Number.isFinite(bounds.min.x) || !Number.isFinite(bounds.max.x)) {
    return null
  }

  return {
    minX: bounds.min.x,
    maxX: bounds.max.x,
  } satisfies DoorCustomFrameBounds
}

function sampleDoorCustomBendPath(
  bendPath: readonly DoorCustomBendPathSample[],
  distance: number,
) {
  const clampedDistance = THREE.MathUtils.clamp(
    distance,
    0,
    bendPath.at(-1)?.distance ?? 0,
  )
  const first = bendPath[0]!
  const last = bendPath.at(-1)!
  if (clampedDistance <= first.distance + BEND_EPSILON) {
    return first
  }
  if (clampedDistance >= last.distance - BEND_EPSILON) {
    return last
  }

  for (let index = 0; index < bendPath.length - 1; index += 1) {
    const current = bendPath[index]!
    const next = bendPath[index + 1]!
    if (clampedDistance > next.distance + BEND_EPSILON) {
      continue
    }

    const segmentDistance = next.distance - current.distance
    const ratio = segmentDistance <= BEND_EPSILON
      ? 0
      : (clampedDistance - current.distance) / segmentDistance
    const tangent = normalizeDoorCustomVector2([
      current.tangent[0] + ((next.tangent[0] - current.tangent[0]) * ratio),
      current.tangent[1] + ((next.tangent[1] - current.tangent[1]) * ratio),
    ], current.tangent)
    const normal: [number, number] = [-tangent[1], tangent[0]]

    return {
      position: [
        current.position[0] + ((next.position[0] - current.position[0]) * ratio),
        current.position[1] + ((next.position[1] - current.position[1]) * ratio),
      ] as [number, number],
      tangent,
      normal,
      distance: clampedDistance,
    } satisfies DoorCustomBendPathSample
  }

  return last
}

function normalizeDoorCustomVector2(
  vector: readonly [number, number],
  fallback: readonly [number, number],
): [number, number] {
  const length = Math.hypot(vector[0], vector[1])
  if (length <= BEND_EPSILON) {
    return [fallback[0], fallback[1]]
  }

  return [vector[0] / length, vector[1] / length]
}

function normalizeDoorCustomVector3(
  vector: readonly [number, number, number],
  fallback: readonly [number, number, number],
): [number, number, number] {
  const length = Math.hypot(vector[0], vector[1], vector[2])
  if (length <= BEND_EPSILON) {
    return [fallback[0], fallback[1], fallback[2]]
  }

  return [vector[0] / length, vector[1] / length, vector[2] / length]
}

if (assetUrl) {
  useGLTF.preload(assetUrl)
}
