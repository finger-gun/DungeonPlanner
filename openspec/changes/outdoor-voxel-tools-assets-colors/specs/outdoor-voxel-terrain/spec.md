## ADDED Requirements

### Requirement: Outdoor terrain SHALL render as chunked voxel-aligned blocks
The system SHALL represent outdoor elevation with voxel-aligned block terrain semantics and SHALL render outdoor terrain using chunked processing that rebuilds only edited regions and affected neighbors.

#### Scenario: Sculpt edit updates only dirty chunks
- **WHEN** the user performs an outdoor elevate/lower sculpt stroke
- **THEN** the system marks intersecting terrain chunks as dirty
- **AND** it rebuilds only dirty chunks and directly adjacent chunks needed for boundary correctness

#### Scenario: Hidden interior faces are not emitted
- **WHEN** outdoor terrain is generated for rendering
- **THEN** faces between fully adjacent terrain voxels are omitted
- **AND** only exposed surfaces contribute to render geometry

### Requirement: Outdoor voxel terrain SHALL preserve grid-based placement support
The system SHALL resolve outdoor support height from voxel terrain for ground-supported placement, movement targeting, and hover previews using the active support cell.

#### Scenario: Ground-supported placement snaps to voxel surface
- **WHEN** a user places or moves a floor/free-connected outdoor object on voxel terrain
- **THEN** the object Y-position is resolved from the support cell's voxel surface
- **AND** the object does not require manual Y adjustment

#### Scenario: Existing placed objects re-anchor after sculpting
- **WHEN** voxel elevation is edited under existing outdoor ground-supported objects
- **THEN** those objects re-anchor to the updated voxel support height
- **AND** child transforms remain coherent after re-anchoring

### Requirement: Outdoor voxel terrain SHALL not alter indoor rendering behavior
The system SHALL keep indoor map rendering and room/wall/floor workflows unchanged while applying voxel terrain logic only in outdoor mode.

#### Scenario: Indoor mode remains on existing pipeline
- **WHEN** the user creates or opens an indoor map
- **THEN** indoor rendering continues using the existing non-voxel room/tile pipeline
- **AND** no outdoor voxel terrain processing is required for indoor scenes
