from character_generator.inference import _extract_rmbg_primary_mask


def test_extract_rmbg_primary_mask_from_nested_result() -> None:
    mask = object()
    aux = object()

    result = ([mask], [aux])

    extracted = _extract_rmbg_primary_mask(result)

    assert extracted is mask
