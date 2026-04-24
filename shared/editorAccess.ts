export type SavedDungeonSummary = {
  _id: string
  title: string
  description: string | null
  createdAt: number
  updatedAt: number
}

export type SavedDungeonRecord = SavedDungeonSummary & {
  serializedDungeon: string
}

export type EditorLaunchSession = {
  backendUrl: string
  accessToken: string
  dungeonId: string | null
}

type BrowserLocationLike = Pick<Location, 'hostname' | 'protocol'>

const APP_BACKEND_URL_QUERY_KEY = 'appBackendUrl'
const APP_EDITOR_TOKEN_QUERY_KEY = 'appEditorToken'
const APP_DUNGEON_ID_QUERY_KEY = 'appDungeonId'

export function resolveEditorBaseUrl(
  browserLocation: BrowserLocationLike,
  configuredEditorUrl?: string,
) {
  if (configuredEditorUrl) {
    return configuredEditorUrl
  }

  if (browserLocation.hostname === 'localhost' || browserLocation.hostname === '127.0.0.1') {
    return `${browserLocation.protocol}//${browserLocation.hostname}:5173/`
  }

  return 'https://demo.dungeonplanner.com/'
}

export function buildEditorLaunchUrl({
  editorBaseUrl,
  backendUrl,
  accessToken,
  dungeonId,
}: {
  editorBaseUrl: string
  backendUrl?: string
  accessToken?: string
  dungeonId?: string
}) {
  const url = new URL(editorBaseUrl)

  if (backendUrl && accessToken) {
    url.searchParams.set(APP_BACKEND_URL_QUERY_KEY, backendUrl)
    url.searchParams.set(APP_EDITOR_TOKEN_QUERY_KEY, accessToken)

    if (dungeonId) {
      url.searchParams.set(APP_DUNGEON_ID_QUERY_KEY, dungeonId)
    }
  }

  return url.toString()
}

export function parseEditorLaunchSession(search: string): EditorLaunchSession | null {
  const params = new URLSearchParams(search)
  const backendUrl = params.get(APP_BACKEND_URL_QUERY_KEY)
  const accessToken = params.get(APP_EDITOR_TOKEN_QUERY_KEY)
  const dungeonId = params.get(APP_DUNGEON_ID_QUERY_KEY)

  if (!backendUrl || !accessToken) {
    return null
  }

  return {
    backendUrl,
    accessToken,
    dungeonId,
  }
}

export function stripEditorLaunchSession(search: string) {
  const params = new URLSearchParams(search)
  params.delete(APP_BACKEND_URL_QUERY_KEY)
  params.delete(APP_EDITOR_TOKEN_QUERY_KEY)
  params.delete(APP_DUNGEON_ID_QUERY_KEY)
  const next = params.toString()
  return next ? `?${next}` : ''
}

export function buildEditorApiUrl(backendUrl: string, path: string) {
  return new URL(path, backendUrl).toString()
}
