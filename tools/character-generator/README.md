# Character generator

Batch-generate Dragonbane TTRPG character portraits from lists of kins, professions, and traits.

The generator:

- downloads required Hugging Face models if they are missing
- creates a base image for every `kin x profession x trait` combination
- detects the primary face on the generated image
- removes the background from the full image
- saves a padded face portrait crop from the transparent main image

## Default models

- **Image generation:** `Disty0/Z-Image-Turbo-SDNQ-uint4-svd-r32` loaded directly through Diffusers with Mac-oriented MPS runtime tweaks
- **Background removal:** `briaai/RMBG-1.4`
- **Illustrated face detection:** `Fuyucchi/yolov8_animeface`

The default face detector is a YOLOv8 model trained for anime and illustrated faces, which is a better starting point for fantasy character art than photo-only face detectors.
If face detection misses anthropomorphic characters, the generator now retries with lower YOLO confidence thresholds and then falls back to a centered head-position estimate based on the visible subject silhouette.

## Requirements

- Python 3.11+
- A Hugging Face account with access to any gated models you want to use
- Enough local GPU memory for your chosen model

The default image generator now uses the direct quantized `Disty0/Z-Image-Turbo-SDNQ-uint4-svd-r32` Diffusers repo, with `PYTORCH_MPS_FAST_MATH=1`, beta-sigma scheduling, attention slicing, VAE slicing, and VAE tiling enabled when available.

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
width: 1024
height: 1024
kins:
  - name: Human
    prompt: a human adventurer
  - name: Halfling
    prompt: a small halfling adventurer with human features
  - name: Dwarf
    prompt: a sturdy dwarf adventurer with a braided beard and compact build
  - name: Elf
    prompt: a graceful elf adventurer with refined features and pointed ears
  - name: Mallard
    prompt: a short anthropomorphic humanoid duck, with beak, arms and duck legs
  - name: Wolfkin
    prompt: an anthropomorphic wolf person with fur, muzzle, claws and wolf legs
  - name: Orc
    prompt: a muscular orc adventurer with tusks and rugged features
  - name: Ogre
    prompt: a large nordic troll-like humanoid with heavy limbs and brutish features
  - name: Goblin
    prompt: a small goblin adventurer with sharp features and wiry limbs
  - name: Hobgoblin
    prompt: a tough hobgoblin warrior with broad shoulders and goblinoid features
  - name: Frog People
    prompt: an anthropomorphic frog person with amphibian skin, wide mouth and frog legs
  - name: Karkion
    prompt: an anthropomorphic golden panther person with bat wings, claws and feline face
  - name: Cat People
    prompt: an anthropomorphic cat person with feline ears, whiskers, tail and agile limbs
  - name: Lizard People
    prompt: an anthropomorphic lizard person with scales, tail, claws and reptilian face
  - name: Satyr
    prompt: a humanoid with goat-like horns, furred legs, hooves and satyr features
genders:
  - name: Female
    prompt: female
  - name: Male
    prompt: male
professions:
  - name: Artisan
    prompt: an artisan carrying crafted tools and handmade gear
  - name: Bard
    prompt: a bard with musical instruments, performance flair and traveler gear
  - name: Fighter
    prompt: a seasoned fighter with practical armor and battle-ready weapons
  - name: Hunter
    prompt: a hunter with wilderness gear, ranged weapons and tracking tools
  - name: Knight
    prompt: a knight with noble armor, heraldic details and disciplined posture
  - name: Mage
    prompt: a mage with arcane implements, spell components and mystical attire
  - name: Mariner
    prompt: a mariner with nautical clothing, rope, hooks and sea-worn gear
  - name: Merchant
    prompt: a merchant with travel packs, trade goods and practical valuables
  - name: Scholar
    prompt: a scholar with books, scrolls, notes and learned accessories
  - name: Thief
    prompt: a thief with stealthy clothing, light gear and nimble posture
traits:
  - name: Battle-scarred stoic guardian
    prompt: battle-scarred, stoic, protective and unshakable
  - name: Shadowy mask-wearing outcast
    prompt: shadowy, masked, isolated and hard to read
  - name: Flamboyant showoff
    prompt: flamboyant, theatrical, stylish and attention-seeking
  - name: Mud-stained wilderness survivor
    prompt: mud-stained, hardened by the wilds and used to rough travel
  - name: Rune-covered haunted mystic
    prompt: rune-covered, haunted by magic and touched by ancient mysteries
```

The YAML file can hold `base_prompt`, `guidance_scale`, `width`, `height`, `kins`, `genders`, `professions`, and `traits`. Each list entry can now be either a plain string or an object with `name` and `prompt`. `name` is used for filenames, status text, and matrix labels; `prompt` is the text sent into image generation. The default Z-Image-Turbo profile stays at `guidance_scale: 0.0` and `1024x1024`. CLI flags still work and are appended on top of the YAML lists, while `--base-prompt` overrides the YAML prompt. If you do not supply genders, the generator defaults to `Female` and `Male`.

Pass `--random` to process the combination matrix in shuffled order without repeats. If you also pass
`--seed`, the randomized order is reproducible.

Using newline-delimited files:

Lines starting with `#` or `//` are ignored, so you can comment out entries quickly.

```bash
python -m character_generator \
  --kins-file ./examples/kins.txt \
  --genders-file ./examples/genders.txt \
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
  --gender Female --gender Male \
  --profession Mage --profession Hunter \
  --trait "scarred veteran" --trait "stern gaze" \
  --base-prompt "Dragonbane character portrait, full body, readable face, neutral background."
```

Using JSON arrays:

```bash
python -m character_generator \
  --kins-json '["Human", "Wolfkin", "Mallard"]' \
  --genders-json '["Female", "Male"]' \
  --professions-json '["Mage", "Bard"]' \
  --traits-json '["scarred veteran", "grim smile"]'
```

## Output files

For each combination, the generator writes:

- `{output-dir}/{kin-slug}/{profession-slug}/{kin-slug}-{gender-slug}-{profession-slug}-{trait-index}-main-{serial}.png`
- `{output-dir}/{kin-slug}/{profession-slug}/{kin-slug}-{gender-slug}-{profession-slug}-{trait-index}-portrait-{serial}.png`

Example:

- `human/mage/human-female-mage-01-main-0001.png`
- `human/mage/human-female-mage-01-portrait-0001.png`

`trait-index` is derived from the position of the trait in the input list, and `serial` increments to avoid overwriting earlier runs.

## Notes

- The default Z-Image model now downloads from its native Diffusers repo instead of the earlier custom assembled Comfy split-weight path.
- Download output now shows a selected-files total and then each file name with its individual size as it downloads.
- Background removal uses the open `briaai/RMBG-1.4` Hugging Face weights, estimates the flat backdrop color from the image corners, and decontaminates edge pixels before writing transparency. This helps reduce green-screen style fringe on the cutout.
- The image generator uses an MPS-native random generator on Apple Silicon when a seed is provided, instead of always falling back to a CPU generator.
- Portrait crops are square, centered on the detected face box, expanded by configurable padding, and clamped to image bounds.
- If a single combination fails and `--fail-fast` is not set, the generator continues and reports the failed combinations at the end.

## Important licenses

- `Disty0/Z-Image-Turbo-SDNQ-uint4-svd-r32` and `Tongyi-MAI/Z-Image-Turbo` have their own upstream model licenses and usage terms.
- `briaai/RMBG-1.4` is source-available for non-commercial use.

Check each model card before production use.
