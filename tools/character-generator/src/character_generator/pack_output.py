from __future__ import annotations

import json
from pathlib import Path

from .config import PackConfig, RuntimeConfig
from .naming import slugify
from .types import GeneratedRecord


def write_generated_pack_output(
    *,
    runtime_config: RuntimeConfig,
    pack_config: PackConfig,
    records: list[GeneratedRecord],
    generated_at: str,
    model_name: str | None,
) -> Path:
    manifest_path = runtime_config.output_dir / "manifest.json"
    manifest = {
        "schemaVersion": 1,
        "type": "generated-character-pack",
        "packId": pack_config.pack_id,
        "name": pack_config.name,
        "description": pack_config.description,
        "scope": pack_config.scope,
        "tags": list(pack_config.tags),
        "generatedAt": generated_at,
        "characters": [
            {
                "id": _build_character_id(record),
                "name": record.combination.trait.strip() or record.combination.profession.strip() or _build_character_id(record),
                "prompt": record.combination.prompt,
                "kind": pack_config.kind,
                "size": pack_config.size,
                "model": model_name,
                "originalImagePath": _relative_output_path(record.outputs.main_path, runtime_config.output_dir),
                "portraitImagePath": _relative_output_path(record.outputs.portrait_path, runtime_config.output_dir),
                "processedImagePath": _relative_output_path(record.outputs.processed_path, runtime_config.output_dir),
                "alphaMaskPath": _relative_output_path(record.outputs.alpha_mask_path, runtime_config.output_dir),
                "thumbnailPath": _relative_output_path(record.outputs.thumbnail_path, runtime_config.output_dir),
                "width": record.processed_width,
                "height": record.processed_height,
                "createdAt": generated_at,
                "updatedAt": generated_at,
            }
            for record in records
        ],
    }
    manifest_path.write_text(f"{json.dumps(manifest, indent=2)}\n", encoding="utf-8")
    _update_generated_pack_index(runtime_config.output_dir.parent, manifest_path)
    return manifest_path


def _build_character_id(record: GeneratedRecord) -> str:
    return slugify(f"{record.outputs.stem}-{record.outputs.serial}")


def _relative_output_path(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def _update_generated_pack_index(index_dir: Path, manifest_path: Path) -> None:
    index_path = index_dir / "index.json"
    relative_manifest_path = manifest_path.relative_to(index_dir).as_posix()
    if index_path.exists():
        raw_index = json.loads(index_path.read_text(encoding="utf-8"))
        manifests = raw_index.get("manifests")
        if raw_index.get("schemaVersion") != 1 or not isinstance(manifests, list):
            raise ValueError(f"{index_path} is not a valid generated character pack index.")
        normalized_manifests = [entry for entry in manifests if isinstance(entry, str) and entry.strip()]
    else:
        normalized_manifests = []

    if relative_manifest_path not in normalized_manifests:
        normalized_manifests.append(relative_manifest_path)
        normalized_manifests.sort()

    index_path.write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "manifests": normalized_manifests,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
