import type { ContentPackAsset } from '../../content-packs/types'
import { useDungeonStore } from '../../store/useDungeonStore'
import { CompactPillButton } from './CompactPillButton'

type SelectedWallInspectorProps = {
  wallKey: string
  asset: ContentPackAsset | null
  wallProps: Record<string, unknown>
  title?: string
}

export function SelectedWallInspector({
  wallKey,
  asset,
  wallProps,
  title = 'Selected Wall',
}: SelectedWallInspectorProps) {
  const setWallSurfaceProps = useDungeonStore((state) => state.setWallSurfaceProps)
  const nextStateProps = asset?.getPlayModeNextProps?.(wallProps) ?? null

  return (
    <section>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/70">
        {title}
      </p>
      <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
              {asset?.name ?? 'Wall'}
            </p>
            <p className="mt-1 font-mono text-sm text-stone-200">
              {wallKey}
            </p>
          </div>
        </div>
        {nextStateProps ? (
          <div className="border-t border-stone-800 pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/70">
              State
            </p>
            <CompactPillButton
              type="button"
              onClick={() => setWallSurfaceProps(wallKey, { ...wallProps, ...nextStateProps })}
              tone="amber"
              size="sm"
            >
              {getStateToggleLabel(nextStateProps)}
            </CompactPillButton>
          </div>
        ) : (
          <p className="text-xs text-stone-500">This wall variant has no interactive state.</p>
        )}
      </div>
    </section>
  )
}

function getStateToggleLabel(nextStateProps: Record<string, unknown>) {
  const entries = Object.entries(nextStateProps)
  if (entries.length !== 1) {
    return 'Toggle State'
  }

  const [key, value] = entries[0]!
  if (typeof value !== 'boolean') {
    return 'Toggle State'
  }

  if (key === 'open') {
    return value ? 'Open' : 'Close'
  }

  return 'Toggle State'
}
