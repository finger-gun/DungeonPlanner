# DungeonPlanner Documentation

DungeonPlanner is a browser-based 3D dungeon editor for tabletop RPG sessions.

This docs hub is organized by audience so you can get to what matters quickly.

---

## Choose your path

### Players

Read this if you mainly use maps during play and need quick orientation.

- [Player Guide](./players.md)

### Game Masters

Read this if you build encounters, prep maps, and run sessions.

- [Game Master Guide](./game-masters.md)

### Developers

Read this if you want to contribute or understand internals.

- [Developer Guide](./developers.md)

---

## Technical reference

When you need deeper internals, use these pages:

| Doc | What it covers |
|-----|---------------|
| [Architecture](./architecture.md) | Component tree, data flow, render loop |
| [State & Store](./store.md) | Zustand state, actions, undo/redo, floors |
| [Content Packs](./content-packs.md) | Asset definitions, metadata, registration |
| [Rendering](./rendering.md) | Grid shader, post-processing, floor transitions |
| [Editor UI](./ui.md) | Panels, controls, shortcuts |
| [File Format](./file-format.md) | Save/load schema, versioning, migrations |
