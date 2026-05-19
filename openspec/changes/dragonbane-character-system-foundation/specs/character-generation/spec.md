## ADDED Requirements

### Requirement: Rules-backed characters can link to generated standees
The system SHALL allow a rules-backed character record to link to generated standee or actor metadata.

#### Scenario: User generates art for a saved character
- **WHEN** a user generates a standee image for a saved rules-backed character
- **THEN** the generated actor metadata can be associated with that character record
- **AND** the character remains the durable source for rules-backed stats

### Requirement: Generated standees remain optional visual assets
The system MUST treat generated standee images as optional visual assets for rules-backed characters.

#### Scenario: Character has no generated image
- **WHEN** a rules-backed character has no generated standee image
- **THEN** the character can still be saved, edited, and listed in the character library

### Requirement: Existing generated actor packs remain compatible
The system MUST keep existing generated actor pack loading and placement behavior compatible with rules-backed character work.

#### Scenario: Existing generated NPC pack is loaded
- **WHEN** the editor loads an existing generated character pack manifest
- **THEN** its actors remain selectable and placeable as before
- **AND** no rules-backed character sheet is required for those actors
