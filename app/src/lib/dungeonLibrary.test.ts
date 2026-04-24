import { describe, expect, it } from 'vitest'
import { getDungeonSyncState, inferDungeonTitle, isPortableDungeonPayload } from './dungeonLibrary'

describe('dungeon library helpers', () => {
  it('detects a synced local draft', () => {
    const draft = {
      title: 'Catacombs',
      description: 'Lower crypt',
      serializedDungeon: '{"version":1,"name":"Catacombs","rooms":[]}',
    }

    expect(
      getDungeonSyncState(draft, {
        id: 'd1',
        ...draft,
      }),
    ).toEqual({
      tone: 'success',
      label: 'Saved',
      detail: 'The local draft matches the latest durable record in Convex.',
    })
  })

  it('marks a divergent draft as unsaved changes', () => {
    expect(
      getDungeonSyncState(
        {
          title: 'Catacombs',
          description: 'v2',
          serializedDungeon: '{"version":1,"name":"Catacombs","rooms":[{"id":"r1"}]}',
        },
        {
          id: 'd1',
          title: 'Catacombs',
          description: 'v1',
          serializedDungeon: '{"version":1,"name":"Catacombs","rooms":[]}',
        },
      ),
    ).toMatchObject({
      tone: 'warning',
      label: 'Unsaved changes',
    })
  })

  it('infers a title from the portable payload name', () => {
    expect(inferDungeonTitle('{"version":1,"name":"Sunken Keep","floors":{}}')).toBe('Sunken Keep')
  })

  it('validates the portable payload shape broadly', () => {
    expect(isPortableDungeonPayload('{"version":1,"rooms":[]}')).toBe(true)
    expect(isPortableDungeonPayload('{"foo":"bar"}')).toBe(false)
  })
})
