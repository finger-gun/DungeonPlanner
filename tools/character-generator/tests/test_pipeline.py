from pathlib import Path

from PIL import Image
import pytest

from character_generator.config import RuntimeConfig
from character_generator.pipeline import CharacterPortraitPipeline, build_character_prompts
from character_generator.types import FaceBox, PromptItem


class StubGenerator:
    def generate(self, **kwargs):
        self.last_kwargs = kwargs
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


class TransparentBackgroundRemover:
    def remove(self, image):
        return Image.new("RGBA", image.size, (0, 0, 0, 0))


def item(name: str, prompt: str | None = None) -> PromptItem:
    return PromptItem(name=name, prompt=prompt or name)


def test_pipeline_generates_expected_output_files(tmp_path: Path) -> None:
    pipeline = CharacterPortraitPipeline(
        config=RuntimeConfig(output_dir=tmp_path, portrait_padding=0.5),
        image_generator=StubGenerator(),
        background_remover=StubBackgroundRemover(),
        face_detector=StubFaceDetector(),
    )

    result = pipeline.run(kins=[item("Human")], genders=[item("Female")], professions=[item("Mage")], traits=[item("scarred veteran")])

    assert not result.failures
    assert len(result.records) == 1
    record = result.records[0]
    assert record.outputs.main_path.parent == tmp_path / "human" / "mage"
    assert record.outputs.portrait_path.parent == tmp_path / "human" / "mage"
    assert record.outputs.main_path.name == "human-female-mage-01-main-0001.png"
    assert record.outputs.portrait_path.name == "human-female-mage-01-portrait-0001.png"
    assert record.outputs.main_path.exists()
    assert record.outputs.portrait_path.exists()


