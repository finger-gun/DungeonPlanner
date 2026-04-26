from __future__ import annotations

import re
import unicodedata
from pathlib import Path

from .types import OutputPair


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", normalized.strip().lower()).strip("-")
    if not slug:
        raise ValueError(f"Cannot create a filename slug from {value!r}.")
    return slug


def trait_index_token(index: int, total_traits: int) -> str:
    width = max(2, len(str(total_traits)))
    return f"{index + 1:0{width}d}"


def next_serial(output_dir: Path, stem: str) -> int:
    pattern = re.compile(rf"^{re.escape(stem)}-(main|portrait)-(?P<serial>\d+)\.png$")
    latest = 0

    if not output_dir.exists():
        return 1

    for path in output_dir.iterdir():
        if not path.is_file():
            continue
        match = pattern.match(path.name)
        if match is not None:
            latest = max(latest, int(match.group("serial")))

    return latest + 1


def allocate_output_pair(
    *,
    output_dir: Path,
    kin: str,
    gender: str,
    profession: str,
    trait_index: int,
    total_traits: int,
    serial_width: int,
) -> OutputPair:
    kin_slug = slugify(kin)
    profession_slug = slugify(profession)
    target_dir = output_dir / kin_slug / profession_slug
    target_dir.mkdir(parents=True, exist_ok=True)
    stem = f"{kin_slug}-{slugify(gender)}-{profession_slug}-{trait_index_token(trait_index, total_traits)}"
    serial = next_serial(target_dir, stem)
    serial_token = f"{serial:0{serial_width}d}"
    return OutputPair(
        stem=stem,
        serial=serial,
        main_path=target_dir / f"{stem}-main-{serial_token}.png",
        portrait_path=target_dir / f"{stem}-portrait-{serial_token}.png",
    )
