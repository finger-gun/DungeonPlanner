## MODIFIED Requirements

### Requirement: Live session access uses authenticated membership
The system MUST base session access on authenticated membership records instead of implicit localhost or network-location assumptions.

#### Scenario: Non-member cannot access protected session behavior
- **WHEN** an authenticated user is not a member of a session
- **THEN** the system denies protected session access

#### Scenario: Existing localhost heuristic is not authoritative
- **WHEN** a client connects from localhost without the required authenticated membership
- **THEN** the system does not grant authoritative session privileges solely because of client locality

#### Scenario: Session ticket consumption uses an explicit backend route
- **WHEN** a client consumes a session access ticket through the backend facade
- **THEN** the request uses `/api/session-access/consume`
