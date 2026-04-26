import type { PropLight } from '../content-packs/types'

export type ObjectLightOverrides = {
  color?: string
  intensity?: number
  flicker?: boolean
}

export type EditablePropLightSettings = {
  color: string
  intensity: number
  flicker: boolean
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function getObjectLightOverrides(
  props: Record<string, unknown> | null | undefined,
): ObjectLightOverrides | null {
  const raw = props?.lightOverrides
  if (!isObject(raw)) {
    return null
  }

  const overrides: ObjectLightOverrides = {}

  if (typeof raw.color === 'string') {
    overrides.color = raw.color
  }
  if (typeof raw.intensity === 'number' && Number.isFinite(raw.intensity)) {
    overrides.intensity = raw.intensity
  }
  if (typeof raw.flicker === 'boolean') {
    overrides.flicker = raw.flicker
  }

  return Object.keys(overrides).length > 0 ? overrides : null
}

export function getEditablePropLightSettings(
  light: PropLight,
  overrides: ObjectLightOverrides | null = null,
): EditablePropLightSettings {
  return {
    color: overrides?.color ?? light.color,
    intensity: overrides?.intensity ?? light.intensity,
    flicker: overrides?.flicker ?? Boolean(light.flicker),
  }
}

export function buildObjectLightOverrides(
  light: PropLight,
  settings: EditablePropLightSettings,
): ObjectLightOverrides | null {
  const overrides: ObjectLightOverrides = {}

  if (settings.color.toLowerCase() !== light.color.toLowerCase()) {
    overrides.color = settings.color
  }
  if (Math.abs(settings.intensity - light.intensity) > 1e-6) {
    overrides.intensity = settings.intensity
  }
  if (settings.flicker !== Boolean(light.flicker)) {
    overrides.flicker = settings.flicker
  }

  return Object.keys(overrides).length > 0 ? overrides : null
}

export function mergePropLightWithOverrides(
  light: PropLight,
  overrides: ObjectLightOverrides | null = null,
): PropLight {
  if (!overrides) {
    return light
  }

  return {
    ...light,
    ...(overrides.color ? { color: overrides.color } : {}),
    ...(typeof overrides.intensity === 'number' ? { intensity: overrides.intensity } : {}),
    ...(typeof overrides.flicker === 'boolean' ? { flicker: overrides.flicker } : {}),
  }
}

export function withObjectLightOverrides(
  props: Record<string, unknown>,
  overrides: ObjectLightOverrides | null,
): Record<string, unknown> {
  const nextProps = { ...props }

  if (overrides) {
    nextProps.lightOverrides = overrides
  } else {
    delete nextProps.lightOverrides
  }

  return nextProps
}
