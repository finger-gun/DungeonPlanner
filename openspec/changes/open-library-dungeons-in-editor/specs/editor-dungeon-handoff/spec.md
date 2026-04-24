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
The system MUST keep authenticated-app dungeon payloads private while allowing an authenticated user to open and manage their own saved dungeons in the editor.

#### Scenario: Valid editor session token grants library access
- **WHEN** a user opens the editor from their authenticated dungeon library
- **THEN** the app issues a short-lived editor session token
- **AND** the backend accepts that token only for the issuing viewer's private dungeon-library operations within the active workspace

#### Scenario: Invalid or expired handoff does not load private data
- **WHEN** the editor attempts to use an invalid or expired editor session token
- **THEN** the backend rejects the request
- **AND** the editor does not receive the private dungeon payload

### Requirement: Editor file actions use the private library when backend access is available
The system SHALL switch the editor's primary Open and Save actions to the private authenticated dungeon library whenever a valid backend editor session is available.

#### Scenario: Editor opens the private dungeon library modal
- **WHEN** backend editor access is available and the user chooses Open in the editor
- **THEN** the editor shows a library modal listing the viewer's saved dungeons
- **AND** each listed dungeon exposes direct open, copy, and delete actions

#### Scenario: Editor keeps local JSON import and export available
- **WHEN** backend editor access is available
- **THEN** the editor still allows manual JSON import and export as explicit local tools
- **AND** those tools remain separate from the primary backend Save and Open actions
