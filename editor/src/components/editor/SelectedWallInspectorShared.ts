import { getContentPackAssetById } from '../../content-packs/registry'
import { useDungeonStore } from '../../store/useDungeonStore'
import { getInheritedWallAssetIdForWallKey } from '../../store/wallSegments'

type SelectedWallInspectorState = Pick<
  ReturnType<typeof useDungeonStore.getState>,
  'placedObjects' | 'wallOpenings' | 'wallSurfaceAssetIds' | 'paintedCells' | 'rooms' | 'selectedAssetIds'
>

export function getSelectedWallAssetId(
  selection: string | null,
  state: SelectedWallInspectorState,
) {
  if (!selection || state.placedObjects[selection] || state.wallOpenings[selection]) {
    return null
  }

  return (
    state.wallSurfaceAssetIds[selection]
    ?? getInheritedWallAssetIdForWallKey(
      selection,
      state.paintedCells,
      state.rooms,
      state.selectedAssetIds.wall,
    )
  )
}

export function getSelectedWallAsset(
  selection: string | null,
  state: SelectedWallInspectorState,
) {
  const assetId = getSelectedWallAssetId(selection, state)
  return assetId ? getContentPackAssetById(assetId) : null
}
