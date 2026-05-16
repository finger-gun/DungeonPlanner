import { getContentPackAssetById } from '../../content-packs/registry'
import { useDungeonStore } from '../../store/useDungeonStore'
import { parseSplineWallSegmentSideSelectionKey } from '../../store/wallStyleAssignments'
import { SelectedOpeningInspector } from './SelectedOpeningInspector'
import { SelectedPropInspector } from './SelectedPropInspector'
import { SelectedSplineWallSegmentInspector } from './SelectedSplineWallSegmentInspector'

export function SelectToolPanel() {
  const selection = useDungeonStore((state) => state.selection)
  const selectedObject = useDungeonStore((state) =>
    selection ? state.placedObjects[selection] : null,
  )
  const selectedOpening = useDungeonStore((state) =>
    selection ? state.wallOpenings[selection] : null,
  )
  const removeSelectedObject = useDungeonStore((state) => state.removeSelectedObject)
  const removeOpening = useDungeonStore((state) => state.removeOpening)
  const selectedWallSection = parseSplineWallSegmentSideSelectionKey(selection)

  const objectAsset = selectedObject?.assetId ? getContentPackAssetById(selectedObject.assetId) : null
  const openingAsset = selectedOpening?.assetId ? getContentPackAssetById(selectedOpening.assetId) : null
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

  if (selectedOpening) {
    return (
      <div className="space-y-4">
        <SelectedOpeningInspector
          opening={selectedOpening}
          asset={openingAsset}
          onDelete={() => removeOpening(selectedOpening.id)}
          title="Selected Opening"
        />
      </div>
    )
  }

  if (selectedWallSection) {
    return (
      <div className="space-y-4">
        <SelectedSplineWallSegmentInspector
          segmentId={selectedWallSection.segmentId}
          side={selectedWallSection.side}
        />
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-xs leading-6 text-stone-400">
      <p className="font-medium text-stone-300">Select Tool</p>
      <p className="mt-1">Click a prop, character, opening, or wall face handle in the scene to inspect it.</p>
      <p>Press <kbd>R</kbd> to rotate, <kbd>Esc</kbd> to deselect, and <kbd>Del</kbd> to delete.</p>
    </section>
  )
}
