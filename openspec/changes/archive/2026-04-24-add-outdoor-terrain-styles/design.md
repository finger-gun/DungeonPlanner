## Context

The recently shipped stepped outdoor terrain feature established the right editing model—raise/lower sculpting plus top-surface painting—but the rendering model still assumes one globally fixed authored terrain kit. Every stepped top and cliff asset resolves from `Color1`, while the current paint tool only swaps among flat overlay materials (`Grass`, `Dry Dirt`, `Rough Stone`, `Wet Dirt`).

That mismatch creates two problems:

1. The user expectation is biome/style-driven: if an area is painted with a terrain style and then sculpted, the raised top surfaces and new cliffs should keep that same style.
2. The source KayKit forest pack does not treat styles as a simple grass tint. Each `ColorN` variant is a coordinated authored terrain theme with a matching top color and cliff/underside color. A correct implementation must treat these as whole terrain styles, not as a single shared cliff color plus a painted top.

## Goals / Non-Goals

**Goals:**
- Replace the legacy outdoor ground-material paint model with terrain-style painting.
- Support the curated eight authored stepped terrain styles from the forest pack.
- Add a map-level default outdoor terrain style while keeping per-cell overrides lightweight.
- Make sculpting preserve the terrain style of affected cells so newly revealed tops and cliffs stay coherent.
- Feather neighboring styles on top surfaces so biome transitions do not look unnaturally hard-edged.
- Keep the first implementation visually reliable and performant by using a simpler cliff ownership rule rather than full cliff crossfading.

**Non-Goals:**
- Supporting both the old material paint layer and the new terrain-style layer simultaneously.
- True two-style blending across a single cliff wall mesh in this change.
- A generalized biome simulation system for vegetation, props, or atmospheric effects.
- Replacing the stepped terrain geometry derivation model introduced by the previous change.

## Decisions

### 1. Treat `Color1`..`Color8` as full terrain styles, not simple palette tints
Implementation and UI should treat each supported `ColorN` variant as an authored terrain style. A terrain style determines the rendered look of:

- flat/unraised top surfaces
- raised top surfaces
- top edge and corner caps
- cliff faces and tall cliff faces

User-facing copy should refer to this workflow as `Terrain Style Paint` rather than `Surface Paint` to avoid implying that only a flat material layer is changing.

### 2. Use one dominant terrain style per cell, plus a map-level default
The persisted state model should remain cell-oriented and lightweight:

- each outdoor map has a `defaultOutdoorTerrainStyle`
- individual cells may optionally override that default with one dominant style

Unpainted cells resolve to the map default. This avoids storing style data for every untouched outdoor cell and keeps sculpting behavior simple: sculpted cells continue using their current resolved style.

This change intentionally does **not** introduce persisted per-cell multi-style weight maps. Feathering is a rendering behavior derived from neighboring dominant styles rather than authored blend-weight state.

### 3. Replace legacy material paint with terrain-style paint
The current `OutdoorGroundTextureType` model (`short-grass`, `dry-dirt`, `rough-stone`, `wet-dirt`) should be removed from the outdoor editing workflow. In its place, the paint tool should:

- present the curated supported terrain styles
- paint selected cells to the chosen style
- erase/reset cells back to the map default style

This keeps the mental model aligned with the authored terrain kit and with sculpted terrain behavior.

### 4. Feather only top-surface style boundaries in V1
When neighboring cells resolve to different terrain styles, the renderer should add soft top-surface transitions between them. This applies to:

- flat ground transitions on the outdoor base surface
- transitions across stepped top surfaces and top caps

The transition should visually soften biome boundaries without requiring full multi-style geometry ownership changes.

This is a visual rendering effect derived from neighboring style differences, not a serialized paint-weight field.

### 5. Cliff faces belong to the dominant style of the higher cell in V1
When adjacent cells of different elevation also resolve to different terrain styles, the rendered cliff face should use the style of the higher cell.

Examples:

- raised `Color2` next to lower `Color1` ground → cliff face uses `Color2`
- pit floor `Color3` below surrounding `Color1` terrain → inward cliff faces use `Color1`

This rule keeps the stepped terrain readable and predictable while avoiding muddy cliff crossfades. A future change may add subtle lip/base seam softening or true multi-style cliff blending if needed, but that is explicitly out of scope here.

### 6. Import and derive maintained runtime assets for every supported terrain style
The maintained runtime terrain kit should expand from `Color1` to all curated supported styles (`Color1`..`Color8`). For each style, the asset pipeline should preserve:

- required stepped terrain `.gltf`/`.bin` assets for blocks, tops, cliffs, and tall cliffs
- any shared source textures needed by those assets
- a derived flat top-surface runtime texture sampled from the style's atlas for base-ground and blend rendering

This allows flat ground and explicit stepped terrain meshes to share the same authored style identity.

### 7. Migration favors safe loading over preserving legacy material accents
Legacy outdoor material-paint data does not map cleanly onto the new terrain-style model. This change should favor safe, predictable loading rather than speculative color/style inference.

Migration rule:

- older files with legacy outdoor material-paint assignments still load successfully
- legacy outdoor material-paint overrides are cleared during migration
- affected terrain resolves to the map default terrain style after migration unless later repainted by the user

This is intentionally lossy for old dirt/stone/wet-dirt accents, but it avoids incorrect automatic style guesses and keeps the migration deterministic.

## Architecture Notes

### Store shape
The single-source-of-truth store should evolve from legacy ground-texture paint records toward terrain-style overrides. Conceptually:

```text
outdoor default style
        +
per-cell terrain style overrides
        +
terrain heightfield
        ↓
derived render records for tops, transitions, and cliffs
```

Likely store concerns:

- map-level default terrain style
- selected terrain style brush
- per-cell terrain style overrides
- paint/reset actions that update those overrides

### Derived rendering
`outdoorTerrainDerived.ts` should derive, per relevant cell:

- resolved dominant terrain style
- top-surface render records
- style-boundary transition records for top surfaces
- cliff records using higher-cell style ownership

The renderer should then choose style-specific meshes/textures from those derived records.

### UI
`RoomToolPanel.tsx` should rename the current outdoor paint workflow from `Surface Paint` to `Terrain Style Paint`, and present the curated styles as selectable brushes. The panel should also expose the current map default terrain style in a way that is understandable for new-map setup and reset behavior.

## Risks / Tradeoffs

### 1. Clearing legacy material paint is visually lossy
Old outdoor maps that used dirt/stone/wet-dirt accents will lose those exact accents after migration. This is acceptable for this change because the old model is being fully replaced and there is no trustworthy one-to-one mapping to the new authored terrain styles.

### 2. Top-only feathering may still leave some style boundaries visible on cliffs
Because cliffs remain single-owner in V1, terrain-style boundaries with elevation changes will still show crisp ownership on the vertical face. This is a deliberate tradeoff to keep the first implementation reliable and avoid visually muddy cliff blends.

### 3. Asset footprint increases meaningfully
Supporting eight full stepped terrain style kits expands maintained runtime assets and possibly build output size. That is acceptable because these are the authored assets required to make terrain-style painting coherent.

## Validation Strategy

- Add store tests for default-style resolution, style paint/reset actions, and sculpt preservation of style ownership.
- Add serialization tests for the new default style and per-cell style override data, plus migration coverage from legacy material-paint saves.
- Add stepped terrain asset tests ensuring every supported style resolves maintained runtime assets.
- Add derived-terrain tests covering top-surface style transitions and higher-cell cliff ownership.
- Run `pnpm run test` and `pnpm run build` after implementation lands.
