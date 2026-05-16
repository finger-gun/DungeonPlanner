## ADDED Requirements

### Requirement: Character records can store typed rules-backed sheets
The system SHALL support durable character records that contain versioned, typed rules-backed character sheet data.

#### Scenario: User saves a Dragonbane character sheet
- **WHEN** a user saves a completed Dragonbane character
- **THEN** the character library stores the character as a durable record with typed sheet data, content references, and derived stat values

### Requirement: Character sheets reference rules-pack content
The system SHALL store rules-pack references for selected kin, profession, skills, weapons, and armor using canonical content references.

#### Scenario: Character uses pack-managed kin and profession
- **WHEN** a Dragonbane character is saved with selected kin and profession
- **THEN** the stored sheet identifies those selections using namespaced content references

### Requirement: Character summaries expose play-relevant values
The system SHALL provide character summaries that include play-relevant values without requiring consumers to load or interpret the full sheet.

#### Scenario: Editor requests character summary
- **WHEN** the editor needs to display or use a placed character
- **THEN** the app can provide a summary including name, movement, HP, WP, conditions, armor, weapons, and carrying load

### Requirement: Full character sheets remain outside dungeon serialization
The system MUST NOT require dungeon files to embed full rules-backed character sheets.

#### Scenario: Dungeon containing a placed character is saved
- **WHEN** a dungeon with a placed character is saved
- **THEN** the dungeon persists placement and references as needed
- **AND** the full character sheet remains owned by the character library
