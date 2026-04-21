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

    return {
      preset: 'fire',
      emitters: options.emitters,
    } satisfies ContentPackEffect
  }
}

function isDungeonFlameLit(objectProps: Record<string, unknown>, defaultLit = false) {
  const lit = objectProps.lit
  return typeof lit === 'boolean' ? lit : defaultLit
}
