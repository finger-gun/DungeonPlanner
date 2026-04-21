import { Room, Client } from 'colyseus'
import { DungeonState, Entity } from '../schema/DungeonStateSchema.js'
import { GRID_SIZE } from '../utils/grid.js'

type ClientRole = 'dm' | 'player'
type MoveRequest  = { entityId: string; targetCell: [number, number] }
type ForceMove    = { entityId: string; targetCell: [number, number] }
type PlaceToken   = { id: string; type: 'PLAYER' | 'NPC'; cellX: number; cellZ: number; name: string; assetId: string }
type RemoveToken  = { entityId: string }
type ToggleVisible = { entityId: string; visible: boolean }

export class DungeonRoom extends Room {
  maxClients = 16

  // Track which sessionId has the DM role
  private dmSessionId: string | null = null

  // Typed accessor for the room state
  private get ds(): DungeonState {
    return this.state as DungeonState
  }

  onCreate(_options: unknown) {
    this.setState(new DungeonState())
    this.setPatchRate(50) // 20 patches/sec

    // ── Map sync ──────────────────────────────────────────────────────────────
    // DM sends the full map JSON; server stores it and re-broadcasts to all
    this.onMessage<string>('uploadMap', (client, json) => {
      if (!this.isDM(client)) return
      try {
        JSON.parse(json) // validate it's parseable
        this.ds.mapJson = json
        // Broadcast to players (not back to DM who sent it)
        this.broadcast('mapSync', json, { except: client })
      } catch {
        client.send('error', 'Invalid dungeon JSON')
      }
    })

    // DM pushes incremental map change — server re-broadcasts as full state
    // (simple v1 approach: full re-sync on every DM edit)
    this.onMessage<string>('mapUpdate', (client, json) => {
      if (!this.isDM(client)) return
      this.ds.mapJson = json
      this.broadcast('mapSync', json, { except: client })
    })

    // ── Entity / token management (DM only) ──────────────────────────────────
    this.onMessage<PlaceToken>('placeToken', (client, msg) => {
      if (!this.isDM(client)) return
      const entity = new Entity()
      entity.id              = msg.id
      entity.type            = msg.type
      entity.cellX           = msg.cellX
      entity.cellZ           = msg.cellZ
      entity.worldX          = (msg.cellX + 0.5) * GRID_SIZE
      entity.worldZ          = (msg.cellZ + 0.5) * GRID_SIZE
      entity.name            = msg.name
      entity.assetId         = msg.assetId
      entity.visibleToPlayers = true
      this.ds.entities.set(entity.id, entity)
    })

    this.onMessage<RemoveToken>('removeToken', (client, msg) => {
      if (!this.isDM(client)) return
      this.ds.entities.delete(msg.entityId)
    })

    this.onMessage<ToggleVisible>('toggleVisible', (client, msg) => {
      if (!this.isDM(client)) return
      const entity = this.ds.entities.get(msg.entityId)
      if (entity) entity.visibleToPlayers = msg.visible
    })

    // ── Movement ─────────────────────────────────────────────────────────────
    this.onMessage<MoveRequest>('requestMove', (client, msg) => {
      const entity = this.ds.entities.get(msg.entityId)
      if (!entity) return
      if (entity.type === 'NPC' && !this.isDM(client)) return // players can't move NPCs

      const wallGrid = this.getWallGrid()
      const path = this.bfsPath(
        [entity.cellX, entity.cellZ],
        msg.targetCell,
        wallGrid,
      )
      if (path === null || path > entity.movementRange) {
        client.send('moveDenied', { entityId: msg.entityId, reason: 'out_of_range' })
        return
      }

      this.applyMove(entity, msg.targetCell)
      this.broadcastLoSFilter()
    })

    this.onMessage<ForceMove>('forceMoveEntity', (client, msg) => {
      if (!this.isDM(client)) return
      const entity = this.ds.entities.get(msg.entityId)
      if (!entity) return
      this.applyMove(entity, msg.targetCell)
      this.broadcastLoSFilter()
    })

    // DM can update entity properties (name, movementRange, etc.)
    this.onMessage<{ entityId: string; patch: Partial<{ name: string; movementRange: number; type: 'PLAYER' | 'NPC' }> }>(
      'patchEntity', (client, msg) => {
        if (!this.isDM(client)) return
        const entity = this.ds.entities.get(msg.entityId)
        if (!entity) return
        if (msg.patch.name        !== undefined) entity.name          = msg.patch.name
        if (msg.patch.movementRange !== undefined) entity.movementRange = msg.patch.movementRange
        if (msg.patch.type        !== undefined) entity.type          = msg.patch.type
      },
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAuth(client: Client, _options: unknown, context: any) {
    const ip: string = context?.socket?.remoteAddress ?? context?.request?.socket?.remoteAddress ?? ''
    const role: ClientRole =
      ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'
        ? 'dm'
        : 'player'

    // First DM wins; subsequent localhost connections are still DM (e.g. multiple windows)
    if (role === 'dm' && this.dmSessionId === null) {
      this.dmSessionId = client.sessionId
      this.ds.dmSessionId = client.sessionId
    }

    return { role }
  }

  onJoin(client: Client, _options: unknown, auth: { role: ClientRole }) {
    console.log(`[DungeonRoom] ${auth.role} joined: ${client.sessionId}`)

    // Send current map state to the joining client
    if (this.ds.mapJson) {
      client.send('mapSync', this.ds.mapJson)
    }
  }

  onLeave(client: Client) {
    console.log(`[DungeonRoom] client left: ${client.sessionId}`)
    if (client.sessionId === this.dmSessionId) {
      // DM disconnected — find next localhost client or null
      this.dmSessionId = null
    }
  }

  onDispose() {
    console.log('[DungeonRoom] room disposed')
  }

  /**
   * Send per-client LoS visibility snapshots after entity moves.
   * Tells each player client which NPC IDs are currently visible to them,
   * so they can hide tokens that exit their LoS.
   */
  private broadcastLoSFilter() {
    const LOS_RADIUS = 10
    const players = Array.from(this.ds.entities.values()).filter(
      (e) => e.type === 'PLAYER',
    )

    // Build visible NPC set (any PLAYER within LOS_RADIUS)
    const visibleNpcIds = new Set<string>()
    for (const [id, entity] of this.ds.entities) {
      if (entity.type !== 'NPC' || !entity.visibleToPlayers) continue
      for (const player of players) {
        const dx = player.cellX - entity.cellX
        const dz = player.cellZ - entity.cellZ
        if (dx * dx + dz * dz <= LOS_RADIUS * LOS_RADIUS) {
          visibleNpcIds.add(id)
          break
        }
      }
    }

    // Broadcast visible NPC list to all non-DM clients
    for (const client of this.clients) {
      if (this.isDM(client)) continue
      client.send('losUpdate', { visibleNpcIds: Array.from(visibleNpcIds) })
    }
  }

  private isDM(client: Client): boolean {
    return client.sessionId === this.dmSessionId
  }

  private applyMove(entity: Entity, targetCell: [number, number]) {
    entity.cellX  = targetCell[0]
    entity.cellZ  = targetCell[1]
    entity.worldX = (targetCell[0] + 0.5) * GRID_SIZE
    entity.worldZ = (targetCell[1] + 0.5) * GRID_SIZE
  }

  /**
   * Build a Set of wall-blocked cells from the current mapJson.
   * A cell is "solid" if it is NOT in paintedCells of the active floor.
   * Returns a function (x, z) => boolean (true = blocked).
   */
  private getWallGrid(): (x: number, z: number) => boolean {
    try {
      const file = JSON.parse(this.ds.mapJson) as {
        floors: Array<{ id: string; cells: Array<{ x: number; z: number }> }>
        activeFloorId: string
      }
      const activeFloor = file.floors.find((f) => f.id === file.activeFloorId)
      if (!activeFloor) return () => true // no data = everything blocked

      const painted = new Set(activeFloor.cells.map((c) => `${c.x}:${c.z}`))
      return (x: number, z: number) => !painted.has(`${x}:${z}`)
    } catch {
      return () => false // parse error = nothing blocked
    }
  }

  /**
   * BFS to find the shortest walkable path between two grid cells.
   * Returns path length (in cells) or null if no path exists.
   */
  private bfsPath(
    from: [number, number],
    to: [number, number],
    isBlocked: (x: number, z: number) => boolean,
  ): number | null {
    if (from[0] === to[0] && from[1] === to[1]) return 0
    if (isBlocked(to[0], to[1])) return null

    const visited = new Set<string>()
    const queue: Array<{ pos: [number, number]; dist: number }> = [{ pos: from, dist: 0 }]
    visited.add(`${from[0]}:${from[1]}`)

    while (queue.length > 0) {
      const { pos, dist } = queue.shift()!
      for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = pos[0] + dx
        const nz = pos[1] + dz
        const key = `${nx}:${nz}`
        if (visited.has(key)) continue
        if (isBlocked(nx, nz)) continue
        if (nx === to[0] && nz === to[1]) return dist + 1
        visited.add(key)
        queue.push({ pos: [nx, nz], dist: dist + 1 })
      }
    }

    return null // no path found
  }
}
