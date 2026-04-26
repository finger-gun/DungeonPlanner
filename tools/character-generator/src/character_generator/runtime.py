from __future__ import annotations

import sys


def describe_device_resolution(requested_device: str) -> tuple[str, str | None]:
    if requested_device != "auto":
        return requested_device, f"Using requested device override: {requested_device}"

    import torch

    if torch.cuda.is_available():
        device_name = "NVIDIA GPU"
        try:
            device_name = torch.cuda.get_device_name(0)
        except Exception:
            pass
        cuda_version = getattr(getattr(torch, "version", None), "cuda", None) or "unknown"
        return "cuda", f"CUDA is available through PyTorch (CUDA {cuda_version}); using {device_name}"

    mps_backend = getattr(getattr(torch, "backends", None), "mps", None)
    if mps_backend is not None and mps_backend.is_available():
        return "mps", "CUDA is unavailable, but Apple MPS is available through PyTorch"

    cuda_version = getattr(getattr(torch, "version", None), "cuda", None)
    if cuda_version is None:
        return "cpu", (
            f"CUDA is unavailable because this PyTorch build has no CUDA support "
            f"(torch {torch.__version__}, torch.version.cuda=None)"
        )

    try:
        device_count = torch.cuda.device_count()
    except Exception:
        device_count = None

    if device_count == 0:
        return "cpu", (
            f"PyTorch has CUDA support (CUDA {cuda_version}), but no NVIDIA GPU was detected by torch.cuda.device_count()"
        )

    return "cpu", (
        f"PyTorch has CUDA support (CUDA {cuda_version}), but torch.cuda.is_available() is False. "
        "Check the installed NVIDIA driver and CUDA runtime compatibility."
    )


def resolve_device(requested_device: str) -> str:
    return describe_device_resolution(requested_device)[0]


def resolve_background_removal_device(runtime_device: str) -> tuple[str, str | None]:
    if runtime_device == "cuda" and sys.platform == "win32":
        return "cpu", "Background removal is running on CPU because BRIA RMBG can produce empty masks on Windows/CUDA."
    return runtime_device, None


def torch_dtype_for_device(device: str):
    import torch

    if device == "cuda":
        return torch.float16
    if device == "mps":
        # Z-Image-Turbo is less stable on Apple MPS in float16 and can emit NaNs.
        return torch.float32
    return torch.float32
