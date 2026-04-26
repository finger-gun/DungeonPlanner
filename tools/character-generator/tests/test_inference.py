import torch
from PIL import Image, ImageDraw

from character_generator.image_ops import estimate_head_box
from character_generator.inference import AnimeFaceDetector, ZImageTurboImageGenerator, _extract_rmbg_primary_mask


def test_extract_rmbg_primary_mask_from_nested_result() -> None:
    mask = object()
    aux = object()

    result = ([mask], [aux])

    extracted = _extract_rmbg_primary_mask(result)

    assert extracted is mask


def test_z_image_generator_sanitizes_invalid_tensor_values() -> None:
    generator = object.__new__(ZImageTurboImageGenerator)
    generator._torch = torch

    image = generator._to_rgba_image(
        torch.tensor(
            [
                [[float("nan")]],
                [[1.5]],
                [[-2.0]],
            ]
        )
    )

    assert image.getpixel((0, 0)) == (0, 255, 0, 255)


def test_estimate_head_box_uses_subject_silhouette() -> None:
    image = Image.new("RGB", (100, 120), (0, 255, 0))
    draw = ImageDraw.Draw(image)
    draw.rectangle((30, 12, 70, 110), fill=(140, 110, 90))

    face_box = estimate_head_box(image)

    assert 35 <= face_box.left <= 45
    assert 5 <= face_box.top <= 20
    assert 55 <= face_box.right <= 65
    assert 25 <= face_box.bottom <= 40
    assert face_box.confidence == 0.0


def test_anime_face_detector_retries_lower_confidence_before_fallback() -> None:
    class FakeTensor:
        def __init__(self, values):
            self._values = values

        def cpu(self):
            return self

        def tolist(self):
            return self._values

    class FakeBoxes:
        def __init__(self, xyxy, conf):
            self.xyxy = FakeTensor(xyxy)
            self.conf = FakeTensor(conf)

        def __len__(self):
            return len(self.conf.tolist())

    class FakeResult:
        def __init__(self, boxes):
            self.boxes = boxes

    class FakeModel:
        def __init__(self):
            self.calls = []

        def predict(self, image, *, conf, verbose):
            self.calls.append(conf)
            if conf <= 0.15:
                return [FakeResult(FakeBoxes([[10, 8, 30, 28]], [0.14]))]
            return [FakeResult(FakeBoxes([], []))]

    detector = object.__new__(AnimeFaceDetector)
    detector._confidence = 0.25
    detector._model = FakeModel()

    face_box = detector.detect_primary(Image.new("RGB", (64, 64), (0, 255, 0)))

    assert face_box == detector._select_best_box([FakeResult(FakeBoxes([[10, 8, 30, 28]], [0.14]))])
    assert detector._model.calls == [0.25, 0.15]


def test_anime_face_detector_falls_back_to_estimated_head_box() -> None:
    class FakeBoxes:
        xyxy = None
        conf = None

        def __len__(self):
            return 0

    class FakeResult:
        boxes = FakeBoxes()

    class FakeModel:
        def __init__(self):
            self.calls = []

        def predict(self, image, *, conf, verbose):
            self.calls.append(conf)
            return [FakeResult()]

    image = Image.new("RGB", (120, 120), (0, 255, 0))
    draw = ImageDraw.Draw(image)
    draw.rectangle((35, 10, 85, 110), fill=(120, 100, 80))

    detector = object.__new__(AnimeFaceDetector)
    detector._confidence = 0.25
    detector._model = FakeModel()

    face_box = detector.detect_primary(image)

    assert detector._model.calls == [0.25, 0.15, 0.08]
    assert face_box.confidence == 0.0
    assert face_box.left < face_box.right
    assert face_box.top < face_box.bottom
