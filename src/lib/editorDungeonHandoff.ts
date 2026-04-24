export type EditorDungeonHandoff = {
  dungeonId: string
  accessToken: string
  backendUrl: string
}

export type ConsumedEditorDungeon = {
  _id: string
  title: string
  description: string | null
  serializedDungeon: string
  createdAt: number
  updatedAt: number
}

export function parseEditorDungeonHandoff(search: string): EditorDungeonHandoff | null {
  const params = new URLSearchParams(search)
  const dungeonId = params.get('appDungeonId')
  const accessToken = params.get('appDungeonToken')
  const backendUrl = params.get('appBackendUrl')

  if (!dungeonId || !accessToken || !backendUrl) {
    return null
  }

  return {
    dungeonId,
    accessToken,
    backendUrl,
  }
}

export function buildEditorDungeonConsumeUrl(backendUrl: string) {
  return new URL('/editor-dungeon/consume', backendUrl).toString()
}

export function stripEditorDungeonHandoff(search: string) {
  const params = new URLSearchParams(search)
  params.delete('appDungeonId')
  params.delete('appDungeonToken')
  params.delete('appBackendUrl')
  const next = params.toString()
  return next ? `?${next}` : ''
}

export async function consumeEditorDungeonHandoff(
  handoff: EditorDungeonHandoff,
  fetchImpl: typeof fetch = fetch,
) {
  const response = await fetchImpl(buildEditorDungeonConsumeUrl(handoff.backendUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dungeonId: handoff.dungeonId,
      accessToken: handoff.accessToken,
    }),
  })

  if (!response.ok) {
    throw new Error('Dungeon handoff could not be completed.')
  }

  return (await response.json()) as ConsumedEditorDungeon
}
