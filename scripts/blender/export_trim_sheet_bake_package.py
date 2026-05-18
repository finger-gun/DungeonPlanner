"""
Prepare a selected Blender wall model for trim-sheet baking.

Run this from Blender with the source wall object(s) selected:

    blender --python scripts/blender/export_trim_sheet_bake_package.py

Or paste/run it in Blender's Text Editor. The script creates a bake package
under //trim_sheet_bake_exports/<PACKAGE_NAME>/ containing:

    high/trim_high.fbx        Selected source wall, duplicated and joined.
    low/trim_low.fbx          Flat UV'd trim-sheet target plane.
    cage/trim_cage.fbx        Explicit cage mesh for Substance/Blender bakers.
    scene/trim_bake_scene.blend
    textures/                 Copied source image textures where available.
    manifest.json             Dimensions, UV band, map list, and bake notes.

The low plane is intentionally simple. It gives Substance or Blender a stable
surface for baking base color, normal, AO, curvature, and a height/displacement
source without building runtime arrays of displaced wall geometry.
"""

from __future__ import annotations

import json
import math
import os
import re
import shutil
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

import bpy
from mathutils import Vector


PACKAGE_NAME = "kaykit_base_wall_trim"
OUTPUT_ROOT = "//trim_sheet_bake_exports"

# Texture bake target size. Substance can bake at another size, this is stored
# in the manifest and used for placeholder images inside the Blender scene.
TEXTURE_SIZE = 2048

# Padding around the UV island, in normalized UV units.
UV_MARGIN = 0.02

# Extra distance beyond the high source bounds for the explicit cage.
CAGE_OUTSET = 0.08

# Where to put the low plane along the model's depth axis:
# - "back": best for baking full relief into a height/displacement map.
# - "center": conservative if the asset has detail on both sides.
# - "front": useful for normal/AO only, but weak for height.
LOW_PLANE_DEPTH_MODE = "back"

# Export both FBX and OBJ. Substance Painter is usually happiest with FBX, but
# OBJ is useful for debugging and for Blender-only bake experiments.
EXPORT_OBJ_DEBUG_COPY = True


@dataclass
class AxisLayout:
    width_axis: str
    depth_axis: str
    height_axis: str
    front_sign: int


@dataclass
class Bounds:
    min: tuple[float, float, float]
    max: tuple[float, float, float]
    size: tuple[float, float, float]
    center: tuple[float, float, float]


def main() -> None:
    source_objects = selected_mesh_objects()
    if not source_objects:
        raise RuntimeError("Select one or more mesh objects before running this script.")

    package_dir = resolve_blender_path(OUTPUT_ROOT) / PACKAGE_NAME
    dirs = create_output_dirs(package_dir)

    source_bounds = get_world_bounds(source_objects)
    layout = infer_wall_axes(source_bounds)
    trim_name = sanitize_name(PACKAGE_NAME)

    bake_collection = recreate_collection("TRIM_SHEET_BAKE_PACKAGE")
    high_collection = recreate_collection("TRIM_HIGH_SOURCE", parent=bake_collection)
    low_collection = recreate_collection("TRIM_LOW_TARGET", parent=bake_collection)
    cage_collection = recreate_collection("TRIM_CAGE", parent=bake_collection)

    high_object = duplicate_joined_mesh(source_objects, f"{trim_name}_high", high_collection)
    low_object = create_low_trim_plane(f"{trim_name}_low", source_bounds, layout, low_collection)
    cage_object = create_cage_plane(f"{trim_name}_cage", source_bounds, layout, cage_collection)

    assign_bake_target_material(low_object, dirs["maps"])

    texture_manifest = copy_source_textures(source_objects, dirs["textures"])
    material_manifest = collect_material_manifest(source_objects, texture_manifest)

    export_mesh(dirs["high"] / "trim_high.fbx", [high_object], "FBX")
    export_mesh(dirs["low"] / "trim_low.fbx", [low_object], "FBX")
    export_mesh(dirs["cage"] / "trim_cage.fbx", [cage_object], "FBX")

    if EXPORT_OBJ_DEBUG_COPY:
        export_mesh(dirs["high"] / "trim_high.obj", [high_object], "OBJ")
        export_mesh(dirs["low"] / "trim_low.obj", [low_object], "OBJ")
        export_mesh(dirs["cage"] / "trim_cage.obj", [cage_object], "OBJ")

    configure_scene_for_baking(low_object, high_object, cage_object)
    scene_path = dirs["scene"] / "trim_bake_scene.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(scene_path), copy=True)

    manifest = build_manifest(
        package_dir=package_dir,
        bounds=source_bounds,
        layout=layout,
        low_object=low_object,
        high_object=high_object,
        cage_object=cage_object,
        textures=texture_manifest,
        materials=material_manifest,
    )
    write_json(package_dir / "manifest.json", manifest)

    print("")
    print("Trim-sheet bake package exported:")
    print(f"  {package_dir}")
    print("")
    print("Recommended Substance setup:")
    print("  High definition mesh: high/trim_high.fbx")
    print("  Low definition mesh:  low/trim_low.fbx")
    print("  Cage file:            cage/trim_cage.fbx")
    print("  Match:                By mesh name, or Always if using this single pair")
    print("  Bake maps:            Normal, World Space Normal, AO, Curvature, Position, Thickness, Height")


