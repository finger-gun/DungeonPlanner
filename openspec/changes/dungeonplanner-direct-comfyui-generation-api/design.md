## Context

DungeonPlanner already has image-generation-related code paths in the `server/` package, and the current implementation stores generated character assets on local disk. The proposed production pipeline keeps orchestration in the existing Express backend while moving persistence to Convex so wall and character outputs can be queued, tracked, and stored without introducing a separate Python or FastAPI middleware tier.

This change crosses several boundaries at once:
- Express backend queueing, orchestration, and HTTP route design in `server/src/`
- Convex schema and storage integration in `app/convex/`
- a new GPU worker contract for headless ComfyUI
- secure HTTP callbacks from external infrastructure into the Express deployment

The design must keep generation off the editor hot path so map editing, scene readability, and camera/tool behavior remain unchanged while jobs are processing asynchronously.

## Goals / Non-Goals

**Goals:**
- Add a durable `generations` job model that tracks prompt, asset type, lifecycle status, and uploaded output storage ids in Convex.
- Dispatch ComfyUI jobs from the Express backend by mutating a raw workflow graph at runtime instead of maintaining a separate middleware translator service.
- Accept texture and depth binaries through authenticated Express HTTP endpoints and persist them into Convex File Storage.
- Limit processing to one generation job at a time through a server-managed single-concurrency queue so the single GPU worker remains predictable.
- Reuse existing server routing patterns and Convex-backed storage/database patterns where possible.

**Non-Goals:**
- Reworking the editor or authenticated app UI for prompt authoring, polling, or asset browsing in this artifact.
- Replacing all existing generation code in `server/` during the first slice.
- Supporting multi-worker scheduling, priority queues, retries across multiple GPUs, or arbitrary workflow composition.
- Designing the internals of the custom ComfyUI upload node beyond the HTTP contract it must satisfy.

## Decisions

### 1. Implement orchestration in `server/` and use Convex only for persistence

The repo's application backend lives in `server/`, while Convex is already used as the database and file-storage layer for the authenticated app. The production generation pipeline should therefore be split across:
- `server/src/` for queueing, workflow mutation, ComfyUI dispatch, and upload endpoints
- `app/convex/schema.ts` for persisted generation records
- existing Convex storage access patterns for binary asset storage and retrieval

This keeps request handling and orchestration in the actual backend boundary instead of inventing a second Convex-owned application backend.

**Alternatives considered**
- Move all orchestration into Convex functions: rejected because that does not match the repo architecture; Convex is a persistence layer here, not the primary application backend.
- Keep generated assets on the Express host filesystem: rejected because Convex storage already provides the durable asset layer we want.

### 2. Model generations as a durable state machine in Convex with partial asset completion

Add a `generations` table keyed by prompt submission, with:
- `prompt`
- `type` (`wall` | `character`)
- `status` (`pending` | `processing` | `completed` | `failed`)
- `textureStorageId`
- `depthStorageId`
- operational metadata needed for safety and observability, such as `createdAt`, `updatedAt`, `errorMessage`, `dispatchedAt`, `completedAt`, and optionally `workflowKind` or `submittedByUserId`

The upload flow is inherently multi-step because texture and depth may arrive independently. The record should therefore support partial progress and only transition to `completed` when all required assets for the chosen generation type have been stored successfully.

**Alternatives considered**
- Store only final asset ids with no intermediate state: rejected because queue workers and upload callbacks need explicit lifecycle state.
- Use separate records per uploaded asset: rejected because job tracking, UI polling, and failure handling are clearer with a single parent generation record.

### 3. Use a server-managed single-concurrency queue to serialize dispatch

The GPU worker is intentionally a single headless ComfyUI container. The Express backend should serialize dispatch using a queue or workpool abstraction configured for one active job at a time. The worker should claim the next `pending` generation from Convex, mark it `processing`, build the workflow payload, POST it to ComfyUI, and exit without waiting for image completion.

This keeps request handlers short-lived and uses the Convex-backed record plus webhook callbacks as the source of truth for eventual completion.

**Alternatives considered**
- Fire actions directly from the UI without queueing: rejected because concurrent users could overwhelm the single worker and create race-prone status tracking.
- Poll ComfyUI from a long-running request handler until completion: rejected because it couples server request lifetime to GPU runtime and duplicates the callback mechanism.

### 4. Inject prompt text and upload URLs into versioned workflow templates at dispatch time

Wall and character generations should be defined by raw ComfyUI workflow JSON templates stored as versioned assets in the server codebase. The dispatch worker should:
1. select the workflow template for the requested generation type
2. deep-clone the JSON
3. locate the configured text encoder node(s) and inject the prompt
4. generate server upload URLs for `texture` and `depth`
5. inject those URLs into the custom HTTP Upload node inputs
6. POST the final graph to `http://<gpu-worker>:8188/prompt`

The design should avoid brittle "find any string field named text" traversal. Instead, each workflow template should have an adjacent small configuration object that identifies which node ids and input keys receive prompt and webhook values.

