import { getContentPackAssetById } from '../../content-packs/registry'
import { useDungeonStore } from '../../store/useDungeonStore'
import { SelectedPropInspector } from './SelectedPropInspector'
import { getSelectedWallAsset, SelectedWallInspector } from './SelectedWallInspector'

const EMPTY_WALL_PROPS: Record<string, unknown> = {}

export function SelectToolPanel() {
  const selection = useDungeonStore((state) => state.selection)
  const selectedObject = useDungeonStore((state) =>
    selection ? state.placedObjects[selection] : null,
  )
  const selectedWallAsset = useDungeonStore((state) => getSelectedWallAsset(selection, state))
  const selectedWallProps = useDungeonStore((state) =>
    selection && !state.placedObjects[selection] && !state.wallOpenings[selection]
      ? (state.wallSurfaceProps[selection] ?? EMPTY_WALL_PROPS)
      : null,
  )
  const removeSelectedObject = useDungeonStore((state) => state.removeSelectedObject)

  const objectAsset = selectedObject?.assetId ? getContentPackAssetById(selectedObject.assetId) : null
  const isCharacterSelection = selectedObject?.type === 'player' || objectAsset?.category === 'player'

  if (selectedObject) {
    return (
      <div className="space-y-4">
        <SelectedPropInspector
          object={selectedObject}
          asset={objectAsset}
          onDelete={removeSelectedObject}
          title={isCharacterSelection ? 'Selected Character' : 'Selected Prop'}
        />
      </div>
    )
  }

  if (selection && selectedWallAsset && selectedWallProps) {
    return (
      <div className="space-y-4">
        <SelectedWallInspector
          wallKey={selection}
          asset={selectedWallAsset}
          wallProps={selectedWallProps}
          title="Selected Wall Variant"
        />
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-xs leading-6 text-stone-400">
      <p className="font-medium text-stone-300">Select Tool</p>
      <p className="mt-1">Click a prop, character, or wall variant in the scene to inspect it.</p>
      <p>Press <kbd>R</kbd> to rotate, <kbd>Esc</kbd> to deselect, and <kbd>Del</kbd> to delete.</p>
    </section>
  )
}