def selected_mesh_objects() -> list[bpy.types.Object]:
    objects: list[bpy.types.Object] = []
    seen: set[str] = set()

    def visit(obj: bpy.types.Object) -> None:
        if obj.name in seen:
            return
        seen.add(obj.name)
        if obj.type == "MESH":
            objects.append(obj)
        for child in obj.children:
            visit(child)

    for obj in bpy.context.selected_objects:
        visit(obj)

    return objects


def resolve_blender_path(path: str) -> Path:
    return Path(bpy.path.abspath(path)).resolve()


def create_output_dirs(package_dir: Path) -> dict[str, Path]:
    dirs = {
        "root": package_dir,
        "high": package_dir / "high",
        "low": package_dir / "low",
        "cage": package_dir / "cage",
        "scene": package_dir / "scene",
        "textures": package_dir / "textures",
        "maps": package_dir / "maps",
    }
    for directory in dirs.values():
        directory.mkdir(parents=True, exist_ok=True)
    return dirs


def recreate_collection(name: str, parent: bpy.types.Collection | None = None) -> bpy.types.Collection:
    old = bpy.data.collections.get(name)
    if old is not None:
        remove_collection(old)

    collection = bpy.data.collections.new(name)
    if parent is None:
        bpy.context.scene.collection.children.link(collection)
    else:
        parent.children.link(collection)
    return collection


