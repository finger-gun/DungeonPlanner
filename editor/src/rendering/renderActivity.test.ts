import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  hasContinuousRenderRequests,
  releaseContinuousRender,
  requestContinuousRender,
  resetContinuousRenderRequests,
  useHasContinuousRenderRequests,
} from './renderActivity'

describe('renderActivity', () => {
  beforeEach(() => {
    resetContinuousRenderRequests()
  })

  afterEach(() => {
    resetContinuousRenderRequests()
  })

  it('starts with no continuous render requests', () => {
    expect(hasContinuousRenderRequests()).toBe(false)
  })

  it('tracks a single continuous render request', () => {
    requestContinuousRender('test-reason')
    expect(hasContinuousRenderRequests()).toBe(true)

    releaseContinuousRender('test-reason')
    expect(hasContinuousRenderRequests()).toBe(false)
  })

  it('tracks multiple distinct continuous render requests', () => {
    requestContinuousRender('reason-1')
    expect(hasContinuousRenderRequests()).toBe(true)

    requestContinuousRender('reason-2')
    expect(hasContinuousRenderRequests()).toBe(true)

    releaseContinuousRender('reason-1')
    expect(hasContinuousRenderRequests()).toBe(true)

    releaseContinuousRender('reason-2')
    expect(hasContinuousRenderRequests()).toBe(false)
  })

  it('ignores duplicate requests for the same reason', () => {
    requestContinuousRender('duplicate')
    requestContinuousRender('duplicate')
    requestContinuousRender('duplicate')

    expect(hasContinuousRenderRequests()).toBe(true)

    releaseContinuousRender('duplicate')
    expect(hasContinuousRenderRequests()).toBe(false)
  })

  it('ignores release for unknown reason', () => {
    requestContinuousRender('known')
    releaseContinuousRender('unknown')
    expect(hasContinuousRenderRequests()).toBe(true)

    releaseContinuousRender('known')
    expect(hasContinuousRenderRequests()).toBe(false)
  })

  it('resets all continuous render requests', () => {
    requestContinuousRender('reason-1')
    requestContinuousRender('reason-2')
    requestContinuousRender('reason-3')

    expect(hasContinuousRenderRequests()).toBe(true)

    resetContinuousRenderRequests()
    expect(hasContinuousRenderRequests()).toBe(false)
  })

  it('notifies subscribers when state changes', async () => {
    const { result, rerender } = renderHook(() => useHasContinuousRenderRequests())

    expect(result.current).toBe(false)

    requestContinuousRender('test')
    rerender()
    expect(result.current).toBe(true)

    releaseContinuousRender('test')
    rerender()
    expect(result.current).toBe(false)
  })

  it('prevents unnecessary re-renders when state does not change', () => {
    const { result, rerender } = renderHook(() => useHasContinuousRenderRequests())
    const initialValue = result.current

    // Request and release multiple times without net change
    requestContinuousRender('a')
    releaseContinuousRender('a')
    rerender()

    expect(result.current).toBe(initialValue)
  })

  describe('typical usage patterns', () => {
    it('handles build animation lifecycle', () => {
      expect(hasContinuousRenderRequests()).toBe(false)

      requestContinuousRender('build-animations')
      expect(hasContinuousRenderRequests()).toBe(true)

      releaseContinuousRender('build-animations')
      expect(hasContinuousRenderRequests()).toBe(false)
    })

    it('handles floor transition lifecycle', () => {
      expect(hasContinuousRenderRequests()).toBe(false)

      requestContinuousRender('floor-transition')
      expect(hasContinuousRenderRequests()).toBe(true)

      releaseContinuousRender('floor-transition')
      expect(hasContinuousRenderRequests()).toBe(false)
    })

    it('handles prop light flicker lifecycle', () => {
      expect(hasContinuousRenderRequests()).toBe(false)

      requestContinuousRender('prop-light-flicker')
      expect(hasContinuousRenderRequests()).toBe(true)

      releaseContinuousRender('prop-light-flicker')
      expect(hasContinuousRenderRequests()).toBe(false)
    })

    it('handles fire particles lifecycle', () => {
      expect(hasContinuousRenderRequests()).toBe(false)

      requestContinuousRender('fire-particles')
      expect(hasContinuousRenderRequests()).toBe(true)

      releaseContinuousRender('fire-particles')
      expect(hasContinuousRenderRequests()).toBe(false)
    })

    it('handles multiple concurrent activities', () => {
      expect(hasContinuousRenderRequests()).toBe(false)

      // Start build animations
      requestContinuousRender('build-animations')
      expect(hasContinuousRenderRequests()).toBe(true)

      // Start fire particles (build still running)
      requestContinuousRender('fire-particles')
      expect(hasContinuousRenderRequests()).toBe(true)

      // Finish build (fire still running)
      releaseContinuousRender('build-animations')
      expect(hasContinuousRenderRequests()).toBe(true)

      // Finish fire (all done)
      releaseContinuousRender('fire-particles')
      expect(hasContinuousRenderRequests()).toBe(false)
    })
  })
})
