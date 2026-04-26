from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable, Sequence

import yaml


def _normalize_items(items: Iterable[str], *, label: str) -> list[str]:
    normalized = [item.strip() for item in items if item.strip()]
    if not normalized:
        raise ValueError(f"No {label} were provided.")
    return normalized


def _load_items_from_lines(text: str) -> list[str]:
    items: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or stripped.startswith("//"):
            continue
        items.append(line)
    return items


def _load_items_from_file(path: Path) -> list[str]:
    if path.suffix.lower() == ".json":
        raw = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(raw, list):
            raise ValueError(f"{path} must contain a JSON array of strings.")
        return [str(item) for item in raw]
    return _load_items_from_lines(path.read_text(encoding="utf-8"))


def _load_items_from_json(json_text: str) -> list[str]:
    raw = json.loads(json_text)
    if not isinstance(raw, list):
        raise ValueError("Inline JSON input must be an array of strings.")
    return [str(item) for item in raw]


def _load_items_from_config(value: object, *, field_name: str) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value]
    if isinstance(value, str):
        return _load_items_from_lines(value)
    raise ValueError(f"Config field '{field_name}' must be a YAML list or multiline string.")


def load_yaml_config(path: Path) -> dict[str, object]:
    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    if raw is None:
        return {}
    if not isinstance(raw, dict):
        raise ValueError(f"{path} must contain a YAML object.")
    return raw


def load_input_items(
    *,
    config_value: object | None = None,
    file_path: Path | None,
    json_text: str | None,
    inline_values: Sequence[str] | None,
    label: str,
) -> list[str]:
    collected: list[str] = []

    if config_value is not None:
        collected.extend(_load_items_from_config(config_value, field_name=label))
    if file_path is not None:
        collected.extend(_load_items_from_file(file_path))
    if json_text is not None:
        collected.extend(_load_items_from_json(json_text))
    if inline_values is not None:
        collected.extend(inline_values)

    return _normalize_items(collected, label=label)
