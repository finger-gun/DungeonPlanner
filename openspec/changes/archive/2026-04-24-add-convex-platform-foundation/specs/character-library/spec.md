## ADDED Requirements

### Requirement: Users can own persistent player character records
The system SHALL provide a character library where authenticated users can create, retrieve, update, and remove their own player character records.

#### Scenario: User creates a character record
- **WHEN** an authenticated user creates a player character
- **THEN** the system stores that character as a durable record owned by the user

#### Scenario: User lists owned characters
- **WHEN** an authenticated user views their character library
- **THEN** the system returns that user's visible character records

### Requirement: Character identity is independent of scene placement
The system MUST treat persistent player character records as a domain separate from placed map tokens or scene objects.

#### Scenario: Character exists without being placed on a map
- **WHEN** a user creates or edits a character that is not currently placed in a dungeon
- **THEN** the character remains available in the user's library

#### Scenario: Session or map references a character
- **WHEN** a dungeon or session uses a player character
- **THEN** the system references the persistent character record instead of deriving character identity only from token placement
