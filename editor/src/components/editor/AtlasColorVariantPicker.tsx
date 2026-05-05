import { Eraser } from 'lucide-react'
import type { MouseEvent } from 'react'
import type { AtlasColorVariantDefinition, AtlasColorVariantsConfig } from '../../content-packs/types'
import { CompactPillButton } from './CompactPillButton'

type AtlasColorVariantPickerProps = {
  config: AtlasColorVariantsConfig
  currentVariantId: string | null
  onSelect: (variantId: string) => void
  onClear?: () => void
  mode?: 'pills' | 'grid'
  className?: string
  getVariantColor?: (variant: AtlasColorVariantDefinition) => string
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function AtlasColorVariantPicker({
  config,
  currentVariantId,
  onSelect,
  onClear,
  mode = 'pills',
  className,
  getVariantColor,
}: AtlasColorVariantPickerProps) {
  if (mode === 'grid') {
    return (
      <div
        className={joinClasses(
          'inline-grid w-max grid-cols-6 gap-px rounded-2xl bg-stone-700/80 p-px',
          className,
        )}
      >
        {config.variants.map((variant) => {
          const active = currentVariantId === variant.id
          const color = getVariantColor?.(variant) ?? variant.swatchColor ?? '#9ca3af'

          return (
            <button
              key={variant.id}
              type="button"
              aria-label={variant.label}
              title={variant.label}
              onClick={(event) => handleVariantClick(event, () => onSelect(variant.id))}
              className={joinClasses(
                'relative flex h-9 w-9 items-center justify-center bg-transparent transition',
                active
                  ? 'z-10'
                  : 'hover:z-10',
              )}
            >
              <span
                aria-hidden="true"
                className={joinClasses(
                  'h-full w-full bg-stone-900/95',
                  active && 'ring-2 ring-amber-300/85 ring-offset-0',
                )}
                style={{ backgroundColor: color }}
              />
            </button>
          )
        })}
        {onClear ? (
          <button
            type="button"
            aria-label="Clear color variant"
            title="Clear color variant"
            onClick={(event) => handleVariantClick(event, onClear)}
            className="inline-flex h-9 w-9 items-center justify-center bg-stone-900/95 text-stone-300 transition hover:z-10 hover:text-stone-100"
          >
            <Eraser size={14} strokeWidth={1.8} />
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className={joinClasses('flex flex-wrap gap-2', className)}>
      {config.variants.map((variant) => (
        <CompactPillButton
          key={variant.id}
          type="button"
          tone="amber"
          size="sm"
          active={currentVariantId === variant.id}
          onClick={() => onSelect(variant.id)}
        >
          {(getVariantColor?.(variant) ?? variant.swatchColor) ? (
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full border border-black/20"
              style={{ backgroundColor: getVariantColor?.(variant) ?? variant.swatchColor }}
            />
          ) : null}
          <span>{variant.label}</span>
        </CompactPillButton>
      ))}
      {onClear ? (
        <CompactPillButton
          type="button"
          tone="stone"
          size="xs"
          onClick={onClear}
        >
          Clear
        </CompactPillButton>
      ) : null}
    </div>
  )
}

function handleVariantClick(event: MouseEvent<HTMLButtonElement>, action: () => void) {
  event.preventDefault()
  event.stopPropagation()
  action()
}
