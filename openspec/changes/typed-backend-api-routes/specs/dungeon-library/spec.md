## MODIFIED Requirements

### Requirement: Authenticated users can own and retrieve saved dungeons
The system SHALL allow authenticated users to create, list, load, and update durable dungeon records they own.

#### Scenario: User saves a dungeon to their library
- **WHEN** an authenticated user explicitly saves a dungeon
- **THEN** the system stores the dungeon under that user's ownership

#### Scenario: User lists owned dungeons
- **WHEN** an authenticated user opens their dungeon library
- **THEN** the system returns only dungeon records visible to that user

#### Scenario: Dungeon library operations use explicit backend routes
- **WHEN** the app or editor performs a dungeon library operation through the backend facade
- **THEN** the request uses a resource-specific backend API route rather than a generic function proxy
