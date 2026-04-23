# outdoor-terrain-sculpting

## Purpose

Define outdoor-only terrain sculpting, height-aware interaction, placement support, and persistence behavior for outdoor maps.
## Requirements
### Requirement: Outdoor mode SHALL support terrain sculpting
The system SHALL provide an outdoor-only terrain sculpting workflow that lets users raise and lower outdoor terrain as discrete grid-aligned elevation levels to form stepped hills, plateaus, pits, and trenches while preserving the existing brush-driven editing model.

#### Scenario: Terrain sculpt controls are available only in outdoor mode
- **WHEN** the user is editing an outdoor map
- **THEN** the UI shows terrain sculpt controls for adjusting ground elevation
- **AND** those controls are not shown for indoor maps

#### Scenario: Raise brush creates stepped raised terrain
- **WHEN** the user performs a sculpt stroke with the raise terrain brush in outdoor mode
- **THEN** each targeted outdoor cell increases by the configured discrete terrain step
- **AND** the raised area renders as stepped terrain with visible top surfaces and exposed outer cliffs where adjacent cells are lower

#### Scenario: Lower brush creates stepped lowered terrain
- **WHEN** the user performs a sculpt stroke with the lower terrain brush in outdoor mode
- **THEN** each targeted outdoor cell decreases by the configured discrete terrain step
- **AND** the lowered area renders as a pit or trench with inward-facing cliff walls where adjacent cells are higher
- **AND** the lowered area keeps a visible floor surface at the lowered terrain level

### Requirement: Outdoor sculpting SHALL preserve grid-aware interaction and placement
The system SHALL keep outdoor authoring grid semantics usable on stepped terrain so cursor targeting, object placement, and other cell-based workflows remain predictable.

#### Scenario: Grid-targeted editing remains stable on stepped terrain
- **WHEN** the user hovers or paints over sculpted outdoor terrain
- **THEN** the editor resolves the interaction to the intended outdoor grid area
- **AND** brush behavior remains consistent with existing outdoor drag interactions

#### Scenario: Props and characters remain placeable on stepped terrain
- **WHEN** the user places or moves a ground-supported prop or character onto stepped outdoor terrain
- **THEN** the object is positioned on the visible terrain top for the chosen support cell
- **AND** placement remains valid without requiring manual Y-axis adjustment

#### Scenario: Existing outdoor objects remain supported after terrain edits
- **WHEN** the user sculpts terrain beneath an already placed outdoor ground-supported prop or character
- **THEN** the object remains supported by the edited terrain surface for its support cell
- **AND** it does not become unusably buried inside cliff geometry or floating above the ground

### Requirement: Outdoor terrain sculpting SHALL persist across save and load
The system SHALL include stepped outdoor terrain elevation data in dungeon serialization and restore it when loading a saved dungeon file.

#### Scenario: Save and load round-trip preserves stepped terrain
- **WHEN** the user saves a dungeon with sculpted outdoor terrain and later reloads it
- **THEN** the same stepped terrain shape is restored

#### Scenario: Older files load with migration-safe stepped terrain defaults
- **WHEN** a dungeon file created before stepped outdoor terrain support is loaded
- **THEN** the file loads successfully
- **AND** any legacy outdoor terrain data is converted to the stepped terrain model using migration-safe defaults or conversion rules

### Requirement: Outdoor stepped terrain SHALL render exposed tops and cliff faces from terrain level differences
The system SHALL derive outdoor stepped terrain rendering from neighboring cell level differences so raised terrain renders outward cliffs and lowered terrain renders inward cliffs.

#### Scenario: Raised terrain renders exposed outer cliffs
- **WHEN** an outdoor cell is higher than one or more neighboring cells
- **THEN** the renderer shows exposed cliff geometry on each boundary where the neighbor is lower
- **AND** the cell keeps a visible top surface at its own terrain level

#### Scenario: Lowered terrain renders exposed inner cliffs
- **WHEN** an outdoor cell is lower than one or more neighboring cells
- **THEN** the renderer shows exposed cliff geometry around the lowered area on the boundaries where surrounding terrain is higher
- **AND** the lowered cell keeps a visible floor surface at its own terrain level

#### Scenario: Larger level differences render full cliff height
- **WHEN** adjacent outdoor cells differ by more than one terrain level
- **THEN** the rendered cliff face spans the full visible level difference between those cells

