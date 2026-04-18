# Editor UI

A walkthrough of every UI panel, tool, and keyboard shortcut. If you just want to know what a button does, this is the page to read.

---


## UI principles
The editor UI is designed around a few core principles:

- **Discoverable by default**. Common actions should be visible without hunting through menus. Tools, object categories, and scene structure should be readable at a glance, and the current tool should explain itself through labels, hover states, previews, and shortcut hints.
- **Fast for repeated work**. Building a dungeon is an iterative process, so the interface should minimize friction for high-frequency actions like painting cells, placing props, switching floors, and undoing mistakes. Primary actions should take one or two interactions, not a long setup flow.
- **Predictable and safe**. The editor should avoid surprising the user. Destructive actions need confirmation or obvious affordances, tool behavior should stay consistent, and visual feedback should make it clear what will happen before the user clicks.
- **Readable over decorative**. The viewport and side panels exist to help users understand the scene quickly. Important state such as the active floor, selected object, locked layer, or invalid placement should be immediately legible without visual clutter.
- **Context where it is needed**. Controls should appear close to the part of the workflow they affect. Scene structure belongs in the scene panel, tool-specific settings belong in the tool panel, and placement feedback belongs directly in the viewport.
- **Support both new and experienced users**. New users should be able to learn the interface by exploring it, while experienced users should be able to move quickly with keyboard shortcuts, persistent panel structure, and consistent interaction rules.

In practice, this means the UI should help users answer three questions at all times: what tool is active, what object or floor they are working on, and what action will happen next if they click or drag.

## Overall layout

```
┌──────┬──────────────────────────────────┬──────────────┐
│ Tool │                                  │ Scene panel  │
│ bar  │       3D Viewport                │ (floor list, │
│      │                                  │  room tree)  │
│      │                                  ├──────────────┤
│      │                                  │ Tool panel   │
│      │                                  │ (tool-       │
│      │                                  │  specific)   │
│      │                                  ├──────────────┤
│      │                                  │ Layers       │
└──────┴──────────────────────────────────┴──────────────┘
```

The viewport fills the majority of the screen. The narrow icon bar is on the left. A fixed-width panel is on the right, split into three sections: the scene graph at the top, the active tool's settings in the middle, and layers at the bottom.

A small hint overlay in the viewport's top-left corner tells you the keyboard shortcuts for the current tool. A cell/prop counter sits in the bottom-left.

---

## Toolbar (left strip)

The toolbar has two sections: tools at the top and file operations at the bottom.

### Tools

| Icon | Tool | Shortcut hint |
|------|------|---------------|
| Play | **Start** | Starts the player experience |
| Cursor | **Select** | Click props/openings to inspect or delete |
| Blocks | **Room** | Paint/erase edit rooms |
| People | **Characters** | Create, edit characters and NPCs | 
| Box | **Prop** | Place and inspect props |
| Door | **Opening** | Place wall openings (doors, archways, stairs) |

Clicking a tool icon activates it. The active tool is highlighted in amber.

### File menu (folder icon)

A small pop-up with three actions:
- **New Dungeon** — clears everything. Click once to arm, click again to confirm (prevents accidental wipes)
- **Save Dungeon** — downloads a `.dungeon.json` file
- **Load Dungeon** — opens a file picker and loads a `.dungeon.json` or `.json` file

### Settings
General settings that affects the application as a whole such as:
- FPS cap
- Grid visibility
- Light rig
- Camera and focus

### Undo / Redo

At the very bottom of the toolbar. Greyed out when unavailable. Maps to the current floor's undo stack — each floor has independent undo history.

**Keyboard shortcuts:** `Cmd/Ctrl + Z` to undo, `Cmd/Ctrl + Shift + Z` or `Cmd/Ctrl + Y` to redo.

---

## Start tool

The Start tool switches the editor into the player-facing view of the dungeon. Use it when you want to preview how the scene reads during play instead of continuing to build.

### What Start mode changes

- The viewport focuses on the active floor instead of the broader editing overview.
- Visibility is driven by placed player characters. Cells in line of sight stay fully visible, previously seen cells remain explored, and unknown space is hidden.
- The tool-specific editing panel is cleared so the screen stays focused on presentation rather than placement controls.

