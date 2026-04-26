from __future__ import annotations

from contextlib import contextmanager
import importlib.util
import logging
import os
import sys
import types
from pathlib import Path

import numpy as np
from PIL import Image

from .image_ops import apply_alpha_mask, estimate_background_color, estimate_head_box
from .runtime import torch_dtype_for_device
from .types import FaceBox

os.environ.setdefault("PYTORCH_MPS_FAST_MATH", "1")


class _SuppressSDNQTritonFallbackFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        return "SDNQ: Triton is not available. Falling back to PyTorch Eager mode." not in message


@contextmanager
def _suppress_sdnq_triton_fallback_warning():
    logger = logging.getLogger("sdnq")
    warning_filter = _SuppressSDNQTritonFallbackFilter()
    logger.addFilter(warning_filter)
    try:
        yield
    finally:
        logger.removeFilter(warning_filter)


def _load_bria_rmbg_model_class(model_path: Path):
    package_name = f"_character_generator_rmbg_{abs(hash(model_path))}"
    if package_name not in sys.modules:
        package = types.ModuleType(package_name)
        package.__path__ = [str(model_path)]
        sys.modules[package_name] = package

        for module_name in ["MyConfig", "briarmbg"]:
            module_key = f"{package_name}.{module_name}"
            if module_key in sys.modules:
                continue
            spec = importlib.util.spec_from_file_location(module_key, model_path / f"{module_name}.py")
            if spec is None or spec.loader is None:
                raise RuntimeError(f"Failed to load BRIA RMBG module {module_name} from {model_path}.")
            module = importlib.util.module_from_spec(spec)
            sys.modules[module_key] = module
            spec.loader.exec_module(module)

    bria_module = sys.modules[f"{package_name}.briarmbg"]
    model_class = bria_module.BriaRMBG
    if not hasattr(model_class, "all_tied_weights_keys"):
        model_class.all_tied_weights_keys = {}
    return model_class


def _extract_rmbg_primary_mask(result):
    if isinstance(result, tuple) and result and isinstance(result[0], list) and result[0]:
        return result[0][0]
    if isinstance(result, list) and result:
        return result[0]
    return result


def _disable_library_progress_bars() -> None:
    try:
        from transformers.utils import logging as transformers_logging

        disable = getattr(transformers_logging, "disable_progress_bar", None)
        if callable(disable):
            disable()
    except ImportError:
        pass


class ZImageTurboImageGenerator:
    def __init__(self, *, model_path: Path, device: str) -> None:
        import torch

        try:
            with _suppress_sdnq_triton_fallback_warning():
                import sdnq  # noqa: F401
            from diffusers import FlowMatchEulerDiscreteScheduler, ZImagePipeline
        except ImportError as exc:
            raise RuntimeError("ZImagePipeline is unavailable. Install a recent diffusers build with Z-Image support.") from exc

        self._torch = torch
        self._device = device
        dtype = torch_dtype_for_device(device)
        _disable_library_progress_bars()

        self._pipeline = ZImagePipeline.from_pretrained(
            str(model_path),
            torch_dtype=dtype,
            low_cpu_mem_usage=True,
            local_files_only=True,
        )
        self._pipeline.scheduler = FlowMatchEulerDiscreteScheduler.from_config(
            self._pipeline.scheduler.config,
            use_beta_sigmas=True,
        )
        self._pipeline.set_progress_bar_config(disable=False)
        if hasattr(self._pipeline, "enable_attention_slicing"):
            self._pipeline.enable_attention_slicing()
        if hasattr(self._pipeline, "enable_vae_slicing"):
            self._pipeline.enable_vae_slicing()
        if hasattr(getattr(self._pipeline, "vae", None), "enable_tiling"):
            self._pipeline.vae.enable_tiling()

        if device == "cuda":
            self._pipeline.enable_model_cpu_offload()
        else:
            self._pipeline.to(device)

    def _to_rgba_image(self, image_tensor) -> Image.Image:
        image_tensor = self._torch.nan_to_num(image_tensor.detach().float().cpu(), nan=0.0, posinf=1.0, neginf=0.0)
        image_tensor = image_tensor.clamp(0.0, 1.0)

        if image_tensor.ndim != 3:
            raise RuntimeError(f"Unexpected generated image tensor shape: {tuple(image_tensor.shape)}")

        if image_tensor.shape[0] in (1, 3, 4):
            image_tensor = image_tensor.permute(1, 2, 0)
        elif image_tensor.shape[-1] not in (1, 3, 4):
            raise RuntimeError(f"Unexpected generated image tensor shape: {tuple(image_tensor.shape)}")

        image_array = image_tensor.numpy()
        if image_array.shape[-1] == 1:
            image_array = np.repeat(image_array, 3, axis=-1)

        image_array = (image_array * 255.0).round().astype(np.uint8)
        return Image.fromarray(image_array).convert("RGBA")

    def generate(
        self,
        *,
        prompt: str,
        width: int,
        height: int,
        guidance_scale: float,
        num_inference_steps: int,
        seed: int | None,
    ) -> Image.Image:
        generator = None
        if seed is not None:
            generator_device = self._device if self._device in {"cuda", "mps"} else "cpu"
            generator = self._torch.Generator(device=generator_device).manual_seed(seed)

        pipeline_kwargs = {
            "prompt": prompt,
            "width": width,
            "height": height,
            "guidance_scale": guidance_scale,
            "num_inference_steps": num_inference_steps,
            "generator": generator,
            "output_type": "pt",
        }

        with self._torch.inference_mode():
            image = self._pipeline(**pipeline_kwargs).images[0]
        return self._to_rgba_image(image)


