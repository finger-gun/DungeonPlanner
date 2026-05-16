## ADDED Requirements

### Requirement: Rules packs expose structured Dragonbane domains
The system SHALL support structured rules/data pack domains needed for Dragonbane character creation and early play state.

#### Scenario: Dragonbane rules pack is installed
- **WHEN** a Dragonbane rules pack is registered in the workspace
- **THEN** the system can read character kins, professions, skills, creation rules, weapons, and armor as structured data domains

### Requirement: Runtime uses structured pack data instead of PDFs
The system MUST use structured rules-pack data as the runtime source for character creation and derived-stat computation.

#### Scenario: Source PDF exists for provenance
- **WHEN** a rules pack includes metadata that references a PDF or source artifact
- **THEN** the runtime uses the structured pack data for calculations
- **AND** the PDF reference is treated as provenance rather than a runtime parser input

### Requirement: Rules packs carry source provenance
The system SHALL allow rules/data packs to record source repository, source paths, source version, and generation metadata.

#### Scenario: Imported Dragonbane pack is inspected
- **WHEN** a user or developer inspects an imported private Dragonbane rules pack
- **THEN** the pack exposes metadata identifying the Dragonbane Unbound source and generation details

### Requirement: Dragonbane-specific logic remains outside core editor placement code
The system MUST keep Dragonbane rules evaluation out of core editor placement and rendering components.

#### Scenario: Editor displays character movement
- **WHEN** the editor shows a placed character's movement allowance
- **THEN** the value is provided by character/rules services or projected character data
- **AND** editor placement code does not hardcode Dragonbane movement formulas
