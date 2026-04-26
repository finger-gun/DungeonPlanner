from __future__ import annotations

import argparse
import io
import shutil
import sys
from pathlib import Path

from .config import ModelConfig, RuntimeConfig
from .inference import AnimeFaceDetector, RMBGBackgroundRemover, ZImageTurboImageGenerator
from .inputs import load_input_items, load_yaml_config
from .model_cache import ModelRegistry
from .pipeline import CharacterPortraitPipeline
from .runtime import resolve_device
from .types import PromptItem

DEFAULT_RUNTIME_CONFIG = RuntimeConfig()
DEFAULT_MODEL_CONFIG = ModelConfig()


def _resolve_prompt_text(value: str) -> str:
    if "\n" in value or "\r" in value:
        return value
    candidate_path = Path(value).expanduser()
    try:
        if candidate_path.is_file():
            return candidate_path.read_text(encoding="utf-8").strip()
    except OSError:
        return value
    return value


def _resolve_base_prompt(value: str) -> str:
    return _resolve_prompt_text(value)


class ConsoleStatusReporter:
    def __init__(self) -> None:
        self._isatty = sys.stdout.isatty()
        self._last_width = 0

    def announce(self, message: str) -> None:
        self.clear()
        print(message)

    def update(self, message: str) -> None:
        if not self._isatty:
            return
        width = shutil.get_terminal_size(fallback=(120, 20)).columns
        clipped = message[: max(width - 1, 1)]
        padded = clipped.ljust(max(self._last_width, len(clipped)))
        sys.stdout.write(f"\r{padded}")
        sys.stdout.flush()
        self._last_width = len(padded)

    def clear(self) -> None:
        if not self._isatty or self._last_width == 0:
            return
        sys.stdout.write("\r" + (" " * self._last_width) + "\r")
        sys.stdout.flush()
        self._last_width = 0

    def failure(self, message: str) -> None:
        self.clear()
        print(message)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate Dragonbane character portraits in batches.")

    parser.add_argument("--config-file", type=Path, help="Path to a YAML config with base_prompt, kins, genders, professions, and traits.")
    parser.add_argument("--kins-file", type=Path, help="Path to newline-delimited or JSON-array kin input.")
    parser.add_argument("--genders-file", type=Path, help="Path to newline-delimited or JSON-array gender input.")
    parser.add_argument("--professions-file", type=Path, help="Path to newline-delimited or JSON-array profession input.")
    parser.add_argument("--traits-file", type=Path, help="Path to newline-delimited or JSON-array trait input.")

    parser.add_argument("--kins-json", help="Inline JSON array for kin values.")
    parser.add_argument("--genders-json", help="Inline JSON array for gender values.")
    parser.add_argument("--professions-json", help="Inline JSON array for profession values.")
    parser.add_argument("--traits-json", help="Inline JSON array for trait values.")

    parser.add_argument("--kin", action="append", help="Single kin value. Repeat for multiple entries.")
    parser.add_argument("--gender", action="append", help="Single gender value. Repeat for multiple entries.")
    parser.add_argument("--profession", action="append", help="Single profession value. Repeat for multiple entries.")
    parser.add_argument("--trait", action="append", help="Single trait value. Repeat for multiple entries.")

    parser.add_argument("--base-prompt", help="Base prompt prepended to each combination prompt.")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_RUNTIME_CONFIG.output_dir, help="Directory for generated PNG output.")
    parser.add_argument("--model-cache-dir", type=Path, default=DEFAULT_MODEL_CONFIG.cache_dir, help="Local cache directory for Hugging Face downloads.")
    parser.add_argument("--width", type=int, default=DEFAULT_RUNTIME_CONFIG.width, help="Output image width.")
    parser.add_argument("--height", type=int, default=DEFAULT_RUNTIME_CONFIG.height, help="Output image height.")
    parser.add_argument("--guidance-scale", type=float, default=DEFAULT_RUNTIME_CONFIG.guidance_scale, help="Guidance scale passed to the image generation pipeline.")
    parser.add_argument("--num-inference-steps", type=int, default=DEFAULT_RUNTIME_CONFIG.num_inference_steps, help="Inference steps passed to the image generation pipeline.")
    parser.add_argument("--seed", type=int, help="Optional fixed seed for deterministic runs.")
    parser.add_argument("--device", default=DEFAULT_RUNTIME_CONFIG.device, help="Runtime device: auto, cuda, mps, or cpu.")
    parser.add_argument("--portrait-padding", type=float, default=DEFAULT_RUNTIME_CONFIG.portrait_padding, help="Padding ratio applied around the face crop.")
    parser.add_argument("--face-confidence", type=float, default=DEFAULT_RUNTIME_CONFIG.face_confidence, help="Minimum confidence used by the face detector.")
    parser.add_argument("--serial-width", type=int, default=DEFAULT_RUNTIME_CONFIG.serial_width, help="Zero-padding width for serial filename suffixes.")
    parser.add_argument("--max-combinations", type=int, help="Optional cap for generated combinations.")
    parser.add_argument("--random", action="store_true", help="Process the combination matrix in randomized non-repeating order.")
    parser.add_argument("--fail-fast", action="store_true", help="Abort on the first failed combination.")

    parser.add_argument("--image-model-id", default=DEFAULT_MODEL_CONFIG.image_model_id, help="Hugging Face model ID for image generation.")
    parser.add_argument("--rmbg-model-id", default=DEFAULT_MODEL_CONFIG.rmbg_model_id, help="Hugging Face model ID for background removal.")
    parser.add_argument("--face-model-id", default=DEFAULT_MODEL_CONFIG.face_model_id, help="Hugging Face model ID for face detection.")
    parser.add_argument("--face-model-filename", default=DEFAULT_MODEL_CONFIG.face_model_filename, help="Filename of the face detector weights in the Hugging Face repo.")

    return parser


