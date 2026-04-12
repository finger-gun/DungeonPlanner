/**
 * useDungeonSync — subscribes to dungeon store changes and, when the local
 * client is the DM, broadcasts map updates to the Colyseus room.
 *
 * Players don't broadcast — their store is hydrated via 'mapSync' messages
 * from the server (see MultiplayerProvider).
 */
import { useEffect, useRef } from 'react'
import { useMultiplayerStore, useIsDM } from './useMultiplayerStore'
import { useDungeonStore } from '../store/useDungeonStore'
import { serializeDungeon } from '../store/serialization'

const SYNC_DEBOUNCE_MS = 150

function sendMapNow(room: ReturnType<typeof useMultiplayerStore.getState>['room']) {
  if (!room) return
  try {
    const json = serializeDungeon(useDungeonStore.getState())
    room.send('mapUpdate', json)
  } catch (err) {
    console.error('[useDungeonSync] failed to serialize map', err)
  }
}

export function useDungeonSync() {
  const isDM = useIsDM()
  const room = useMultiplayerStore((s) => s.room)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initial sync: push current dungeon to server as soon as the DM's room
  // is established.  Without this, the server's mapJson stays null until the
  // DM makes the first edit, so joining players see an empty dungeon.
  useEffect(() => {
    if (!isDM || !room) return
    sendMapNow(room)
  }, [isDM, room])

  useEffect(() => {
    if (!isDM) return

    const unsubscribe = useDungeonStore.subscribe(() => {
      const currentRoom = useMultiplayerStore.getState().room
      if (!currentRoom) return

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => sendMapNow(currentRoom), SYNC_DEBOUNCE_MS)
    })

    return () => {
      unsubscribe()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [isDM])
}
