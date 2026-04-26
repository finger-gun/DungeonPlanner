from __future__ import annotations


def resolve_device(requested_device: str) -> str:
    if requested_device != "auto":
        return requested_device

    import torch

    if torch.cuda.is_available():
        return "cuda"
    if getattr(torch.backends, "mps", None) is not None and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def torch_dtype_for_device(device: str):
    import torch

    if device == "cuda":
        return torch.float16
    if device == "mps":
        # Z-Image-Turbo is less stable on Apple MPS in float16 and can emit NaNs.
        return torch.float32
    return torch.float32
