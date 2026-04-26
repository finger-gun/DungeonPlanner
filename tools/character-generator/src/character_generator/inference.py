from __future__ import annotations

import importlib.util
import sys
import types
from pathlib import Path

import numpy as np
from PIL import Image

from .image_ops import apply_alpha_mask, estimate_background_color
from .runtime import torch_dtype_for_device
from .types import FaceBox


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
        from diffusers.utils import logging as diffusers_logging

        disable = getattr(diffusers_logging, "disable_progress_bar", None)
        if callable(disable):
            disable()
    except ImportError:
        pass

    try:
        from transformers.utils import logging as transformers_logging

        disable = getattr(transformers_logging, "disable_progress_bar", None)
        if callable(disable):
            disable()
    except ImportError:
        pass


class Flux2KleinImageGenerator:
    def __init__(self, *, model_path: Path, device: str, vae_model_path: Path | None = None) -> None:
        import torch

        try:
            from diffusers import AutoencoderKLFlux2, Flux2KleinPipeline
        except ImportError as exc:
            raise RuntimeError(
                "Flux2KleinPipeline is unavailable. Install a recent diffusers build with FLUX.2 support."
            ) from exc

        self._torch = torch
        self._device = device
        dtype = torch_dtype_for_device(device)
        _disable_library_progress_bars()
        if vae_model_path is not None:
            vae = AutoencoderKLFlux2.from_pretrained(str(vae_model_path), torch_dtype=dtype)
        else:
            vae = AutoencoderKLFlux2.from_pretrained(str(model_path), subfolder="vae", torch_dtype=dtype)
        self._pipeline = Flux2KleinPipeline.from_pretrained(
            str(model_path),
            vae=vae,
            torch_dtype=dtype,
        )
        self._pipeline.set_progress_bar_config(disable=True)

        if device == "cuda":
            self._pipeline.enable_model_cpu_offload()
        else:
            self._pipeline.to(device)

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
            generator_device = "cuda" if self._device == "cuda" else "cpu"
            generator = self._torch.Generator(device=generator_device).manual_seed(seed)

        image = self._pipeline(
            prompt=prompt,
            width=width,
            height=height,
            guidance_scale=guidance_scale,
            num_inference_steps=num_inference_steps,
            generator=generator,
        ).images[0]
        return image.convert("RGBA")


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

    def detect_primary(self, image: Image.Image) -> FaceBox:
        results = self._model.predict(np.array(image.convert("RGB")), conf=self._confidence, verbose=False)
        if not results:
            raise RuntimeError("Face detector returned no results.")

        boxes = results[0].boxes
        if boxes is None or len(boxes) == 0:
            raise RuntimeError("No face detected in generated image.")

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

        if best_box is None:
            raise RuntimeError("No usable face box was produced by the face detector.")

        return best_box
