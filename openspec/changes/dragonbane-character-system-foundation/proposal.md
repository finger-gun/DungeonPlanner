## Why

DungeonPlanner can already create and place generated standee actors, but those actors do not carry the Dragonbane character rules needed for play: attributes, trained skills, movement, hit points, carrying capacity, weapons, or armor. Adding a rules-backed character creator now lets GMs and players create usable characters as quickly as they create maps, while preserving the current fast 3D editing workflow.

## What Changes

- Add a Dragonbane character creation flow in the authenticated app that understands installed rules-pack data for kins, professions, skills, derived ratings, and starting equipment.
- Introduce structured Dragonbane character sheet data for identity, attributes, skills, derived stats, HP/WP, inventory, weapons, armor, and conditions.
- Extend rules/data pack interop so Dragonbane rules are available as structured packs, generated from the Dragonbane Unbound source repository rather than hardcoded in DungeonPlanner.
- Treat PDFs and Dragonbane Unbound reference data as source/provenance artifacts; use structured pack data as the runtime format.
- Connect rules-backed characters to the existing generated actor/standee workflow so a saved character can also have a placeable 3D standee.
- Surface play-relevant computed values, starting with character-specific movement and loadout summaries, without making the dungeon file the source of truth for full character sheets.
- Keep attacks, dice roll automation, damage resolution, monster stat management, and full combat automation out of this first change.
- No intentional breaking changes to existing dungeons, generated actor packs, or static scene content packs.

## Capabilities

### New Capabilities

- `dragonbane-character-creation`: Rules-backed Dragonbane character creation, derived stats, skill selection validation, and equipment initialization.

### Modified Capabilities

- `rules-pack-interop`: Add requirements for structured rules-pack domains, source/provenance metadata, and runtime use without hardcoded Dragonbane rules.
- `character-library`: Add requirements for storing typed rules-backed character sheets while keeping character identity separate from scene placement.
- `character-generation`: Add requirements for linking generated standee actors to rules-backed characters without making image generation mandatory.

## Impact

- **App UI:** new or revised character creation/editing surfaces in `app/src`.
- **Convex schema and functions:** character records and pack records may need additional typed fields or validation around rule-pack refs and sheet payloads.
- **Shared types:** new shared Dragonbane-ready character sheet, content ref, rules-pack, and derived-stat types.
- **Rules/import tooling:** new importer or generator that reads `$DRAGONBANE_UNBOUND_PATH` or `<repo-root>/dragonbane-unbound/` and emits DungeonPlanner-compatible private workspace rules packs.
- **Editor integration:** existing actor-pack loading remains, but editor character panels and movement overlays can consume computed character summaries.
- **Serialization compatibility:** dungeon files should continue storing placed object refs only; full character sheets remain in app/Convex to avoid broad dungeon serialization migrations.
- **UX:** character creation should stay guided and rules-aware; map editing, camera behavior, and placement speed should remain unchanged.
