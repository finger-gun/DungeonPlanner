# content-pack-registry

## Purpose

Define admin-managed content pack registration, file linkage, activation, workspace scoping, visibility, and canonical metadata behavior.

## Requirements

### Requirement: Admins can manage registered content packs
The system SHALL provide an admin-managed registry for content packs, including pack metadata, ownership context, and activation state.

#### Scenario: Admin registers a content pack
- **WHEN** an admin creates or uploads a content pack record
- **THEN** the system stores pack metadata in the registry

#### Scenario: Non-admin cannot manage pack registry
- **WHEN** a non-admin user attempts to create or modify a content pack record
- **THEN** the system denies the operation

### Requirement: Registered packs can reference stored files
The system SHALL support associating registry entries with backend-managed file storage for pack assets or pack data files.

#### Scenario: Pack record references uploaded files
- **WHEN** a pack includes uploaded assets or structured data files
- **THEN** the registry stores references to the corresponding backend-managed files

### Requirement: Pack activation is explicit and durable
The system MUST persist whether a registered pack is active for use rather than inferring availability only from files present in the repository.

#### Scenario: Admin activates a pack
- **WHEN** an admin marks a registered pack as active
- **THEN** the system persists the pack's active state for downstream consumers

#### Scenario: Inactive pack is not treated as available
- **WHEN** a registered pack is inactive
- **THEN** the system does not expose it as active content for dependent features

### Requirement: Pack availability is scoped to the DM workspace
The system SHALL scope rules/data pack availability to the DM workspace that owns or manages the pack access policy.

#### Scenario: Session inherits workspace pack availability
- **WHEN** a player participates in a session under a DM workspace
- **THEN** the player can access pack content allowed by that DM workspace

#### Scenario: Unrelated workspace does not inherit pack access
- **WHEN** a user is outside the owning DM workspace or its sessions
- **THEN** the system does not grant that user access to workspace-scoped pack availability

### Requirement: Pack visibility modes are explicit
The system MUST support explicit pack visibility modes of `global`, `public`, and `private` for the first phase of admin-managed pack access.

#### Scenario: Global pack is forced active
- **WHEN** a pack is marked `global`
- **THEN** the system treats it as forced active within the owning workspace scope

#### Scenario: Public pack is user-visible
- **WHEN** a pack is marked `public`
- **THEN** authorized users in the owning workspace scope can see and use it

#### Scenario: Private pack is hidden from regular users
- **WHEN** a pack is marked `private`
- **THEN** regular users do not see it as available content

### Requirement: Canonical pack metadata includes placement-critical fields
The system SHALL store canonical pack metadata sufficient for registry management, access control, file linkage, and generic placement behavior.

#### Scenario: Registry stores canonical pack and asset metadata
- **WHEN** an admin registers a pack
- **THEN** the system stores canonical pack-level metadata and asset-level placement-critical metadata needed for identity, browsing, and activation
