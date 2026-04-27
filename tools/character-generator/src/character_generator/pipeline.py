from __future__ import annotations

from dataclasses import dataclass
from itertools import product
import random
import re
import time
from typing import Callable, Protocol

from .config import RuntimeConfig
from .image_ops import crop_portrait, has_visible_alpha_content
from .naming import allocate_output_pair
from .types import CharacterPrompt, FaceBox, GeneratedRecord, PromptItem


class ImageGenerator(Protocol):
    def generate(
        self,
        *,
        prompt: str,
        width: int,
        height: int,
        guidance_scale: float,
        num_inference_steps: int,
        seed: int | None,
    ): ...


class BackgroundRemover(Protocol):
    def remove(self, image): ...


class FaceDetector(Protocol):
    def detect_primary(self, image) -> FaceBox: ...


@dataclass(frozen=True, slots=True)
class PipelineFailure:
    combination: CharacterPrompt
    error: str


@dataclass(frozen=True, slots=True)
class PipelineRunResult:
    records: list[GeneratedRecord]
    failures: list[PipelineFailure]


def _format_eta(seconds: float) -> str:
    rounded_seconds = max(0, int(round(seconds)))
    hours, remainder = divmod(rounded_seconds, 3600)
    minutes, secs = divmod(remainder, 60)
    if hours:
        return f"{hours}h {minutes:02d} min"
    if minutes:
        return f"{minutes} min"
    return f"{secs} sec"


def _describe_combination(combination: CharacterPrompt) -> str:
    return f"{combination.kin}, {combination.gender}, {combination.profession}, {combination.trait}"


_DYNAMIC_PROMPT_PATTERN = re.compile(r"\{([^{}]+)\}")


def _as_sentence(text: str) -> str:
    stripped = text.strip()
    if stripped.endswith((".", "!", "?")):
        return stripped
    return f"{stripped}."


def _expand_dynamic_prompt(prompt: str, rng: random.Random) -> str:
    def replace(match: re.Match[str]) -> str:
        raw_options = match.group(1)
        options = [option.strip() for option in raw_options.split("|") if option.strip()]
        if len(options) <= 1:
            return match.group(0)
        return rng.choice(options)

    return _DYNAMIC_PROMPT_PATTERN.sub(replace, prompt)


def build_character_prompts(
    *,
    kins: list[PromptItem],
    genders: list[PromptItem],
    professions: list[PromptItem],
    traits: list[PromptItem],
    base_prompt: str,
    seed: int | None = None,
    max_combinations: int | None = None,
    randomize_order: bool = False,
) -> list[CharacterPrompt]:
    combinations: list[CharacterPrompt] = []
    rng = random.Random(seed) if seed is not None else random.SystemRandom()
    matrix_items = list(
        product(
            kins,
            genders,
            professions,
            enumerate(traits),
        )
    )

    if randomize_order:
        rng.shuffle(matrix_items)

    if max_combinations is not None:
        matrix_items = matrix_items[:max_combinations]

    for kin, gender, profession, (trait_index, trait) in matrix_items:
        generation_seed = rng.randrange(0, 2**32)
        prompt_rng = random.Random(generation_seed)
        prompt = _expand_dynamic_prompt(
            " ".join(
                [
                    base_prompt.strip(),
                    _as_sentence(f"Character: {kin.prompt}"),
                    _as_sentence(f"Gender: {gender.prompt}"),
                    _as_sentence(f"Profession: {profession.prompt}"),
                    _as_sentence(f"Defining trait: {trait.prompt}"),
                ]
            ).strip(),
            prompt_rng,
        )
        combinations.append(
            CharacterPrompt(
                kin=kin.name,
                gender=gender.name,
                profession=profession.name,
                trait=trait.name,
                trait_index=trait_index,
                prompt=prompt,
                generation_seed=generation_seed,
            )
        )

    return combinations


