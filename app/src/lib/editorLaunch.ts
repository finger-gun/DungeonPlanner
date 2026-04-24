export type EditorLaunchTicket = {
  dungeonId: string
  accessToken: string
}

type BrowserLocationLike = Pick<Location, 'hostname' | 'protocol'>

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
  ticket,
}: {
  editorBaseUrl: string
  backendUrl?: string
  ticket?: EditorLaunchTicket
}) {
  const url = new URL(editorBaseUrl)

  if (backendUrl && ticket) {
    url.searchParams.set('appDungeonId', ticket.dungeonId)
    url.searchParams.set('appDungeonToken', ticket.accessToken)
    url.searchParams.set('appBackendUrl', backendUrl)
  }

  return url.toString()
}
