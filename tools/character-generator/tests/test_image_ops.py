from PIL import Image

from character_generator.image_ops import apply_alpha_mask, crop_portrait, estimate_background_color, expand_face_box
from character_generator.types import FaceBox


def test_expand_face_box_clamps_to_image_bounds() -> None:
    face_box = FaceBox(left=5, top=6, right=25, bottom=26, confidence=0.9)

    result = expand_face_box(face_box, (30, 30), 1.0)

    assert result == (0, 0, 30, 30)


def test_crop_portrait_returns_image_region() -> None:
    image = Image.new("RGBA", (100, 80), (255, 0, 0, 255))
    face_box = FaceBox(left=30, top=20, right=50, bottom=40, confidence=0.8)

    portrait = crop_portrait(image, face_box, 0.5)

    assert portrait.size == (40, 40)


def test_estimate_background_color_samples_corners() -> None:
    image = Image.new("RGB", (10, 10), (0, 255, 0))
    image.putpixel((5, 5), (255, 0, 0))

    background = estimate_background_color(image, sample_ratio=0.2, max_sample_size=2)

    assert background == (0, 255, 0)


def test_apply_alpha_mask_decontaminates_edge_pixels_against_background() -> None:
    image = Image.new("RGB", (1, 1), (128, 128, 0))
    mask = Image.new("L", (1, 1), 128)

    result = apply_alpha_mask(image, mask, background_color=(0, 255, 0))

    red, green, blue, alpha = result.getpixel((0, 0))
    assert red >= 250
    assert green <= 2
    assert blue == 0
    assert alpha == 128
