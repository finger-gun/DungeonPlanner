import type { ContentPackEffect, PropLight } from '../../types'

const DEFAULT_FLAME_LIGHT = {
  color: '#ff9944',
  intensity: 1.5,
  distance: 8,
  decay: 2,
  flicker: true,
} satisfies Omit<PropLight, 'offset'>

type FlameEmitter = NonNullable<ContentPackEffect['emitters']>[number]

type DungeonFlameOptions = {
  defaultLit?: boolean
  light?: Partial<PropLight>
  emitters?: FlameEmitter[]
}

export function createDungeonFlameLightGetter(options: DungeonFlameOptions = {}) {
  return (objectProps: Record<string, unknown>) => {
    if (!isDungeonFlameLit(objectProps, options.defaultLit)) {
      return null
    }

    return {
      ...DEFAULT_FLAME_LIGHT,
      offset: [0, 1.5, 0] as [number, number, number],
      ...options.light,
    } satisfies PropLight
  }
}

export function createDungeonFlameEffectGetter(options: DungeonFlameOptions = {}) {
  return (objectProps: Record<string, unknown>) => {
    if (!isDungeonFlameLit(objectProps, options.defaultLit)) {
      return null
    }

    const flameColor = getDungeonFlameColor(
      objectProps,
      options.light?.color ?? DEFAULT_FLAME_LIGHT.color,
    )

    return {
      preset: 'fire',
      emitters: options.emitters?.map((emitter) => ({
        ...emitter,
        color: emitter.color ?? flameColor,
      })),
    } satisfies ContentPackEffect
  }
}

function isDungeonFlameLit(objectProps: Record<string, unknown>, defaultLit = false) {
  const lit = objectProps.lit
  return typeof lit === 'boolean' ? lit : defaultLit
}

function getDungeonFlameColor(objectProps: Record<string, unknown>, fallbackColor: string) {
  const lightOverrides = objectProps.lightOverrides
  if (isObjectWithColor(lightOverrides)) {
    return lightOverrides.color
  }

  return fallbackColor
}

function isObjectWithColor(value: unknown): value is { color: string } {
  return (
    typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && typeof (value as { color?: unknown }).color === 'string'
  )
}
