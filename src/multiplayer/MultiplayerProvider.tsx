/**
 * MultiplayerProvider — connects to the Colyseus server, detects role, and
 * keeps the multiplayer store in sync.  Renders children regardless of
 * connection state so the app still works fully offline (role = 'offline').
 */
import { useEffect, useRef, type ReactNode } from 'react'
import { Client } from '@colyseus/sdk'
import type { Room } from '@colyseus/sdk'
import {
  useMultiplayerStore,
  entityToSnapshot,
  type ClientRole,
} from './useMultiplayerStore'
import type { DungeonState, Entity } from './colyseusTypes'
import { useDungeonStore } from '../store/useDungeonStore'

const COLYSEUS_ENDPOINT =
  import.meta.env.VITE_COLYSEUS_URL ??
  `ws://${window.location.hostname}:2567`

/** True when the page was loaded from the server itself (DM role) */
function isLocalhost(): boolean {
  const h = window.location.hostname
  return h === 'localhost' || h === '127.0.0.1' || h === '::1'
}

export function MultiplayerProvider({ children }: { children: ReactNode }) {
  const { setRole, setConnected, setRoom, setEntities, updateEntity, removeEntity } =
    useMultiplayerStore.getState()

  const roomRef = useRef<Room<DungeonState> | null>(null)

  useEffect(() => {
    // In offline/dev mode (no server), stay offline
    if (import.meta.env.VITE_OFFLINE === 'true') return

    const client = new Client(COLYSEUS_ENDPOINT)

    async function connect() {
      try {
        const room = await client.joinOrCreate<DungeonState>('dungeon')
        roomRef.current = room

        const role: ClientRole = isLocalhost() ? 'dm' : 'player'
        setRole(role)
        setConnected(true)
        setRoom(room, room.sessionId)

        // ── Entity listeners — deferred until first state patch ───────────
        // The Colyseus client SDK receives room.state asynchronously via a
        // binary patch AFTER joinOrCreate resolves.  Until that first patch
        // arrives, room.state is a plain empty object and room.state.entities
        // is undefined.  We use onStateChange.once to defer wiring up
        // onAdd/onRemove until the MapSchema is actually present.
        function attachEntityListeners(state: DungeonState) {
          const entities = (state as any).entities
          if (!entities?.onAdd) return   // schema not yet a MapSchema — skip

          // Snapshot any entities that already exist in the initial state
          const snapshot: Record<string, ReturnType<typeof entityToSnapshot>> = {}
          entities.forEach((e: Entity, id: string) => {
            snapshot[id] = entityToSnapshot(e)
          })
          setEntities(snapshot)

          entities.onAdd((entity: any, id: string) => {
            updateEntity(id, entityToSnapshot(entity as Entity))
            entity.listen('worldX', (v: number) => updateEntity(id, { worldX: v }))
            entity.listen('worldZ', (v: number) => updateEntity(id, { worldZ: v }))
            entity.listen('cellX',  (v: number) => updateEntity(id, { cellX: v }))
            entity.listen('cellZ',  (v: number) => updateEntity(id, { cellZ: v }))
            entity.listen('name',   (v: string) => updateEntity(id, { name: v }))
            entity.listen('visibleToPlayers', (v: boolean) => updateEntity(id, { visibleToPlayers: v }))
            entity.listen('movementRange', (v: number) => updateEntity(id, { movementRange: v }))
          })

          entities.onRemove((_entity: any, id: string) => {
            removeEntity(id)
          })
        }

        // If state is already hydrated (reconnect / fast server), wire up now.
        // Otherwise wait for the first state patch.
        if ((room.state as any)?.entities?.onAdd) {
          attachEntityListeners(room.state)
        } else {
          room.onStateChange.once((state: DungeonState) => attachEntityListeners(state))
        }

        // ── Map sync (full state from DM) ────────────────────────────────
        room.onMessage<string>('mapSync', (json: string) => {
          const ok = useDungeonStore.getState().loadDungeon(json)
          if (!ok) console.warn('[MultiplayerProvider] mapSync: failed to load dungeon JSON')
        })

        // ── LoS update (server tells players which NPCs are visible) ─────
        room.onMessage<{ visibleNpcIds: string[] }>('losUpdate', ({ visibleNpcIds }) => {
          const visible = new Set(visibleNpcIds)
          const { entities, updateEntity } = useMultiplayerStore.getState()
          for (const [id, entity] of Object.entries(entities)) {
            if (entity.type === 'NPC') {
              const shouldBeVisible = visible.has(id)
              if (entity.visibleToPlayers !== shouldBeVisible) {
                updateEntity(id, { visibleToPlayers: shouldBeVisible })
              }
            }
          }
        })

        room.onError((code: number, message?: string) => {
          console.error('[MultiplayerProvider] room error', code, message)
          setConnected(false)
        })

        room.onLeave(() => {
          setConnected(false)
          setRole('offline')
          setRoom(null, null)
        })
      } catch (err) {
        // Server not running — stay in offline mode, no error shown to user
        console.info('[MultiplayerProvider] Server not reachable, running offline.', err)
        setRole('offline')
      }
    }

    connect()

    return () => {
      roomRef.current?.leave()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
