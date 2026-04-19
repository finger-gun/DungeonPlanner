# outdoor-ground-texture-paint

## Purpose

Define outdoor-only ground texture painting, blended terrain rendering, and persistence behavior for outdoor maps.

## Requirements

### Requirement: Outdoor mode SHALL support ground texture painting
The system SHALL provide an outdoor-only ground surface paint capability that allows users to assign a terrain texture type to outdoor ground cells using brush interactions.

#### Scenario: Outdoor paint controls are available only in outdoor mode
- **WHEN** the user is editing an outdoor map
- **THEN** the UI shows outdoor texture paint controls for selecting a terrain texture brush
- **AND** those controls are not shown in indoor mode

#### Scenario: Brush painting assigns terrain texture types
- **WHEN** the user performs a paint stroke with a selected terrain texture brush in outdoor mode
- **THEN** each targeted outdoor cell stores the selected terrain texture type assignment

#### Scenario: Brush erase removes terrain texture assignments
- **WHEN** the user performs an erase stroke in outdoor mode
- **THEN** targeted cells remove their explicit terrain texture assignment

### Requirement: Outdoor ground rendering SHALL auto-blend adjacent texture types
The system SHALL render outdoor ground textures with smooth transitions where neighboring cells have different terrain texture assignments.

#### Scenario: Adjacent textures blend without hard seams
- **WHEN** two neighboring outdoor cells have different terrain texture assignments
- **THEN** the rendered ground transition between those cells appears blended rather than as a hard material edge

#### Scenario: Unpainted outdoor cells use default outdoor surface appearance
- **WHEN** an outdoor cell has no explicit terrain texture assignment
- **THEN** the renderer falls back to the default outdoor ground appearance for that cell

### Requirement: Outdoor texture paint SHALL persist across save and load
The system SHALL include outdoor texture paint state in dungeon serialization and restore it when loading a saved dungeon file.

#### Scenario: Save and load round-trip preserves painted textures
- **WHEN** the user saves a dungeon with outdoor texture-painted cells and then reloads it
- **THEN** the same outdoor texture paint assignments are restored

#### Scenario: Older files load with migration-safe defaults
- **WHEN** a dungeon file created before outdoor texture paint support is loaded
- **THEN** the file loads successfully with no outdoor texture paint assignments applied by default
