## MODIFIED Requirements

### Requirement: Authenticated users can own and retrieve saved dungeons
The system SHALL allow authenticated users to create, list, open in the main editor, load, update, copy, and delete durable dungeon records they own.

#### Scenario: User saves a dungeon to their library
- **WHEN** an authenticated user explicitly saves a dungeon
- **THEN** the system stores the dungeon under that user's ownership

#### Scenario: User lists owned dungeons
- **WHEN** an authenticated user opens their dungeon library
- **THEN** the system returns only dungeon records visible to that user

#### Scenario: User opens a saved dungeon in the editor
- **WHEN** an authenticated user chooses a saved dungeon from their library
- **THEN** the system opens the main editor for that dungeon
- **AND** the editor restores the saved dungeon into the local editing workflow

#### Scenario: User copies a saved dungeon from the library
- **WHEN** an authenticated user chooses to copy one of their saved dungeons
- **THEN** the system creates a new private dungeon record owned by that user
- **AND** the copied record preserves the original dungeon payload as the starting point

#### Scenario: User deletes a saved dungeon from the library
- **WHEN** an authenticated user explicitly confirms deletion for one of their saved dungeons
- **THEN** the system removes that dungeon record from their private library

### Requirement: Local editing remains responsive and explicit
The system MUST preserve local-first dungeon editing and SHALL only treat backend persistence as a result of explicit save, load, or publish actions.

#### Scenario: Unsaved local edits remain local
- **WHEN** a user edits a dungeon in the scene editor without saving
- **THEN** the system keeps the edits in local editor state instead of requiring immediate backend persistence

#### Scenario: Saved dungeon can be restored into editor state
- **WHEN** a user loads a saved dungeon from the library
- **THEN** the system restores the saved dungeon into the local editor workflow without breaking existing editing behavior

#### Scenario: Backend handoff is unavailable
- **WHEN** a user opens the editor without a valid authenticated backend handoff
- **THEN** the editor continues to support its existing local save and load workflows
- **AND** the lack of backend connectivity does not break anonymous or local-first editing

#### Scenario: Backend-aware editor save updates the private library
- **WHEN** a user saves from the main editor while a valid authenticated backend session is available
- **THEN** the editor stores the current dungeon in that user's private library
- **AND** later saves update the same durable record until the user opens or creates a different dungeon
