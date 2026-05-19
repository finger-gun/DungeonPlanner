## 1. Convex persistence for generation jobs

- [ ] 1.1 Add a `generations` table to `app/convex/schema.ts` with prompt, generation type, lifecycle status, asset storage ids, timestamps, and failure metadata.
- [ ] 1.2 Add shared Convex helpers or functions for creating generation records, claiming the next pending job, updating asset references, and marking jobs completed or failed.
- [ ] 1.3 Add or update tests covering generation record creation, status transitions, and completion only after both required assets are stored.

## 2. Server-side queue and ComfyUI dispatch

- [ ] 2.1 Add server-side workflow template assets and template metadata for prompt-field and upload-callback injection by generation type.
- [ ] 2.2 Implement a single-concurrency generation queue in `server/src/` that claims pending jobs from Convex, marks them processing, and dispatches them to the ComfyUI worker.
- [ ] 2.3 Implement dispatch error handling that records failed submissions back onto the corresponding Convex generation record.

## 3. Upload callback and asset persistence flow

- [ ] 3.1 Add authenticated Express upload endpoints for generation assets that validate generation id, asset kind, and the shared-secret header.
- [ ] 3.2 Persist accepted upload binaries from the Express backend into Convex File Storage and patch the matching generation record with the stored asset reference.
- [ ] 3.3 Complete the generation only after both texture and depth uploads are stored, and reject uploads that target invalid or terminal jobs.

## 4. Worker packaging and backend integration

- [ ] 4.1 Add the minimal ComfyUI Dockerfile and supporting setup needed to run headless ComfyUI plus the custom HTTP Upload node on port `8188`.
- [ ] 4.2 Add server configuration for the GPU worker base URL, upload secret, and Convex access credentials, and wire those settings into dispatch and upload handling.
- [ ] 4.3 Update any app or server integration points that read generated assets so they resolve Convex-backed storage references without breaking existing character or asset workflows.

## 5. Validation

- [ ] 5.1 Add focused tests for workflow injection, queue serialization behavior, authenticated upload handling, and failure-state updates.
- [ ] 5.2 Run `pnpm run test` and `pnpm run build` after the new generation pipeline is integrated.
- [ ] 5.3 Run `pnpm run verify` once the end-to-end pipeline changes are ready for full validation.
