## MODIFIED Requirements

### Requirement: Asset-specific placement behavior remains intact inside the unified workflow
The unified asset placement workflow MUST preserve specialized placement behavior based on asset metadata and placement family rather than forcing all assets through identical placement logic.

#### Scenario: Door assets still target wall replacement behavior
- **WHEN** a user selects a door asset from the unified browser
- **THEN** placement previews and placement results target valid spline wall opening locations on straight, diagonal, and rounded walls
- **AND** the editor does not treat the door as a generic floor prop

#### Scenario: Stair assets still use their specialized floor-link behavior
- **WHEN** a user selects a stair asset from the unified browser
- **THEN** the editor uses the stair placement behavior already required for linked floor traversal

#### Scenario: Surface-variant assets can still use fast editing interactions
- **WHEN** a user selects an asset whose intended placement mode is a surface paint or variant workflow
- **THEN** the unified workflow exposes that faster interaction model instead of degrading it to single-object point placement

## ADDED Requirements

### Requirement: Wall-targeted unified placement uses spline wall geometry
The unified asset placement workflow SHALL resolve wall-targeted assets against spline wall geometry instead of requiring only cardinal wall replacement targets.

#### Scenario: Wall-mounted asset previews on curved wall
- **WHEN** a user selects a wall-mounted asset from the unified browser and hovers a rounded wall
- **THEN** the placement preview snaps to the nearest eligible spline wall surface
- **AND** the preview orientation follows the local wall tangent and normal

#### Scenario: Unified placement remains valid on diagonal walls
- **WHEN** a user hovers a diagonal indoor wall with a wall-targeted asset selected
- **THEN** the workflow exposes that wall as a valid placement target
- **AND** placement does not require converting the wall back into a cardinal wall key
