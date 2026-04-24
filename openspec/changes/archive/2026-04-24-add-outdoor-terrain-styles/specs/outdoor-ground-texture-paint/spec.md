## MODIFIED Requirements

### Requirement: Outdoor mode SHALL support ground texture painting
The system SHALL provide an outdoor-only terrain style paint capability that allows users to assign a supported authored terrain style to outdoor terrain cells using brush interactions.

#### Scenario: Outdoor paint controls are available only in outdoor mode
- **WHEN** the user is editing an outdoor map
- **THEN** the UI shows terrain-style paint controls for selecting a supported terrain style brush
- **AND** those controls are not shown in indoor mode

#### Scenario: Brush painting assigns terrain styles
- **WHEN** the user performs a paint stroke with a selected terrain style brush in outdoor mode
- **THEN** each targeted outdoor cell stores the selected terrain style override
- **AND** the selected style is used for the visible terrain top and any stepped terrain geometry owned by that cell

#### Scenario: Brush erase resets cells to the map default terrain style
- **WHEN** the user performs an erase stroke in outdoor mode
- **THEN** targeted cells clear their explicit terrain style override
- **AND** those cells render using the map's default outdoor terrain style

### Requirement: Outdoor texture paint SHALL persist across save and load
The system SHALL include outdoor terrain style paint state and the map-level default outdoor terrain style in dungeon serialization and restore them when loading a saved dungeon file.

#### Scenario: Save and load round-trip preserves terrain styles
- **WHEN** the user saves a dungeon with outdoor terrain-style overrides and later reloads it
- **THEN** the same map default terrain style and per-cell terrain-style overrides are restored

#### Scenario: Older files load with safe default-style migration
- **WHEN** a dungeon file created before outdoor terrain-style paint support is loaded
- **THEN** the file loads successfully
- **AND** any legacy outdoor material-paint overrides are cleared safely
- **AND** outdoor terrain resolves to the map default terrain style unless repainted by the user

### Requirement: Outdoor texture paint SHALL remain aligned on sculpted terrain
The system SHALL keep outdoor terrain style assignments aligned to the stepped outdoor terrain top so painted areas remain visually coherent after terrain elevation changes.

#### Scenario: Painted terrain styles remain attached to stepped terrain
- **WHEN** an outdoor area has terrain-style overrides and that terrain is sculpted upward or downward
- **THEN** the same terrain style remains associated with the edited cells
- **AND** newly visible top surfaces for those cells use the same terrain style

#### Scenario: Terrain style paint stays editable after sculpting
- **WHEN** the user paints or erases terrain styles on already sculpted outdoor terrain
- **THEN** the same terrain-style paint workflow remains available
- **AND** resulting rendered tops and transitions align with the edited stepped terrain

## REMOVED Requirements

### Requirement: Outdoor ground rendering SHALL auto-blend adjacent texture types
**Reason**: The legacy outdoor material-paint system is being replaced by terrain-style painting based on authored stepped terrain style kits rather than flat material categories.

**Migration**: Clear legacy outdoor material-paint overrides safely during migration and resolve terrain to the map default style until the user repaints it.

## ADDED Requirements

### Requirement: Outdoor maps SHALL define a default terrain style
The system SHALL define a map-level default outdoor terrain style used for new outdoor maps and for cells without an explicit terrain-style override.

#### Scenario: New outdoor maps start with the default terrain style
- **WHEN** the user creates or loads an outdoor map with no explicit terrain-style overrides
- **THEN** visible outdoor terrain uses the configured map default terrain style

### Requirement: Outdoor terrain style paint SHALL feather neighboring top-surface styles
The system SHALL render soft top-surface transitions between neighboring outdoor cells that resolve to different terrain styles.

#### Scenario: Flat neighboring styles transition softly
- **WHEN** two neighboring flat outdoor cells resolve to different terrain styles
- **THEN** the visible top-surface boundary between them appears feathered rather than as a hard-edged seam

#### Scenario: Stepped neighboring styles transition softly across top surfaces
- **WHEN** neighboring stepped outdoor cells resolve to different terrain styles
- **THEN** the visible top surfaces and top caps render a soft transition where those styles meet
