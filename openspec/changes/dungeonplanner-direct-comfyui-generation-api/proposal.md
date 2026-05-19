## Why

DungeonPlanner needs a production-ready image generation pipeline that can turn prompts into usable assets without a fragile middleware layer or manual file handling. Moving orchestration into the existing Express backend while keeping Convex as the database and file-storage layer reduces operational complexity and gives GMs faster, more reliable access to generated wall and character assets.

## What Changes

- Add an Express-backend-managed asynchronous generation job pipeline that tracks prompt, asset type, processing state, and stored output files for wall and character generations.
- Add direct server-to-ComfyUI dispatch that injects prompt text and per-asset upload webhook URLs into a raw ComfyUI workflow before submitting the job to a headless GPU worker.
- Add secure Express upload endpoints that accept raw binary texture and depth outputs, persist them into Convex File Storage, and mark jobs complete once all required assets arrive in the Convex-backed record.
- Add a minimal GPU worker container contract for running bare ComfyUI plus the custom HTTP upload node required by the workflow.
- In scope: server-side job orchestration, secure upload callbacks, Convex-backed generated asset storage, and the API contract between the Express backend and the GPU worker.
- Out of scope: generation UI redesign, prompt authoring UX changes, placement/rendering changes for generated assets, multi-worker scaling beyond a single-queue worker, and any Python middleware service between Convex and ComfyUI.

UX implications: generation requests become asynchronous and more reliable, reducing editor stalls while preserving current editing speed, scene readability, and camera/tool behavior because generation runs outside the active editing loop.

Migration/compatibility: no dungeon serialization migration is expected because generated binaries live in Convex File Storage rather than the dungeon save format. Any downstream persistence changes for libraries or asset references must preserve existing placed-object and character workflows.

## Capabilities

### New Capabilities
- `direct-generated-asset-pipeline`: Queue, dispatch, upload, and completion requirements for server-managed ComfyUI generation jobs backed by Convex storage and database records.

### Modified Capabilities
- None.

## Impact

- Adds new server-side generation orchestration and upload-routing surfaces plus Convex schema/storage updates for persisted job state and assets.
- Introduces a new infrastructure dependency on a headless ComfyUI GPU worker container reachable from the Express backend.
- Establishes a secure binary upload contract between ComfyUI workflow nodes and the server deployment URL while storing outputs in Convex.
- Affects generated asset flows that currently rely on character image generation infrastructure, but is intended to preserve existing placement and rendering behavior for completed assets.
