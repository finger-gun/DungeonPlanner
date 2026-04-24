import { buildEditorApiUrl } from '@dungeonplanner/shared/editorAccess'
import type { EditorActorRecord } from '@dungeonplanner/shared/actors'

type EditorActorAccess = {
  backendUrl: string
  accessToken: string
}

export async function listEditorActors(
  access: EditorActorAccess,
  fetchImpl: typeof fetch = fetch,
) {
  const response = await fetchImpl(buildEditorApiUrl(access.backendUrl, '/api/editor/actors/list'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accessToken: access.accessToken,
    }),
  })

  if (!response.ok) {
    throw new Error('Actor library request could not be completed.')
  }

  return (await response.json()) as EditorActorRecord[]
}
