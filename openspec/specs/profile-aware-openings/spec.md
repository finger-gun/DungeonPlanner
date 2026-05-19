# profile-aware-openings

## Purpose

Define opening behavior for profile-driven walls, including compatibility rules, opening modes, and continuity around opening spans.

## Requirements

### Requirement: Openings use one shared capability with explicit modes
The wall system SHALL treat doors and windows as one shared opening capability whose behavior is selected through explicit wall-family opening modes instead of splitting them into separate capability models or using one generic hole-cutting behavior.

#### Scenario: Framed opening terminates decorative layers
- **WHEN** a wall style and opening asset use a framed opening mode
- **THEN** the structural wall is cut to the required clear opening
- **AND** decorative layers terminate according to the style rules so the frame asset can cover the boundary cleanly

#### Scenario: Structural opening exposes style-defined reveals
- **WHEN** a wall style and opening asset use a structural opening mode
- **THEN** the generated wall assembly includes the visible jamb or reveal geometry required by that style
- **AND** the opening is not forced into a frame-hidden treatment

#### Scenario: Door and window assets share the same opening capability contract
- **WHEN** a user places either a door asset or a window asset on a compatible wall style
- **THEN** both placements resolve through the same opening capability contract
- **AND** their different behavior comes from the selected opening mode and compatibility rules rather than separate wall-opening systems

### Requirement: Opening compatibility is explicit between wall styles and opening assets
The wall system MUST evaluate compatibility rules between the assigned wall style and the selected opening asset before finalizing the rendered opening result.

#### Scenario: Compatible opening is accepted
- **WHEN** a user places an opening whose compatibility rules match the assigned wall style and opening mode
- **THEN** the system accepts the placement and generates the corresponding wall/opening assembly

#### Scenario: Incompatible opening is rejected or flagged
- **WHEN** a user places an opening that the assigned wall style does not support
- **THEN** the system reports the incompatibility through the wall/opening rules
- **AND** it does not silently render an unsupported wall cut

### Requirement: Opening generation preserves the analyzed wall path outside the opening span
The wall system MUST preserve the analyzed wall path and curvature outside the affected opening span so adding an opening does not visibly re-section unrelated curved wall geometry.

#### Scenario: Curved wall keeps its shape outside a door span
- **WHEN** a door is added to a curved wall
- **THEN** the wall sections outside the opening span keep the same analyzed curve and continuity as before the door was placed
- **AND** only the opening span and its immediate style-defined transitions are regenerated for the opening

#### Scenario: Shared wall opening updates both faces consistently
- **WHEN** an opening is added to a shared wall section between two rooms
- **THEN** the structural opening and any style-defined face terminations resolve consistently for both room-owned faces
- **AND** the shared section remains one structural wall opening rather than two drifting cuts
