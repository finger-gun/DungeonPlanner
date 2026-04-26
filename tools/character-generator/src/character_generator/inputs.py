from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable, Mapping, Sequence

import yaml

from .types import PromptItem


def _normalize_items(items: Iterable[PromptItem], *, label: str) -> list[PromptItem]:
    normalized = [
        PromptItem(name=item.name.strip(), prompt=item.prompt.strip())
        for item in items
        if item.name.strip() and item.prompt.strip()
    ]
    if not normalized:
        raise ValueError(f"No {label} were provided.")
    return normalized


def _item_from_string(value: str) -> PromptItem:
    stripped = value.strip()
    return PromptItem(name=stripped, prompt=stripped)


def _item_from_mapping(value: Mapping[object, object], *, field_name: str) -> PromptItem:
    raw_name = value.get("name")
    raw_prompt = value.get("prompt")
    if not isinstance(raw_name, str) or not raw_name.strip():
        raise ValueError(f"Config field '{field_name}' entries must include a non-empty string 'name'.")
    if not isinstance(raw_prompt, str) or not raw_prompt.strip():
        raise ValueError(f"Config field '{field_name}' entries must include a non-empty string 'prompt'.")
    return PromptItem(name=raw_name.strip(), prompt=raw_prompt.strip())


def _coerce_item(value: object, *, field_name: str) -> PromptItem:
    if isinstance(value, str):
        return _item_from_string(value)
    if isinstance(value, Mapping):
        return _item_from_mapping(value, field_name=field_name)
    raise ValueError(f"Config field '{field_name}' entries must be strings or objects with 'name' and 'prompt'.")


def _load_items_from_lines(text: str) -> list[PromptItem]:
    items: list[PromptItem] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or stripped.startswith("//"):
            continue
        items.append(_item_from_string(line))
    return items


def _load_items_from_file(path: Path) -> list[PromptItem]:
    if path.suffix.lower() == ".json":
        raw = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(raw, list):
            raise ValueError(f"{path} must contain a JSON array of strings or objects.")
        return [_coerce_item(item, field_name=str(path)) for item in raw]
    return _load_items_from_lines(path.read_text(encoding="utf-8"))


def _load_items_from_json(json_text: str) -> list[PromptItem]:
    raw = json.loads(json_text)
    if not isinstance(raw, list):
        raise ValueError("Inline JSON input must be an array of strings or objects.")
    return [_coerce_item(item, field_name="inline JSON input") for item in raw]


def _load_items_from_config(value: object, *, field_name: str) -> list[PromptItem]:
    if isinstance(value, list):
        return [_coerce_item(item, field_name=field_name) for item in value]
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
) -> list[PromptItem]:
    collected: list[PromptItem] = []

    if config_value is not None:
        collected.extend(_load_items_from_config(config_value, field_name=label))
    if file_path is not None:
        collected.extend(_load_items_from_file(file_path))
    if json_text is not None:
        collected.extend(_load_items_from_json(json_text))
    if inline_values is not None:
        collected.extend(_item_from_string(value) for value in inline_values)

    return _normalize_items(collected, label=label)
