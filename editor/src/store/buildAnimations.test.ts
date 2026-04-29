import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getBuildYOffset,
  isAnimationActive,
  resetBuildAnimations,
  triggerBuild,
  useBuildAnimationVersion,
} from './buildAnimations'

describe('buildAnimations', () => {
  beforeEach(() => {
    resetBuildAnimations()
    vi.spyOn(performance, 'now').mockReturnValue(1000)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetBuildAnimations()
  })

  it('publishes version updates when animations start and when they are cleaned up', () => {
    const { result } = renderHook(() => useBuildAnimationVersion())
    const initialVersion = result.current

    act(() => {
      triggerBuild([[0, 0]], [0, 0])
    })

    expect(isAnimationActive('0:0')).toBe(true)
    expect(result.current).toBe(initialVersion + 1)

    act(() => {
      getBuildYOffset('0:0', 1971)
    })

    expect(isAnimationActive('0:0')).toBe(false)
    expect(result.current).toBe(initialVersion + 2)
  })
})
