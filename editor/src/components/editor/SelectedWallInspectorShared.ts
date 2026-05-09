import { getContentPackAssetById } from '../../content-packs/registry'
import { useDungeonStore } from '../../store/useDungeonStore'
import { getCanonicalWallKey, getInheritedWallAssetIdForWallKey } from '../../store/wallSegments'

const EMPTY_WALL_PROPS: Record<string, unknown> = Object.freeze({})

type SelectedWallInspectorState = Pick<
  ReturnType<typeof useDungeonStore.getState>,
  | 'placedObjects'
  | 'wallOpenings'
  | 'wallSurfaceAssetIds'
  | 'wallSurfaceProps'
  | 'paintedCells'
  | 'rooms'
  | 'selectedAssetIds'
>

export function getSelectedWallKey(
  selection: string | null,
  state: SelectedWallInspectorState,
) {
  if (!selection || state.placedObjects[selection] || state.wallOpenings[selection]) {
    return null
  }

  return getCanonicalWallKey(selection, state.paintedCells) ?? selection
}

export function getSelectedWallAssetId(
  selection: string | null,
  state: SelectedWallInspectorState,
) {
  const wallKey = getSelectedWallKey(selection, state)
  if (!wallKey) {
    return null
  }

  return (
    state.wallSurfaceAssetIds[wallKey]
    ?? getInheritedWallAssetIdForWallKey(
      wallKey,
      state.paintedCells,
      state.rooms,
      state.selectedAssetIds.wall,
    )
  )
}

export function getSelectedWallProps(
  selection: string | null,
  state: SelectedWallInspectorState,
) {
  const wallKey = getSelectedWallKey(selection, state)
  if (!wallKey) {
    return null
  }

  return state.wallSurfaceProps[wallKey] ?? EMPTY_WALL_PROPS
}

export function getSelectedWallAsset(
  selection: string | null,
  state: SelectedWallInspectorState,
) {
  const assetId = getSelectedWallAssetId(selection, state)
  return assetId ? getContentPackAssetById(assetId) : null
}
