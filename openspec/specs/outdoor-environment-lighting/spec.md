# outdoor-environment-lighting

## Purpose

Define static outdoor environment lighting controls and persistence behavior compatible with indoor lighting workflows.

## Requirements

### Requirement: Outdoor maps provide static time-of-day controls
The system SHALL provide a static time-of-day control for outdoor maps that updates scene presentation parameters (lighting and atmospheric look) without running a real-time cycle.

#### Scenario: Author sets outdoor time of day
- **WHEN** the user adjusts the outdoor time-of-day control
- **THEN** the outdoor scene updates to the selected static presentation state

### Requirement: Time-of-day state is persisted per map
The system SHALL serialize and deserialize outdoor time-of-day state so saved maps reopen with the same visual environment.

#### Scenario: Reload preserves outdoor time of day
- **WHEN** the user saves and later loads an outdoor map
- **THEN** the map restores the previously selected time-of-day state

### Requirement: Indoor lighting controls remain compatible
The system SHALL keep indoor maps compatible with existing lighting behavior and SHALL NOT require outdoor-only time-of-day settings for indoor maps.

#### Scenario: Indoor map load without outdoor state
- **WHEN** an indoor map is loaded that does not include outdoor time-of-day data
- **THEN** the map loads successfully using indoor-compatible defaults
