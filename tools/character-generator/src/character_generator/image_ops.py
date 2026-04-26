from __future__ import annotations

import math
from typing import Tuple

import numpy as np
from PIL import Image

from .types import FaceBox


def estimate_background_color(
    image: Image.Image,
    *,
    sample_ratio: float = 0.08,
    max_sample_size: int = 64,
) -> tuple[int, int, int]:
    rgb = np.asarray(image.convert("RGB"), dtype=np.float32)
    height, width = rgb.shape[:2]
    sample_width = max(1, min(max_sample_size, int(round(width * sample_ratio))))
    sample_height = max(1, min(max_sample_size, int(round(height * sample_ratio))))

    patches = [
        rgb[:sample_height, :sample_width],
        rgb[:sample_height, width - sample_width :],
        rgb[height - sample_height :, :sample_width],
        rgb[height - sample_height :, width - sample_width :],
    ]
    samples = np.concatenate([patch.reshape(-1, 3) for patch in patches], axis=0)
    return tuple(int(round(channel)) for channel in np.median(samples, axis=0))


def apply_alpha_mask(
    image: Image.Image,
    mask: Image.Image,
    *,
    background_color: tuple[int, int, int] | None = None,
) -> Image.Image:
    alpha = np.asarray(mask.convert("L"), dtype=np.float32) / 255.0
    rgb = np.asarray(image.convert("RGB"), dtype=np.float32) / 255.0

    if background_color is not None:
        background = np.asarray(background_color, dtype=np.float32) / 255.0
        alpha_channel = alpha[..., None]
        safe_alpha = np.clip(alpha_channel, 1e-3, 1.0)
        decontaminated = (rgb - (background * (1.0 - alpha_channel))) / safe_alpha
        edge_pixels = (alpha_channel > 0.0) & (alpha_channel < 1.0)
        rgb = np.where(edge_pixels, np.clip(decontaminated, 0.0, 1.0), rgb)

    rgba = np.dstack((np.clip(rgb, 0.0, 1.0), alpha[..., None]))
    return Image.fromarray((rgba * 255.0).round().astype(np.uint8), mode="RGBA")


def expand_face_box(face_box: FaceBox, image_size: Tuple[int, int], padding_ratio: float) -> tuple[int, int, int, int]:
    image_width, image_height = image_size
    square_size = max(face_box.width, face_box.height) * (1 + (padding_ratio * 2))
    half_size = max(square_size / 2, 1)

    left = max(0, math.floor(face_box.center_x - half_size))
    top = max(0, math.floor(face_box.center_y - half_size))
    right = min(image_width, math.ceil(face_box.center_x + half_size))
    bottom = min(image_height, math.ceil(face_box.center_y + half_size))

    return left, top, right, bottom


def crop_portrait(image: Image.Image, face_box: FaceBox, padding_ratio: float) -> Image.Image:
    crop_box = expand_face_box(face_box, image.size, padding_ratio)
    return image.crop(crop_box)


def estimate_head_box(
    image: Image.Image,
    *,
    background_color: tuple[int, int, int] | None = None,
    color_distance_threshold: float = 30.0,
) -> FaceBox:
    rgb = np.asarray(image.convert("RGB"), dtype=np.float32)
    image_height, image_width = rgb.shape[:2]

    if background_color is None:
        background_color = estimate_background_color(image)

    background = np.asarray(background_color, dtype=np.float32)
    color_distance = np.linalg.norm(rgb - background, axis=2)
    subject_mask = color_distance >= color_distance_threshold

    coordinates = np.argwhere(subject_mask)
    if coordinates.size == 0:
        size = max(1, min(image_width, image_height) // 4)
        center_x = image_width / 2
        center_y = image_height * 0.2
    else:
        top = int(coordinates[:, 0].min())
        bottom = int(coordinates[:, 0].max()) + 1
        left = int(coordinates[:, 1].min())
        right = int(coordinates[:, 1].max()) + 1
        subject_width = max(right - left, 1)
        subject_height = max(bottom - top, 1)
        size = int(round(max(subject_width * 0.34, subject_height * 0.2)))
        size = max(1, min(size, image_width, image_height))
        center_x = left + (subject_width / 2)
        center_y = top + (size * 0.55)

    half_size = size / 2
    box_left = max(0, int(round(center_x - half_size)))
    box_top = max(0, int(round(center_y - half_size)))
    box_right = min(image_width, box_left + size)
    box_bottom = min(image_height, box_top + size)

    if box_right <= box_left:
        box_right = min(image_width, box_left + 1)
    if box_bottom <= box_top:
        box_bottom = min(image_height, box_top + 1)

    return FaceBox(
        left=box_left,
        top=box_top,
        right=box_right,
        bottom=box_bottom,
        confidence=0.0,
    )
