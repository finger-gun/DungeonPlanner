## ADDED Requirements

### Requirement: Postprocess-owned character outline
Character generation MUST rely on app postprocessing to create the white standee outline, not on model-generated sticker borders or frames.

#### Scenario: Prompt recipe forbids model-made borders and frames
- **Given** a user opens Character Sheet and views the generation recipe
- **When** the recipe is composed for an image generation request
- **Then** the recipe includes explicit constraints forbidding border, frame, nameplate, and text output
- **And** the recipe does not request a model-generated white sticker border

#### Scenario: Final standee keeps contour without frame
- **Given** a generated image that includes a character plus frame-like artifacts
- **When** the image is processed by the character postprocessing pipeline
- **Then** the final processed standee preserves a white contour around the character silhouette
- **And** rectangular frame artifacts are removed from the output

### Requirement: Frame and text artifacts are excluded
Processed generated characters MUST exclude model-introduced frame geometry and readable label overlays while preserving the main subject.

#### Scenario: Nameplate and frame are dropped during processing
- **Given** a generated source image containing a character, white frame strokes, and a text nameplate
- **When** postprocessing extracts the standee subject
- **Then** frame strokes and nameplate regions are not present in the final processed standee image
- **And** core character details remain visible and placeable as before

### Requirement: Existing placement workflows stay stable
Changes to character generation cleanup MUST NOT break character selection, placement, or runtime rendering workflows.

#### Scenario: Placement flow remains unchanged
- **Given** a processed generated character is available in Character Library
- **When** a user selects and places that character in the scene
- **Then** selection, placement, and rendering behave the same as before this change
- **And** no serialization migration is required for dungeon state
