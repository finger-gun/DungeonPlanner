from pathlib import Path
import io
from textwrap import dedent

import pytest

from character_generator.inputs import load_input_items, load_yaml_config
from character_generator.cli import (
    ConsoleStatusReporter,
    _preview_with_kitten,
    _resolve_base_prompt,
    build_parser,
    build_runtime_config,
)
from character_generator.types import PromptItem


def test_load_input_items_from_lines(tmp_path: Path) -> None:
    input_path = tmp_path / "kins.txt"
    input_path.write_text("Human\n\nMallard\n", encoding="utf-8")

    result = load_input_items(config_value=None, file_path=input_path, json_text=None, inline_values=None, label="kins")

    assert result == [PromptItem(name="Human", prompt="Human"), PromptItem(name="Mallard", prompt="Mallard")]


def test_load_input_items_ignores_commented_lines(tmp_path: Path) -> None:
    input_path = tmp_path / "kins.txt"
    input_path.write_text("Human\n# Elf\n  // Mallard\nWolfkin\n", encoding="utf-8")

    result = load_input_items(config_value=None, file_path=input_path, json_text=None, inline_values=None, label="kins")

    assert result == [PromptItem(name="Human", prompt="Human"), PromptItem(name="Wolfkin", prompt="Wolfkin")]


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

    assert result == [
        PromptItem(name="scarred veteran", prompt="scarred veteran"),
        PromptItem(name="grim smile", prompt="grim smile"),
        PromptItem(name="keen eyes", prompt="keen eyes"),
        PromptItem(name="steady hands", prompt="steady hands"),
    ]


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

    assert result == [PromptItem(name="Human", prompt="Human"), PromptItem(name="Mallard", prompt="Mallard")]


def test_load_input_items_from_yaml_config_objects() -> None:
    result = load_input_items(
        config_value=[
            {"name": "Mallard", "prompt": "A short anthropomorphic humanoid duck, with beak, arms and duck legs."},
            {"name": "Wolfkin", "prompt": "An anthropomorphic wolf person with fur, muzzle, claws and wolf legs."},
        ],
        file_path=None,
        json_text=None,
        inline_values=None,
        label="kins",
    )

    assert result == [
        PromptItem(name="Mallard", prompt="A short anthropomorphic humanoid duck, with beak, arms and duck legs."),
        PromptItem(name="Wolfkin", prompt="An anthropomorphic wolf person with fur, muzzle, claws and wolf legs."),
    ]


def test_load_input_items_from_yaml_config_multiline_string() -> None:
    result = load_input_items(
        config_value="Human\n# Elf\nWolfkin\n",
        file_path=None,
        json_text=None,
        inline_values=None,
        label="kins",
    )

    assert result == [PromptItem(name="Human", prompt="Human"), PromptItem(name="Wolfkin", prompt="Wolfkin")]


def test_load_yaml_config_reads_mapping(tmp_path: Path) -> None:
    config_path = tmp_path / "characters.yaml"
    config_path.write_text(dedent("""
        base_prompt: Test prompt
        kins:
          - name: Mallard
            prompt: A short anthropomorphic humanoid duck, with beak, arms and duck legs.
        genders:
          - name: Female
            prompt: female
        professions:
          - name: Knight
            prompt: an armored knight
        traits:
          - name: Stoic
            prompt: stoic and battle-worn
        """).strip() + "\n", encoding="utf-8")

    result = load_yaml_config(config_path)

    assert result["base_prompt"] == "Test prompt"
    assert result["kins"] == [{"name": "Mallard", "prompt": "A short anthropomorphic humanoid duck, with beak, arms and duck legs."}]
    assert result["genders"] == [{"name": "Female", "prompt": "female"}]


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


def test_console_status_reporter_announce_prints_for_non_tty(monkeypatch: pytest.MonkeyPatch) -> None:
    class FakeStdout(io.StringIO):
        def isatty(self) -> bool:
            return False

    fake_stdout = FakeStdout()
    monkeypatch.setattr("sys.stdout", fake_stdout)
    reporter = ConsoleStatusReporter()

    reporter.announce("Loading image model into memory...")

    assert fake_stdout.getvalue() == "Loading image model into memory...\n"


def test_build_runtime_config_reads_guidance_scale_from_yaml(tmp_path: Path) -> None:
    config_path = tmp_path / "characters.yaml"
    config_path.write_text("guidance_scale: 3.0\n", encoding="utf-8")

    parser = build_parser()
    args = parser.parse_args(["--config-file", str(config_path)])

    runtime_config = build_runtime_config(args)

    assert runtime_config.guidance_scale == 3.0


def test_build_runtime_config_reads_dimensions_from_yaml(tmp_path: Path) -> None:
    config_path = tmp_path / "characters.yaml"
    config_path.write_text("width: 512\nheight: 512\n", encoding="utf-8")

    parser = build_parser()
    args = parser.parse_args(["--config-file", str(config_path)])

    runtime_config = build_runtime_config(args)

    assert runtime_config.width == 512
    assert runtime_config.height == 512


def test_build_runtime_config_reads_preview_kitten_flag() -> None:
    parser = build_parser()
    args = parser.parse_args(["--preview-kitten"])

    runtime_config = build_runtime_config(args)

    assert runtime_config.preview_kitten is True


def test_preview_with_kitten_runs_kitten_icat(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    image_path = tmp_path / "preview.png"
    image_path.write_bytes(b"png")
    captured = {}

    monkeypatch.setattr("shutil.which", lambda command: "/usr/bin/kitten" if command == "kitten" else None)

    def fake_run(command: list[str], check: bool) -> None:
        captured["command"] = command
        captured["check"] = check

    monkeypatch.setattr("subprocess.run", fake_run)

    _preview_with_kitten(image_path)

    assert captured == {
        "command": ["/usr/bin/kitten", "icat", str(image_path)],
        "check": True,
    }


def test_preview_with_kitten_requires_command_on_path(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    image_path = tmp_path / "preview.png"
    image_path.write_bytes(b"png")
    monkeypatch.setattr("shutil.which", lambda command: None)

    with pytest.raises(RuntimeError, match="requires the 'kitten' command"):
        _preview_with_kitten(image_path)


def test_build_parser_defaults_to_sdnq_z_image_model() -> None:
    parser = build_parser()
    args = parser.parse_args([])

    assert args.image_model_id == "Disty0/Z-Image-Turbo-SDNQ-uint4-svd-r32"
