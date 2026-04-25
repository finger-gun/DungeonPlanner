import type { ButtonHTMLAttributes } from 'react'

type CompactPillTone = 'teal' | 'sky' | 'amber' | 'emerald' | 'rose' | 'stone'
type CompactPillSize = 'xs' | 'sm' | 'md'

type CompactPillButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean
  tone?: CompactPillTone
  size?: CompactPillSize
  fullWidth?: boolean
}

const ACTIVE_TONE_CLASSES: Record<CompactPillTone, string> = {
  teal: 'border-teal-300/35 bg-teal-400/10 text-teal-200',
  sky: 'border-sky-300/35 bg-sky-400/10 text-sky-200',
  amber: 'border-amber-300/40 bg-amber-400/15 text-amber-100',
  emerald: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
  rose: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
  stone: 'border-stone-600/80 bg-stone-800/80 text-stone-100',
}

const SIZE_CLASSES: Record<CompactPillSize, string> = {
  xs: 'min-h-[1.625rem] px-2 py-1 text-[10px]',
  sm: 'min-h-7 px-2.5 py-1 text-[10px]',
  md: 'min-h-8 px-3 py-1.5 text-[11px]',
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function CompactPillButton({
  active = false,
  tone = 'teal',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...props
}: CompactPillButtonProps) {
  return (
    <button
      {...props}
      className={joinClasses(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg border bg-stone-950/60 font-medium leading-none transition disabled:cursor-not-allowed disabled:opacity-50',
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        active
          ? ACTIVE_TONE_CLASSES[tone]
          : 'border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200',
        className,
      )}
    >
      {children}
    </button>
  )
}
