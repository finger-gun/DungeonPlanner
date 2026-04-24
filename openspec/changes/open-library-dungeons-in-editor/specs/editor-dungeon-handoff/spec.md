## ADDED Requirements

### Requirement: Editor can open an authenticated library dungeon by reference
The system SHALL allow the main editor to open a saved authenticated-app dungeon through a deep link that carries a dungeon reference and secure backend handoff data.

#### Scenario: Editor loads a referenced saved dungeon
- **WHEN** the editor is opened with a dungeon handoff reference, a valid short-lived access ticket, and a backend handoff endpoint
- **THEN** the editor fetches the saved dungeon payload from the backend
- **AND** loads that payload into the existing local editor workflow

#### Scenario: Missing backend handoff preserves normal editor startup
- **WHEN** the editor opens without valid dungeon handoff parameters
- **THEN** the editor skips remote loading
- **AND** continues using its existing local-file and local-storage startup behavior

### Requirement: Editor handoff preserves private dungeon access
The system MUST keep authenticated-app dungeon payloads private while allowing an authenticated user to open their own saved dungeons in the editor.

#### Scenario: Valid ticket grants one handoff fetch
- **WHEN** a user opens the editor from their authenticated dungeon library
- **THEN** the app issues a short-lived dungeon-specific access ticket
- **AND** the backend handoff endpoint accepts that ticket only for the referenced dungeon

#### Scenario: Invalid or expired handoff does not load private data
- **WHEN** the editor attempts to consume an invalid, reused, or expired dungeon handoff ticket
- **THEN** the backend rejects the request
- **AND** the editor does not receive the private dungeon payload
