import { Schema, type, MapSchema } from '@colyseus/schema'

export class Entity extends Schema {
  @type('string') id: string = ''
  @type('string') type: 'PLAYER' | 'NPC' = 'PLAYER'
  /** Grid cell X coordinate */
  @type('number') cellX: number = 0
  /** Grid cell Z coordinate */
  @type('number') cellZ: number = 0
  /** World-space X (derived from cellX, kept for smooth client lerp) */
  @type('number') worldX: number = 0
  /** World-space Z (derived from cellZ, kept for smooth client lerp) */
  @type('number') worldZ: number = 0
  @type('number') movementRange: number = 10
  /** Content pack asset ID for the token model/icon — optional */
  @type('string') assetId: string = ''
  @type('string') name: string = 'Token'
  /** DM-controlled: when false, entity is hidden from players */
  @type('boolean') visibleToPlayers: boolean = true
}

export class DungeonState extends Schema {
  /** Session ID of the DM — stored so server LoS logic can identify DM clients */
  @type('string') dmSessionId: string = ''

  /** Map of entity ID → Entity */
  @type({ map: Entity }) entities = new MapSchema<Entity>()

  /**
   * Serialised dungeon map — the full DungeonFile JSON string.
   * Stored as a raw string so we don't need to mirror all map Schema types.
   * Clients parse this into their Zustand store on join/update.
   */
  @type('string') mapJson: string = ''

  /** Which floor is currently active (mirrors DM's activeFloorId) */
  @type('string') activeFloorId: string = ''
}
