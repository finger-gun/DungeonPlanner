## ADDED Requirements

### Requirement: Generation jobs are stored as durable backend records
The system SHALL create a durable generation record for each submitted wall or character generation request, with prompt text, generation type, lifecycle status, and Convex-backed asset references for the generated texture and depth outputs.

#### Scenario: New generation request creates a pending record
- **WHEN** a user or backend workflow submits a new wall or character generation request
- **THEN** the system creates a generation record with the submitted prompt and type
- **AND** the record starts in `pending` status before GPU processing begins

#### Scenario: Stored generation record tracks uploaded asset references
- **WHEN** texture or depth outputs are persisted for a generation
- **THEN** the generation record stores the corresponding Convex storage reference for each uploaded asset
- **AND** the record remains the source of truth for generation progress

### Requirement: Generation dispatch is serialized through a single-worker queue
The system MUST dispatch generation jobs to the ComfyUI worker through a backend-managed queue that allows only one active job at a time.

#### Scenario: Second request waits for the active job
- **WHEN** one generation job is already being processed and another pending job is available
- **THEN** the system dispatches only the active job to the ComfyUI worker
- **AND** the later job remains queued until the active dispatch completes or fails

#### Scenario: Dispatch updates job status before submission
- **WHEN** the queue selects the next pending generation for processing
- **THEN** the system marks that generation as `processing`
- **AND** the queue submits the job to the headless ComfyUI worker without waiting for final image delivery

### Requirement: Dispatched workflows contain runtime prompt and upload callback injection
The system SHALL build each ComfyUI submission from a stored workflow template and inject the generation prompt plus backend upload callback URLs for the required output assets before dispatch.

#### Scenario: Prompt is injected into the selected workflow
- **WHEN** the backend prepares a wall or character generation workflow for dispatch
- **THEN** the submitted ComfyUI graph contains the request prompt in the configured text-encoder input
- **AND** the graph matches the workflow template for the selected generation type

#### Scenario: Upload callbacks are injected for both required assets
- **WHEN** the backend dispatches a generation job
- **THEN** the submitted workflow contains backend callback URLs for both the texture output and the depth output
- **AND** those callback URLs identify the target generation record and asset kind

### Requirement: Upload callbacks are authenticated and persisted to Convex storage
The system MUST accept raw binary callback uploads only through authenticated backend endpoints and persist accepted payloads into Convex File Storage.

#### Scenario: Valid authenticated upload stores an asset
- **WHEN** the ComfyUI upload node posts a texture or depth binary to the backend with the expected shared-secret authentication
- **THEN** the backend stores the binary in Convex File Storage
- **AND** the matching generation record is updated with the stored asset reference for that asset kind

#### Scenario: Invalid upload authentication is rejected
- **WHEN** a callback upload omits the required shared-secret authentication or sends an invalid secret
- **THEN** the backend rejects the upload request
- **AND** the system does not store the payload or mutate the generation record

### Requirement: Generation completion depends on required asset delivery
The system MUST treat texture and depth outputs as separate required assets and complete a generation only after both assets have been stored successfully for that generation.

#### Scenario: First uploaded asset leaves generation in progress
- **WHEN** only one of the required outputs has been uploaded successfully for a processing generation
- **THEN** the generation record remains incomplete
- **AND** the system continues waiting for the missing required asset

#### Scenario: Second uploaded asset completes the generation
- **WHEN** the remaining required output is uploaded successfully for a processing generation
- **THEN** the system marks the generation record as `completed`
- **AND** the record retains both stored asset references for later retrieval

### Requirement: Dispatch and callback failures are visible in generation state
The system MUST record failed dispatch or upload-processing outcomes on the generation record instead of silently abandoning the job.

#### Scenario: Dispatch failure marks the generation as failed
- **WHEN** the backend cannot submit a prepared workflow to the ComfyUI worker
- **THEN** the system marks the generation record as `failed`
- **AND** the failure is retained on the record for later inspection or retry handling

#### Scenario: Upload cannot be applied to the target generation
- **WHEN** an authenticated upload references an invalid generation id, an invalid asset kind, or a generation that can no longer accept that asset
- **THEN** the backend rejects the upload
- **AND** the system leaves unrelated generation records unchanged
