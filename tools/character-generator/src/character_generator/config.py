from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path


def default_cache_dir() -> Path:
    return Path.home() / ".cache" / "character-generator"


@dataclass(slots=True)
class ModelConfig:
    flux_model_id: str = "black-forest-labs/FLUX.2-klein-4B"
    flux_vae_model_id: str | None = None
    rmbg_model_id: str = "briaai/RMBG-1.4"
    face_model_id: str = "Fuyucchi/yolov8_animeface"
    face_model_filename: str = "yolov8x6_animeface.pt"
    cache_dir: Path = field(default_factory=default_cache_dir)


@dataclass(slots=True)
class RuntimeConfig:
    base_prompt: str = "Dragonbane TTRPG character illustration."
    output_dir: Path = Path("output")
    width: int = 1024
    height: int = 1024
    guidance_scale: float = 1.0
    num_inference_steps: int = 4
    seed: int | None = None
    device: str = "auto"
    portrait_padding: float = 0.75
    face_confidence: float = 0.25
    serial_width: int = 4
    fail_fast: bool = False
    max_combinations: int | None = None
    randomize_order: bool = False
