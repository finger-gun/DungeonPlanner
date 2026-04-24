## ADDED Requirements

### Requirement: Dungeon masters can create durable play sessions
The system SHALL allow an authenticated user with the dm role to create a play session that can later be joined by other users.

#### Scenario: DM creates a session
- **WHEN** a user with the dm role creates a new play session
- **THEN** the system stores a durable session record owned or managed by that user

#### Scenario: Session creation returns a join mechanism
- **WHEN** a dm successfully creates a play session
- **THEN** the system provides a join mechanism that can be shared with players

### Requirement: Authenticated users can join a session through the join mechanism
The system SHALL allow authenticated users to join a play session using its join mechanism and persist their membership.

#### Scenario: Player joins with valid join mechanism
- **WHEN** an authenticated player submits a valid join mechanism
- **THEN** the system adds that player as a member of the session

#### Scenario: Join fails for invalid session reference
- **WHEN** a user submits an invalid or inactive join mechanism
- **THEN** the system rejects the join attempt

### Requirement: Live session access uses authenticated membership
The system MUST base session access on authenticated membership records instead of implicit localhost or network-location assumptions.

#### Scenario: Non-member cannot access protected session behavior
- **WHEN** an authenticated user is not a member of a session
- **THEN** the system denies protected session access

#### Scenario: Existing localhost heuristic is not authoritative
- **WHEN** a client connects from localhost without the required authenticated membership
- **THEN** the system does not grant authoritative session privileges solely because of client locality
