from pathlib import Path

import pytest

from character_generator.inputs import load_input_items, load_yaml_config
from character_generator.cli import _resolve_base_prompt


def test_load_input_items_from_lines(tmp_path: Path) -> None:
    input_path = tmp_path / "kins.txt"
    input_path.write_text("Human\n\nMallard\n", encoding="utf-8")

    result = load_input_items(config_value=None, file_path=input_path, json_text=None, inline_values=None, label="kins")

    assert result == ["Human", "Mallard"]


def test_load_input_items_ignores_commented_lines(tmp_path: Path) -> None:
    input_path = tmp_path / "kins.txt"
    input_path.write_text("Human\n# Elf\n  // Mallard\nWolfkin\n", encoding="utf-8")

    result = load_input_items(config_value=None, file_path=input_path, json_text=None, inline_values=None, label="kins")

    assert result == ["Human", "Wolfkin"]


def test_load_input_items_from_json_sources(tmp_path: Path) -> None:
    input_path = tmp_path / "traits.json"
    input_path.write_text('["scarred veteran", "grim smile"]', encoding="utf-8")

    result = load_input_items(
        config_value=None,
        file_path=input_path,
        json_text='["keen eyes"]',
        inline_values=["steady hands"],
        label="traits",
    )

    assert result == ["scarred veteran", "grim smile", "keen eyes", "steady hands"]


def test_load_input_items_requires_at_least_one_value() -> None:
    with pytest.raises(ValueError, match="No kins were provided"):
        load_input_items(config_value=None, file_path=None, json_text=None, inline_values=None, label="kins")


def test_load_input_items_from_yaml_config_list() -> None:
    result = load_input_items(
        config_value=["Human", "Mallard"],
        file_path=None,
        json_text=None,
        inline_values=None,
        label="kins",
    )

    assert result == ["Human", "Mallard"]


def test_load_input_items_from_yaml_config_multiline_string() -> None:
    result = load_input_items(
        config_value="Human\n# Elf\nWolfkin\n",
        file_path=None,
        json_text=None,
        inline_values=None,
        label="kins",
    )

    assert result == ["Human", "Wolfkin"]


def test_load_yaml_config_reads_mapping(tmp_path: Path) -> None:
    config_path = tmp_path / "characters.yaml"
    config_path.write_text(
        "base_prompt: Test prompt\nkins:\n  - Human\nprofessions:\n  - Knight\ntraits:\n  - Stoic\n",
        encoding="utf-8",
    )

    result = load_yaml_config(config_path)

    assert result["base_prompt"] == "Test prompt"
    assert result["kins"] == ["Human"]


def test_resolve_base_prompt_reads_file_contents(tmp_path: Path) -> None:
    prompt_path = tmp_path / "base-prompt.txt"
    prompt_path.write_text("Prompt from file.\n", encoding="utf-8")

    result = _resolve_base_prompt(str(prompt_path))

    assert result == "Prompt from file."


def test_resolve_base_prompt_keeps_literal_text() -> None:
    literal_prompt = "Literal prompt text."

    result = _resolve_base_prompt(literal_prompt)

    assert result == literal_prompt


def test_resolve_base_prompt_keeps_multiline_literal_text() -> None:
    literal_prompt = "Prompt line one.\nPrompt line two."

    result = _resolve_base_prompt(literal_prompt)

    assert result == literal_prompt


def test_resolve_base_prompt_keeps_too_long_literal_text() -> None:
    literal_prompt = "a" * 300

    result = _resolve_base_prompt(literal_prompt)

    assert result == literal_prompt
