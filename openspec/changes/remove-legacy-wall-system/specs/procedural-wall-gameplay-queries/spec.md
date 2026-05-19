## ADDED Requirements

### Requirement: Visibility and occlusion respect spline wall geometry
Indoor visibility, fog, and wall-driven light occlusion queries SHALL use spline wall geometry and cutouts rather than cardinal grid wall boundaries.

#### Scenario: Rounded wall blocks line of sight
- **WHEN** a line-of-sight or occlusion query crosses a rounded spline wall with no open cutout
- **THEN** the query treats that wall as blocking
- **AND** visibility does not leak through because the wall is non-cardinal

#### Scenario: Open doorway allows visibility through spline wall
- **WHEN** a visibility or occlusion query crosses a spline wall segment at an open doorway or passage cutout
- **THEN** the query allows sight through the cutout opening
- **AND** the remainder of the wall segment still blocks as normal

### Requirement: Indoor movement uses spline room containment and wall crossing tests
Indoor movement SHALL evaluate traversable cells from spline room containment and spline wall crossing rules instead of only painted-cell wall boundaries.

#### Scenario: Closed spline wall blocks adjacent movement
- **WHEN** a movement step would cross a spline wall segment without an open cutout
- **THEN** the step is rejected even if the source and destination cells are grid-adjacent

#### Scenario: Open passage allows movement across connected rooms
- **WHEN** a movement step crosses a spline wall segment at an open shared passage or door cutout
- **THEN** the step is permitted if the destination cell also satisfies room containment rules

### Requirement: Indoor movement requires destination cells to be mostly inside the room interior
The system MUST allow indoor movement only into cells whose playable area is at least 75 percent inside the traversable spline room interior.

#### Scenario: Curved boundary rejects mostly-outside cell
- **WHEN** a candidate movement cell lies mostly outside a rounded room boundary
- **THEN** the cell is excluded from movement range even if part of the cell overlaps the room

#### Scenario: Mostly-inside cell remains traversable near diagonal wall
- **WHEN** a candidate movement cell is at least 75 percent inside the spline room interior near a diagonal wall
- **THEN** the cell remains eligible for movement if no blocking wall crossing occurs
