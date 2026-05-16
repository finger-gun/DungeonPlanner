## Context

DungeonPlanner currently has two separate character-related foundations:

- the app can persist user-owned character records with freeform `sheet` data and can manage generated actor/standee packs
- the editor can ingest generated actor packs and place ready standees into 3D scenes

Dragonbane Unbound already provides a working rules-aware character creator, structured Dragonbane content packs, and TypeScript logic for derived ratings and skill validation. DungeonPlanner should reuse those ideas and source data, but should not hardcode Dragonbane rules into core editor logic or depend directly on the sibling repository at runtime.

## Goals / Non-Goals

**Goals:**

- Represent Dragonbane rules as structured DungeonPlanner rules packs, generated from Dragonbane Unbound source data.
- Store rules-backed character sheets in app/Convex as the durable source of truth.
- Provide a guided Dragonbane character creator that enforces creation rules, trained-skill counts, derived stats, and starting equipment structure.
- Connect saved rules-backed characters to existing generated standee/actor workflows.
- Project character-specific play data, especially movement and loadout summary, into the editor without storing full sheets in dungeon files.

**Non-Goals:**

- Do not parse PDFs at runtime.
- Do not hardcode Dragonbane rules, professions, skills, weapons, armor, or kin data in app/editor components.
- Do not implement full combat automation, attack resolution, damage rolls, monster stat management, or dice automation in this change.
- Do not make generated images mandatory for character creation.
- Do not migrate existing dungeon files to embed character sheets.

## Decisions

### Decision: Structured rules packs are the runtime format

PDFs and Dragonbane Unbound reference data remain source/provenance artifacts. DungeonPlanner runtime code will consume structured JSON-like pack domains such as `character.kins`, `character.professions`, `character.skills`, `character.rules`, `equipment.weapons`, and `equipment.armor`.

**Rationale:** Structured packs are diffable, testable, cacheable, and safe to validate. Runtime PDF parsing would be brittle, slow, and hard to reason about.

**Alternative considered:** Keep PDFs as installed rules packs and extract values on demand. Rejected because it would make character creation unreliable and would obscure rule changes from tests and review.

### Decision: Import from Dragonbane Unbound into private workspace packs

The first implementation should generate a private DungeonPlanner workspace add-on from `/Users/lejahmie/projects/dragonbane-unbound/`.

**Rationale:** This uses the existing local structured data and avoids manually duplicating rules. Keeping it private/workspace-scoped preserves the current licensing boundary and leaves room for later user-owned imports.

**Alternative considered:** Vendor Dragonbane Unbound packages directly. Rejected for now because DungeonPlanner should own its app/editor contracts and avoid a runtime dependency on a sibling project.

### Decision: App/Convex owns full character truth

Full rules-backed character sheets live in the app character library. Editor/dungeon state only stores references and projected summaries needed for placement and play-facing UI.

**Rationale:** Characters can exist without being placed on a map, and a placed standee is not the same as the persistent character. This also avoids broad dungeon serialization migrations.

**Alternative considered:** Serialize full character sheets into dungeon files. Rejected because it would duplicate character truth and make cross-dungeon updates difficult.

### Decision: Port Dragonbane Unbound creator logic, adapt DungeonPlanner UX

The DungeonPlanner creator should reuse Dragonbane Unbound's creation flow and calculations as the behavioral model, but implement them in DungeonPlanner shared/app modules and UI.

**Rationale:** The Unbound form already knows the important Dragonbane creation rules. Porting the logic preserves behavior while fitting DungeonPlanner's Convex, actor pack, and UI patterns.

**Alternative considered:** Embed the Unbound Next.js component. Rejected because it depends on a different app shell, API, routing, and storage model.

### Decision: Standee generation is linked, not required

Rules-backed character creation must produce a usable character sheet even if no image exists. Generated images and actor packs remain an optional visual layer linked to the saved character.

**Rationale:** This keeps character creation fast and reliable, while preserving DungeonPlanner's visual standee strengths for users who want them.

## Risks / Trade-offs

- **Rules data drift between Dragonbane Unbound and DungeonPlanner** → Mitigate with an explicit importer, source metadata, and tests that verify imported domains contain required fields.
- **Over-scoping into combat automation** → Mitigate by limiting v1 to creation-time stats, movement, inventory, weapons, and armor state.
- **Character sheet shape changes after early saves** → Mitigate with versioned sheet payloads and migration/normalization helpers before tightening Convex validation.
- **Editor becomes coupled to Dragonbane** → Mitigate by projecting generic play summaries from app data and keeping Dragonbane-specific computation in app/shared rules services.
- **Generated actor assets and rules-backed characters can diverge** → Mitigate with explicit optional linkage between a character record and actor/standee metadata.

## Migration Plan

1. Add shared types and normalizers alongside existing freeform character sheets.
2. Add importer output and pack loading without changing existing actor pack behavior.
3. Create new rules-backed characters with versioned typed sheets.
4. Keep existing freeform character records readable; migrate or normalize only when edited through the new creator.
5. Keep existing dungeon serialization unchanged unless a future change needs explicit character-reference persistence.

Rollback is straightforward while the new flow is additive: disable the new creator/routes and continue reading existing character records and generated actor packs.

## Open Questions

- Should typed sheet validation be enforced immediately in Convex, or introduced as runtime normalization first and tightened after existing records are audited?
- Should the first creator UI be a wizard or a single page with guided sections?
- Which imported Dragonbane source domains should be mandatory for the private v1 pack: core only, or core plus available add-on source data?
