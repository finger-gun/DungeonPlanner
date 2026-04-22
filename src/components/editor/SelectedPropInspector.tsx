import { useEffect, useMemo, useRef, useState } from 'react'
import type { ContentPackAsset } from '../../content-packs/types'
import type { DungeonObjectRecord } from '../../store/useDungeonStore'
import { useDungeonStore } from '../../store/useDungeonStore'
import {
  buildObjectLightOverrides,
  getEditablePropLightSettings,
  getObjectLightOverrides,
  withObjectLightOverrides,
  type EditablePropLightSettings,
} from '../../store/lightOverrides'

type SelectedPropInspectorProps = {
  object: DungeonObjectRecord
  asset: ContentPackAsset | null
  onDelete: () => void
  title?: string
}

export function SelectedPropInspector({
  object,
  asset,
  onDelete,
  title = 'Selected Prop',
}: SelectedPropInspectorProps) {
  return (
    <section>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/70">
        {title}
      </p>
      <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
              {asset?.name ?? object.type}
            </p>
            <p className="mt-1 font-mono text-sm text-stone-200">
              {object.id.slice(0, 8)}
            </p>
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-200 transition hover:border-rose-300/60 hover:bg-rose-500/20"
          >
            Delete
          </button>
        </div>
        <div className="grid gap-2 text-xs">
          <InfoRow label="Position" value={object.position.map((v) => v.toFixed(2)).join(', ')} />
          <InfoRow label="Rotation" value={object.rotation.map((v) => v.toFixed(2)).join(', ')} />
          <InfoRow label="Cell" value={object.cellKey} />
        </div>
        {asset && (
          <SelectedPropLightSection object={object} asset={asset} />
        )}
      </div>
    </section>
  )
}

function SelectedPropLightSection({
  object,
  asset,
}: {
  object: DungeonObjectRecord
  asset: ContentPackAsset
}) {
  const setObjectProps = useDungeonStore((state) => state.setObjectProps)
  const setObjectLightPreview = useDungeonStore((state) => state.setObjectLightPreview)
  const defaultLight = useMemo(
    () => asset.getLight?.(object.props) ?? asset.metadata?.light ?? null,
    [asset, object.props],
  )
  const committedOverrides = useMemo(() => getObjectLightOverrides(object.props), [object.props])
  const [draft, setDraft] = useState<EditablePropLightSettings | null>(null)
  const draftRef = useRef<EditablePropLightSettings | null>(null)
  const sliderDirtyRef = useRef(false)

  useEffect(() => {
    if (!defaultLight) {
      setDraft(null)
      draftRef.current = null
      setObjectLightPreview(object.id, null)
      return
    }

    const nextDraft = getEditablePropLightSettings(defaultLight, committedOverrides)
    setDraft(nextDraft)
    draftRef.current = nextDraft

    return () => {
      setObjectLightPreview(object.id, null)
    }
  }, [committedOverrides, defaultLight, object.id, setObjectLightPreview])

  if (!defaultLight || !draft) {
    return null
  }

  const setDraftState = (nextDraft: EditablePropLightSettings) => {
    setDraft(nextDraft)
    draftRef.current = nextDraft
  }

  const commitDraft = (nextDraft: EditablePropLightSettings) => {
    sliderDirtyRef.current = false
    setDraftState(nextDraft)
    setObjectLightPreview(object.id, null)
    setObjectProps(
      object.id,
      withObjectLightOverrides(object.props, buildObjectLightOverrides(defaultLight, nextDraft)),
    )
  }

  const commitCurrentDraft = () => {
    if (!sliderDirtyRef.current || !draftRef.current) {
      return
    }

    commitDraft(draftRef.current)
  }

  return (
    <div className="mt-4 border-t border-stone-800 pt-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/70">
        Light
      </p>

      <div className="grid gap-3">
        <div className="rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor={`light-color-${object.id}`} className="text-xs uppercase tracking-[0.2em] text-stone-500">
              Color
            </label>
            <input
              id={`light-color-${object.id}`}
              type="color"
              aria-label="Light Color"
              value={draft.color}
              onChange={(event) => {
                commitDraft({
                  ...draftRef.current!,
                  color: event.target.value,
                })
              }}
              className="h-8 w-12 cursor-pointer rounded border border-stone-700 bg-transparent p-1"
            />
          </div>
          <p className="text-[11px] text-stone-500">{draft.color}</p>
        </div>

        <div className="rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-3">
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor={`light-intensity-${object.id}`} className="text-xs uppercase tracking-[0.2em] text-stone-500">
              Intensity
            </label>
            <span className="text-xs tabular-nums text-stone-300">{draft.intensity.toFixed(2)}</span>
          </div>
          <input
            id={`light-intensity-${object.id}`}
            type="range"
            min={0}
            max={10}
            step={0.05}
            value={draft.intensity}
            aria-label="Light Intensity"
            onChange={(event) => {
              sliderDirtyRef.current = true
              const nextDraft = {
                ...draftRef.current!,
                intensity: parseFloat(event.target.value),
              }
              setDraftState(nextDraft)
              setObjectLightPreview(
                object.id,
                buildObjectLightOverrides(defaultLight, nextDraft),
              )
            }}
            onMouseUp={commitCurrentDraft}
            onTouchEnd={commitCurrentDraft}
            onBlur={commitCurrentDraft}
            onKeyUp={(event) => {
              if (
                event.key.startsWith('Arrow') ||
                event.key === 'Home' ||
                event.key === 'End' ||
                event.key === 'PageUp' ||
                event.key === 'PageDown'
              ) {
                commitCurrentDraft()
              }
            }}
            className="w-full accent-amber-400"
          />
        </div>

        <div className="rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Flicker</p>
              <p className="mt-1 text-xs text-stone-500">
                Toggle flame-style flicker for this light instance.
              </p>
            </div>
            <button
              type="button"
              aria-label="Light Flicker"
              aria-pressed={draft.flicker}
              onClick={() => {
                commitDraft({
                  ...draftRef.current!,
                  flicker: !draftRef.current!.flicker,
                })
              }}
              className={`relative h-4 w-7 rounded-full transition ${draft.flicker ? 'bg-amber-500' : 'bg-stone-700'}`}
            >
              <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all ${draft.flicker ? 'left-[14px]' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
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
