## 1. Rules Pack Foundation

- [x] 1.1 Define shared TypeScript types for Dragonbane rules-pack domains: kins, professions, skills, creation rules, weapons, armor, and source provenance.
- [x] 1.2 Add normalizers and validators for namespaced Dragonbane content refs used by rules packs and character sheets.
- [x] 1.3 Extend app pack handling so `rules` packs can store and expose structured domain payloads without executable client code.
- [x] 1.4 Add tests for rules-pack domain validation, source metadata, and coexistence with existing asset/generated actor packs.

## 2. Dragonbane Unbound Import Pipeline

- [x] 2.1 Create an importer script that reads Dragonbane Unbound content from `/Users/lejahmie/projects/dragonbane-unbound/`.
- [x] 2.2 Normalize imported Dragonbane content into DungeonPlanner private workspace rules-pack payloads.
- [x] 2.3 Include source/provenance metadata for source repo, source paths, generation time, and pack version.
- [x] 2.4 Add importer tests with fixture data covering kins, professions, skills, rules, weapons, and armor.

## 3. Typed Character Sheet Domain

- [x] 3.1 Add shared versioned character sheet types for Dragonbane identity, attributes, derived ratings, skills, conditions, HP/WP, inventory, weapons, armor, and currency.
- [x] 3.2 Add sheet normalization and migration helpers so existing freeform character records remain readable.
- [x] 3.3 Update Convex character save/read paths to preserve typed Dragonbane sheets and content refs.
- [x] 3.4 Add tests for typed sheet persistence, normalization, and summary generation.

## 4. Character Creation Rules Engine

- [x] 4.1 Port Dragonbane Unbound character calculation logic into DungeonPlanner shared/app modules without a runtime dependency on the sibling repo.
- [x] 4.2 Implement trained-skill slot calculation and validation from selected age and profession.
- [x] 4.3 Implement derived-stat calculation for HP, WP, movement, damage bonuses, and carrying capacity from rules-pack data.
- [x] 4.4 Implement equipment initialization for inventory, ready weapons, armor slots, and currency.
- [x] 4.5 Add unit tests for skill validation, derived stats, and equipment initialization.

## 5. App Character Creator UI

- [x] 5.1 Build the Dragonbane character creator surface using DungeonPlanner app UI patterns.
- [x] 5.2 Load available Dragonbane rules packs and populate kin, profession, age, skill, weapon, and armor options from pack data.
- [x] 5.3 Provide live derived-stat previews as character choices change.
- [x] 5.4 Enforce required fields and trained-skill counts before save.
- [x] 5.5 Save completed rules-backed characters to the character library.
- [x] 5.6 Add app UI tests for successful creation and validation failures.

## 6. Standee and Editor Integration

- [x] 6.1 Link saved rules-backed character records to optional generated actor/standee metadata.
- [x] 6.2 Preserve existing generated actor-pack loading and placement behavior for actors without rules-backed sheets.
- [x] 6.3 Expose character summaries for editor consumption, including name, movement, HP/WP, conditions, weapons, armor, and carrying load.
- [x] 6.4 Update editor character UI or movement overlays to consume projected movement values where a linked character summary is available.
- [x] 6.5 Add tests that existing generated NPC packs still load and rules-backed characters can appear without generated images.

## 7. Verification

- [x] 7.1 Run targeted unit tests for shared rules, importer, app character flows, and editor actor-pack compatibility.
- [x] 7.2 Run `pnpm run build` after implementation changes.
- [x] 7.3 Run broader verification (`pnpm run test` or `pnpm run verify`) before marking the change complete.
