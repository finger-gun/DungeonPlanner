## ADDED Requirements

### Requirement: Rules-backed Dragonbane character creation
The system SHALL provide a guided Dragonbane character creation flow that uses installed structured rules-pack data for creation options and calculations.

#### Scenario: Creator loads options from rules pack
- **WHEN** a user opens the Dragonbane character creator
- **THEN** the creator presents kin, profession, age, skill, rules, weapon, and armor data from an installed rules pack
- **AND** the creator does not require Dragonbane rules to be hardcoded in the UI component

### Requirement: Creator validates trained skill choices
The system SHALL enforce the number and source of trained skills required by the selected Dragonbane age and profession rules.

#### Scenario: User selects too few trained skills
- **WHEN** a user attempts to save a character with fewer trained skills than the selected age requires
- **THEN** the system prevents saving
- **AND** the user sees which trained skill requirement is incomplete

#### Scenario: User selects the required skill distribution
- **WHEN** a user selects the required number of profession skills and free-choice skills
- **THEN** the character can be saved with those trained skills

### Requirement: Creator computes derived character stats
The system SHALL compute Dragonbane derived stats from the selected rules pack and character choices.

#### Scenario: Derived stats update from attributes and kin
- **WHEN** a user changes kin or attributes during character creation
- **THEN** the creator updates hit points, willpower points, movement, damage bonuses, and carrying capacity from the rules-pack formulas or tables

### Requirement: Creator initializes equipment state
The system SHALL initialize character equipment state with inventory, readied weapons, armor, and currency structures compatible with later play systems.

#### Scenario: Character is saved with equipment structure
- **WHEN** a user saves a Dragonbane character
- **THEN** the saved sheet includes inventory, weapons, armor, and currency fields even if some are empty

### Requirement: Character creation does not require generated art
The system MUST allow a user to save a complete rules-backed Dragonbane character without generating or attaching a standee image.

#### Scenario: User saves sheet before standee generation
- **WHEN** a user completes required Dragonbane character fields and skips image generation
- **THEN** the system saves the character sheet successfully
- **AND** the character remains available for later standee generation or linking
