import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { cellToWorldPosition, getCellKey, type GridCell } from '../../hooks/useSnapToGrid'
import { FLOOR_PIVOT_OFFSET, getFloorVariantIndex } from '../../content-packs/core/tiles/floorVariants'

export function buildMergedFloorReceiverGeometry({
  cells,
  blockedFloorCellKeys,
  variantScenes,
}: {
  cells: GridCell[]
  blockedFloorCellKeys: Set<string>
  variantScenes: THREE.Object3D[]
}) {
  const geometries: THREE.BufferGeometry[] = []

  for (const cell of cells) {
    const cellKey = getCellKey(cell)
    if (blockedFloorCellKeys.has(cellKey)) {
      continue
    }

    const variantIndex = getFloorVariantIndex(cellKey, variantScenes.length)
    const variantScene = variantScenes[variantIndex]
    const tilePosition = cellToWorldPosition(cell)
    const tileMatrix = new THREE.Matrix4().compose(
      new THREE.Vector3(
        tilePosition[0] + FLOOR_PIVOT_OFFSET[0],
        tilePosition[1] + FLOOR_PIVOT_OFFSET[1],
        tilePosition[2] + FLOOR_PIVOT_OFFSET[2],
      ),
      new THREE.Quaternion(),
      new THREE.Vector3(1, 1, 1),
    )

    variantScene.updateWorldMatrix(true, true)
    variantScene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) {
        return
      }

      const geometry = obj.geometry.clone()
      geometry.applyMatrix4(tileMatrix.clone().multiply(obj.matrixWorld))
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