class CharacterPortraitPipeline:
    def __init__(
        self,
        *,
        config: RuntimeConfig,
        image_generator: ImageGenerator,
        background_remover: BackgroundRemover,
        face_detector: FaceDetector,
        status_callback: Callable[[str], None] | None = None,
        preview_callback: Callable[[GeneratedRecord], None] | None = None,
        failure_callback: Callable[[PipelineFailure], None] | None = None,
    ) -> None:
        self._config = config
        self._image_generator = image_generator
        self._background_remover = background_remover
        self._face_detector = face_detector
        self._status_callback = status_callback
        self._preview_callback = preview_callback
        self._failure_callback = failure_callback

    def run(
        self,
        *,
        kins: list[PromptItem],
        genders: list[PromptItem],
        professions: list[PromptItem],
        traits: list[PromptItem],
    ) -> PipelineRunResult:
        prompts = build_character_prompts(
            kins=kins,
            genders=genders,
            professions=professions,
            traits=traits,
            base_prompt=self._config.base_prompt,
            seed=self._config.seed,
            max_combinations=self._config.max_combinations,
            randomize_order=self._config.randomize_order,
        )
        total_prompts = len(prompts)
        started_at = time.monotonic()

        records: list[GeneratedRecord] = []
        failures: list[PipelineFailure] = []

        for current_index, combination in enumerate(prompts, start=1):
            try:
                records.append(
                    self._process_combination(
                        combination=combination,
                        total_traits=len(traits),
                        current_index=current_index,
                        total_combinations=total_prompts,
                        started_at=started_at,
                    )
                )
            except Exception as exc:
                if self._config.fail_fast:
                    raise
                failure = PipelineFailure(combination=combination, error=str(exc))
                failures.append(failure)
                if self._failure_callback is not None:
                    self._failure_callback(failure)

        return PipelineRunResult(records=records, failures=failures)

    def _process_combination(
        self,
        *,
        combination: CharacterPrompt,
        total_traits: int,
        current_index: int,
        total_combinations: int,
        started_at: float,
    ) -> GeneratedRecord:
        self._report_status("Generating main image", combination, current_index, total_combinations, started_at)
        base_image = self._image_generator.generate(
            prompt=combination.prompt,
            width=self._config.width,
            height=self._config.height,
            guidance_scale=self._config.guidance_scale,
            num_inference_steps=self._config.num_inference_steps,
            seed=combination.generation_seed,
        )
        self._report_status("Detecting face", combination, current_index, total_combinations, started_at)
        face_box = self._face_detector.detect_primary(base_image)
        self._report_status("Removing background", combination, current_index, total_combinations, started_at)
        main_image = self._background_remover.remove(base_image)
        if not has_visible_alpha_content(main_image):
            main_image = base_image.convert("RGBA")
        self._report_status("Saving outputs", combination, current_index, total_combinations, started_at)
        outputs = allocate_output_pair(
            output_dir=self._config.output_dir,
            kin=combination.kin,
            gender=combination.gender,
            profession=combination.profession,
            trait_index=combination.trait_index,
            total_traits=total_traits,
            serial_width=self._config.serial_width,
        )
        main_image.save(outputs.main_path)
        portrait = crop_portrait(main_image, face_box, self._config.portrait_padding)
        portrait.save(outputs.portrait_path)
        record = GeneratedRecord(combination=combination, face_box=face_box, outputs=outputs)
        if self._preview_callback is not None:
            self._preview_callback(record)
        return record

    def _report_status(
        self,
        stage: str,
        combination: CharacterPrompt,
        current_index: int,
        total_combinations: int,
        started_at: float,
    ) -> None:
        if self._status_callback is None:
            return
        elapsed = time.monotonic() - started_at
        average_seconds_per_item = elapsed / max(current_index, 1)
        remaining_seconds = average_seconds_per_item * max(total_combinations - current_index, 0)
        self._status_callback(
            f"{stage}: {_describe_combination(combination)} | "
            f"{current_index} of {total_combinations} | Estimated time {_format_eta(remaining_seconds)}"
        )
