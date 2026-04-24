# rules-pack-interop

## Purpose

Define canonical namespaced pack references and shared registry behavior for asset packs and rules or data packs.

## Requirements

### Requirement: Persisted cross-pack references use namespaced content identifiers
The system SHALL use canonical namespaced content references in the form `packId:localId` for persisted references to pack-managed content.

#### Scenario: Persisted content reference includes namespace
- **WHEN** the system stores a reference to pack-managed content
- **THEN** the stored reference uses the `packId:localId` form

#### Scenario: Two packs reuse the same local identifier
- **WHEN** two different packs contain the same local identifier
- **THEN** the system distinguishes them by pack namespace

### Requirement: The platform supports both scene asset packs and rules/data packs
The system SHALL support a shared registry model that can represent scene asset packs and structured rules/data packs without requiring them to share identical runtime behavior.

#### Scenario: Asset pack and rules pack coexist
- **WHEN** the platform registers both a scene asset pack and a rules/data pack
- **THEN** the system can represent both under the shared pack model

#### Scenario: Rules/data pack does not require executable client code
- **WHEN** a rules/data pack is registered
- **THEN** the system does not require arbitrary runtime code execution as a prerequisite for storing or identifying the pack
