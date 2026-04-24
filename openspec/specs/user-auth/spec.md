# user-auth

## Purpose

Define authentication behavior for account sign-up, sign-in, sign-out, and protected feature identity in the authenticated app surface.

## Requirements

### Requirement: Users can authenticate in local Convex development
The system SHALL provide account sign-up, sign-in, and sign-out flows backed by the local Convex setup used for development.

#### Scenario: User signs up locally
- **WHEN** a new user submits valid account credentials in local development
- **THEN** the system creates an authenticated account using the local Convex-backed auth flow

#### Scenario: User signs in and receives an authenticated session
- **WHEN** an existing user submits valid credentials
- **THEN** the system establishes an authenticated session that frontend and backend features can rely on

#### Scenario: User signs out
- **WHEN** an authenticated user signs out
- **THEN** the system clears the active authenticated session and treats the user as signed out

### Requirement: Authenticated identity is available to protected features
The system MUST expose authenticated user identity to protected application features that require ownership or authorization checks.

#### Scenario: Protected route receives authenticated identity
- **WHEN** a signed-in user accesses a protected capability
- **THEN** the capability receives stable authenticated user identity for authorization and ownership decisions

#### Scenario: Anonymous user accesses a protected capability
- **WHEN** an unauthenticated user attempts to access a protected capability
- **THEN** the system denies access and presents a path to authenticate

### Requirement: Authentication first appears in the dedicated app surface
The system SHALL introduce account authentication into the dedicated authenticated app surface without requiring the existing public landing page, docs, or anonymous demo to adopt login-first behavior in the same phase.

#### Scenario: Public landing remains anonymous-first
- **WHEN** a visitor opens the public landing page during the initial platform-foundation phase
- **THEN** the visitor can view the landing experience without being forced through the authenticated app flow

#### Scenario: Auth flow enters the authenticated app surface
- **WHEN** a user chooses to sign in to the product
- **THEN** the authentication flow enters the dedicated authenticated app surface used for signed-in product features
