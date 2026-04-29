const DEFAULT_OBJECT_INSTANCE_SCALE = 1
export const MIN_OBJECT_INSTANCE_SCALE = 0.5
export const MAX_OBJECT_INSTANCE_SCALE = 2
export const OBJECT_INSTANCE_SCALE_STEP = 0.25

const INSTANCE_SCALE_KEY = 'instanceScale'
const TINT_COLOR_KEY = 'tintColor'
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i

export function getObjectInstanceScale(props: Record<string, unknown>) {
  const raw = props[INSTANCE_SCALE_KEY]
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return DEFAULT_OBJECT_INSTANCE_SCALE
  }

  return clampObjectInstanceScale(raw)
}

export function withObjectInstanceScale(props: Record<string, unknown>, scale: number) {
  const nextScale = clampObjectInstanceScale(scale)
  const nextProps = { ...props }

  if (Math.abs(nextScale - DEFAULT_OBJECT_INSTANCE_SCALE) < 0.001) {
    delete nextProps[INSTANCE_SCALE_KEY]
    return nextProps
  }

  nextProps[INSTANCE_SCALE_KEY] = nextScale
  return nextProps
}

export function getObjectTintColor(props: Record<string, unknown>) {
  const raw = props[TINT_COLOR_KEY]
  return typeof raw === 'string' && HEX_COLOR_PATTERN.test(raw.trim())
    ? raw.trim().toLowerCase()
    : null
}

export function withObjectTintColor(props: Record<string, unknown>, color: string | null) {
  const nextProps = { ...props }
  const normalizedColor = normalizeTintColor(color)

  if (normalizedColor === null) {
    delete nextProps[TINT_COLOR_KEY]
    return nextProps
  }

  nextProps[TINT_COLOR_KEY] = normalizedColor
  return nextProps
}

function clampObjectInstanceScale(scale: number) {
  return Math.round(Math.min(MAX_OBJECT_INSTANCE_SCALE, Math.max(MIN_OBJECT_INSTANCE_SCALE, scale)) * 100) / 100
}

function normalizeTintColor(color: string | null) {
  if (typeof color !== 'string') {
    return null
  }

  const normalized = color.trim()
  return HEX_COLOR_PATTERN.test(normalized) ? normalized.toLowerCase() : null
}
