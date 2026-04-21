## ADDED Requirements

### Requirement: Users can browse placeable assets from one placement workflow
The editor MUST provide a unified asset placement workflow that surfaces props, openings, and decorative surface assets from one browser entry point instead of requiring separate top-level tools for each asset family.

#### Scenario: Unified browser exposes multiple asset families
- **WHEN** a user opens the asset placement workflow
- **THEN** the browser shows assets from props, openings, and decorative surface-oriented asset groups in the same browsing experience

#### Scenario: Selecting an opening does not require switching to a separate tool first
- **WHEN** a user chooses a door or stair asset from the unified browser
- **THEN** the editor prepares that asset for placement without requiring the user to switch to a different top-level tool

### Requirement: Asset-specific placement behavior remains intact inside the unified workflow
The unified asset placement workflow MUST preserve specialized placement behavior based on asset metadata and placement family rather than forcing all assets through identical placement logic.

#### Scenario: Door assets still target wall replacement behavior
- **WHEN** a user selects a door asset from the unified browser
- **THEN** placement previews and placement results target valid wall-replacement locations
- **AND** the editor does not treat the door as a generic floor prop

#### Scenario: Stair assets still use their specialized floor-link behavior
- **WHEN** a user selects a stair asset from the unified browser
- **THEN** the editor uses the stair placement behavior already required for linked floor traversal

#### Scenario: Surface-variant assets can still use fast editing interactions
- **WHEN** a user selects an asset whose intended placement mode is a surface paint or variant workflow
- **THEN** the unified workflow exposes that faster interaction model instead of degrading it to single-object point placement

### Requirement: Legacy tool selections map safely into the unified workflow
The editor MUST translate legacy prop/opening/surface placement entry points into the unified asset placement workflow without breaking dungeon loading or normal editing startup.

#### Scenario: Existing editor state opens into the unified placement tool
- **WHEN** the editor restores a previously selected prop, opening, or surface placement context
- **THEN** the editor resolves that context into the unified asset placement workflow
- **AND** a valid asset category or safe default category is selected

#### Scenario: Dungeon content remains compatible
- **WHEN** an existing dungeon containing placed props, openings, and surface variants is loaded after this change
- **THEN** existing placed content remains usable without requiring a dungeon data migration unrelated to editor UI state
