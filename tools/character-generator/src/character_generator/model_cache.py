from __future__ import annotations

import json
from dataclasses import dataclass
from fnmatch import fnmatch
from pathlib import Path
from typing import Iterable

from .config import ModelConfig

RMBG_ALLOW_PATTERNS = [
    "*.py",
    "config.json",
    "preprocessor_config.json",
    "*.safetensors",
]


@dataclass(frozen=True, slots=True)
class DownloadedModels:
    image_model_path: Path
    rmbg_model_path: Path
    face_model_path: Path


@dataclass(frozen=True, slots=True)
class RepoFile:
    filename: str
    size: int


def format_bytes(size: int) -> str:
    units = ["B", "KB", "MB", "GB", "TB"]
    value = float(size)
    for unit in units:
        if value < 1024 or unit == units[-1]:
            if unit == "B":
                return f"{int(value)} {unit}"
            return f"{value:.1f} {unit}"
        value /= 1024
    return f"{size} B"


def _matches_any_pattern(filename: str, patterns: Iterable[str] | None) -> bool:
    if patterns is None:
        return True
    return any(fnmatch(filename, pattern) for pattern in patterns)


def list_repo_files(repo_id: str) -> list[RepoFile]:
    from huggingface_hub import HfApi

    info = HfApi().model_info(repo_id, files_metadata=True)
    files: list[RepoFile] = []
    for sibling in info.siblings:
        size = sibling.size
        if size is None and sibling.lfs is not None:
            size = sibling.lfs.size
        if size is None:
            size = 0
        files.append(RepoFile(filename=sibling.rfilename, size=size))
    return files


def select_repo_files(repo_files: list[RepoFile], allow_patterns: list[str] | None) -> list[RepoFile]:
    return [repo_file for repo_file in repo_files if _matches_any_pattern(repo_file.filename, allow_patterns)]


def _repo_local_dir(cache_dir: Path, repo_id: str) -> Path:
    return cache_dir / "models" / repo_id


def _manifest_path(local_dir: Path) -> Path:
    return local_dir / ".download-manifest.json"


def _load_manifest(local_dir: Path) -> list[str] | None:
    manifest_path = _manifest_path(local_dir)
    if not manifest_path.is_file():
        return None
    try:
        raw = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    if not isinstance(raw, list) or not all(isinstance(item, str) for item in raw):
        return None
    return raw


def _write_manifest(local_dir: Path, filenames: list[str]) -> None:
    _manifest_path(local_dir).write_text(json.dumps(filenames, indent=2) + "\n", encoding="utf-8")


def _files_exist(local_dir: Path, filenames: Iterable[str]) -> bool:
    return all((local_dir / filename).is_file() for filename in filenames)


def download_repo(
    repo_id: str,
    cache_dir: Path,
    *,
    allow_patterns: list[str] | None = None,
    progress_label: str,
) -> Path:
    from huggingface_hub import hf_hub_download

    local_dir = _repo_local_dir(cache_dir, repo_id)
    local_dir.mkdir(parents=True, exist_ok=True)
    cached_filenames = _load_manifest(local_dir)
    if cached_filenames is not None and _files_exist(local_dir, cached_filenames):
        return local_dir

    repo_files = select_repo_files(list_repo_files(repo_id), allow_patterns)
    total_size = sum(repo_file.size for repo_file in repo_files)

    print(
        f"{progress_label}: downloading {len(repo_files)} required files "
        f"({format_bytes(total_size)} total)"
    )

    downloaded_so_far = 0
    for index, repo_file in enumerate(repo_files, start=1):
        running_total = downloaded_so_far + repo_file.size
        print(
            f"  [{index}/{len(repo_files)}] {repo_file.filename} "
            f"({format_bytes(repo_file.size)}) "
            f"[selected {format_bytes(running_total)}/{format_bytes(total_size)}]"
        )
        hf_hub_download(
            repo_id=repo_id,
            filename=repo_file.filename,
            cache_dir=str(cache_dir),
            local_dir=str(local_dir),
        )
        downloaded_so_far = running_total

    _write_manifest(local_dir, [repo_file.filename for repo_file in repo_files])
    return local_dir


def download_model_file(repo_id: str, filename: str, cache_dir: Path, *, progress_label: str) -> Path:
    from huggingface_hub import hf_hub_download

    local_dir = _repo_local_dir(cache_dir, repo_id)
    local_file = local_dir / filename
    if local_file.is_file():
        return local_file

    print(f"{progress_label}: downloading {filename}")
    local_dir.mkdir(parents=True, exist_ok=True)
    hf_hub_download(
        repo_id=repo_id,
        filename=filename,
        cache_dir=str(cache_dir),
        local_dir=str(local_dir),
    )
    return local_file


class ModelRegistry:
    def __init__(self, config: ModelConfig) -> None:
        self._config = config

    def ensure_downloaded(self) -> DownloadedModels:
        hub_cache_dir = self._config.cache_dir / "huggingface"
        hub_cache_dir.mkdir(parents=True, exist_ok=True)

        return DownloadedModels(
            image_model_path=download_repo(
                self._config.image_model_id,
                hub_cache_dir,
                progress_label="Image model",
            ),
            rmbg_model_path=download_repo(
                self._config.rmbg_model_id,
                hub_cache_dir,
                allow_patterns=RMBG_ALLOW_PATTERNS,
                progress_label="Background remover",
            ),
            face_model_path=download_model_file(
                self._config.face_model_id,
                self._config.face_model_filename,
                hub_cache_dir,
                progress_label="Face detector",
            ),
        )
