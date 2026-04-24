## ADDED Requirements

### Requirement: The signed-in product uses a dedicated authenticated app surface
The system SHALL introduce a dedicated authenticated application surface rooted in `app/` for signed-in user flows.

#### Scenario: Authenticated app runs separately from existing public surfaces
- **WHEN** local development is configured for the authenticated product
- **THEN** the signed-in application surface runs without requiring `web/`, `docs-web/`, or the anonymous demo/editor to be restructured first

#### Scenario: Signed-in flows are routed into the authenticated app surface
- **WHEN** a user enters the authenticated product experience
- **THEN** account-aware flows such as libraries, sessions, and admin features are served from the dedicated authenticated app surface

### Requirement: Existing public surfaces remain unchanged during the first phase
The system MUST keep the current landing page, docs output, and anonymous demo/editor surfaces intact during the initial platform-foundation phase.

#### Scenario: Landing page remains a static public surface
- **WHEN** the first platform-foundation slice is delivered
- **THEN** the existing `web/` landing page remains available as a public surface

#### Scenario: Docs and demo are not forced into the authenticated shell
- **WHEN** the authenticated app surface is introduced
- **THEN** `docs-web/` and the current anonymous demo/editor continue to operate without requiring immediate consolidation into the authenticated app
