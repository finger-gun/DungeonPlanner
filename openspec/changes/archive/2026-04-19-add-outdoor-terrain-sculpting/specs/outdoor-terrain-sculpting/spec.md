## ADDED Requirements

### Requirement: Outdoor mode SHALL support terrain sculpting
The system SHALL provide an outdoor-only terrain sculpting workflow that lets users raise and lower ground elevation to form hills, slopes, and valleys while preserving the existing brush-driven editing model.

#### Scenario: Terrain sculpt controls are available only in outdoor mode
- **WHEN** the user is editing an outdoor map
- **THEN** the UI shows terrain sculpt controls for adjusting ground elevation
- **AND** those controls are not shown for indoor maps

#### Scenario: Raise and lower brushes change terrain elevation
- **WHEN** the user performs a sculpt stroke with a raise or lower terrain brush in outdoor mode
- **THEN** the targeted outdoor terrain updates its elevation accordingly
- **AND** the result remains part of the continuous outdoor ground surface

### Requirement: Outdoor sculpting SHALL preserve grid-aware interaction and placement
The system SHALL keep outdoor authoring grid semantics usable on sculpted terrain so cursor targeting, object placement, and other cell-based workflows remain predictable.

#### Scenario: Grid-targeted editing remains stable on sculpted terrain
- **WHEN** the user hovers or paints over sculpted outdoor terrain
- **THEN** the editor resolves the interaction to the intended outdoor grid area
- **AND** brush behavior remains consistent with existing outdoor drag interactions

#### Scenario: Props and characters remain placeable on sculpted terrain
- **WHEN** the user places or moves a ground-supported prop or character onto sculpted outdoor terrain
- **THEN** the object is positioned on the terrain surface at the chosen support location
- **AND** placement remains valid without requiring manual Y-axis adjustment

#### Scenario: Existing outdoor objects remain supported after terrain edits
- **WHEN** the user sculpts terrain beneath an already placed outdoor ground-supported prop or character
- **THEN** the object remains supported by the edited terrain surface
- **AND** it does not become unusably buried below or floating above the ground

### Requirement: Outdoor terrain sculpting SHALL persist across save and load
The system SHALL include outdoor terrain elevation data in dungeon serialization and restore it when loading a saved dungeon file.

#### Scenario: Save and load round-trip preserves sculpted terrain
- **WHEN** the user saves a dungeon with sculpted outdoor terrain and later reloads it
- **THEN** the same terrain shape is restored

#### Scenario: Older files load with flat-terrain defaults
- **WHEN** a dungeon file created before outdoor terrain sculpting support is loaded
- **THEN** the file loads successfully with a flat outdoor terrain surface by default
