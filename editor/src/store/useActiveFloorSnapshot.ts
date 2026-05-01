import { useDungeonStore } from './useDungeonStore'
import {
  createFloorDirtyInfo,
  FLOOR_DIRTY_DOMAIN_VERSION_KEYS,
  type FloorDirtyDomainKey,
} from './floorDirtyDomains'

export const ACTIVE_FLOOR_RENDER_DOMAINS = [
  'tiles',
  'blocked',
  'walls',
  'openings',
  'props',
  'lighting',
  'renderPlan',
  'layerVisibility',
  'occupancy',
  'terrain',
] as const satisfies readonly FloorDirtyDomainKey[]

export const ACTIVE_FLOOR_VISIBILITY_DOMAINS = [
  'tiles',
  'walls',
  'openings',
  'props',
  'lighting',
  'layerVisibility',
  'renderPlan',
] as const satisfies readonly FloorDirtyDomainKey[]

export function useActiveFloorSnapshot<T>(
  domains: readonly FloorDirtyDomainKey[],
  select: (state: ReturnType<typeof useDungeonStore.getState>) => T,
) {
  const dependencyKey = useDungeonStore((state) => {
    const dirtyInfo = state.floorDirtyDomains[state.activeFloorId] ?? createFloorDirtyInfo()
    return [
      state.activeFloorId,
      ...domains.map((domain) => dirtyInfo[FLOOR_DIRTY_DOMAIN_VERSION_KEYS[domain]]),
    ].join(':')
  })

  void dependencyKey
  return select(useDungeonStore.getState())
}
