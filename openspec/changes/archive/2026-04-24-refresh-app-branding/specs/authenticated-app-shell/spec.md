## ADDED Requirements

### Requirement: The authenticated app reflects DungeonPlanner brand identity
The authenticated application surface in `app/` SHALL use the same core DungeonPlanner visual identity established by the public `web/` experience, including logo usage, typography, dark fantasy-themed surfaces, and warm accent styling.

#### Scenario: Signed-out users enter a branded product shell
- **WHEN** a user opens the authenticated app before signing in
- **THEN** the header, hero, and authentication card present recognizable DungeonPlanner branding instead of a generic prototype-style shell

#### Scenario: Signed-in users stay within the same product identity
- **WHEN** an authenticated user navigates the libraries, sessions, characters, or admin modules in `app/`
- **THEN** the shell continues to use the same branded theme, logo treatment, and visual hierarchy across those authenticated workflows

### Requirement: The authenticated app reuses the public-site primary navigation pattern
The authenticated application surface MUST present the same primary header structure used by `web/`, including the DungeonPlanner logo treatment and external navigation links, with one added login or workspace entry into the app itself.

#### Scenario: Users see a familiar primary header
- **WHEN** a user opens the authenticated app
- **THEN** the header mirrors the public-site navigation pattern for brand, Demo, Docs, and GitHub links, plus a login or workspace link for the app

### Requirement: Signed-out routes separate marketing and authentication
The authenticated application surface SHALL use the signed-out default route as the public marketing experience and expose login on its own route.

#### Scenario: Signed-out users land on the marketing page
- **WHEN** a signed-out user opens the app at the default route
- **THEN** the visible page matches the public `web/` marketing experience rather than showing the login form inline

#### Scenario: Signed-out users open a dedicated login screen
- **WHEN** a signed-out user chooses the login entry from navigation
- **THEN** the app routes them to a dedicated login screen that contains the authentication form

### Requirement: Authenticated modules are organized into dedicated pages
The authenticated application surface SHALL organize overview, dungeon, session, character, and admin tools into dedicated pages with clear in-app navigation.

#### Scenario: Signed-in users navigate between module pages
- **WHEN** an authenticated user opens the app
- **THEN** workspace navigation exposes dedicated pages for the modules available to that user instead of relying on one long scrolling page

#### Scenario: Admin tools expose nested navigation
- **WHEN** an administrator opens the admin area
- **THEN** user management and pack management appear as separately navigable admin subpages

### Requirement: Branded styling preserves application readability
The authenticated application surface MUST preserve legibility, interaction clarity, and role-aware task scanning while adopting the DungeonPlanner brand theme.

#### Scenario: Dense workflows remain readable after the visual refresh
- **WHEN** a dungeon master or admin views forms, status cards, saved records, and module sections in the authenticated app
- **THEN** inputs, selected records, notices, and action buttons remain visually distinct and easy to scan

#### Scenario: Public and authenticated surfaces remain distinct deployments
- **WHEN** the authenticated app styling is updated to match the public brand
- **THEN** the existing `web/` landing page remains unchanged and the authenticated shell still runs from the separate `app/` workspace
