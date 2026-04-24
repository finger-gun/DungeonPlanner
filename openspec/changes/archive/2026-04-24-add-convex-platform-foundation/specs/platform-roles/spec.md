## ADDED Requirements

### Requirement: Users can hold multiple platform roles
The system SHALL support assigning any combination of the roles `admin`, `dm`, and `player` to a single user.

#### Scenario: User has multiple roles
- **WHEN** a user is assigned more than one platform role
- **THEN** the system recognizes all assigned roles during authorization

#### Scenario: User has no elevated role
- **WHEN** a user is authenticated without admin or dm privileges
- **THEN** the system limits that user to capabilities available to players

### Requirement: Role-restricted operations are enforced consistently
The system MUST enforce role checks for protected operations in both UI affordances and backend execution paths.

#### Scenario: Admin-only operation is blocked for non-admin
- **WHEN** a non-admin user attempts to perform an admin-only operation
- **THEN** the system denies the operation

#### Scenario: DM operation is available to authorized user
- **WHEN** a user with the dm role accesses a DM-scoped operation
- **THEN** the system permits the operation without requiring admin privileges
