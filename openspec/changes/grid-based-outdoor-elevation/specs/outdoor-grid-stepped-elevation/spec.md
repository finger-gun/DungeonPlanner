## ADDED Requirements

### Requirement: Outdoor terrain elevation SHALL be represented as grid-stepped levels
The system SHALL represent outdoor terrain elevation as discrete, grid-aligned step levels so each vertical transition follows cell boundaries rather than continuous slopes.

#### Scenario: Raise/lower editing produces stepped elevation
- **WHEN** the user applies raise or lower terrain editing on an outdoor map
- **THEN** affected terrain resolves to discrete elevation levels
- **AND** vertical transitions align to outdoor grid cell boundaries

#### Scenario: Elevated outdoor terrain remains visually readable
- **WHEN** adjacent outdoor cells are on different elevation levels
- **THEN** the terrain mesh includes visible side faces at the step boundary
- **AND** step structure is readable from normal gameplay camera angles

### Requirement: Outdoor stepped terrain surfaces SHALL resolve textures by face with safe defaults
The system SHALL resolve terrain material by face for stepped outdoor terrain using a shared default rule and explicit overrides. By default, top and side faces SHALL use the same selected terrain material unless an override is defined for that material type.

#### Scenario: Non-overridden materials use the same texture on all faces
- **WHEN** an outdoor terrain material has no face override and stepped side faces are exposed
- **THEN** top and side faces use the same selected terrain texture
- **AND** no additional user configuration is required

#### Scenario: Grass uses dirt side faces with a soft top transition
- **WHEN** a stepped outdoor terrain area uses grass texture
- **THEN** top faces render grass while side faces render dirt
- **AND** a soft blend band appears near the top edge of side faces to avoid a hard seam
