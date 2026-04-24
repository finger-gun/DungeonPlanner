## MODIFIED Requirements

### Requirement: Outdoor mode SHALL support terrain sculpting
The system SHALL provide an outdoor-only terrain sculpting workflow that lets users raise and lower outdoor terrain as discrete grid-aligned elevation levels while preserving the resolved terrain style of affected cells.

#### Scenario: Raise brush creates stepped raised terrain with the current cell style
- **WHEN** the user performs a sculpt stroke with the raise terrain brush in outdoor mode
- **THEN** each targeted outdoor cell increases by the configured discrete terrain step
- **AND** the raised area renders as stepped terrain with visible top surfaces and exposed outer cliffs
- **AND** newly visible stepped geometry for each cell uses that cell's resolved terrain style

#### Scenario: Lower brush creates stepped lowered terrain with the current cell style
- **WHEN** the user performs a sculpt stroke with the lower terrain brush in outdoor mode
- **THEN** each targeted outdoor cell decreases by the configured discrete terrain step
- **AND** the lowered area renders as a pit or trench with inward-facing cliff walls and a visible lowered floor surface
- **AND** newly visible stepped geometry for each affected cell uses that cell's resolved terrain style or the owning higher-cell style for cliffs

### Requirement: Outdoor sculpting SHALL preserve grid-aware interaction and placement
The system SHALL keep outdoor authoring grid semantics usable on stepped terrain with painted terrain styles so cursor targeting, object placement, and other cell-based workflows remain predictable.

#### Scenario: Grid-targeted editing remains stable on styled stepped terrain
- **WHEN** the user hovers or paints over sculpted outdoor terrain with terrain-style overrides
- **THEN** the editor resolves the interaction to the intended outdoor grid area
- **AND** brush behavior remains consistent with existing outdoor drag interactions

### Requirement: Outdoor stepped terrain SHALL render exposed tops and cliff faces from terrain level differences
The system SHALL derive outdoor stepped terrain rendering from neighboring cell level differences and the resolved terrain style of the owning cells.

#### Scenario: Raised terrain uses the higher cell's terrain style on cliffs
- **WHEN** an outdoor cell is higher than a neighboring cell and the two cells resolve to different terrain styles
- **THEN** the exposed cliff geometry on that boundary uses the dominant terrain style of the higher cell
- **AND** the higher cell keeps a visible top surface using its own resolved terrain style

#### Scenario: Lowered terrain uses the surrounding higher terrain style on inward cliffs
- **WHEN** an outdoor cell is lower than one or more neighboring cells and the surrounding higher terrain resolves to a different style than the pit floor
- **THEN** the exposed inward cliff geometry uses the dominant terrain style of the higher surrounding cell
- **AND** the lowered cell keeps a visible floor surface using its own resolved terrain style

## ADDED Requirements

### Requirement: Outdoor terrain sculpting SHALL preserve terrain-style paint across edits
The system SHALL preserve terrain-style paint assignments across sculpt operations so terrain appearance remains stable while elevations change.

#### Scenario: Sculpting does not clear painted terrain styles
- **WHEN** the user raises or lowers outdoor terrain that has explicit terrain-style overrides
- **THEN** those terrain-style overrides remain associated with the same edited cells after the sculpt operation

#### Scenario: Unpainted sculpted terrain continues using the map default style
- **WHEN** the user sculpts outdoor terrain on cells without explicit terrain-style overrides
- **THEN** newly visible terrain for those cells renders using the map default outdoor terrain style
