# layered-profile-walls

## Purpose

Define profile-driven wall assemblies that derive coordinated wall geometry and per-side styling from authored wall centerlines.

## Requirements

### Requirement: Wall assemblies derive from one authored centerline
The wall system SHALL generate wall assemblies from the authored spline centerline instead of requiring separately authored interior, exterior, or trim meshes for the same boundary.

#### Scenario: One wall path produces multiple coordinated layers
- **WHEN** a room boundary is rendered with a profile-driven wall style
- **THEN** the system generates the structural wall body and any enabled face or trim layers from the same sampled centerline
- **AND** all generated layers remain spatially aligned to that boundary without manual per-layer placement

#### Scenario: Editing the wall path updates the full assembly
- **WHEN** a user edits a wall path that uses a profile-driven wall style
- **THEN** the system rebuilds the corresponding wall assembly from the updated centerline
- **AND** the visible wall faces, trims, and inserts stay attached to the edited path

### Requirement: Room-facing finishes use room-owned face resolution
The wall system MUST resolve visible wall faces per boundary section using room-owned face rules: a room owns the finish facing into that room, an adjacent room owns the opposing inward-facing finish on shared sections, and the originating room owns the outward-facing exterior finish on sections with no adjacent room.

#### Scenario: Shared section renders two room-owned interior faces
- **WHEN** two rooms share a wall section and each room has a different wall style or finish
- **THEN** the shared structural wall section renders one inward-facing finish for the first room and one inward-facing finish for the second room
- **AND** the system does not require duplicating the structural wall body

#### Scenario: Exposed section renders exterior for the owning room
- **WHEN** a room boundary section has no adjacent room on the opposite side
- **THEN** the system renders the room-owned inward-facing finish on the room side
- **AND** the system renders that room's configured exterior-facing finish on the exposed side of the same section

### Requirement: Mixed adjacency is supported within one continuous run
The wall system MUST support a continuous wall run whose boundary sections resolve to different adjacency conditions, including shared sections and exterior sections, without splitting the authored wall path into separate manual wall objects.

#### Scenario: Continuous run contains both shared and exposed sections
- **WHEN** one portion of a room's wall run is shared with another room and another portion is exposed to the outside
- **THEN** the system resolves face ownership separately for each boundary section
- **AND** the user continues to edit the run as one wall path

#### Scenario: Shared section changes to exposed after room removal
- **WHEN** an adjacent room is removed from a previously shared wall section
- **THEN** the remaining room keeps ownership of its inward-facing finish on that section
- **AND** the opposing face resolves to the remaining room's exterior finish without requiring manual reassignment

### Requirement: Wall style assignment targets graph segment sides
The wall system MUST assign wall styles at the graph-segment-side level so shared and exposed boundary sections can be styled independently without breaking the single wall-path authoring model.

#### Scenario: User assigns a style to one shared boundary face
- **WHEN** a user assigns a wall style to one face of a shared graph segment
- **THEN** the system stores that assignment against the targeted graph segment side
- **AND** the opposing room-facing side can keep a different style assignment on the same structural wall section

#### Scenario: One run stores different assignments across its sections
- **WHEN** a continuous wall run contains multiple graph segment sides with different ownership or styling needs
- **THEN** the system can store different wall style assignments for those segment sides
- **AND** the user does not need to break the authored wall path into separate wall objects to express that difference

### Requirement: Shared structural cores resolve independently from visible side styles
The wall system MUST allow a shared wall section to resolve its structural core independently from the visible face styles assigned to the two room-facing sides of that section.

#### Scenario: Shared segment uses a separate structural core style
- **WHEN** two rooms assign different wall styles to opposite sides of the same shared wall section
- **THEN** the system can resolve the shared structural core from a dedicated structural-core assignment for that shared segment
- **AND** changing one visible side style does not implicitly replace the shared structural core
