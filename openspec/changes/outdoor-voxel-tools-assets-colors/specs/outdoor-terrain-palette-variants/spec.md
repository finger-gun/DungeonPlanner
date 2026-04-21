## ADDED Requirements

### Requirement: Outdoor terrain SHALL support selectable color variant palettes
The system SHALL provide outdoor terrain palette selection that allows users to choose Color1-Color8 variant families for terrain visuals and related outdoor asset usage.

#### Scenario: User selects a terrain palette variant
- **WHEN** the user changes the outdoor terrain palette selection
- **THEN** subsequent outdoor terrain rendering resolves assets/material variants from the selected color family
- **AND** the selection is reflected consistently in terrain previews

### Requirement: New outdoor maps SHALL default to green-grass base terrain
The system SHALL initialize new outdoor maps with a green-grass base ground style and a deterministic default terrain palette when no user override exists.

#### Scenario: Outdoor map starts with expected base style
- **WHEN** the user creates a new outdoor map
- **THEN** unpainted/base terrain renders as green grass
- **AND** the map uses the default palette variant until changed by the user

### Requirement: Palette selection SHALL persist across save and load
The system SHALL include outdoor palette selection state in serialization and restore it when loading saved dungeons.

#### Scenario: Palette round-trip is preserved
- **WHEN** the user saves an outdoor dungeon with a non-default terrain palette and reloads it
- **THEN** the same palette selection is restored
- **AND** terrain visuals continue using the restored palette
