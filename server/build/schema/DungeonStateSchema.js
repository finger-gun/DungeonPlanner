var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Schema, type, MapSchema } from '@colyseus/schema';
export class Entity extends Schema {
    id = '';
    type = 'PLAYER';
    /** Grid cell X coordinate */
    cellX = 0;
    /** Grid cell Z coordinate */
    cellZ = 0;
    /** World-space X (derived from cellX, kept for smooth client lerp) */
    worldX = 0;
    /** World-space Z (derived from cellZ, kept for smooth client lerp) */
    worldZ = 0;
    movementRange = 10;
    /** Content pack asset ID for the token model/icon — optional */
    assetId = '';
    name = 'Token';
    /** DM-controlled: when false, entity is hidden from players */
    visibleToPlayers = true;
}
__decorate([
    type('string'),
    __metadata("design:type", String)
], Entity.prototype, "id", void 0);
__decorate([
    type('string'),
    __metadata("design:type", String)
], Entity.prototype, "type", void 0);
__decorate([
    type('number'),
    __metadata("design:type", Number)
], Entity.prototype, "cellX", void 0);
__decorate([
    type('number'),
    __metadata("design:type", Number)
], Entity.prototype, "cellZ", void 0);
__decorate([
    type('number'),
    __metadata("design:type", Number)
], Entity.prototype, "worldX", void 0);
__decorate([
    type('number'),
    __metadata("design:type", Number)
], Entity.prototype, "worldZ", void 0);
__decorate([
    type('number'),
    __metadata("design:type", Number)
], Entity.prototype, "movementRange", void 0);
__decorate([
    type('string'),
    __metadata("design:type", String)
], Entity.prototype, "assetId", void 0);
__decorate([
    type('string'),
    __metadata("design:type", String)
], Entity.prototype, "name", void 0);
__decorate([
    type('boolean'),
    __metadata("design:type", Boolean)
], Entity.prototype, "visibleToPlayers", void 0);
export class DungeonState extends Schema {
    /** Session ID of the DM — stored so server LoS logic can identify DM clients */
    dmSessionId = '';
    /** Map of entity ID → Entity */
    entities = new MapSchema();
    /**
     * Serialised dungeon map — the full DungeonFile JSON string.
     * Stored as a raw string so we don't need to mirror all map Schema types.
     * Clients parse this into their Zustand store on join/update.
     */
    mapJson = '';
    /** Which floor is currently active (mirrors DM's activeFloorId) */
    activeFloorId = '';
}
__decorate([
    type('string'),
    __metadata("design:type", String)
], DungeonState.prototype, "dmSessionId", void 0);
__decorate([
    type({ map: Entity }),
    __metadata("design:type", Object)
], DungeonState.prototype, "entities", void 0);
__decorate([
    type('string'),
    __metadata("design:type", String)
], DungeonState.prototype, "mapJson", void 0);
__decorate([
    type('string'),
    __metadata("design:type", String)
], DungeonState.prototype, "activeFloorId", void 0);
