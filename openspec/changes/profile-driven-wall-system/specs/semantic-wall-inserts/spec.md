## ADDED Requirements

### Requirement: The system derives semantic insert anchors from wall paths
The wall system SHALL derive semantic anchors from analyzed wall paths for architectural inserts such as pillars, posts, caps, and cover pieces.

#### Scenario: Endpoints create endpoint anchors
- **WHEN** a wall run has a start or end boundary section
- **THEN** the analysis stage emits anchors for endpoint inserts at those locations
- **AND** style rules can target those anchors without manual prop placement

#### Scenario: Bends and corners create transition anchors
- **WHEN** a wall path contains a corner or a curvature change above the configured threshold
- **THEN** the analysis stage emits anchors for transition inserts at the relevant boundary sections
- **AND** those anchors remain attached to the wall path as it is edited

### Requirement: Styles control which inserts appear at which anchors
The wall system MUST resolve insert placement from style rules rather than treating pillars, posts, and cover pieces as free-floating decorative props.

#### Scenario: Style places pillars at convex corners
- **WHEN** a wall style specifies pillar placement on convex corner anchors
- **THEN** the generated wall assembly places the configured pillar or cover piece at those anchors
- **AND** wall edits keep those inserts synchronized with the corner location

#### Scenario: Style omits inserts for unsupported anchor types
- **WHEN** a wall style does not define an insert for a given anchor type
- **THEN** the system leaves that anchor empty
- **AND** wall generation continues without requiring a placeholder insert

### Requirement: Styles can request repeated inserts along runs
The wall system MUST support interval-driven semantic inserts in addition to structural transition anchors.

#### Scenario: Regular spacing inserts are generated along a long wall
- **WHEN** a wall style configures repeated inserts at a fixed spacing interval
- **THEN** the system emits interval anchors along eligible wall sections
- **AND** inserts are generated from those anchors in addition to any endpoint or bend-driven inserts

#### Scenario: Shared wall section keeps structural inserts aligned
- **WHEN** a repeated or transition insert lands on a shared wall section
- **THEN** the insert remains aligned to the shared structural wall section
- **AND** face-specific finishes on either side continue to resolve independently around that insert

### Requirement: Insert ownership follows styled visible sides
The wall system MUST resolve semantic inserts per styled visible side instead of forcing all insert ownership through the shared structural core.

#### Scenario: Opposing sides use different insert rules
- **WHEN** opposite sides of the same wall section use different wall styles with different insert rules
- **THEN** each styled side resolves its own semantic inserts from its own style rules
- **AND** one side can omit or vary inserts without suppressing inserts on the other side