This mode is meant for checking readability, sight lines, lighting, and room-to-room flow from a player perspective. To resume editing, switch back to any build tool.

---

## Select tool

In the Select tool, clicking any placed prop, character, or opening selects it and shows an inspector in the right panel with position, rotation, cell, and context actions.

### What you can inspect

- **Props** show their asset name, transform, and a **Delete** button.
- **Characters** show the same placement data, and generated characters also expose an **Edit** action to reopen their character sheet.
- **Openings** show their opening type and wall placement details.

**Delete** or **Backspace** removes the selected object from anywhere (any tool).

**Escape** clears the current selection.

When post-processing is enabled, selected objects get a depth-edge outline in the viewport. When post-processing is off, a red inverted-hull outline is used instead.

---

## Room tool

**Left-drag** to paint cells. **Right-drag** to erase cells.

You can hold the button and sweep across many cells in one stroke — they're all committed as a single undoable action when you release.

New cells automatically go on the active layer. If the active layer is locked, painting is blocked.

When you paint cells, each tile rises from below with a staggered wave animation — tiles closest to where you released the drag animate first, creating a ripple effect.

### Surface modes

The Room tool also controls the surface brush used for dungeon structure:

- **Rooms** paints and erases room cells.
- **Floor** applies floor variants to existing painted cells.
- **Walls** applies wall variants to room boundaries.

When you switch to Floor or Walls mode, the right panel changes from a simple room brush to an asset catalogue for that surface type.

---

## Characters tool

The Characters tool is for building and placing player characters or NPC standees in the dungeon.

### Character library

The right panel is split into two main sources:

- **Created Characters** are your generated or custom characters.
- **Core Characters** are built-in standees from the default content pack.

The **Create New Character** card opens a blank character sheet. Draft characters stay editable until they have a generated standee image, at which point they can be armed for placement like any other character.

### Placing characters

Click a ready character in the library to arm it, then **click a floor cell** in the viewport to place it.

Placed characters use the same direct-placement flow as props:

- **Click** to place on a valid cell
- **Right-click** a placed character to remove it quickly
- **R** rotates the selected character

### Editing generated characters

Generated characters can be reopened from the library or from the selected-character card in the right panel. The character sheet is where you edit the prompt, preview the standee image, regenerate art, and prepare the character for placement.

---

## Prop tool

Select a prop type from the panel on the right, then **click a floor cell** to place it. **Right-click** a placed prop to remove it instantly.

In the Prop tool, **Alt + click** a placed prop to select it and see its position/rotation/cell in the inspector below the prop list.

### Placing connective props

Props with `connectsTo: 'WALL'` snap to wall segments. The placement system finds the nearest wall segment to your cursor and places the prop there. The staircase props are a special case — placing a StairCaseDown automatically creates (or connects to) the floor below, and places a matching StairCaseUp on that floor.

### Rotating props

Press **R** while placing to cycle through 90° rotation increments. Already-placed props can be rotated the same way if selected.

---

## Opening tool

Select an opening type (small door, wide archway, etc.) from the right panel, then click a wall segment to place it.

The cursor highlights the nearest valid wall segment as you hover. A **preview** of the full model is shown while you hover — if the placement would be invalid (no wall at that position), the preview shows with a **red tint** instead of a red dummy box.

**Right-click** to remove a placed opening.

### Wall connection

