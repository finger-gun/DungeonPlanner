import { useDungeonStore } from './useDungeonStore'
import {
  createFloorDirtyInfo,
  FLOOR_DIRTY_DOMAIN_VERSION_KEYS,
  type FloorDirtyDomainKey,
} from './floorDirtyDomains'

/**
 * Subscribes to specific dirty domains on the active floor and returns a
 * synchronously derived snapshot.
 *
 * Uses `useDungeonStore` to subscribe to version counters for the given
 * domains — this causes React to re-render when any of those domains are
 * marked dirty. The derived value is then computed synchronously from the
 * latest store state (bypassing the stale closure problem inherent to
 * selector-based subscriptions).
 *
 * The `void dependencyKey` is intentional: we call `useDungeonStore` for
 * its subscription side-effect (triggering re-renders), not to use the
 * returned value directly.
 */
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

  // Intentionally unused: reading this value keeps the component subscribed.
  void dependencyKey
  return select(useDungeonStore.getState())
}