def remove_collection(collection: bpy.types.Collection) -> None:
    for obj in list(collection.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for child in list(collection.children):
        remove_collection(child)
    bpy.data.collections.remove(collection)


def duplicate_joined_mesh(
    source_objects: Iterable[bpy.types.Object],
    name: str,
    collection: bpy.types.Collection,
) -> bpy.types.Object:
    duplicates: list[bpy.types.Object] = []
    for source in source_objects:
        duplicate = source.copy()
        duplicate.data = source.data.copy()
        duplicate.animation_data_clear()
        duplicate.name = f"{sanitize_name(source.name)}_high_part"
        duplicate.data.name = duplicate.name
        collection.objects.link(duplicate)
        duplicates.append(duplicate)

    unlink_from_other_collections(duplicates, keep=collection)

    bpy.ops.object.select_all(action="DESELECT")
    for duplicate in duplicates:
        duplicate.select_set(True)
    bpy.context.view_layer.objects.active = duplicates[0]

    if len(duplicates) > 1:
        bpy.ops.object.join()

    high_object = bpy.context.view_layer.objects.active
    high_object.name = name
    high_object.data.name = f"{name}_mesh"
    return high_object


def unlink_from_other_collections(objects: Iterable[bpy.types.Object], keep: bpy.types.Collection) -> None:
    object_set = set(objects)
    for obj in object_set:
        for collection in list(obj.users_collection):
            if collection != keep:
                collection.objects.unlink(obj)


def get_world_bounds(objects: Iterable[bpy.types.Object]) -> Bounds:
    points: list[Vector] = []
    for obj in objects:
        for corner in obj.bound_box:
            points.append(obj.matrix_world @ Vector(corner))

    min_v = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    max_v = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    size_v = max_v - min_v
    center_v = (min_v + max_v) * 0.5
    return Bounds(tuple(min_v), tuple(max_v), tuple(size_v), tuple(center_v))


def infer_wall_axes(bounds: Bounds) -> AxisLayout:
    # Wall assets are expected to be upright in Blender: Z is height. The
    # smaller horizontal dimension is treated as depth; the other is width.
    size = {"x": bounds.size[0], "y": bounds.size[1], "z": bounds.size[2]}
    depth_axis = "x" if size["x"] < size["y"] else "y"
    width_axis = "y" if depth_axis == "x" else "x"
    return AxisLayout(width_axis=width_axis, depth_axis=depth_axis, height_axis="z", front_sign=1)


def create_low_trim_plane(
    name: str,
    bounds: Bounds,
    layout: AxisLayout,
    collection: bpy.types.Collection,
) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(f"{name}_mesh")
    verts, faces, uvs = make_projection_plane_geometry(bounds, layout, LOW_PLANE_DEPTH_MODE, 0.0)
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    uv_layer = mesh.uv_layers.new(name="trim_sheet_uv")
    for loop_index, uv in enumerate(uvs):
        uv_layer.data[loop_index].uv = uv

    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    add_custom_props(obj, role="low", layout=layout, bounds=bounds)
    return obj


def create_cage_plane(
    name: str,
    bounds: Bounds,
    layout: AxisLayout,
    collection: bpy.types.Collection,
) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(f"{name}_mesh")
    verts, faces, uvs = make_projection_plane_geometry(bounds, layout, "front", CAGE_OUTSET)
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    uv_layer = mesh.uv_layers.new(name="trim_sheet_uv")
    for loop_index, uv in enumerate(uvs):
        uv_layer.data[loop_index].uv = uv

    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    add_custom_props(obj, role="cage", layout=layout, bounds=bounds)
    return obj


def make_projection_plane_geometry(
    bounds: Bounds,
    layout: AxisLayout,
    depth_mode: str,
    depth_outset: float,
) -> tuple[list[tuple[float, float, float]], list[tuple[int, int, int, int]], list[tuple[float, float]]]:
    min_values = {"x": bounds.min[0], "y": bounds.min[1], "z": bounds.min[2]}
    max_values = {"x": bounds.max[0], "y": bounds.max[1], "z": bounds.max[2]}
    center_values = {"x": bounds.center[0], "y": bounds.center[1], "z": bounds.center[2]}

    if depth_mode == "back":
        depth_value = min_values[layout.depth_axis] - depth_outset
    elif depth_mode == "center":
        depth_value = center_values[layout.depth_axis]
    elif depth_mode == "front":
        depth_value = max_values[layout.depth_axis] + depth_outset
    else:
        raise ValueError(f"Unsupported depth mode: {depth_mode}")

    width_min = min_values[layout.width_axis]
    width_max = max_values[layout.width_axis]
    height_min = min_values[layout.height_axis]
    height_max = max_values[layout.height_axis]

    def point(width_value: float, height_value: float) -> tuple[float, float, float]:
        values = {
            layout.width_axis: width_value,
            layout.depth_axis: depth_value,
            layout.height_axis: height_value,
        }
        return (values["x"], values["y"], values["z"])

    verts = [
        point(width_min, height_min),
        point(width_max, height_min),
        point(width_max, height_max),
        point(width_min, height_max),
    ]

    # Winding is chosen so the normal points toward the high model front side
    # for the common case of depth_axis=Y/front=+Y. Flip for depth_axis=X.
    if layout.depth_axis == "y":
        faces = [(0, 1, 2, 3)]
    else:
        faces = [(0, 3, 2, 1)]

    uv_min = UV_MARGIN
    uv_max = 1.0 - UV_MARGIN
    uvs = [
        (uv_min, uv_min),
        (uv_max, uv_min),
        (uv_max, uv_max),
        (uv_min, uv_max),
    ]
    return verts, faces, uvs


def add_custom_props(obj: bpy.types.Object, role: str, layout: AxisLayout, bounds: Bounds) -> None:
    obj["trim_sheet_role"] = role
    obj["trim_sheet_width_axis"] = layout.width_axis
    obj["trim_sheet_depth_axis"] = layout.depth_axis
    obj["trim_sheet_height_axis"] = layout.height_axis
    obj["trim_sheet_source_min"] = bounds.min
    obj["trim_sheet_source_max"] = bounds.max


def assign_bake_target_material(obj: bpy.types.Object, maps_dir: Path) -> None:
    material = bpy.data.materials.new("trim_bake_target_material")
    material.use_nodes = True
    obj.data.materials.append(material)

    images = {
        "base_color": create_placeholder_image(maps_dir / "base_color.png"),
        "normal": create_placeholder_image(maps_dir / "normal.png", float_buffer=False),
        "height": create_placeholder_image(maps_dir / "height.png", float_buffer=True),
        "roughness": create_placeholder_image(maps_dir / "roughness.png"),
        "ao": create_placeholder_image(maps_dir / "ao.png"),
    }

    material["bake_images"] = json.dumps({key: bpy.path.abspath(image.filepath) for key, image in images.items()})


def create_placeholder_image(path: Path, float_buffer: bool = False) -> bpy.types.Image:
    image = bpy.data.images.new(path.stem, width=TEXTURE_SIZE, height=TEXTURE_SIZE, alpha=True, float_buffer=float_buffer)
    image.filepath_raw = str(path)
    image.file_format = "PNG"
    image.save()
    return image


def copy_source_textures(
    objects: Iterable[bpy.types.Object],
    textures_dir: Path,
) -> dict[str, dict[str, str | bool]]:
    copied: dict[str, dict[str, str | bool]] = {}
    for obj in objects:
        for material_slot in obj.material_slots:
            material = material_slot.material
            if material is None or not material.use_nodes:
                continue
            for node in material.node_tree.nodes:
                if node.type != "TEX_IMAGE" or node.image is None:
                    continue
                image = node.image
                source_path = bpy.path.abspath(image.filepath) if image.filepath else ""
                key = image.name
                if key in copied:
                    continue

                entry: dict[str, str | bool] = {
                    "imageName": image.name,
                    "sourcePath": source_path,
                    "copied": False,
                    "packagePath": "",
                }

                if source_path and os.path.exists(source_path):
                    destination = unique_path(textures_dir / Path(source_path).name)
                    shutil.copy2(source_path, destination)
                    entry["copied"] = True
                    entry["packagePath"] = str(destination)
                elif image.packed_file is not None:
                    destination = unique_path(textures_dir / f"{sanitize_name(image.name)}.png")
                    old_filepath = image.filepath_raw
                    old_format = image.file_format
                    image.filepath_raw = str(destination)
                    image.file_format = "PNG"
                    image.save()
                    image.filepath_raw = old_filepath
                    image.file_format = old_format
                    entry["copied"] = True
                    entry["packagePath"] = str(destination)

                copied[key] = entry
    return copied


def collect_material_manifest(
    objects: Iterable[bpy.types.Object],
    textures: dict[str, dict[str, str | bool]],
) -> list[dict[str, object]]:
    materials: list[dict[str, object]] = []
    seen: set[str] = set()
    for obj in objects:
        for material_slot in obj.material_slots:
            material = material_slot.material
            if material is None or material.name in seen:
                continue
            seen.add(material.name)
            texture_nodes: list[dict[str, str]] = []
            if material.use_nodes:
                for node in material.node_tree.nodes:
                    if node.type == "TEX_IMAGE" and node.image is not None:
                        texture_nodes.append({
                            "node": node.name,
                            "image": node.image.name,
                            "packagePath": str(textures.get(node.image.name, {}).get("packagePath", "")),
                        })
            materials.append({
                "name": material.name,
                "useNodes": bool(material.use_nodes),
                "textureNodes": texture_nodes,
                "diffuseColor": tuple(float(channel) for channel in material.diffuse_color),
            })
    return materials


def export_mesh(path: Path, objects: list[bpy.types.Object], file_type: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]

    if file_type == "FBX":
        bpy.ops.export_scene.fbx(
            filepath=str(path),
            use_selection=True,
            apply_unit_scale=True,
            bake_space_transform=False,
            object_types={"MESH"},
            mesh_smooth_type="FACE",
            use_mesh_modifiers=True,
            add_leaf_bones=False,
            path_mode="COPY",
            embed_textures=False,
        )
        return

    if file_type == "OBJ":
        export_obj(path)
        return

    raise ValueError(f"Unsupported export type: {file_type}")


def export_obj(path: Path) -> None:
    # Blender 4.x exposes wm.obj_export; older versions expose export_scene.obj.
    if hasattr(bpy.ops.wm, "obj_export"):
        bpy.ops.wm.obj_export(filepath=str(path), export_selected_objects=True)
    else:
        bpy.ops.export_scene.obj(filepath=str(path), use_selection=True)


def configure_scene_for_baking(
    low_object: bpy.types.Object,
    high_object: bpy.types.Object,
    cage_object: bpy.types.Object,
) -> None:
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 64
    scene.render.resolution_x = TEXTURE_SIZE
    scene.render.resolution_y = TEXTURE_SIZE

    bpy.ops.object.select_all(action="DESELECT")
    high_object.select_set(True)
    low_object.select_set(True)
    bpy.context.view_layer.objects.active = low_object

    scene.render.bake.use_selected_to_active = True
    scene.render.bake.use_cage = True
    scene.render.bake.cage_object = cage_object
    scene.render.bake.margin = 16
    scene.render.bake.target = "IMAGE_TEXTURES"


def build_manifest(
    package_dir: Path,
    bounds: Bounds,
    layout: AxisLayout,
    low_object: bpy.types.Object,
    high_object: bpy.types.Object,
    cage_object: bpy.types.Object,
    textures: dict[str, dict[str, str | bool]],
    materials: list[dict[str, object]],
) -> dict[str, object]:
    depth_extent = bounds.size[axis_index(layout.depth_axis)]
    height_note = (
        "Use high/trim_high.fbx as the high mesh, low/trim_low.fbx as the low mesh, "
        "and cage/trim_cage.fbx as the explicit cage. Bake height/displacement from "
        "the selected high wall onto the low plane. The low plane is placed at the "
        f"'{LOW_PLANE_DEPTH_MODE}' side of the source bounds, so the useful height range is "
        f"approximately 0..{depth_extent + CAGE_OUTSET:.4f} Blender units along the "
        f"{layout.depth_axis.upper()} axis."
    )

    return {
        "packageName": PACKAGE_NAME,
        "packagePath": str(package_dir),
        "textureSize": TEXTURE_SIZE,
        "sourceBounds": asdict(bounds),
        "axisLayout": asdict(layout),
        "uvBands": [
            {
                "name": "base_wall",
                "uv": {
                    "minU": UV_MARGIN,
                    "minV": UV_MARGIN,
                    "maxU": 1.0 - UV_MARGIN,
                    "maxV": 1.0 - UV_MARGIN,
                },
                "lowMesh": low_object.name,
                "highMesh": high_object.name,
                "cageMesh": cage_object.name,
            }
        ],
        "exports": {
            "highFbx": "high/trim_high.fbx",
            "lowFbx": "low/trim_low.fbx",
            "cageFbx": "cage/trim_cage.fbx",
            "sceneBlend": "scene/trim_bake_scene.blend",
        },
        "recommendedBakeMaps": [
            "base_color",
            "normal",
            "world_space_normal",
            "ambient_occlusion",
            "curvature",
            "position",
            "thickness",
            "height",
            "roughness",
        ],
        "substancePainter": {
            "matchMode": "always_for_single_pair_or_by_mesh_name",
            "commonOutputSize": TEXTURE_SIZE,
            "antialiasing": "4x4",
            "dilationWidth": 16,
            "useCage": True,
            "heightUsage": height_note,
        },
        "blenderCycles": {
            "selectedToActive": True,
            "useCage": True,
            "marginPixels": 16,
            "normalSpace": "tangent",
            "note": "The scene file has the low mesh active and high mesh selected for selected-to-active baking.",
        },
        "textures": textures,
        "materials": materials,
    }


def write_json(path: Path, value: dict[str, object]) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True), encoding="utf-8")


def axis_index(axis: str) -> int:
    return {"x": 0, "y": 1, "z": 2}[axis]


def sanitize_name(name: str) -> str:
    clean = re.sub(r"[^A-Za-z0-9_]+", "_", name.strip())
    clean = re.sub(r"_+", "_", clean).strip("_")
    return clean or "trim_asset"


def unique_path(path: Path) -> Path:
    if not path.exists():
        return path
    stem = path.stem
    suffix = path.suffix
    parent = path.parent
    for index in range(1, 10000):
        candidate = parent / f"{stem}_{index:04d}{suffix}"
        if not candidate.exists():
            return candidate
    raise RuntimeError(f"Could not find a unique path for {path}")


if __name__ == "__main__":
    main()
