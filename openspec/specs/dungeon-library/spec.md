# dungeon-library

## Purpose

Define durable dungeon ownership, explicit save and load behavior, and compatibility for portable dungeon data.

## Requirements

### Requirement: Authenticated users can own and retrieve saved dungeons
The system SHALL allow authenticated users to create, list, load, and update durable dungeon records they own.

#### Scenario: User saves a dungeon to their library
- **WHEN** an authenticated user explicitly saves a dungeon
- **THEN** the system stores the dungeon under that user's ownership

#### Scenario: User lists owned dungeons
- **WHEN** an authenticated user opens their dungeon library
- **THEN** the system returns only dungeon records visible to that user

### Requirement: Dungeon library persistence starts with explicit manual saves
The system MUST treat backend-backed dungeon persistence as an explicit manual save operation and SHALL start with latest-only durable records instead of automatic revision history.

#### Scenario: Unsaved edits do not create backend revisions
- **WHEN** a user changes a dungeon locally without invoking save
- **THEN** the system does not create an automatic backend revision for those edits

#### Scenario: Manual save updates the latest durable record
- **WHEN** a user explicitly saves a dungeon
- **THEN** the system updates the latest durable record for that saved dungeon instead of creating automatic revision history

### Requirement: Local editing remains responsive and explicit
The system MUST preserve local-first dungeon editing and SHALL only treat backend persistence as a result of explicit save, load, or publish actions.

#### Scenario: Unsaved local edits remain local
- **WHEN** a user edits a dungeon in the scene editor without saving
- **THEN** the system keeps the edits in local editor state instead of requiring immediate backend persistence

#### Scenario: Saved dungeon can be restored into editor state
- **WHEN** a user loads a saved dungeon from the library
- **THEN** the system restores the saved dungeon into the local editor workflow without breaking existing editing behavior

### Requirement: Existing portable dungeon data remains loadable
The system MUST preserve compatibility for existing serialized dungeon payloads used by current local save/load workflows.

#### Scenario: Existing dungeon JSON remains usable
- **WHEN** a dungeon created before backend-backed library support is loaded
- **THEN** the system accepts the serialized dungeon payload without requiring the user to recreate the map
