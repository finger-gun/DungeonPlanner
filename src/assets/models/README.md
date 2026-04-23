# Asset pipeline

This directory contains the imported runtime model packs used by the app.

The pipeline now does four things as a single workflow:

1. **Import** source models into a pack directory under `src/assets/models/`.
2. **Optimize** geometry with `gltf-transform`.
3. **Compress textures to KTX2** for WebGPU-friendly runtime loading.
4. **Generate thumbnails** by rendering the imported assets through the app's thumbnail renderer.

## Pack layout

- `src/assets/models/core/` - core pack runtime assets.
- `src/assets/models/dungeon/` - dungeon pack runtime assets.
- `src/assets/models/kaykit/` - KayKit runtime assets, including `.gltf` sidecars and external texture/buffer files.

Pack folders are treated as generated runtime content, not raw source-asset staging areas.

## Runtime loading

Runtime GLTF loading goes through `src/rendering/useGLTF.ts`, not raw `@react-three/drei` `useGLTF(...)` calls.

That wrapper:

- installs `KTX2Loader`
- points it at `/three/basis/`
- waits until a renderer is available before flushing queued preloads
- keeps thumbnail rendering and main-scene rendering on the same KTX2 path

The Basis transcoder files are copied from `three/examples/jsm/libs/basis/` into `public/three/basis/` by:

- `pnpm run sync:ktx2-transcoders`

That sync runs automatically before:

- `pnpm run dev`
- `pnpm run build:demo`
- `pnpm run generate:thumbnails`

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm run sync:ktx2-transcoders` | Copy Basis transcoder JS/WASM into `public/three/basis/`. |
| `pnpm run optimize:models -- [pack-or-dir]` | Optimize one pack, one directory, or all packs when no target is provided. |
| `pnpm run import:models -- <pack-or-dir> --source <source-dir>` | Copy source assets into a runtime pack, optimize them, then generate thumbnails. |
| `pnpm run generate:content-pack:core` | Rebuild the curated core pack using the configured source directory and allowlist. |
| `pnpm run generate:thumbnails -- <pack-or-dir>` | Regenerate thumbnails for imported GLB/GLTF assets. |

## Standard workflows

### Rebuild the core pack

```bash
pnpm run generate:content-pack:core
```

The core pack is configured in `scripts/model-packs.config.mjs`:

- source directory: `DUNGEONPLANNER_CORE_SOURCE_DIR`
- target directory: `src/assets/models/core`
- imported files: only the curated allowlisted core `.glb` assets

The KayKit terrain pack is also configured in `scripts/model-packs.config.mjs`:

- source directory: `forrest-assets-tmp/KayKit_Forest_Nature_Pack_1.0_EXTRA/Assets/gltf/Color1`
- target directory: `src/assets/models/kaykit`
- imported files: the allowlisted terrain `.gltf` assets used by the stepped outdoor terrain runtime
- derived assets: a generated `forest_grass_patch.png` cropped from the optimized `forest_texture.ktx2` atlas so `OutdoorGround` matches the terrain models at runtime

### Import a new pack or directory

```bash
pnpm run import:models -- dungeon --source /absolute/path/to/source-assets
```

You can also target a direct directory:

```bash
pnpm run import:models -- src/assets/models/custom-pack --source /absolute/path/to/source-assets
```

By default, import will:

1. copy the source assets into the target pack directory
2. run optimization/KTX2 conversion
3. regenerate thumbnails

Optional flags:

- `--skip-optimize`
- `--skip-thumbnails`
- `--clean`
- `--no-clean`
- `--filter <substring>`
- `--texture-size <max-size>`
- `--ktx-dir <directory-containing-ktx>`

### Re-run optimization only

```bash
pnpm run optimize:models -- core
pnpm run optimize:models -- dungeon kaykit
pnpm run optimize:models -- src/assets/models/custom-pack
```

The optimizer:

- runs `gltf-transform optimize`
- uses `--compress meshopt`
- uses `--texture-compress ktx2`
- reports per-file before/after size
- reports per-pack totals
- removes stale sidecar files that are no longer referenced by the resulting assets

## KTX2 / encoder requirements

Texture compression requires the **KTX-Software** CLI and specifically the `ktx` command.

If `ktx` is already on your `PATH`, the scripts will use it automatically.

The optimizer also checks:

- `DUNGEONPLANNER_KTX_DIR`
- `~/.local/bin`

If not, point the scripts at a local install:

```bash
pnpm run optimize:models -- core --ktx-dir /path/to/bin
pnpm run import:models -- dungeon --source /path/to/source --ktx-dir /path/to/bin
```

The script checks for `ktx` and fails with an explicit error when it cannot be found.

## Thumbnails

`pnpm run generate:thumbnails` renders assets through the app itself using Playwright + a local Vite server.

That means thumbnails validate the real runtime path:

- WebGPU renderer
- node-material upgrade path
- KTX2 transcoder wiring
- imported asset URLs as served by Vite

Thumbnails are written next to their model file as `.png`.

## KayKit `.gltf` packs

KayKit assets may use `.gltf` files with sidecar `.bin` and texture files instead of self-contained `.glb`.

The pipeline preserves those sidecars so the runtime can load the emitted `.gltf` directly and let relative sidecar references resolve naturally, including `.ktx2` textures after optimization.

## Notes on output size

KTX2 is primarily a **runtime texture format optimization**, not a guarantee that every individual file on disk gets smaller.

Expected behavior:

- many larger textured assets shrink significantly
- some tiny assets may grow slightly after KTX2 packaging
- pack-level totals are the metric to watch, not every single file

Use the optimizer report to judge whether a pack is improving overall.

## Troubleshooting

### `The KTX-Software CLI was not found`

Install KTX-Software or rerun with:

```bash
--ktx-dir /path/to/bin
```

### `No GLB/GLTF files found`

Check that:

- your target pack/directory is correct
- your `--filter` is not excluding everything
- the source import step actually copied model files

### Thumbnails fail after import

Run:

```bash
pnpm run sync:ktx2-transcoders
pnpm run generate:thumbnails -- <pack-or-dir>
```

If that still fails, check that the imported pack resolves all referenced sidecar files and that the target assets load in the app through `src/rendering/useGLTF.ts`.
