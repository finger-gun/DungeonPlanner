# wall-style-assets

## Purpose

Define data-driven wall style assets for profile-driven walls, including generation inputs, face treatments, and geometry control rules.

## Requirements

### Requirement: Wall styles define first-slice profile-driven wall families
The system SHALL provide wall style definitions as data assets that describe how a wall family is generated. In the first implementation slice, a wall style MUST cover the structural core, room-owned faces, and pillar or cover insert rules, while trim/crown/base layers remain optional future extensions rather than required capabilities.

#### Scenario: Wall style defines coordinated layers
- **WHEN** a content author creates a wall style
- **THEN** the style can define the structural layer and one or more visible face or trim layers
- **AND** each layer can reference its own 2D cross-section profile and material binding

#### Scenario: Wall style drives generated wall output
- **WHEN** a wall section is assigned a wall style
- **THEN** wall generation reads the style asset rather than a single baked wall mesh asset
- **AND** the resulting assembly reflects that style's layer definitions

#### Scenario: First slice does not require trim stacks
- **WHEN** a wall style is authored for the first implementation slice
- **THEN** it is valid with only structural core, room-owned face definitions, and pillar or cover insert rules
- **AND** the system does not require trim, crown, or base layer definitions for that style to be usable

### Requirement: Wall styles support face-specific visual treatment
Wall style definitions MUST support distinct visual treatment for different room-owned faces and exposed faces so the same structural wall can present different profiles or materials depending on which side is being rendered.

#### Scenario: Shared rooms use different interior treatments
- **WHEN** two adjacent rooms with different wall styles share a boundary section
- **THEN** each room-facing side resolves using that room's own interior-facing style treatment
- **AND** the shared wall does not force both sides to use the same finish

#### Scenario: Exposed face uses exterior treatment
- **WHEN** a boundary section has no adjacent room
- **THEN** the system can resolve the exposed face using the wall style's exterior treatment
- **AND** that exterior treatment can differ from the room-facing interior treatment

### Requirement: Wall styles declare geometry control rules
Wall style definitions MUST declare the geometry control rules needed for generation, including UV behavior, join preferences, curvature limits, and insert/opening hooks.

#### Scenario: Style limits unsupported curvature
- **WHEN** a wall style is applied to a boundary whose curvature exceeds that style's supported limits
- **THEN** the system detects the incompatibility from the style definition
- **AND** the style does not silently generate unsupported geometry

#### Scenario: Style exposes join and insert preferences
- **WHEN** the wall assembly pipeline evaluates corners, bends, or semantic insert anchors
- **THEN** it can read the applicable join preferences and insert hooks from the assigned wall style
- **AND** generated geometry follows those rules consistently

### Requirement: Wall styles replace legacy wall-definition systems
The wall system MUST treat wall styles as the canonical wall-definition mechanism for profile-driven walls rather than requiring a parallel bridge through legacy room sets or wall material sets.

#### Scenario: Wall style assignment does not depend on a room set
- **WHEN** a user assigns a profile-driven wall style to a wall boundary
- **THEN** the assignment resolves directly through wall-style data
- **AND** it does not require an intermediate room-set preset to remain valid

#### Scenario: Wall style assignment does not depend on a legacy wall material set
- **WHEN** a wall style defines its materials and geometry behavior
- **THEN** the wall assembly resolves from that wall-style definition
- **AND** it does not require a separate legacy wall material set to complete the wall definition
