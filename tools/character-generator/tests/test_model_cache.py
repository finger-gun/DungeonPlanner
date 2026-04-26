from pathlib import Path

from character_generator.config import ModelConfig
from character_generator.model_cache import (
    FLUX_ALLOW_PATTERNS,
    RMBG_ALLOW_PATTERNS,
    ModelRegistry,
    RepoFile,
    format_bytes,
    select_repo_files,
)


def test_format_bytes_uses_human_readable_units() -> None:
    assert format_bytes(999) == "999 B"
    assert format_bytes(1024) == "1.0 KB"
    assert format_bytes(1024 * 1024 * 5) == "5.0 MB"


def test_select_repo_files_filters_to_allowed_patterns() -> None:
    repo_files = [
        RepoFile(filename="README.md", size=10),
        RepoFile(filename="model_index.json", size=20),
        RepoFile(filename="tokenizer/tokenizer.json", size=30),
        RepoFile(filename="images/example.jpg", size=40),
    ]

    selected = select_repo_files(repo_files, ["model_index.json", "tokenizer/*"])

    assert selected == [
        RepoFile(filename="model_index.json", size=20),
        RepoFile(filename="tokenizer/tokenizer.json", size=30),
    ]


def test_model_registry_uses_expected_hf_targets(monkeypatch, tmp_path: Path) -> None:
    calls: list[tuple[str, str, Path, list[str] | None, str | None]] = []

    def fake_download_repo(
        repo_id: str,
        cache_dir: Path,
        *,
        allow_patterns: list[str] | None = None,
        progress_label: str,
    ) -> Path:
        calls.append(("repo", repo_id, cache_dir, allow_patterns, progress_label))
        return tmp_path / "models" / repo_id

    def fake_download_model_file(
        repo_id: str,
        filename: str,
        cache_dir: Path,
        *,
        progress_label: str,
    ) -> Path:
        calls.append(("file", f"{repo_id}:{filename}", cache_dir, None, progress_label))
        return tmp_path / filename

    monkeypatch.setattr("character_generator.model_cache.download_repo", fake_download_repo)
    monkeypatch.setattr("character_generator.model_cache.download_model_file", fake_download_model_file)

    registry = ModelRegistry(ModelConfig(cache_dir=tmp_path))
    result = registry.ensure_downloaded()

    assert result.flux_model_path == tmp_path / "models" / "black-forest-labs/FLUX.2-klein-4B"
    assert result.flux_vae_model_path is None
    assert result.rmbg_model_path == tmp_path / "models" / "briaai/RMBG-1.4"
    assert result.face_model_path == tmp_path / "yolov8x6_animeface.pt"
    assert calls == [
        ("repo", "black-forest-labs/FLUX.2-klein-4B", tmp_path / "huggingface", FLUX_ALLOW_PATTERNS, "FLUX model"),
        ("repo", "briaai/RMBG-1.4", tmp_path / "huggingface", RMBG_ALLOW_PATTERNS, "Background remover"),
        ("file", "Fuyucchi/yolov8_animeface:yolov8x6_animeface.pt", tmp_path / "huggingface", None, "Face detector"),
    ]
