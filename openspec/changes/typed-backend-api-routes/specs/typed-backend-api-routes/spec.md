## ADDED Requirements

### Requirement: Browser app data calls use allowlisted backend routes
The system SHALL expose authenticated app data operations through explicit backend routes instead of accepting arbitrary Convex function names from the browser.

#### Scenario: Supported app query uses a route
- **WHEN** the authenticated app requests a supported read operation
- **THEN** the browser calls the specific backend route for that operation
- **AND** the request body does not include a Convex function name

#### Scenario: Supported app mutation uses a route
- **WHEN** the authenticated app submits a supported write operation
- **THEN** the browser calls the specific backend route for that operation
- **AND** the server invokes the corresponding Convex mutation from server-owned code

#### Scenario: Unsupported operation is rejected before proxying
- **WHEN** app code attempts to call a Convex operation that has not been added to the backend route allowlist
- **THEN** the app data transport rejects the call instead of sending it to a generic backend executor

### Requirement: Server retains backend-owned Convex authentication
The system MUST keep Convex authentication tokens owned by the backend facade for authenticated app data operations.

#### Scenario: Browser requests authenticated app data
- **WHEN** a browser calls an authenticated app data route
- **THEN** the backend resolves the viewer's Convex access token from server-managed auth state
- **AND** the browser does not provide a Convex token directly for that call

#### Scenario: Expired token can be refreshed
- **WHEN** Convex rejects an authenticated app data call because the token is expired
- **THEN** the backend attempts the operation again with a freshly resolved token

### Requirement: Editor facade routes use an explicit API namespace
The system SHALL expose editor handoff operations through `/api/editor/...` and session handoff through `/api/session-access/...`.

#### Scenario: Editor lists private library dungeons
- **WHEN** the editor lists dungeons using a valid editor access token
- **THEN** it posts to the backend's `/api/editor/dungeons/list` route

#### Scenario: Editor lists private actor records
- **WHEN** the editor lists actors using a valid editor access token
- **THEN** it posts to the backend's `/api/editor/actors/list` route

#### Scenario: Session access is consumed through the API namespace
- **WHEN** a session access ticket is consumed through the backend facade
- **THEN** the browser-facing route is `/api/session-access/consume`
