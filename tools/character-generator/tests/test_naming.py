from pathlib import Path

from character_generator.naming import allocate_output_pair, slugify


def test_slugify_normalizes_names() -> None:
    assert slugify("Mallard Knight!") == "mallard-knight"


def test_allocate_output_pair_increments_serial(tmp_path: Path) -> None:
    first = allocate_output_pair(
        output_dir=tmp_path,
        kin="Human",
        gender="Female",
        profession="Mage",
        trait_index=0,
        total_traits=8,
        serial_width=4,
    )
    first.main_path.write_bytes(b"main")
    first.portrait_path.write_bytes(b"portrait")

    second = allocate_output_pair(
        output_dir=tmp_path,
        kin="Human",
        gender="Female",
        profession="Mage",
        trait_index=0,
        total_traits=8,
        serial_width=4,
    )

    assert first.main_path.parent == tmp_path / "human" / "mage"
    assert first.portrait_path.parent == tmp_path / "human" / "mage"
    assert first.main_path.name == "human-female-mage-01-main-0001.png"
    assert second.main_path.name == "human-female-mage-01-main-0002.png"
    assert second.portrait_path.name == "human-female-mage-01-portrait-0002.png"
