## MODIFIED Requirements

### Requirement: Outdoor mode SHALL support ground texture painting
The system SHALL provide an outdoor-only ground surface paint capability that allows users to assign terrain texture types to outdoor ground cells using brush interactions, with texture/style resolution compatible with the selected outdoor terrain palette.

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

### Requirement: Outdoor ground rendering SHALL resolve texture transitions with voxel terrain alignment
The system SHALL render outdoor texture assignments in a way that remains visually coherent on voxel-aligned terrain surfaces and across adjacent cells with differing assignments.

#### Scenario: Adjacent textures transition without broken seams
- **WHEN** two neighboring outdoor cells have different terrain texture assignments
- **THEN** the rendered transition appears visually coherent for the active terrain style
- **AND** no obvious detached or broken surface seam is introduced by voxel terrain geometry

#### Scenario: Unpainted outdoor cells use default outdoor surface appearance
- **WHEN** an outdoor cell has no explicit terrain texture assignment
- **THEN** the renderer falls back to the default outdoor ground appearance for that cell
- **AND** the default base appearance is green-grass aligned

### Requirement: Outdoor texture paint SHALL persist across save and load
The system SHALL include outdoor texture paint state in dungeon serialization and restore it when loading a saved dungeon file.

#### Scenario: Save and load round-trip preserves painted textures
- **WHEN** the user saves a dungeon with outdoor texture-painted cells and then reloads it
- **THEN** the same outdoor texture paint assignments are restored

#### Scenario: Older files load with migration-safe defaults
- **WHEN** a dungeon file created before outdoor texture paint support is loaded
- **THEN** the file loads successfully with no outdoor texture paint assignments applied by default

### Requirement: Outdoor texture paint SHALL remain aligned on sculpted terrain
The system SHALL keep outdoor ground texture paint mapped to the sculpted outdoor terrain surface so texture-painted areas remain visually aligned after terrain elevation changes.

#### Scenario: Painted textures remain attached to sculpted terrain
- **WHEN** an outdoor area has texture paint assignments and that terrain is sculpted upward or downward
- **THEN** the painted texture remains rendered on the corresponding terrain area
- **AND** the texture does not appear mirrored, detached, or projected onto the old flat plane

#### Scenario: Texture paint stays editable after sculpting
- **WHEN** the user paints or erases outdoor ground texture on already sculpted terrain
- **THEN** the same texture-paint workflow remains available
- **AND** the resulting painted area aligns with the sculpted surface
