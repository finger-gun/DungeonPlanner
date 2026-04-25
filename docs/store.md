# State & Store

All dungeon data lives in a single Zustand store defined in `editor/src/store/useDungeonStore.ts`. This page walks through the structure, the most important actions, and the subtler systems like undo/redo and floor management.

---

## Snapshot shape

A `DungeonSnapshot` captures the full state of one floor at one point in time:

```ts
type DungeonSnapshot = {
  paintedCells:    Record<string, PaintedCellRecord>
  placedObjects:   Record<string, DungeonObjectRecord>
  wallOpenings:    Record<string, OpeningRecord>
  occupancy:       Record<string, string>   // cellKey → objectId
  tool:            DungeonTool
  selectedAssetIds: Record<ContentPackCategory, string | null>
  selection:       string | null
  layers:          Record<string, Layer>
  layerOrder:      string[]
  activeLayerId:   string
  rooms:           Record<string, Room>
  nextRoomNumber:  number
}
```

The top-level store extends this snapshot with extra fields that aren't part of the dungeon data itself (camera settings, FPS limit, post-processing config, floor records).

---

## Core data types

### PaintedCellRecord

Every floor cell that has been painted:

```ts
type PaintedCellRecord = {
  cell:    [x, z]      // grid coordinates
  layerId: string      // which layer this cell is on
  roomId:  string | null   // optional room assignment
}
```

Cells are keyed by `"x:z"` string in `paintedCells`. The same format is used everywhere in the system (wall keys, occupancy, etc.).

### DungeonObjectRecord

A placed prop (torch, pillar, staircase, etc.):

```ts
type DungeonObjectRecord = {
  id:       string
  type:     'prop'
  assetId:  string | null       // e.g. "core.props_wall_torch"
  position: [x, y, z]
  rotation: [x, y, z]
  props:    Record<string, unknown>   // reserved for future per-instance config
  cell:     [x, z]
  cellKey:  string
  layerId:  string
}
```

### OpeningRecord

A wall opening (door, archway, etc.) anchored to a wall segment:

```ts
type OpeningRecord = {
  id:      string
  assetId: string | null
  wallKey: string     // "x:z:direction" — the center wall segment
  width:   1 | 2 | 3  // how many wall segments it spans
  flipped: boolean    // 180° rotation (front/back swap for directional doors)
  layerId: string
}
```

### Room

A named region that can override the global floor/wall asset:

```ts
type Room = {
  id:           string
  name:         string
  layerId:      string
  floorAssetId: string | null   // null = inherit global
  wallAssetId:  string | null   // null = inherit global
}
```

---

## Undo / redo

Undo/redo is snapshot-based. Every action that mutates dungeon state calls an internal `pushHistory(state)` helper before making the change. This helper:

1. Clones the current snapshot with `cloneSnapshot()`
2. Appends it to `state.history`
3. Clears `state.future`

`undo()` pops the last entry from `history`, pushes the current state to `future`, and restores the popped snapshot.

Importantly, undo/redo is **per floor** — each `FloorRecord` has its own `history` and `future` arrays. When you switch floors, the active floor's history/future is saved into its `FloorRecord`.

The store uses Zustand's `persist` middleware to save to `localStorage`, but `history` and `future` are excluded from persistence via the `partialize` option — they would be enormous and are not useful across sessions.

---

## Floor management

### FloorRecord

```ts
type FloorRecord = {
  id:       string
  name:     string
  level:    number     // integer — 0=ground, 1=first floor, -1=basement, etc.
  snapshot: DungeonSnapshot
  history:  DungeonSnapshot[]
  future:   DungeonSnapshot[]
}
```

`floors` is a `Record<string, FloorRecord>` and `floorOrder` is a `string[]` of IDs in display order.

### switchFloor(id)

This is the core floor-switching action. It:
1. Clones the **current** working state into `floors[activeFloorId].snapshot`
2. Copies `floors[id].snapshot` into all the top-level store slices
3. Updates `activeFloorId`

Everything else — canvas subscriptions, UI panels, serialization — just reads from those top-level slices and doesn't need to know about floors at all.

### ensureAdjacentFloor(targetLevel, cell, opposingAssetId, position, rotation)

Called automatically when you place a StaircaseDown or StaircaseUp. It finds or creates a floor at `targetLevel` and places the matching staircase in the mirror cell on that floor. Three cases:

1. **Floor at targetLevel already exists and is active** — just place the opposing staircase in the current working state
2. **Floor at targetLevel already exists but is inactive** — load its snapshot, place the staircase, save back
3. **No floor at targetLevel** — create a new floor, place the staircase in its snapshot

---

## Opening wall segments

`getOpeningSegments(wallKey, width)` is exported from the store and used in `DungeonRoom` to suppress the wall tiles covered by an opening. For a 3-wide opening centred at `"4:2:north"`, it returns the three wall segment keys `["3:2:north", "4:2:north", "5:2:north"]`.

Wall suppression accounts for both sides: the suppressed key AND its mirror (the same physical wall as seen from the neighbouring cell), because the canonical wall renderer might be on either side.

---

## Layers

Layers are simple visibility + lock toggles. Every painted cell, placed object, and opening carries a `layerId`. When a layer's `visible` flag is `false`, those objects are filtered out in both the canvas (never rendered) and the UI (not shown in the scene tree).

There is always at least one layer and always an active layer. When you create a new object, it automatically goes on the active layer.

---

## Occupancy

`occupancy` is a `Record<cellKey, objectId>` that tracks which cell is occupied by which prop. It prevents placing two props in the same cell. It is maintained automatically by `placeObject` and `removeObject`.

---

## Camera and rendering settings (non-dungeon state)

These live in the store for convenience but are not part of the dungeon snapshot:

| Field | Type | Purpose |
|-------|------|---------|
| `cameraMode` | `'orbit'` | Currently only orbit mode exists |
| `activeCameraMode` | `'perspective' \| 'isometric' \| 'top-down'` | Current camera preset |
| `sceneLighting.intensity` | `number` | Global light multiplier (0–2) |
| `postProcessing` | object | Tilt-shift enabled + focus/focal/bokeh settings |
| `showGrid` | `boolean` | Grid overlay visibility |
| `fpsLimit` | `0 \| 30 \| 60 \| 120` | `0` = uncapped |
| `dungeonName` | `string` | Used as the JSON filename on export |

---

## Persistence

The store uses Zustand's `persist` middleware with `localStorage` as the backend. The `partialize` function controls what's included — undo history and future stacks are explicitly excluded to avoid bloating localStorage.

On load, the persisted state is merged with the default initial state, so missing keys (from older versions) always get sensible defaults.
