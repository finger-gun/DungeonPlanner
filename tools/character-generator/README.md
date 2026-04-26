# Character generator

Batch-generate Dragonbane TTRPG character portraits from lists of kins, professions, and traits.

The generator:

- downloads required Hugging Face models if they are missing
- creates a base image for every `kin x profession x trait` combination
- detects the primary face on the generated image
- removes the background from the full image
- saves a padded face portrait crop from the transparent main image

## Default models

- **Image generation:** `black-forest-labs/FLUX.2-klein-4B`
- **Background removal:** `briaai/RMBG-1.4`
- **Illustrated face detection:** `Fuyucchi/yolov8_animeface`

The default face detector is a YOLOv8 model trained for anime and illustrated faces, which is a better starting point for fantasy character art than photo-only face detectors.

## Requirements

- Python 3.11+
- A Hugging Face account with access to any gated models you want to use
- Enough local GPU memory for your chosen model

The default pure-Python stack targets a 32 GB class machine more safely by using `FLUX.2-klein-4B` instead of the heavier 9B stack.

## Install

```bash
cd tools/character-generator
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[test]"
```

## Run

Using a single YAML config file:

```bash
python -m character_generator \
  --config-file ./examples/character-config.yaml \
  --output-dir ./output
```

Example YAML:

```yaml
base_prompt: |
  Fantasy tabletop character concept art of a single full-body fantasy character.
  Art style: Old-school fantasy RPG style, vintage monster manual art, pen and ink with muted earthy watercolor wash, bold black outlines, gritty dark fantasy aesthetic, crosshatching shading.
  Expression: {stern and focused|calm and watchful|wild-eyed and intense|confident and proud|melancholic and distant|suspicious and guarded|cheerful and bold|grim and battle-worn|mysterious and unreadable|arrogant and theatrical|wise and tired|nervous but determined|cold and calculating|warm and heroic|haunted and sorrowful}.
  Extra details: {old scars|mud-stained boots|travel-worn cloak|small trophies|carved charms|patched fabric|metal buckles|leather straps|handmade jewelry|weathered weapons|ancient symbols|ink stains|burn marks|ritual tattoos|braided hair or fur|feathers or beads|small animal bones|coin pouches|maps and scrolls|glowing magical details|family heirloom|profession symbols|battle damage|carefully maintained gear}.
  Centered character, clearly readable, full body, visible from head to toe, strong silhouette, clean crisp edges, polished fantasy concept art, tabletop RPG book illustration style, detailed materials, even lighting, clear green screen background, no scenery, no environment, no floor, no shadows.
kins:
  - Human
  - Halfling
  - Dwarf
  - Elf
  - Mallard
  - Wolfkin
  - Orc
  - Ogre
  - Goblin
  - Hobgoblin
  - Frog People
  - Karkion
  - Cat People
  - Lizard People
  - Satyr
professions:
  - Artisan
  - Bard
  - Fighter
  - Hunter
  - Knight
  - Mage
  - Mariner
  - Merchant
  - Scholar
  - Thief
traits:
  - Battle-scarred stoic guardian
  - Shadowy mask-wearing outcast
  - Flamboyant showoff
  - Mud-stained wilderness survivor
  - Rune-covered haunted mystic
```

The YAML file can hold `base_prompt`, `kins`, `professions`, and `traits`. CLI flags still work and are appended on top of the YAML lists, while `--base-prompt` overrides the YAML prompt.

Using newline-delimited files:

Lines starting with `#` or `//` are ignored, so you can comment out entries quickly.

```bash
python -m character_generator \
  --kins-file ./examples/kins.txt \
  --professions-file ./examples/professions.txt \
  --traits-file ./examples/traits.txt \
  --base-prompt ./examples/base-prompt.txt \
  --output-dir ./output
```

`--base-prompt` accepts either literal prompt text or a path to a text file.

Comfy-style dynamic prompt groups are supported in prompt text and prompt files. For example,
`{red|blue|green}` picks one option for each generated combination. If you pass `--seed`, it is
used as a reproducible **master seed** for the batch, and each character generation gets its own
derived seed so image generation and prompt expansion still vary across the run.

Using inline values:

```bash
python -m character_generator \
  --kin Human --kin Mallard \
  --profession Mage --profession Hunter \
  --trait "scarred veteran" --trait "stern gaze" \
  --base-prompt "Dragonbane character portrait, full body, readable face, neutral background."
```

Using JSON arrays:

```bash
python -m character_generator \
  --kins-json '["Human", "Wolfkin", "Mallard"]' \
  --professions-json '["Mage", "Bard"]' \
  --traits-json '["scarred veteran", "grim smile"]'
```

## Output files

For each combination, the generator writes:

- `{kin-slug}-{profession-slug}-{trait-index}-main-{serial}.png`
- `{kin-slug}-{profession-slug}-{trait-index}-portrait-{serial}.png`

Example:

- `human-mage-01-main-0001.png`
- `human-mage-01-portrait-0001.png`

`trait-index` is derived from the position of the trait in the input list, and `serial` increments to avoid overwriting earlier runs.

## Notes

- Hugging Face downloads are filtered to the files needed for local inference instead of cloning entire model repos.
- Download output now shows a selected-files total and then each file name with its individual size as it downloads.
- Background removal uses the open `briaai/RMBG-1.4` Hugging Face weights, estimates the flat backdrop color from the image corners, and decontaminates edge pixels before writing transparency. This helps reduce green-screen style fringe on the cutout.
- `--flux-vae-model-id` lets you opt into a different FLUX VAE path, but the default is disabled because the small-decoder override is not compatible with the currently installed Diffusers build.
- Portrait crops are square, centered on the detected face box, expanded by configurable padding, and clamped to image bounds.
- If a single combination fails and `--fail-fast` is not set, the generator continues and reports the failed combinations at the end.

## Important licenses

- `black-forest-labs/FLUX.2-klein-4B` is currently Apache 2.0.
- `briaai/RMBG-1.4` is source-available for non-commercial use.

Check each model card before production use.
