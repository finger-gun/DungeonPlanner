## MODIFIED Requirements

### Requirement: Outdoor mode SHALL support ground texture painting
The system SHALL provide an outdoor-only ground surface paint capability that allows users to assign a terrain surface type to outdoor terrain cells using brush interactions. The selected surface type SHALL apply to the visible top surface of that cell at its current stepped terrain level.

#### Scenario: Outdoor paint controls are available only in outdoor mode
- **WHEN** the user is editing an outdoor map
- **THEN** the UI shows outdoor surface-paint controls for selecting a terrain surface brush
- **AND** those controls are not shown in indoor mode

#### Scenario: Brush painting assigns top-surface terrain types
- **WHEN** the user performs a paint stroke with a selected terrain surface brush in outdoor mode
- **THEN** each targeted outdoor cell stores the selected terrain surface assignment
- **AND** the selected surface appears on the visible top of that cell at its current terrain level

#### Scenario: Brush erase removes terrain surface assignments
- **WHEN** the user performs an erase stroke in outdoor mode
- **THEN** targeted cells remove their explicit terrain surface assignment

### Requirement: Outdoor texture paint SHALL persist across save and load
The system SHALL include outdoor terrain surface paint state in dungeon serialization and restore it when loading a saved dungeon file.

#### Scenario: Save and load round-trip preserves painted terrain surfaces
- **WHEN** the user saves a dungeon with outdoor terrain surface-painted cells and then reloads it
- **THEN** the same outdoor terrain surface assignments are restored

#### Scenario: Older files load with migration-safe defaults
- **WHEN** a dungeon file created before stepped outdoor terrain surface paint support is loaded
- **THEN** the file loads successfully with migration-safe terrain surface defaults

### Requirement: Outdoor texture paint SHALL remain aligned on sculpted terrain
The system SHALL keep outdoor terrain surface paint mapped to the stepped outdoor terrain top so painted areas remain visually aligned after terrain elevation changes.

#### Scenario: Painted terrain surfaces remain attached to stepped terrain
- **WHEN** an outdoor area has terrain surface assignments and that terrain is sculpted upward or downward
- **THEN** the painted surface remains rendered on the corresponding stepped terrain top
- **AND** the surface does not appear detached from the edited terrain cell

#### Scenario: Terrain surface paint stays editable after sculpting
- **WHEN** the user paints or erases outdoor terrain surface paint on already sculpted terrain
- **THEN** the same surface-paint workflow remains available
- **AND** the resulting painted area aligns with the stepped terrain top that was edited

## REMOVED Requirements

### Requirement: Outdoor ground rendering SHALL auto-blend adjacent texture types
**Reason**: Stepped outdoor terrain now renders from asset-derived tops and cliffs instead of a blended terrain plane, so adjacent terrain surface assignments no longer require plane-based texture blending.

**Migration**: Preserve explicit painted terrain surface assignments where possible on stepped terrain tops, and fall back to the default green grass top surface when no explicit assignment exists.

## ADDED Requirements

### Requirement: Unpainted stepped outdoor terrain SHALL use the default green grass top surface
The system SHALL render unpainted stepped outdoor terrain tops with the default green grass terrain surface appearance.

#### Scenario: Unpainted flat terrain uses default grass top
- **WHEN** an outdoor terrain cell has no explicit terrain surface assignment
- **THEN** its visible top surface renders with the default green grass appearance

#### Scenario: Unpainted lowered terrain floor uses default grass top
- **WHEN** a lowered outdoor terrain cell has no explicit terrain surface assignment
- **THEN** the visible floor surface at the bottom of the pit or trench renders with the default green grass appearance
