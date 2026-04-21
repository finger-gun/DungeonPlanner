## MODIFIED Requirements

### Requirement: User can create an outdoor map mode
The system SHALL allow the user to choose the map mode when creating a new map, with at least `indoor` and `outdoor` options, and outdoor maps SHALL initialize with outdoor voxel terrain defaults.

#### Scenario: Selecting outdoor map mode at creation
- **WHEN** the user creates a new map and selects `outdoor`
- **THEN** the map is initialized in outdoor mode semantics instead of indoor room-first semantics
- **AND** default outdoor terrain starts with green-grass base appearance and the default terrain palette

### Requirement: Outdoor editing defaults to open terrain with explicit constraints
For outdoor maps, the system SHALL treat terrain as open by default and SHALL apply navigability constraints only from explicit authoring actions (blocked-cell painting and placed boundary/blocking assets), while providing voxel elevation and terrain palette controls.

#### Scenario: Outdoor map starts open
- **WHEN** a new outdoor map is created
- **THEN** the map starts with no required room-painting step and allows placement/constraint authoring directly

#### Scenario: Outdoor constraints shape space
- **WHEN** the user paints blocked cells or places boundary assets on an outdoor map
- **THEN** those authored constraints are applied to the map's blocked-space model

#### Scenario: Outdoor tools include voxel elevation and palette controls
- **WHEN** the user is authoring an outdoor map
- **THEN** the editor exposes outdoor voxel elevation and terrain palette controls
- **AND** those controls operate without switching indoor authoring behavior

### Requirement: Indoor behavior remains unchanged
The system SHALL preserve existing indoor authoring behavior for indoor maps.

#### Scenario: Indoor map retains room-first flow
- **WHEN** the user creates or opens an indoor map
- **THEN** existing room painting, wall inference, and opening workflows behave as before