**Alternatives considered**
- Hardcode node ids directly in the action: acceptable short-term but weaker than keeping template metadata beside the workflow.
- Build workflows programmatically instead of storing raw JSON: rejected because ComfyUI graphs are easier to author and review in their native exported format.

### 5. Secure the upload endpoint with a shared secret header and generation-scoped URL parameters

The Express upload route should require:
- query params or path params identifying the generation id and asset kind
- a shared secret header known to the server and the ComfyUI upload node

The handler should reject requests with missing or invalid secrets before storing data. Once authenticated, it should read the binary body, store the blob in Convex File Storage, patch the matching generation record in Convex, and transition status when all required assets are present.

This design deliberately avoids forcing ComfyUI to talk directly to Convex endpoints because the workflow needs a simple, stable upload contract owned by the Express backend while still persisting into Convex.

**Alternatives considered**
- Unauthenticated callback URLs with opaque ids: rejected because the endpoint is internet-reachable and should not trust id secrecy alone.
- One secret per job: stronger but unnecessary for the first slice and more complex to inject/manage inside ComfyUI graphs.

### 6. Keep existing app asset consumers compatible by resolving Convex storage URLs lazily

The current app already resolves Convex `_storage` ids to signed URLs lazily in query helpers such as `actors.ts`. The new generation pipeline should follow the same pattern: store `_storage` ids durably in Convex and derive access URLs in read APIs rather than persisting public URLs as the source of truth.

This keeps storage-provider specifics out of durable records and matches the existing app conventions.

**Alternatives considered**
- Persist returned URLs directly: rejected because Convex storage URLs are derived data and may change over time.

### 7. Treat the Docker image as infrastructure for a narrow execution contract

The Docker deliverable should produce a minimal container that:
- installs ComfyUI
- installs the custom HTTP Upload node dependency
- exposes port `8188`
- runs `python main.py --listen 0.0.0.0`

The application contract is intentionally narrow: the Express backend submits a graph, ComfyUI executes it, and the upload node posts binaries back to the Express backend for persistence into Convex. No additional web server should exist in the container.

**Alternatives considered**
- Add a Python API wrapper for validation or secret injection: rejected because the change explicitly removes middleware.

## Risks / Trade-offs

- **[Workflow template drift]** Exported ComfyUI JSON can change when nodes are updated or graphs are reauthored -> **Mitigation:** keep workflow metadata versioned beside the JSON and validate required node ids/inputs before dispatch.
- **[External callback abuse]** The upload endpoint is publicly reachable -> **Mitigation:** require a shared secret header, validate generation id and asset kind strictly, and reject uploads for terminal jobs.
- **[Stuck `processing` jobs]** Server dispatch may succeed but uploads may never arrive if the worker crashes -> **Mitigation:** record `dispatchedAt`, add timeout/reaper logic in a later task, and allow explicit failure marking in Convex.
- **[Single-worker backlog]** `maxParallelism: 1` trades throughput for predictability -> **Mitigation:** keep the queue explicit now and leave the schema compatible with future worker scaling.
- **[Repo boundary confusion]** Existing `server/` generation code and new generation queue/upload logic may overlap conceptually -> **Mitigation:** document that `server/` owns orchestration and Convex owns persistence, and defer broader cleanup to follow-up work.
- **[Large upload memory use]** Binary uploads are buffered by the Express handler before persistence -> **Mitigation:** constrain supported output sizes for the first slice and prefer PNG/WebP outputs sized for game assets.

## Migration Plan

1. Add the `generations` table and any supporting indexes to `app/convex/schema.ts`.
2. Add workflow template assets plus queueing, dispatch, and Convex persistence integration in `server/src/`.
3. Extend the Express backend with the authenticated binary upload route.
4. Add environment variables for the GPU worker base URL, shared upload secret, and any Convex access credentials required by the server.
5. Deploy Convex schema changes before routing production traffic to the new pipeline.
6. Deploy the server changes that submit jobs and persist upload callbacks into Convex.
7. Build and deploy the ComfyUI Docker image with the custom upload node and matching shared secret.
8. Enable clients to create generation jobs only after Convex, the server, and the worker are live.

**Rollback strategy**
- Disable job creation in the app surface or config.
- Stop the GPU worker.
- Keep existing stored generation records intact.
- Revert or disable the new server routes/workers if needed; schema rollback should be avoided unless the table is unused because stored job history is harmless.

## Open Questions

- Does `wall` generation always require both `texture` and `depth`, or do some workflows need optional asset sets?
- Should user-facing generation submission live under authenticated mutations only, or do we also need internal-only generation entry points for automation/import flows?
- Where should workflow JSON live in the repo: inline TypeScript constants, checked-in `.json` files under `server/`, or content-pack-style assets?
- Do we need a first-slice query API for polling generation progress, or is that covered by existing Convex subscription patterns outside this artifact?
- Should the shared upload secret be global for the worker or rotated per environment/deployment?
