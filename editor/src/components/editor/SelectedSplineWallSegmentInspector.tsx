import { useMemo } from 'react'
import { getContentPackWallStyles } from '../../content-packs/registry'
import { deriveSplineWallAssemblyData } from '../../store/splineWallAssembly'
import type { SplineWallSegmentSide } from '../../store/wallStyleAssignments'
import { useDungeonStore } from '../../store/useDungeonStore'
import { CompactPillButton } from './CompactPillButton'

export function SelectedSplineWallSegmentInspector({
  segmentId,
  side,
}: {
  segmentId: string
  side: SplineWallSegmentSide
}) {
  const splineWallGraph = useDungeonStore((state) => state.splineWallGraph)
  const rooms = useDungeonStore((state) => state.rooms)
  const wallStyleAssignments = useDungeonStore((state) => state.wallStyleAssignments)
  const wallCoreAssignments = useDungeonStore((state) => state.wallCoreAssignments)
  const setSplineWallSegmentStyle = useDungeonStore((state) => state.setSplineWallSegmentStyle)
  const setSplineWallStructuralStyle = useDungeonStore((state) => state.setSplineWallStructuralStyle)
  const wallStyles = useMemo(() => getContentPackWallStyles('dungeon'), [])

  const selectedSection = useMemo(() => {
    return deriveSplineWallAssemblyData({
      splineWallGraph,
      wallStyleAssignments,
      wallCoreAssignments,
      rooms,
    }).assemblySections.find((section) =>
      section.segmentId === segmentId
      && section.side === side
      && section.layerKind !== 'structural-core')
  }, [rooms, segmentId, side, splineWallGraph, wallCoreAssignments, wallStyleAssignments])

  const currentStyleId = selectedSection?.wallStyleId ?? null
  const currentCoreStyleId = selectedSection?.structuralSegmentId
    ? (wallCoreAssignments[selectedSection.structuralSegmentId] ?? null)
    : null

  return (
    <section>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-violet-200/70">
        Selected Wall Face
      </p>
      <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-4">
        <div className="grid gap-2 text-xs">
          <InfoRow label="Segment" value={segmentId} />
          <InfoRow label="Side" value={side} />
          <InfoRow label="Layer" value={selectedSection?.layerKind ?? 'room-face'} />
          <InfoRow label="Shared With" value={selectedSection?.oppositeRoomId ?? 'Exterior'} />
        </div>

        <div className="mt-4 border-t border-stone-800 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/70">
            Face Style
          </p>
          <div className="flex flex-wrap gap-2">
            {wallStyles.map((style) => (
              <CompactPillButton
                key={style.id}
                type="button"
                tone="sky"
                size="sm"
                active={currentStyleId === style.id}
                onClick={() => setSplineWallSegmentStyle(segmentId, side, style.id)}
              >
                {style.name}
              </CompactPillButton>
            ))}
            <CompactPillButton
              type="button"
              tone="stone"
              size="sm"
              onClick={() => setSplineWallSegmentStyle(segmentId, side, null)}
            >
              Default
            </CompactPillButton>
          </div>
        </div>

        <div className="mt-4 border-t border-stone-800 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/70">
            Structural Core
          </p>
          <div className="flex flex-wrap gap-2">
            {wallStyles.map((style) => (
              <CompactPillButton
                key={`core:${style.id}`}
                type="button"
                tone="amber"
                size="sm"
                active={currentCoreStyleId === style.id}
                onClick={() => setSplineWallStructuralStyle(segmentId, style.id)}
              >
                {style.name}
              </CompactPillButton>
            ))}
            <CompactPillButton
              type="button"
              tone="stone"
              size="sm"
              onClick={() => setSplineWallStructuralStyle(segmentId, null)}
            >
              Default
            </CompactPillButton>
          </div>
        </div>
      </div>
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-2">
      <span className="uppercase tracking-[0.2em] text-stone-500">{label}</span>
      <span className="break-all text-right text-stone-300">{value}</span>
    </div>
  )
}
