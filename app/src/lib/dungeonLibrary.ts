export type LocalDungeonDraft = {
  title: string
  description: string
  serializedDungeon: string
}

export type SavedDungeonSnapshot = LocalDungeonDraft & {
  id: string
}

export type DungeonSyncState =
  | { tone: 'muted'; label: 'No draft'; detail: string }
  | { tone: 'warning'; label: 'Local draft'; detail: string }
  | { tone: 'success'; label: 'Saved'; detail: string }
  | { tone: 'warning'; label: 'Unsaved changes'; detail: string }

export function getDungeonSyncState(
  draft: LocalDungeonDraft,
  savedSnapshot: SavedDungeonSnapshot | null,
): DungeonSyncState {
  const hasDraft = Boolean(draft.title.trim() || draft.description.trim() || draft.serializedDungeon.trim())

  if (!hasDraft) {
    return {
      tone: 'muted',
      label: 'No draft',
      detail: 'Import a portable dungeon JSON file or paste a payload to start a local draft.',
    }
  }

  if (!savedSnapshot) {
    return {
      tone: 'warning',
      label: 'Local draft',
      detail: 'This draft only exists in the browser until you save it into the dungeon library.',
    }
  }

  if (
    draft.title === savedSnapshot.title &&
    draft.description === savedSnapshot.description &&
    draft.serializedDungeon === savedSnapshot.serializedDungeon
  ) {
    return {
      tone: 'success',
      label: 'Saved',
      detail: 'The local draft matches the latest durable record in Convex.',
    }
  }

  return {
    tone: 'warning',
    label: 'Unsaved changes',
    detail: 'The local draft has diverged from the last saved Convex record.',
  }
}

export function inferDungeonTitle(serializedDungeon: string, fallbackTitle = 'Imported Dungeon') {
  const normalizedPayload = serializedDungeon.trim()
  if (!normalizedPayload) {
    return fallbackTitle
  }

  try {
    const parsed = JSON.parse(normalizedPayload) as { name?: unknown }
    return typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : fallbackTitle
  } catch {
    return fallbackTitle
  }
}

export function isPortableDungeonPayload(serializedDungeon: string) {
  const normalizedPayload = serializedDungeon.trim()
  if (!normalizedPayload) {
    return false
  }

  try {
    const parsed = JSON.parse(normalizedPayload) as { version?: unknown; floors?: unknown; rooms?: unknown }

    return typeof parsed === 'object' && parsed !== null && 'version' in parsed && ('floors' in parsed || 'rooms' in parsed)
  } catch {
    return false
  }
}
