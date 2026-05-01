import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BUILD_ANIMATION_DEBUG_SLOW_MULTIPLIER,
  BUILD_ANIMATION_RISE_DURATION_MS,
  BUILD_ANIMATION_WARMUP_MS,
  getHeldBuildBatchState,
  getBuildAnimationState,
  getBuildYOffset,
  hasHeldBuildAnimations,
  isAnimationActive,
  releaseHeldBuildAnimations,
  resetBuildAnimations,
  triggerBuild,
  useBuildAnimationVersion,
} from './buildAnimations'
import {
  hasContinuousRenderRequests,
  resetContinuousRenderRequests,
} from '../rendering/renderActivity'
import { useDungeonStore } from './useDungeonStore'

describe('buildAnimations', () => {
  beforeEach(() => {
    useDungeonStore.getState().reset()
    useDungeonStore.getState().setSlowBuildAnimationDebug(false)
    resetBuildAnimations()
    resetContinuousRenderRequests()
    vi.spyOn(performance, 'now').mockReturnValue(1000)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetBuildAnimations()
    resetContinuousRenderRequests()
  })

  it('publishes version updates when animations start and when they are cleaned up', () => {
    const { result } = renderHook(() => useBuildAnimationVersion())
    const initialVersion = result.current

    act(() => {
      triggerBuild([[0, 0]], [0, 0])
    })

    expect(isAnimationActive('0:0')).toBe(true)
    expect(hasContinuousRenderRequests()).toBe(true)
    expect(result.current).toBe(initialVersion + 1)

    act(() => {
      getBuildYOffset('0:0', 2041)
    })

    expect(isAnimationActive('0:0')).toBe(true)
    expect(getBuildAnimationState('0:0')).toEqual({ delay: 0, startedAt: 1000 })

    act(() => {
      getBuildYOffset('0:0', 1000 + BUILD_ANIMATION_WARMUP_MS + BUILD_ANIMATION_RISE_DURATION_MS + 2000)
    })

    expect(isAnimationActive('0:0')).toBe(false)
    expect(hasContinuousRenderRequests()).toBe(false)
    expect(result.current).toBe(initialVersion + 2)
  })

  it('keeps tiles below ground during the warmup window before the visible rise starts', () => {
    act(() => {
      triggerBuild([[0, 0]], [0, 0])
    })

    expect(getBuildYOffset('0:0', 1000 + BUILD_ANIMATION_WARMUP_MS - 1)).toBeLessThan(0)
    expect(getBuildYOffset('0:0', 1000 + BUILD_ANIMATION_WARMUP_MS)).toBeLessThan(0)
    expect(getBuildYOffset('0:0', 1000 + BUILD_ANIMATION_WARMUP_MS + BUILD_ANIMATION_RISE_DURATION_MS)).toBe(0)
  })

  it('stretches build animation timing when slow debug mode is enabled', () => {
    useDungeonStore.getState().setSlowBuildAnimationDebug(true)

    act(() => {
      triggerBuild([[0, 0]], [0, 0])
    })

    expect(getBuildYOffset('0:0', 1000 + BUILD_ANIMATION_WARMUP_MS + BUILD_ANIMATION_RISE_DURATION_MS)).toBeLessThan(0)
    expect(
      getBuildYOffset(
        '0:0',
        1000 + BUILD_ANIMATION_WARMUP_MS + BUILD_ANIMATION_RISE_DURATION_MS * BUILD_ANIMATION_DEBUG_SLOW_MULTIPLIER,
      ),
    ).toBe(0)
  })

  it('holds a build batch below ground until release and then starts the rise from the release time', () => {
    act(() => {
      triggerBuild([[0, 0]], [0, 0], { holdUntilReleased: true })
    })

    expect(hasHeldBuildAnimations()).toBe(true)
    expect(getHeldBuildBatchState(1200)).toEqual({
      startedAt: 1000,
      effectiveReleaseAt: 1200,
      released: false,
    })
    expect(getBuildYOffset('0:0', 1400)).toBeLessThan(0)

    vi.spyOn(performance, 'now').mockReturnValue(1450)
    act(() => {
      releaseHeldBuildAnimations()
    })

    expect(hasHeldBuildAnimations()).toBe(false)
    expect(getBuildYOffset('0:0', 1450)).toBeLessThan(0)
    expect(getBuildYOffset('0:0', 1450 + BUILD_ANIMATION_RISE_DURATION_MS / 2)).toBeLessThan(0)
    expect(getBuildYOffset('0:0', 1450 + BUILD_ANIMATION_RISE_DURATION_MS)).toBe(0)
  })
})
