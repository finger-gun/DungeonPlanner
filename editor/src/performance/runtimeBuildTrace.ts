import { useSyncExternalStore } from 'react'
import { getContinuousRenderReasons } from '../rendering/renderActivity'
import { useDungeonStore } from '../store/useDungeonStore'

type BuildTraceDetailValue = string | number | boolean | null | undefined | readonly string[]
export type BuildTraceDetail = Record<string, BuildTraceDetailValue>

export type BuildTraceEntry = {
  id: number
  kind: 'span' | 'longtask'
  name: string
  duration: number
  startTime: number
  detail: BuildTraceDetail | null
}

const MAX_TRACE_ENTRIES = 30
const entries: BuildTraceEntry[] = []
const listeners = new Set<() => void>()
let nextEntryId = 1
let longTaskObserver: PerformanceObserver | null = null
let traceEntriesSnapshot: BuildTraceEntry[] = []

export function traceBuildPerf<T>(
  name: string,
  detail: BuildTraceDetail | null | undefined,
  callback: () => T,
): T {
  if (!isBuildTracingEnabled()) {
    return callback()
  }

  syncBuildTraceObservers()
  const entryId = nextEntryId++
  const traceName = `dp:${name}`
  const startMark = `${traceName}:${entryId}:start`
  const endMark = `${traceName}:${entryId}:end`
  const startTime = performance.now()

  performance.mark(startMark)
  try {
    return callback()
  } finally {
    const endTime = performance.now()
    performance.mark(endMark)
    performance.measure(traceName, startMark, endMark)
    pushTraceEntry({
      id: entryId,
      kind: 'span',
      name: traceName,
      duration: endTime - startTime,
      startTime,
      detail: addRenderReasons(detail),
    })
  }
}

export function startBuildPerfSpan(
  name: string,
  detail: BuildTraceDetail | null | undefined,
) {
  if (!isBuildTracingEnabled()) {
    return () => {}
  }

  syncBuildTraceObservers()
  const entryId = nextEntryId++
  const traceName = `dp:${name}`
  const startMark = `${traceName}:${entryId}:start`
  const endMark = `${traceName}:${entryId}:end`
  const startTime = performance.now()
  let ended = false

  performance.mark(startMark)

  return (endDetail?: BuildTraceDetail | null) => {
    if (ended) {
      return
    }
    ended = true

    const endTime = performance.now()
    performance.mark(endMark)
    performance.measure(traceName, startMark, endMark)
    pushTraceEntry({
      id: entryId,
      kind: 'span',
      name: traceName,
      duration: endTime - startTime,
      startTime,
      detail: addRenderReasons({
        ...(detail ?? {}),
        ...(endDetail ?? {}),
      }),
    })
  }
}

export function recordBuildPerfEvent(
  name: string,
  detail: BuildTraceDetail | null | undefined,
) {
  if (!isBuildTracingEnabled()) {
    return
  }

  syncBuildTraceObservers()
  const entryId = nextEntryId++
  const traceName = `dp:${name}`
  const startTime = performance.now()

  performance.mark(traceName)
  pushTraceEntry({
    id: entryId,
    kind: 'span',
    name: traceName,
    duration: 0,
    startTime,
    detail: addRenderReasons(detail),
  })
}

export function recordBuildPerfDuration(
  name: string,
  detail: BuildTraceDetail | null | undefined,
  startTime: number,
  duration: number,
) {
  if (!isBuildTracingEnabled()) {
    return
  }

  syncBuildTraceObservers()
  const entryId = nextEntryId++
  const traceName = `dp:${name}`

  try {
    performance.measure(traceName, {
      start: startTime,
      duration,
    })
  } catch {
    const startMark = `${traceName}:${entryId}:start`
    const endMark = `${traceName}:${entryId}:end`
    performance.mark(startMark)
    performance.mark(endMark)
    performance.measure(traceName, startMark, endMark)
  }

  pushTraceEntry({
    id: entryId,
    kind: 'span',
    name: traceName,
    duration,
    startTime,
    detail: addRenderReasons(detail),
  })
}

export function clearBuildTraceEntries() {
  if (entries.length === 0) {
    return
  }

  entries.length = 0
  traceEntriesSnapshot = []
  notifyTraceEntriesChanged()
}

export function useBuildTraceEntries() {
  return useSyncExternalStore(subscribeToTraceEntries, getTraceEntriesSnapshot)
}

export function syncBuildTraceObservers() {
  if (!isBuildTracingEnabled()) {
    longTaskObserver?.disconnect()
    longTaskObserver = null
    return
  }

  if (
    longTaskObserver
    || typeof PerformanceObserver === 'undefined'
    || !(PerformanceObserver.supportedEntryTypes?.includes('longtask') ?? false)
  ) {
    return
  }

  longTaskObserver = new PerformanceObserver((list) => {
    if (!isBuildTracingEnabled()) {
      return
    }

    list.getEntries().forEach((entry) => {
      pushTraceEntry({
        id: nextEntryId++,
        kind: 'longtask',
        name: 'browser-longtask',
        duration: entry.duration,
        startTime: entry.startTime,
        detail: addRenderReasons({ entryName: entry.name || 'longtask' }),
      })
    })
  })
  longTaskObserver.observe({ type: 'longtask', buffered: true })
}

function isBuildTracingEnabled() {
  return useDungeonStore.getState().buildPerformanceTracingEnabled
}

function addRenderReasons(detail: BuildTraceDetail | null | undefined) {
  const renderReasons = getContinuousRenderReasons()
  if (renderReasons.length === 0) {
    return detail ?? null
  }

  return {
    ...(detail ?? {}),
    renderReasons,
  }
}

function pushTraceEntry(entry: BuildTraceEntry) {
  entries.push(entry)
  if (entries.length > MAX_TRACE_ENTRIES) {
    entries.splice(0, entries.length - MAX_TRACE_ENTRIES)
  }
  traceEntriesSnapshot = [...entries]
  notifyTraceEntriesChanged()
}

function subscribeToTraceEntries(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getTraceEntriesSnapshot() {
  return traceEntriesSnapshot
}

function notifyTraceEntriesChanged() {
  listeners.forEach((listener) => listener())
}
