## ADDED Requirements

### Requirement: Wall-targeted assets snap to the nearest eligible spline wall surface
The editor SHALL snap wall-targeted assets to the nearest eligible spline wall surface using segment geometry instead of ranking only cardinal wall directions.

#### Scenario: Wall-mounted prop snaps to rounded wall
- **WHEN** a user places a wall-mounted prop near a rounded spline wall
- **THEN** the editor chooses the nearest eligible spline segment on that wall
- **AND** the preview sits flush against the sampled wall surface

#### Scenario: Wall-mounted prop ignores farther cardinal approximation
- **WHEN** a nearby spline wall is diagonal or curved and a farther legacy cardinal approximation would disagree
- **THEN** the editor prefers the actual nearest spline wall surface
- **AND** the asset does not snap to a less accurate cardinal fallback

### Requirement: Wall-targeted asset rotation follows spline wall tangent and normal
Wall-targeted asset placement MUST derive orientation from spline segment tangent and normal data so doors and props face the correct wall direction on any angle.

#### Scenario: Diagonal door aligns to segment orientation
- **WHEN** a user places a door on a diagonal spline wall
- **THEN** the door aligns perpendicular to the sampled spline wall normal
- **AND** the doorway cutout is generated at the same segment-relative position

#### Scenario: Curved wall prop follows local tangent
- **WHEN** a user places a wall-mounted prop on a rounded spline wall
- **THEN** the prop orientation uses the local tangent/normal at the snap point
- **AND** the prop does not retain a hard-coded north, south, east, or west rotation
