from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True, slots=True)
class CharacterPrompt:
    kin: str
    profession: str
    trait: str
    trait_index: int
    prompt: str
    generation_seed: int | None = None


@dataclass(frozen=True, slots=True)
class FaceBox:
    left: int
    top: int
    right: int
    bottom: int
    confidence: float

    @property
    def width(self) -> int:
        return self.right - self.left

    @property
    def height(self) -> int:
        return self.bottom - self.top

    @property
    def center_x(self) -> float:
        return self.left + self.width / 2

    @property
    def center_y(self) -> float:
        return self.top + self.height / 2


@dataclass(frozen=True, slots=True)
class OutputPair:
    stem: str
    serial: int
    main_path: Path
    portrait_path: Path


@dataclass(frozen=True, slots=True)
class GeneratedRecord:
    combination: CharacterPrompt
    face_box: FaceBox
    outputs: OutputPair
