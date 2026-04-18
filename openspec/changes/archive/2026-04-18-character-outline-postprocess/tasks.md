## Tasks

- [x] Update prompt recipe
  - Remove language encouraging model-made sticker borders.
  - Add explicit negatives: no frame, no border, no nameplate, no text, no logos/watermarks.

- [x] Improve postprocess subject isolation
  - Keep dominant character component and drop frame-like components.
  - Add heuristics for thin rectangular white structures and edge-connected frame artifacts.
  - Preserve intended postprocess white contour generation.

- [x] Update Character Sheet recipe copy
  - Reflect that border is produced in app postprocessing, not requested from model output.

- [x] Add/adjust tests
  - Prompt composition test for new border/frame constraints.
  - Postprocessing tests for frame-removal cases and silhouette preservation.

- [x] Validation
  - Run: `pnpm run test`
  - Run: `pnpm run build`
