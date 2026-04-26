import torch
from PIL import Image, ImageDraw

from character_generator.image_ops import estimate_head_box
from character_generator.inference import (
    AnimeFaceDetector,
    RMBGBackgroundRemover,
    ZImageTurboImageGenerator,
    _SuppressSDNQTritonFallbackFilter,
    _extract_rmbg_primary_mask,
    _normalize_rmbg_mask,
)


def test_extract_rmbg_primary_mask_from_nested_result() -> None:
    mask = object()
    aux = object()

    result = ([mask], [aux])

    extracted = _extract_rmbg_primary_mask(result)

    assert extracted is mask


def test_normalize_rmbg_mask_returns_none_for_flat_mask() -> None:
    normalized = _normalize_rmbg_mask(torch.zeros((1, 2, 2)), torch)

    assert normalized is None


def test_rmbg_background_remover_falls_back_to_opaque_image_for_flat_mask() -> None:
    remover = object.__new__(RMBGBackgroundRemover)
    remover._torch = torch
    remover._device = "cpu"
    remover._model_input_size = (1024, 1024)
    remover._preprocess = lambda image: torch.zeros((1, 3, 2, 2))
    remover._functional = type(
        "FakeFunctional",
        (),
        {
            "interpolate": staticmethod(lambda tensor, size, mode, align_corners: tensor),
        },
    )()

    class FakeModel:
        def __call__(self, input_images):
            return torch.zeros((1, 1, 2, 2))

    remover._model = FakeModel()

    result = remover.remove(Image.new("RGB", (2, 2), (10, 20, 30)))

    assert result.mode == "RGBA"
    assert result.getpixel((0, 0)) == (10, 20, 30, 255)


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

        def predict(self, image, *, conf, verbose, device):
            self.calls.append((conf, device))
            if conf <= 0.15:
                return [FakeResult(FakeBoxes([[10, 8, 30, 28]], [0.14]))]
            return [FakeResult(FakeBoxes([], []))]

    detector = object.__new__(AnimeFaceDetector)
    detector._confidence = 0.25
    detector._device = 0
    detector._model = FakeModel()

    face_box = detector.detect_primary(Image.new("RGB", (64, 64), (0, 255, 0)))

    assert face_box == detector._select_best_box([FakeResult(FakeBoxes([[10, 8, 30, 28]], [0.14]))])
    assert detector._model.calls == [(0.25, 0), (0.15, 0)]


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

        def predict(self, image, *, conf, verbose, device):
            self.calls.append((conf, device))
            return [FakeResult()]

    image = Image.new("RGB", (120, 120), (0, 255, 0))
    draw = ImageDraw.Draw(image)
    draw.rectangle((35, 10, 85, 110), fill=(120, 100, 80))

    detector = object.__new__(AnimeFaceDetector)
    detector._confidence = 0.25
    detector._device = "cpu"
    detector._model = FakeModel()

    face_box = detector.detect_primary(image)

    assert detector._model.calls == [(0.25, "cpu"), (0.15, "cpu"), (0.08, "cpu")]
    assert face_box.confidence == 0.0
    assert face_box.left < face_box.right
    assert face_box.top < face_box.bottom


def test_z_image_generator_calls_pipeline_with_expected_kwargs() -> None:
    class FakePipelineResult:
        def __init__(self, image):
            self.images = [image]

    class FakePipeline:
        def __init__(self):
            self.calls = []

        def __call__(self, **kwargs):
            self.calls.append(kwargs)
            return FakePipelineResult(torch.zeros((3, 1, 1)))

    generator = object.__new__(ZImageTurboImageGenerator)
    generator._torch = torch
    generator._device = "cpu"
    generator._pipeline = FakePipeline()

    generator.generate(
        prompt="prompt",
        width=64,
        height=64,
        guidance_scale=0.0,
        num_inference_steps=4,
        seed=None,
    )

    assert generator._pipeline.calls[0]["prompt"] == "prompt"
    assert generator._pipeline.calls[0]["guidance_scale"] == 0.0
    assert sorted(generator._pipeline.calls[0]) == [
        "generator",
        "guidance_scale",
        "height",
        "num_inference_steps",
        "output_type",
        "prompt",
        "width",
    ]


def test_sdnq_triton_filter_suppresses_expected_fallback_warning() -> None:
    warning_filter = _SuppressSDNQTritonFallbackFilter()

    suppressed = warning_filter.filter(
        type("Record", (), {"getMessage": lambda self: "SDNQ: Triton is not available. Falling back to PyTorch Eager mode."})()
    )
    kept = warning_filter.filter(
        type("Record", (), {"getMessage": lambda self: "SDNQ: Triton test failed! Falling back to PyTorch Eager mode. Error message: boom"})()
    )

    assert suppressed is False
    assert kept is True
