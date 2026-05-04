from pathlib import Path

from character_generator.config import ModelConfig
from character_generator.model_cache import (
    RMBG_ALLOW_PATTERNS,
    ModelRegistry,
    RepoFile,
    download_model_file,
    download_repo,
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
    repo_calls: list[tuple[str, str, Path, list[str] | None, str | None]] = []
    file_calls: list[tuple[str, str, Path, str | None]] = []

    def fake_download_repo(
        repo_id: str,
        cache_dir: Path,
        *,
        allow_patterns: list[str] | None = None,
        progress_label: str,
    ) -> Path:
        repo_calls.append(("repo", repo_id, cache_dir, allow_patterns, progress_label))
        return tmp_path / "models" / repo_id

    def fake_download_model_file(
        repo_id: str,
        filename: str,
        cache_dir: Path,
        *,
        progress_label: str,
    ) -> Path:
        file_calls.append(("file", f"{repo_id}:{filename}", cache_dir, progress_label))
        return tmp_path / filename

    monkeypatch.setattr("character_generator.model_cache.download_repo", fake_download_repo)
    monkeypatch.setattr("character_generator.model_cache.download_model_file", fake_download_model_file)

    registry = ModelRegistry(ModelConfig(cache_dir=tmp_path))
    result = registry.ensure_downloaded()

    assert result.image_model_path == tmp_path / "models" / "Disty0/Z-Image-Turbo-SDNQ-uint4-svd-r32"
    assert result.rmbg_model_path == tmp_path / "models" / "briaai/RMBG-1.4"
    assert result.face_model_path == tmp_path / "yolov8x6_animeface.pt"
    assert repo_calls == [
        ("repo", "Disty0/Z-Image-Turbo-SDNQ-uint4-svd-r32", tmp_path / "huggingface", None, "Image model"),
        ("repo", "briaai/RMBG-1.4", tmp_path / "huggingface", RMBG_ALLOW_PATTERNS, "Background remover"),
    ]
    assert file_calls == [
        ("file", "Fuyucchi/yolov8_animeface:yolov8x6_animeface.pt", tmp_path / "huggingface", "Face detector"),
    ]


def test_download_repo_uses_manifested_cache_without_hub_calls(monkeypatch, tmp_path: Path) -> None:
    cache_dir = tmp_path / "huggingface"
    local_dir = cache_dir / "models" / "example/repo"
    local_dir.mkdir(parents=True)
    (local_dir / "model_index.json").write_text("{}", encoding="utf-8")
    (local_dir / ".download-manifest.json").write_text('[\n  "model_index.json"\n]\n', encoding="utf-8")

    monkeypatch.setattr(
        "character_generator.model_cache.list_repo_files",
        lambda repo_id: (_ for _ in ()).throw(AssertionError("should not query hub")),
    )

    result = download_repo("example/repo", cache_dir, allow_patterns=["model_index.json"], progress_label="Image model")

    assert result == local_dir


def test_download_model_file_uses_cached_local_file_without_hub_calls(monkeypatch, tmp_path: Path) -> None:
    cache_dir = tmp_path / "huggingface"
    local_file = cache_dir / "models" / "example/repo" / "weights.pt"
    local_file.parent.mkdir(parents=True)
    local_file.write_bytes(b"cached")

    class FakeApi:
        def model_info(self, *args, **kwargs):
            raise AssertionError("should not query hub")

    monkeypatch.setattr("huggingface_hub.HfApi", FakeApi)

    result = download_model_file("example/repo", "weights.pt", cache_dir, progress_label="Face detector")

    assert result == local_file
