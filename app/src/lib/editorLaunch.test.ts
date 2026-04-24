import { describe, expect, it } from 'vitest'
import { buildEditorLaunchUrl, resolveEditorBaseUrl } from './editorLaunch'

describe('editor launch helpers', () => {
  it('prefers a configured editor URL when present', () => {
    expect(resolveEditorBaseUrl({ hostname: 'localhost', protocol: 'http:' }, 'https://editor.example.com/app')).toBe(
      'https://editor.example.com/app',
    )
  })

  it('defaults localhost app launches to the local editor port', () => {
    expect(resolveEditorBaseUrl({ hostname: 'localhost', protocol: 'http:' })).toBe('http://localhost:5173/')
  })

  it('builds an editor launch URL with backend handoff parameters', () => {
    const url = buildEditorLaunchUrl({
      editorBaseUrl: 'https://demo.dungeonplanner.com/',
      backendUrl: 'http://127.0.0.1:3210',
      ticket: {
        dungeonId: 'dungeon-1',
        accessToken: 'token-123',
      },
    })

    expect(url).toContain('appDungeonId=dungeon-1')
    expect(url).toContain('appDungeonToken=token-123')
    expect(url).toContain('appBackendUrl=http%3A%2F%2F127.0.0.1%3A3210')
  })
})
