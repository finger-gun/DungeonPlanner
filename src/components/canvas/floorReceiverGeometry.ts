import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { cellToWorldPosition, getCellKey, type GridCell } from '../../hooks/useSnapToGrid'
import type { ContentPackModelTransform } from '../../content-packs/types'

type FloorReceiverCell = {
  cell: GridCell
  receiverScene: THREE.Object3D
  receiverTransform?: ContentPackModelTransform
}

export function buildMergedFloorReceiverGeometry({
  cells,
  blockedFloorCellKeys,
}: {
  cells: FloorReceiverCell[]
  blockedFloorCellKeys: Set<string>
}) {
  const geometries: THREE.BufferGeometry[] = []

  for (const cell of cells) {
    const cellKey = getCellKey(cell.cell)
    if (blockedFloorCellKeys.has(cellKey)) {
      continue
    }

    const tilePosition = cellToWorldPosition(cell.cell)
    const cellMatrix = new THREE.Matrix4().compose(
      new THREE.Vector3(tilePosition[0], tilePosition[1], tilePosition[2]),
      new THREE.Quaternion(),
      new THREE.Vector3(1, 1, 1),
    )
    const receiverMatrix = getReceiverTransformMatrix(cell.receiverTransform)

    cell.receiverScene.updateWorldMatrix(true, true)
    cell.receiverScene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) {
        return
      }

      const geometry = obj.geometry.clone()
      geometry.applyMatrix4(cellMatrix.clone().multiply(receiverMatrix).multiply(obj.matrixWorld))
      geometries.push(geometry)
    })
  }

  if (geometries.length === 0) {
    return null
  }

  const merged = mergeGeometries(geometries, false)
  geometries.forEach((geometry) => geometry.dispose())
  return merged
}

function getReceiverTransformMatrix(transform?: ContentPackModelTransform) {
  const scale = resolveScale(transform?.scale)
  return new THREE.Matrix4().compose(
    new THREE.Vector3(...(transform?.position ?? [0, 0, 0])),
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(...(transform?.rotation ?? [0, 0, 0])),
    ),
    new THREE.Vector3(...scale),
  )
}

function resolveScale(scale?: ContentPackModelTransform['scale']): [number, number, number] {
  if (typeof scale === 'number') {
    return [scale, scale, scale]
  }

  return scale ? [scale[0], scale[1], scale[2]] : [1, 1, 1]
}

export type { FloorReceiverCell }
