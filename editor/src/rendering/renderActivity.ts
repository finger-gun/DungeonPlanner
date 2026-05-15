import { useSyncExternalStore } from 'react'

const activeReasons = new Set<string>()
const listeners = new Set<() => void>()
let activeReasonsSnapshot: string[] = []

export function requestContinuousRender(reason: string) {
  const sizeBefore = activeReasons.size
  activeReasons.add(reason)
  if (activeReasons.size !== sizeBefore) {
    notifyRenderActivityChanged()
  }
}

export function releaseContinuousRender(reason: string) {
  if (activeReasons.delete(reason)) {
    notifyRenderActivityChanged()
  }
}

export function hasContinuousRenderRequests() {
  return activeReasons.size > 0
}

export function getContinuousRenderReasons() {
  return activeReasonsSnapshot
}

export function resetContinuousRenderRequests() {
  if (activeReasons.size === 0) {
    return
  }

  activeReasons.clear()
  notifyRenderActivityChanged()
}

export function useHasContinuousRenderRequests() {
  return useSyncExternalStore(subscribeToRenderActivity, hasContinuousRenderRequests)
}

export function useContinuousRenderReasons() {
  return useSyncExternalStore(subscribeToRenderActivity, getContinuousRenderReasons)
}

function subscribeToRenderActivity(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notifyRenderActivityChanged() {
  activeReasonsSnapshot = [...activeReasons].sort()
  listeners.forEach((listener) => listener())
}
