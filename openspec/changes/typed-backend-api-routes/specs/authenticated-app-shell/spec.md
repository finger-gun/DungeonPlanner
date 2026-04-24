## MODIFIED Requirements

### Requirement: Authenticated modules are organized into dedicated pages
The authenticated application surface SHALL organize overview, dungeon, session, character, and admin tools into dedicated pages with clear in-app navigation.

#### Scenario: Signed-in users navigate between module pages
- **WHEN** an authenticated user opens the app
- **THEN** workspace navigation exposes dedicated pages for the modules available to that user instead of relying on one long scrolling page

#### Scenario: Admin tools expose nested navigation
- **WHEN** an administrator opens the admin area
- **THEN** user management and pack management appear as separately navigable admin subpages

#### Scenario: Authenticated modules load through explicit backend routes
- **WHEN** an authenticated module loads users, dungeons, sessions, characters, packs, or actor records
- **THEN** the app uses an allowlisted backend route for that operation instead of posting a Convex function name to a generic executor