class RMBGBackgroundRemover:
    def __init__(self, *, model_path: Path, device: str) -> None:
        import torch
        import torch.nn.functional as functional
        from torchvision.transforms.functional import normalize

        self._torch = torch
        self._device = device
        self._functional = functional
        self._normalize = normalize
        _disable_library_progress_bars()
        bria_model_class = _load_bria_rmbg_model_class(model_path)
        self._model = bria_model_class.from_pretrained(
            str(model_path),
            local_files_only=True,
        ).eval().to(device)
        self._model_input_size = (1024, 1024)

    def _preprocess(self, image: Image.Image):
        image_array = np.asarray(image.convert("RGB"))
        image_tensor = self._torch.tensor(image_array, dtype=self._torch.float32).permute(2, 0, 1)
        image_tensor = self._functional.interpolate(
            image_tensor.unsqueeze(0),
            size=self._model_input_size,
            mode="bilinear",
            align_corners=False,
        )
        image_tensor = image_tensor / 255.0
        image_tensor = self._normalize(image_tensor, [0.5, 0.5, 0.5], [1.0, 1.0, 1.0])
        return image_tensor.to(self._device)

    def remove(self, image: Image.Image) -> Image.Image:
        rgb = image.convert("RGB")
        background_color = estimate_background_color(rgb)
        input_images = self._preprocess(rgb)
        with self._torch.no_grad():
            result = self._model(input_images)

        raw_mask = _extract_rmbg_primary_mask(result)
        raw_mask = self._functional.interpolate(
            raw_mask,
            size=rgb.size[::-1],
            mode="bilinear",
            align_corners=False,
        )
        raw_mask = self._torch.squeeze(raw_mask, 0)
        max_value = self._torch.max(raw_mask)
        min_value = self._torch.min(raw_mask)
        normalized_mask = (raw_mask - min_value) / (max_value - min_value + 1e-8)
        mask_array = (normalized_mask * 255).permute(1, 2, 0).cpu().numpy().astype(np.uint8).squeeze()
        mask = Image.fromarray(mask_array)
        return apply_alpha_mask(rgb, mask, background_color=background_color)


class AnimeFaceDetector:
    def __init__(self, *, model_path: Path, confidence: float) -> None:
        from ultralytics import YOLO

        self._confidence = confidence
        self._model = YOLO(str(model_path))

    @staticmethod
    def _select_best_box(results) -> FaceBox | None:
        if not results:
            return None

        boxes = results[0].boxes
        if boxes is None or len(boxes) == 0:
            return None

        best_box = None
        best_score = -1.0

        coordinates = boxes.xyxy.cpu().tolist()
        confidences = boxes.conf.cpu().tolist()

        for coords, confidence in zip(coordinates, confidences, strict=True):
            left, top, right, bottom = [int(round(value)) for value in coords]
            area = max(right - left, 0) * max(bottom - top, 0)
            score = area * confidence
            if score > best_score:
                best_score = score
                best_box = FaceBox(left=left, top=top, right=right, bottom=bottom, confidence=float(confidence))

        return best_box

    def _confidence_attempts(self) -> list[float]:
        attempts = [self._confidence, 0.15, 0.08]
        deduplicated: list[float] = []
        for attempt in attempts:
            clamped = max(0.01, min(float(attempt), 1.0))
            if clamped not in deduplicated:
                deduplicated.append(clamped)
        return deduplicated

    def detect_primary(self, image: Image.Image) -> FaceBox:
        rgb = np.array(image.convert("RGB"))
        for confidence in self._confidence_attempts():
            results = self._model.predict(rgb, conf=confidence, verbose=False)
            best_box = self._select_best_box(results)
            if best_box is not None:
                return best_box

        return estimate_head_box(image)
