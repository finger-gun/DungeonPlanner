from pathlib import Path

from PIL import Image
import pytest

from character_generator.config import RuntimeConfig
from character_generator.pipeline import CharacterPortraitPipeline, build_character_prompts
from character_generator.types import FaceBox


class StubGenerator:
    def generate(self, **kwargs):
        return Image.new("RGBA", (128, 128), (255, 255, 255, 255))


class StubBackgroundRemover:
    def remove(self, image):
        return image


class StubFaceDetector:
    def detect_primary(self, image) -> FaceBox:
        return FaceBox(left=32, top=20, right=64, bottom=52, confidence=0.92)


class FailingFaceDetector:
    def detect_primary(self, image) -> FaceBox:
        raise RuntimeError("no face")


def test_pipeline_generates_expected_output_files(tmp_path: Path) -> None:
    pipeline = CharacterPortraitPipeline(
        config=RuntimeConfig(output_dir=tmp_path, portrait_padding=0.5),
        image_generator=StubGenerator(),
        background_remover=StubBackgroundRemover(),
        face_detector=StubFaceDetector(),
    )

    result = pipeline.run(kins=["Human"], professions=["Mage"], traits=["scarred veteran"])

    assert not result.failures
    assert len(result.records) == 1
    record = result.records[0]
    assert record.outputs.main_path.name == "human-mage-01-main-0001.png"
    assert record.outputs.portrait_path.name == "human-mage-01-portrait-0001.png"
    assert record.outputs.main_path.exists()
    assert record.outputs.portrait_path.exists()


def test_pipeline_collects_failures_when_fail_fast_is_disabled(tmp_path: Path) -> None:
    pipeline = CharacterPortraitPipeline(
        config=RuntimeConfig(output_dir=tmp_path, fail_fast=False),
        image_generator=StubGenerator(),
        background_remover=StubBackgroundRemover(),
        face_detector=FailingFaceDetector(),
    )

    result = pipeline.run(kins=["Human"], professions=["Mage"], traits=["scarred veteran"])

    assert not result.records
    assert len(result.failures) == 1
    assert result.failures[0].error == "no face"


def test_pipeline_reports_stage_statuses(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    messages: list[str] = []
    time_values = iter([100.0, 110.0, 110.0, 110.0, 110.0])
    monkeypatch.setattr("character_generator.pipeline.time.monotonic", lambda: next(time_values))
    pipeline = CharacterPortraitPipeline(
        config=RuntimeConfig(output_dir=tmp_path),
        image_generator=StubGenerator(),
        background_remover=StubBackgroundRemover(),
        face_detector=StubFaceDetector(),
        status_callback=messages.append,
    )

    pipeline.run(kins=["Human"], professions=["Knight"], traits=["Battle-scarred stoic guardian"])

    assert messages == [
        "Generating main image: Human, Knight, Battle-scarred stoic guardian | 1 of 1 | Estimated time 0 sec",
        "Detecting face: Human, Knight, Battle-scarred stoic guardian | 1 of 1 | Estimated time 0 sec",
        "Removing background: Human, Knight, Battle-scarred stoic guardian | 1 of 1 | Estimated time 0 sec",
        "Saving outputs: Human, Knight, Battle-scarred stoic guardian | 1 of 1 | Estimated time 0 sec",
    ]


def test_pipeline_reports_failures_immediately(tmp_path: Path) -> None:
    failures = []
    pipeline = CharacterPortraitPipeline(
        config=RuntimeConfig(output_dir=tmp_path, fail_fast=False),
        image_generator=StubGenerator(),
        background_remover=StubBackgroundRemover(),
        face_detector=FailingFaceDetector(),
        failure_callback=failures.append,
    )

    result = pipeline.run(kins=["Human"], professions=["Knight"], traits=["Battle-scarred stoic guardian"])

    assert not result.records
    assert len(failures) == 1
    assert failures[0].error == "no face"


def test_build_character_prompts_expands_dynamic_prompt_choices_deterministically() -> None:
    prompts = build_character_prompts(
        kins=["Human"],
        professions=["Knight"],
        traits=["Stoic"],
        base_prompt="A {red|blue|green} cloak and {gold|silver} trim.",
        seed=123,
    )

    assert len(prompts) == 1
    assert prompts[0].prompt == (
        "A blue cloak and silver trim. Character kin: Human. Profession: Knight. Defining trait: Stoic."
    )
    assert prompts[0].generation_seed == 224899942


def test_build_character_prompts_leaves_non_choice_braces_unchanged() -> None:
    prompts = build_character_prompts(
        kins=["Human"],
        professions=["Knight"],
        traits=["Stoic"],
        base_prompt="Keep literal braces {no-choice}.",
        seed=123,
    )

    assert prompts[0].prompt == (
        "Keep literal braces {no-choice}. Character kin: Human. Profession: Knight. Defining trait: Stoic."
    )


def test_build_character_prompts_assigns_unique_generation_seeds_per_combination() -> None:
    prompts = build_character_prompts(
        kins=["Human"],
        professions=["Knight"],
        traits=["Stoic", "Bold"],
        base_prompt="A {red|blue|green} cloak.",
        seed=123,
    )

    assert [prompt.generation_seed for prompt in prompts] == [224899942, 1749090055]
    assert prompts[0].prompt == (
        "A blue cloak. Character kin: Human. Profession: Knight. Defining trait: Stoic."
    )
    assert prompts[1].prompt == (
        "A blue cloak. Character kin: Human. Profession: Knight. Defining trait: Bold."
    )
