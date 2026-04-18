# OpenSpec Change: Character outline owned by postprocess

## Problem framing
Generated character images sometimes include model-produced sticker frames, white rectangular borders, and nameplates. These artifacts reduce tabletop readability and break the intended standee style.

## Expected user impact
Game Masters get cleaner standees: a white contour around the character only, without extra frame geometry or text plates.

## Proposed approach
1. Update character-generation prompt instructions to explicitly forbid model-generated borders/frames/nameplates/text.
2. Keep the white outline as a postprocess responsibility only.
3. Strengthen postprocess subject extraction to remove frame-like connected components while preserving the main character silhouette.

## In scope
- Prompt recipe updates for generated characters.
- Postprocess masking/selection logic improvements to remove frame artifacts.
- UI copy update in Character Sheet “Generation Recipe” to match new behavior.
- Tests for prompt composition and postprocess frame-removal behavior.

## Out of scope
- Changing standee 3D geometry or base materials.
- Reworking model hosting/runtime behavior in Ollama.
- Migrating existing saved assets automatically.

## UX implications
- New generations should keep a clean white contour around the character body.
- Rectangular frame lines and label plates should not appear in processed output.
- Existing editing and placement flow remains unchanged.

## Compatibility and risks
- No serialized schema changes expected.
- Previously generated assets may still contain old frame artifacts until regenerated.
- Over-aggressive mask cleanup could remove thin character details; tests and thresholds must protect against this.
