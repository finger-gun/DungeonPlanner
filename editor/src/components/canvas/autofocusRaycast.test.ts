import { describe, expect, it } from 'vitest'
import {
  AUTOFOCUS_RAYCAST_INTERVAL_MS,
  didAutofocusViewStateChange,
  shouldRefreshAutofocusRaycast,
  type AutofocusRaycastViewState,
} from './autofocusRaycast'

const BASE_VIEW_STATE: AutofocusRaycastViewState = {
  position: [0, 1, 2],
  quaternion: [0, 0, 0, 1],
  zoom: 1,
  orbitTarget: { x: 3, y: 4, z: 5 },
}

describe('autofocusRaycast', () => {
  it('detects meaningful autofocus view changes', () => {
    expect(didAutofocusViewStateChange(null, BASE_VIEW_STATE)).toBe(true)
    expect(didAutofocusViewStateChange(BASE_VIEW_STATE, BASE_VIEW_STATE)).toBe(false)
    expect(didAutofocusViewStateChange(BASE_VIEW_STATE, {
      ...BASE_VIEW_STATE,
      position: [0, 1, 2.01],
    })).toBe(true)
    expect(didAutofocusViewStateChange(BASE_VIEW_STATE, {
      ...BASE_VIEW_STATE,
      orbitTarget: { x: 8, y: 4, z: 5 },
    })).toBe(true)
  })

  it('refreshes autofocus raycasts only when needed', () => {
    expect(shouldRefreshAutofocusRaycast({
      nowMs: 1000,
      lastSampleTimeMs: Number.NEGATIVE_INFINITY,
      hasCachedRaycastTarget: false,
      needsResample: false,
      viewStateChanged: false,
    })).toBe(true)

    expect(shouldRefreshAutofocusRaycast({
      nowMs: 1000,
      lastSampleTimeMs: 950,
      hasCachedRaycastTarget: true,
      needsResample: false,
      viewStateChanged: false,
    })).toBe(false)

    expect(shouldRefreshAutofocusRaycast({
      nowMs: 1000,
      lastSampleTimeMs: 950,
      hasCachedRaycastTarget: true,
      needsResample: false,
      viewStateChanged: true,
    })).toBe(false)

    expect(shouldRefreshAutofocusRaycast({
      nowMs: 1000 + AUTOFOCUS_RAYCAST_INTERVAL_MS,
      lastSampleTimeMs: 1000,
      hasCachedRaycastTarget: true,
      needsResample: false,
      viewStateChanged: true,
    })).toBe(true)

    expect(shouldRefreshAutofocusRaycast({
      nowMs: 1000,
      lastSampleTimeMs: 900,
      hasCachedRaycastTarget: true,
      needsResample: true,
      viewStateChanged: false,
    })).toBe(true)
  })
})
