import sys
from types import ModuleType, SimpleNamespace

from character_generator.runtime import describe_device_resolution, resolve_background_removal_device, resolve_device


def test_describe_device_resolution_reports_cpu_only_torch_build(monkeypatch) -> None:
    fake_torch = ModuleType("torch")
    fake_torch.__version__ = "2.11.0"
    fake_torch.version = SimpleNamespace(cuda=None)
    fake_torch.cuda = SimpleNamespace(is_available=lambda: False, device_count=lambda: 0)
    fake_torch.backends = SimpleNamespace(mps=SimpleNamespace(is_available=lambda: False))
    monkeypatch.setitem(sys.modules, "torch", fake_torch)

    device, details = describe_device_resolution("auto")

    assert device == "cpu"
    assert details is not None
    assert "torch.version.cuda=None" in details
    assert resolve_device("auto") == "cpu"


def test_describe_device_resolution_reports_cuda_device(monkeypatch) -> None:
    fake_torch = ModuleType("torch")
    fake_torch.__version__ = "2.11.0"
    fake_torch.version = SimpleNamespace(cuda="12.8")
    fake_torch.cuda = SimpleNamespace(
        is_available=lambda: True,
        device_count=lambda: 1,
        get_device_name=lambda index: "NVIDIA GeForce RTX 4090",
    )
    fake_torch.backends = SimpleNamespace(mps=SimpleNamespace(is_available=lambda: False))
    monkeypatch.setitem(sys.modules, "torch", fake_torch)

    device, details = describe_device_resolution("auto")

    assert device == "cuda"
    assert details == "CUDA is available through PyTorch (CUDA 12.8); using NVIDIA GeForce RTX 4090"


def test_resolve_background_removal_device_uses_cpu_on_windows_cuda(monkeypatch) -> None:
    monkeypatch.setattr(sys, "platform", "win32")

    device, details = resolve_background_removal_device("cuda")

    assert device == "cpu"
    assert details == "Background removal is running on CPU because BRIA RMBG can produce empty masks on Windows/CUDA."


def test_resolve_background_removal_device_keeps_cuda_off_windows(monkeypatch) -> None:
    monkeypatch.setattr(sys, "platform", "linux")

    device, details = resolve_background_removal_device("cuda")

    assert device == "cuda"
    assert details is None
