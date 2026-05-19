from pathlib import Path
import json

from character_generator.config import PackConfig, RuntimeConfig
from character_generator.pack_output import write_generated_pack_output
from character_generator.types import CharacterPrompt, FaceBox, GeneratedRecord, OutputPair


def test_write_generated_pack_output_writes_manifest_and_updates_index(tmp_path: Path) -> None:
    pack_dir = tmp_path / "zombie-monsters"
    asset_dir = pack_dir / "zombie" / "shambler"
    asset_dir.mkdir(parents=True)

    outputs = OutputPair(
        stem="zombie-undead-shambler-01",
        serial=1,
        main_path=asset_dir / "zombie-undead-shambler-01-main-0001.png",
        portrait_path=asset_dir / "zombie-undead-shambler-01-portrait-0001.png",
        processed_path=asset_dir / "zombie-undead-shambler-01-processed-0001.png",
        alpha_mask_path=asset_dir / "zombie-undead-shambler-01-alpha-mask-0001.png",
        thumbnail_path=asset_dir / "zombie-undead-shambler-01-thumbnail-0001.png",
    )

    record = GeneratedRecord(
        combination=CharacterPrompt(
            kin="Zombie",
            gender="Undead",
            profession="Shambler",
            trait="Fresh Grave Riser",
            trait_index=0,
            prompt="undead zombie",
            generation_seed=123,
        ),
        face_box=FaceBox(left=0, top=0, right=1, bottom=1, confidence=1.0),
        outputs=outputs,
        processed_width=412,
        processed_height=721,
    )

    manifest_path = write_generated_pack_output(
        runtime_config=RuntimeConfig(output_dir=pack_dir),
        pack_config=PackConfig(
            pack_id="zombie-monsters",
            name="Zombie Monsters",
            description="Five shambling undead NPCs.",
            scope="workspace",
            tags=("undead", "zombies"),
            kind="npc",
            size="XL",
        ),
        records=[record],
        generated_at="2026-01-01T00:00:00Z",
        model_name="disty/z-image",
    )

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    index = json.loads((tmp_path / "index.json").read_text(encoding="utf-8"))

    assert manifest["packId"] == "zombie-monsters"
    assert manifest["scope"] == "workspace"
    assert manifest["characters"] == [{
        "id": "zombie-undead-shambler-01-1",
        "name": "Fresh Grave Riser",
        "prompt": "undead zombie",
        "kind": "npc",
        "size": "XL",
        "model": "disty/z-image",
        "originalImagePath": "zombie/shambler/zombie-undead-shambler-01-main-0001.png",
        "portraitImagePath": "zombie/shambler/zombie-undead-shambler-01-portrait-0001.png",
        "processedImagePath": "zombie/shambler/zombie-undead-shambler-01-processed-0001.png",
        "alphaMaskPath": "zombie/shambler/zombie-undead-shambler-01-alpha-mask-0001.png",
        "thumbnailPath": "zombie/shambler/zombie-undead-shambler-01-thumbnail-0001.png",
        "width": 412,
        "height": 721,
        "createdAt": "2026-01-01T00:00:00Z",
        "updatedAt": "2026-01-01T00:00:00Z",
    }]
    assert index == {
        "schemaVersion": 1,
        "manifests": ["zombie-monsters/manifest.json"],
    }