def test_pipeline_collects_failures_when_fail_fast_is_disabled(tmp_path: Path) -> None:
    pipeline = CharacterPortraitPipeline(
        config=RuntimeConfig(output_dir=tmp_path, fail_fast=False),
        image_generator=StubGenerator(),
        background_remover=StubBackgroundRemover(),
        face_detector=FailingFaceDetector(),
    )

    result = pipeline.run(kins=[item("Human")], genders=[item("Female")], professions=[item("Mage")], traits=[item("scarred veteran")])

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

    pipeline.run(kins=[item("Human")], genders=[item("Female")], professions=[item("Knight")], traits=[item("Battle-scarred stoic guardian")])

    assert messages == [
        "Generating main image: Human, Female, Knight, Battle-scarred stoic guardian | 1 of 1 | Estimated time 0 sec",
        "Detecting face: Human, Female, Knight, Battle-scarred stoic guardian | 1 of 1 | Estimated time 0 sec",
        "Removing background: Human, Female, Knight, Battle-scarred stoic guardian | 1 of 1 | Estimated time 0 sec",
        "Saving outputs: Human, Female, Knight, Battle-scarred stoic guardian | 1 of 1 | Estimated time 0 sec",
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

    result = pipeline.run(kins=[item("Human")], genders=[item("Female")], professions=[item("Knight")], traits=[item("Battle-scarred stoic guardian")])

    assert not result.records
    assert len(failures) == 1
    assert failures[0].error == "no face"


def test_pipeline_falls_back_to_base_image_when_background_output_is_transparent(tmp_path: Path) -> None:
    pipeline = CharacterPortraitPipeline(
        config=RuntimeConfig(output_dir=tmp_path),
        image_generator=StubGenerator(),
        background_remover=TransparentBackgroundRemover(),
        face_detector=StubFaceDetector(),
    )

    result = pipeline.run(kins=[item("Human")], genders=[item("Female")], professions=[item("Mage")], traits=[item("scarred veteran")])

    assert not result.failures
    saved_main = Image.open(result.records[0].outputs.main_path).convert("RGBA")
    assert saved_main.getpixel((0, 0)) == (255, 255, 255, 255)


def test_build_character_prompts_expands_dynamic_prompt_choices_deterministically() -> None:
    prompts = build_character_prompts(
        kins=[item("Human")],
        genders=[item("Female")],
        professions=[item("Knight")],
        traits=[item("Stoic")],
        base_prompt="A {red|blue|green} cloak and {gold|silver} trim.",
        seed=123,
    )

    assert len(prompts) == 1
    assert prompts[0].prompt == (
        "A blue cloak and silver trim. Character kin: Human. Gender: Female. Profession: Knight. Defining trait: Stoic."
    )
    assert prompts[0].generation_seed == 224899942


def test_build_character_prompts_leaves_non_choice_braces_unchanged() -> None:
    prompts = build_character_prompts(
        kins=[item("Human")],
        genders=[item("Female")],
        professions=[item("Knight")],
        traits=[item("Stoic")],
        base_prompt="Keep literal braces {no-choice}.",
        seed=123,
    )

    assert prompts[0].prompt == (
        "Keep literal braces {no-choice}. Character kin: Human. Gender: Female. Profession: Knight. Defining trait: Stoic."
    )


def test_build_character_prompts_assigns_unique_generation_seeds_per_combination() -> None:
    prompts = build_character_prompts(
        kins=[item("Human")],
        genders=[item("Female")],
        professions=[item("Knight")],
        traits=[item("Stoic"), item("Bold")],
        base_prompt="A {red|blue|green} cloak.",
        seed=123,
    )

    assert [prompt.generation_seed for prompt in prompts] == [224899942, 1749090055]
    assert prompts[0].prompt == (
        "A blue cloak. Character kin: Human. Gender: Female. Profession: Knight. Defining trait: Stoic."
    )
    assert prompts[1].prompt == (
        "A blue cloak. Character kin: Human. Gender: Female. Profession: Knight. Defining trait: Bold."
    )


def test_build_character_prompts_randomizes_without_repeating() -> None:
    prompts = build_character_prompts(
        kins=[item("Human"), item("Elf")],
        genders=[item("Female")],
        professions=[item("Knight"), item("Mage")],
        traits=[item("Stoic"), item("Bold")],
        base_prompt="Portrait.",
        seed=123,
        randomize_order=True,
    )

    assert [(prompt.kin, prompt.profession, prompt.trait) for prompt in prompts] == [
        ("Human", "Knight", "Bold"),
        ("Elf", "Knight", "Stoic"),
        ("Elf", "Knight", "Bold"),
        ("Elf", "Mage", "Stoic"),
        ("Human", "Mage", "Bold"),
        ("Elf", "Mage", "Bold"),
        ("Human", "Mage", "Stoic"),
        ("Human", "Knight", "Stoic"),
    ]
    assert len({(prompt.kin, prompt.profession, prompt.trait) for prompt in prompts}) == len(prompts)


def test_build_character_prompts_randomize_respects_max_combinations() -> None:
    prompts = build_character_prompts(
        kins=[item("Human"), item("Elf")],
        genders=[item("Female")],
        professions=[item("Knight"), item("Mage")],
        traits=[item("Stoic"), item("Bold")],
        base_prompt="Portrait.",
        seed=123,
        randomize_order=True,
        max_combinations=3,
    )

    assert [(prompt.kin, prompt.profession, prompt.trait) for prompt in prompts] == [
        ("Human", "Knight", "Bold"),
        ("Elf", "Knight", "Stoic"),
        ("Elf", "Knight", "Bold"),
    ]


def test_build_character_prompts_expands_gender_matrix() -> None:
    prompts = build_character_prompts(
        kins=[item("Human")],
        genders=[item("Female"), item("Male")],
        professions=[item("Knight")],
        traits=[item("Stoic")],
        base_prompt="Portrait.",
        seed=123,
    )

    assert [(prompt.gender, prompt.profession, prompt.trait) for prompt in prompts] == [
        ("Female", "Knight", "Stoic"),
        ("Male", "Knight", "Stoic"),
    ]


def test_build_character_prompts_uses_prompt_text_but_keeps_names() -> None:
    prompts = build_character_prompts(
        kins=[item("Mallard", "A short anthropomorphic humanoid duck, with beak, arms and duck legs.")],
        genders=[item("Female", "female")],
        professions=[item("Mage", "a robed spellcaster with arcane focus")],
        traits=[item("Rune-covered haunted mystic", "rune-covered and haunted by ancient magic")],
        base_prompt="Portrait.",
        seed=123,
    )

    assert prompts[0].kin == "Mallard"
    assert prompts[0].gender == "Female"
    assert prompts[0].profession == "Mage"
    assert prompts[0].trait == "Rune-covered haunted mystic"
    assert prompts[0].prompt == (
        "Portrait. Character kin: A short anthropomorphic humanoid duck, with beak, arms and duck legs. "
        "Gender: female. Profession: a robed spellcaster with arcane focus. "
        "Defining trait: rune-covered and haunted by ancient magic."
    )
