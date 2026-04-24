import {
  buildEditorApiUrl,
  parseEditorLaunchSession,
  stripEditorLaunchSession,
  type EditorLaunchSession,
  type SavedDungeonRecord,
  type SavedDungeonSummary,
} from '../../shared/editorAccess'

export type EditorDungeonHandoff = EditorLaunchSession
export type ConsumedEditorDungeon = SavedDungeonRecord
export type EditorDungeonAccess = Pick<EditorLaunchSession, 'backendUrl' | 'accessToken'>

export function parseEditorDungeonHandoff(search: string): EditorDungeonHandoff | null {
  return parseEditorLaunchSession(search)
}

export function stripEditorDungeonHandoff(search: string) {
  return stripEditorLaunchSession(search)
}

async function postEditorApi<TResponse>(
  access: EditorDungeonAccess,
  path: string,
  body: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
) {
  const response = await fetchImpl(buildEditorApiUrl(access.backendUrl, path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accessToken: access.accessToken,
      ...body,
    }),
  })

  if (!response.ok) {
    throw new Error('Dungeon library request could not be completed.')
  }

  return (await response.json()) as TResponse
}

export async function consumeEditorDungeonHandoff(
  handoff: EditorDungeonHandoff,
  fetchImpl: typeof fetch = fetch,
) {
  if (!handoff.dungeonId) {
    throw new Error('Dungeon handoff is missing its dungeon reference.')
  }

  return postEditorApi<ConsumedEditorDungeon>(
    handoff,
    '/editor-dungeons/open',
    { dungeonId: handoff.dungeonId },
    fetchImpl,
  )
}

export async function listEditorDungeons(
  access: EditorDungeonAccess,
  fetchImpl: typeof fetch = fetch,
) {
  return postEditorApi<SavedDungeonSummary[]>(access, '/editor-dungeons/list', {}, fetchImpl)
}

export async function openEditorDungeon(
  access: EditorDungeonAccess,
  dungeonId: string,
  fetchImpl: typeof fetch = fetch,
) {
  return postEditorApi<ConsumedEditorDungeon>(
    access,
    '/editor-dungeons/open',
    { dungeonId },
    fetchImpl,
  )
}

export async function saveEditorDungeon(
  access: EditorDungeonAccess,
  input: {
    dungeonId?: string
    title: string
    description?: string
    serializedDungeon: string
  },
  fetchImpl: typeof fetch = fetch,
) {
  return postEditorApi<SavedDungeonSummary>(
    access,
    '/editor-dungeons/save',
    input,
    fetchImpl,
  )
}

export async function copyEditorDungeon(
  access: EditorDungeonAccess,
  dungeonId: string,
  fetchImpl: typeof fetch = fetch,
) {
  return postEditorApi<SavedDungeonSummary>(
    access,
    '/editor-dungeons/copy',
    { dungeonId },
    fetchImpl,
  )
}

export async function deleteEditorDungeon(
  access: EditorDungeonAccess,
  dungeonId: string,
  fetchImpl: typeof fetch = fetch,
) {
  return postEditorApi<{ dungeonId: string }>(
    access,
    '/editor-dungeons/delete',
    { dungeonId },
    fetchImpl,
  )
}