When an opening is placed on a wall that is shared between two rooms, both copies of the wall (one from each room's perspective) are suppressed. Without this, a second wall would clip through the opening model.

### Flipping

Doors have a front and a back. Press **R** while hovering a wall-connected opening to flip it 180°. The flip is stored in `OpeningRecord.flipped` and is saved/loaded correctly.

---

## Viewport navigation

Camera movement is available while working in the editor, and the Settings button is where viewport presentation controls live. Use these controls to inspect the dungeon without changing its contents.

### Mouse controls

- **Left-drag** — orbit (rotate the camera around its target)
- **Right-drag** — pan
- **Scroll wheel** — zoom in/out
- **Middle-drag** — pan (alternative)

### Keyboard controls (work in all tools)

| Key | Action |
|-----|--------|
| W / ↑ | Pan forward |
| S / ↓ | Pan back |
| A / ← | Pan left |
| D / → | Pan right |
| Q | Rotate left (perspective only) |
| E | Rotate right (perspective only) |

Keyboard controls are relative to the camera's current facing direction, so "forward" means toward wherever you're looking. In top-down mode, the camera faces straight down and forward/back/left/right map to world cardinals. Keyboard shortcuts are suppressed when focus is in a text input.

Panning happens by moving both `camera.position` and `controls.target` by the same vector — this preserves the camera's orbit distance.

---

## View controls

### Camera presets

Camera presets are available from the camera button in the top-right of the viewport.

Three view modes:
- **Perspective** — classic 3D view with orbit controls. Good for seeing depth and the overall dungeon feel.
- **Isometric** — orthographic camera at a fixed angle. Great for planning maps.
- **Top-down** — orthographic, looking straight down. Best for precise cell placement.

Switching presets animates the camera smoothly to the new position using a spring animation in `CameraPresetManager`.

### Post-processing (Lens)

The Settings button in the toolbar exposes the viewport tuning controls. Lens settings include a toggle for post-processing plus controls for:
- **Autofocus** — keeps focus centered on whatever the camera's center ray is hitting
- **Near range** — how much foreground depth stays in focus
- **Far range** — how much background depth stays in focus
- **Blur** — the overall strength of the blur effect

### Lighting

A single **intensity** slider that scales all scene lights (ambient + directional) uniformly.

### Performance

**FPS cap** selector: Uncapped / 30 / 60 / 120. Lower caps save battery. The render loop pauses entirely when the browser tab is hidden.

**Grid** toggle: shows/hides the grid overlay.

---

## Scene panel (top-right)

The scene panel has two sections: floors and rooms.

### Floors

Floors are listed from top (highest level) to bottom. The active floor has an amber dot. Each floor shows:
- Floor name (double-click to rename)
- Level number (e.g. +1, 0, -1)
- A count of rooms, cells, props, and openings

Click any floor to switch to it. Switching triggers the floor-switch animation: the screen fades to black, the camera bumps in the travel direction, then the new floor fades in.

The **+** button next to the floor header adds a new floor. New floors get an auto-incremented name and level. You can't delete the last floor.

Clicking a prop or opening in the scene tree jumps to that floor (if it's on a different floor) and selects the object.

### Rooms

Rooms within the active floor are listed as a tree under their floor. Each room shows its cell count, object count, and opening count.

- Click a room name to select all its cells
- Double-click to rename
- The trash icon removes the room and unassigns its cells (cells remain, they just lose their room association)

---

## Layers panel (bottom-right)

Layers are listed in creation order. The active layer is highlighted.

Controls per layer:
- **Eye** icon — toggle visibility. Hidden layers don't render and aren't shown in the scene tree.
- **Lock** icon — toggle lock. Locked layers prevent painting, placing, or removing objects on that layer.
- **Trash** icon — delete the layer (only available if there are 2+ layers). Objects on the deleted layer are removed.
- **Name** — click to edit inline, Enter to confirm, Escape to cancel.

The **+** button at the header adds a new layer and activates it immediately.

---

## Keyboard shortcuts summary

| Shortcut | Action |
|----------|--------|
| W A S D / Arrow keys | Pan camera |
| Q / E | Orbit left/right (perspective only) |
| R | Rotate placed/selected prop; flip wall opening |
| Delete / Backspace | Remove selected object |
| Escape | Deselect |
| Cmd/Ctrl + Z | Undo |
| Cmd/Ctrl + Shift + Z | Redo |
| Cmd/Ctrl + Y | Redo |
| Alt + click | Inspect object (in Prop/Opening tool) |
| Right-click | Remove prop, character, or opening under cursor |

All shortcuts are suppressed when a text input or contenteditable has focus, so you can rename rooms and layers without accidentally triggering tools.