def build_runtime_config(args: argparse.Namespace) -> RuntimeConfig:
    config_data = load_yaml_config(args.config_file) if args.config_file is not None else {}
    base_prompt_value = args.base_prompt
    if base_prompt_value is None:
        base_prompt_value = str(config_data.get("base_prompt", DEFAULT_RUNTIME_CONFIG.base_prompt))
    width_value = args.width
    configured_width = config_data.get("width")
    if width_value == DEFAULT_RUNTIME_CONFIG.width and isinstance(configured_width, int):
        width_value = configured_width
    height_value = args.height
    configured_height = config_data.get("height")
    if height_value == DEFAULT_RUNTIME_CONFIG.height and isinstance(configured_height, int):
        height_value = configured_height
    guidance_scale_value = args.guidance_scale
    configured_guidance_scale = config_data.get("guidance_scale")
    if guidance_scale_value == DEFAULT_RUNTIME_CONFIG.guidance_scale and isinstance(configured_guidance_scale, (int, float)):
        guidance_scale_value = float(configured_guidance_scale)
    return RuntimeConfig(
        base_prompt=_resolve_base_prompt(base_prompt_value),
        output_dir=args.output_dir,
        genders=tuple(item.name for item in load_input_items(
            config_value=config_data.get("genders"),
            file_path=args.genders_file,
            json_text=args.genders_json,
            inline_values=args.gender,
            label="genders",
        )) if any(
            value is not None for value in [config_data.get("genders"), args.genders_file, args.genders_json, args.gender]
        ) else DEFAULT_RUNTIME_CONFIG.genders,
        width=width_value,
        height=height_value,
        guidance_scale=guidance_scale_value,
        num_inference_steps=args.num_inference_steps,
        seed=args.seed,
        device=args.device,
        portrait_padding=args.portrait_padding,
        face_confidence=args.face_confidence,
        serial_width=args.serial_width,
        fail_fast=args.fail_fast,
        max_combinations=args.max_combinations,
        randomize_order=args.random,
    )


def build_model_config(args: argparse.Namespace) -> ModelConfig:
    return ModelConfig(
        image_model_id=args.image_model_id,
        rmbg_model_id=args.rmbg_model_id,
        face_model_id=args.face_model_id,
        face_model_filename=args.face_model_filename,
        cache_dir=args.model_cache_dir,
    )


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    config_data = load_yaml_config(args.config_file) if args.config_file is not None else {}
    status_reporter = ConsoleStatusReporter()

    kins = load_input_items(
        config_value=config_data.get("kins"),
        file_path=args.kins_file,
        json_text=args.kins_json,
        inline_values=args.kin,
        label="kins",
    )
    genders = list(
        load_input_items(
            config_value=config_data.get("genders"),
            file_path=args.genders_file,
            json_text=args.genders_json,
            inline_values=args.gender,
            label="genders",
        )
    ) if any(
        value is not None for value in [config_data.get("genders"), args.genders_file, args.genders_json, args.gender]
    ) else [PromptItem(name=value, prompt=value) for value in DEFAULT_RUNTIME_CONFIG.genders]
    professions = load_input_items(
        config_value=config_data.get("professions"),
        file_path=args.professions_file,
        json_text=args.professions_json,
        inline_values=args.profession,
        label="professions",
    )
    traits = load_input_items(
        config_value=config_data.get("traits"),
        file_path=args.traits_file,
        json_text=args.traits_json,
        inline_values=args.trait,
        label="traits",
    )

    runtime_config = build_runtime_config(args)
    runtime_config.output_dir.mkdir(parents=True, exist_ok=True)

    status_reporter.announce("Resolving runtime device...")
    device = resolve_device(runtime_config.device)
    status_reporter.announce(f"Using device: {device}")
    model_registry = ModelRegistry(build_model_config(args))
    status_reporter.announce("Checking model cache and downloading missing files...")
    downloaded_models = model_registry.ensure_downloaded()

    status_reporter.announce("Loading image model into memory...")
    image_generator = ZImageTurboImageGenerator(model_path=downloaded_models.image_model_path, device=device)
    status_reporter.announce("Loading background remover into memory...")
    background_remover = RMBGBackgroundRemover(model_path=downloaded_models.rmbg_model_path, device=device)
    status_reporter.announce("Loading face detector into memory...")
    face_detector = AnimeFaceDetector(model_path=downloaded_models.face_model_path, confidence=runtime_config.face_confidence)
    status_reporter.announce("Starting generation...")

    pipeline = CharacterPortraitPipeline(
        config=runtime_config,
        image_generator=image_generator,
        background_remover=background_remover,
        face_detector=face_detector,
        status_callback=status_reporter.update,
        failure_callback=lambda failure: status_reporter.failure(
            f"failed {failure.combination.kin} / {failure.combination.profession} / {failure.combination.trait}: {failure.error}"
        ),
    )
    try:
        result = pipeline.run(kins=kins, genders=genders, professions=professions, traits=traits)
    finally:
        status_reporter.clear()

    print(f"completed {len(result.records)} combinations with {len(result.failures)} failures")

    if result.failures:
        return 1

    return 0
