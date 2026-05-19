## ADDED Requirements

### Requirement: Indoor walls are authored from spline wall segments and cutouts
The editor SHALL treat spline wall graph segments and cutouts as the authoritative indoor wall model for wall surfaces, openings, shared passages, and wall-focused editing state.

#### Scenario: Wall variant editing targets spline segments
- **WHEN** a user paints or edits a wall variant on an indoor wall
- **THEN** the editor stores the wall surface selection against the targeted spline segment
- **AND** indoor wall rendering reads that segment-owned data without requiring legacy grid wall derivation

#### Scenario: Shared passages are stored on spline-owned openings
- **WHEN** a user creates an open passage or door between rooms
- **THEN** the editor records the passage as a spline segment cutout/opening
- **AND** the connected wall behavior does not require a cardinal `wallKey` to remain valid

### Requirement: Indoor wall edits support straight, diagonal, and rounded walls
The editor MUST allow indoor wall editing, wall targeting, and opening ownership on straight, diagonal, and rounded spline wall geometry.

#### Scenario: Opening is added to a diagonal segment
- **WHEN** a user places a door or passage on a diagonal spline wall
- **THEN** the editor associates the opening with that diagonal spline segment
- **AND** the opening remains attached when the wall is rendered or reloaded

#### Scenario: Opening is added to a rounded wall span
- **WHEN** a user places an opening on a rounded spline wall span
- **THEN** the editor stores segment-relative opening data that can be rebuilt into the curved wall cutout
- **AND** the opening does not depend on a fallback cardinal wall identifier

### Requirement: Legacy indoor wall data migrates into spline-owned wall records
The system MUST migrate persisted indoor wall surface and opening data that still references legacy wall keys into spline-owned segment and cutout records during load.

#### Scenario: Legacy dungeon with wall-key openings loads successfully
- **WHEN** a dungeon containing wall-key-based openings or wall surfaces is loaded
- **THEN** the system maps that data onto the current spline wall graph before normal editing/render flows execute
- **AND** the dungeon remains editable without reintroducing the legacy wall runtime model
