# Architecture

This page explains how DungeonPlanner is structured today, with the current backend facade in place, and then drills into the editor internals in `editor/src/`.

---

## The big picture

DungeonPlanner is a monorepo with three main runtime surfaces:

- `app/` — the authenticated workspace app. Users manage dungeons, sessions, actor packs, actors, roles, and other library/admin data here.
- `editor/` — the main dungeon editor and player view package. This is the 3D R3F/WebGPU experience.
- `server/` — the browser-facing backend facade. It owns auth cookies, browser API endpoints, editor/library proxies, actor library proxies, generated-character endpoints, and the Colyseus multiplayer server.

Convex still exists, but it is now an **internal backend dependency**, not something the browser talks to directly.

```text
┌────────────────────────────────────────────────────────────────────┐
│ Browser: app/                                                     │
│ React workspace UI                                                │
│ - login                                                           │
│ - dungeon library                                                 │
│ - sessions / actor packs / actors / roles                         │
└───────────────────────────────┬────────────────────────────────────┘
                                │ fetch + cookies
┌───────────────────────────────▼────────────────────────────────────┐
│ server/                                                           │
│ Express facade + Colyseus                                         │
│ - /api/auth/*                                                     │
│ - /api/app/* typed data routes                                    │
│ - /api/app/storage/upload                                         │
│ - /api/editor/dungeons/*                                          │
│ - /api/session-access/consume                                     │
│ - /api/generated-characters/*                                     │
│ - /api/editor/actors/list                                         │
│ - Colyseus room: "dungeon"                                        │
└──────────────────────┬───────────────────────────────┬─────────────┘
                       │                               │
                       │ server-side Convex access     │ websocket / HTTP
                       │                               │
┌──────────────────────▼───────────────────┐   ┌───────▼────────────────┐
│ Convex                                   │   │ Browser: editor/src/   │
│ app domain data + auth state             │   │ React editor / player  │
│ - users, roles, dungeons                 │   │ Zustand + R3F/WebGPU   │
│ - sessions, actorPacks, characters       │   │ editor + actor handoff │
└──────────────────────────────────────────┘   └────────────────────────┘
```

The architectural rule is now:

> **Browsers talk to `server/`. `server/` talks to Convex.**

---

## Repository roles

## `app/` — authenticated workspace app

`app/` is a static React app that renders the account/workspace UI:

- sign-in and sign-out
- workspace overview
- private dungeon library
- session creation and join flows
- actor pack and actor library
- role management
- content pack management

It no longer uses `ConvexReactClient`, `ConvexProviderWithAuth`, or `@convex-dev/auth/react` in the browser.

Instead:

- `app/src/lib/backendAuth.tsx` manages auth state through backend cookies
- `app/src/lib/backendData.tsx` provides `useQuery` / `useMutation` hooks that map known app operations to explicit backend routes, such as:
  - `GET /api/app/viewer-context`
  - `GET /api/app/dungeons`
  - `POST /api/app/sessions/create`
  - `POST /api/app/roles/grant`
  - `POST /api/app/storage/upload`

The actor pipeline now lives here too:

- `app/src/components/ActorLibraryPanel.tsx` is the browser UI for actor pack management and actor creation/editing
- `app/convex/actors.ts` owns the actor domain in Convex: user-owned `actorPacks`, actor records in `characters`, active/inactive toggles, and the editor-facing actor export
- standee generation/storage still uses the shared `editor/src/generated-characters/*` helpers, but the browser reaches them through `server/`'s `/api/generated-characters/*` facade routes

So `app/` still *looks* like it is calling Convex functions from React, but that is now just a naming and contract convenience. The browser is really talking to `server/`.

## `editor/src/` — editor and player runtime

`editor/src/` is the main dungeon editor and play surface:

- map editing
- room painting
- object placement
- multi-floor dungeon management
- local persistence
- dungeon file import/export
- remote dungeon library handoff
- actor selection from active actor packs
- multiplayer play mode

This app is also static. It talks to:

- `server/` HTTP endpoints for editor-library handoff (`/api/editor/dungeons/*`)
- `server/` actor handoff endpoint (`/api/editor/actors/list`)
- `server/` generated-character APIs (`/api/generated-characters/*`)
- Colyseus on `server/` for live play sessions

`editor/src/` no longer owns actor authoring. It only imports active actors from `app/`, converts them into runtime/generated-character records, and exposes them as selectable placement assets in the editor UI.

## `server/` — backend facade

`server/` is the integration point between static frontends and backend services.

It is responsible for:

1. browser auth/session cookies
2. app-facing typed data routes
3. editor dungeon library proxies
4. editor actor proxy routes
5. session-access token consumption
6. generated-character APIs and asset storage
7. Colyseus multiplayer hosting
8. serving the built frontend bundle in deployment

Key files:

- `server/src/index.ts` — Express + Colyseus bootstrap
- `server/src/authFacade.ts` — auth cookie handling and access-token resolution
- `server/src/appFacade.ts` — app data facade and editor/actor/session proxy routes
- `server/src/sessionAccess.ts` — server-side session token consumption helper
- `server/src/rooms/DungeonRoom.ts` — multiplayer room logic

---

## How `app/`, `editor/`, and `server/` work together

## 1. Authenticated app flow

`app/` boots like this:

```text
app/src/main.tsx
  -> <BackendAuthProvider>
  -> <AppBackendProvider>
  -> <App />
```

At runtime:

1. `BackendAuthProvider` calls `GET /api/auth/session`
2. `server/` checks or refreshes the Convex-backed auth cookies
3. `AppBackendProvider` exposes a simple invalidation counter
4. `app/src/lib/backendData.tsx` maps each supported app operation to an explicit `/api/app/...` route
5. `server/` resolves the current user token, calls the allowlisted Convex function server-side, and returns JSON

This gives `app/` a static deployment model with a server-owned API facade.

## 2. Open dungeon from `app/` into `editor/`

This is the main cross-app handoff:

1. User clicks **Open** in `app/`'s dungeon library
2. `app/` calls `POST /api/app/editor-access-token`
3. `app/` builds an editor launch URL with:
   - editor base URL
   - backend URL
   - short-lived editor access token
   - optional dungeon id
4. The browser opens `editor/`
5. `editor/src/lib/editorDungeonHandoff.ts` reads those params
6. `editor/src/` calls `POST /api/editor/dungeons/open` on `server/`
7. `server/` proxies that request to Convex HTTP actions
8. `editor/src/` receives serialized dungeon JSON and loads it into the Zustand store

The important bit is that the editor now receives the **backend facade URL**, not a raw Convex browser endpoint.

## 3. Actor pipeline

Actors now cross all three runtimes, but each runtime has a narrower responsibility:

### In `app/`

1. `ActorLibraryPanel` is where users create/edit characters and NPCs
2. actor packs are owned by the current user inside the active workspace
3. each pack can be toggled `isActive`, which is the switch that controls whether the editor should see that pack
4. actor standee images are generated/processed/saved through the shared generated-character helpers and `server/`'s `/api/generated-characters/*` routes

### In Convex (internal only)

`app/convex/actors.ts` is the authoritative actor domain layer:

- viewer-scoped queries/mutations manage packs and actors for the workspace app
- `internal.actors.listEditorActors` accepts the short-lived editor access token
- it filters to the token's workspace, keeps only active packs, and only returns actors with ready processed assets (`processedImageUrl`, `thumbnailUrl`, `width`, `height`)
- it emits `EditorActorRecord` payloads from `shared/actors.ts`, including a stable editor/runtime asset id shaped like `generated.player.<actorId>`

### Through `server/`

When the editor starts with backend handoff access:

1. `editor/src/App.tsx` calls `editor/src/lib/editorActors.ts`
2. that posts to `POST /api/editor/actors/list` on `server/`
3. `server/src/appFacade.ts` proxies the request to the Convex site HTTP endpoint
4. `app/convex/http.ts` forwards the request to `internal.actors.listEditorActors`

### In `editor/src/`

The editor is selection-only for actors:

1. `editor/src/App.tsx` maps each `EditorActorRecord` into the existing `GeneratedCharacterRecord` shape
2. `useDungeonStore.ingestGeneratedCharacters()` merges those records into `generatedCharacters`
3. `syncGeneratedCharacterAssets()` rebuilds the runtime asset registry so those actors behave like generated player assets
4. `CharacterToolPanel` renders them under **Active Actor Packs** and only lets users select/place ready actors

So the editor reuses the generated-character/runtime asset path, but the source of truth for actor authoring now lives in `app/`.

## 4. Editor library operations

Inside the editor, remote library actions such as:

- list dungeons
- open dungeon
- save dungeon
- copy dungeon
- delete dungeon

all go through `editor/src/lib/editorDungeonHandoff.ts`, which posts to:

- `/api/editor/dungeons/list`
- `/api/editor/dungeons/open`
- `/api/editor/dungeons/save`
- `/api/editor/dungeons/copy`
- `/api/editor/dungeons/delete`

Those routes are implemented in `server/src/appFacade.ts`, which currently proxies to Convex site HTTP endpoints.

The same short-lived editor access handoff used for dungeon library operations is also what authorizes `/api/editor/actors/list`.

## 5. Multiplayer session access

For live sessions:

1. `app/` creates or joins sessions through the app facade
2. `app/` requests a short-lived session access ticket
3. a live connection presents that ticket to `server/`
4. `server/` resolves the session membership through Convex using `/api/session-access/consume`
5. Colyseus uses the resolved role/session info for room auth

This keeps live room auth server-owned instead of relying on direct browser access to Convex state.

---

## Editor root in `editor/src/`

The editor has two entry modes:

```text
editor/src/main.tsx
  -> <RootApp />
```

`editor/src/RootApp.tsx` decides between:

- `App` — the normal editor/player runtime
- `ThumbnailRendererApp` — a special headless-ish rendering path used for thumbnail generation

That split keeps thumbnail rendering isolated from the normal interactive editor shell.

---

## Editor shell

At a high level, the editor still follows this shape:

```text
<App>
  <EditorToolbar />              left toolbar + actions
  <Scene />                      lazy-loaded 3D viewport
    <Canvas frameloop="demand">
      <GlobalContent />          shared camera / lights / controls
      <FloorContent />           active floor render tree
        <DungeonRoom />
        <DungeonObject />
    </Canvas>
  <RightPanel>
    <ScenePanel />
    <{Tool}ToolPanel />
  </RightPanel>
</App>
```

`editor/src/App.tsx` owns the editor shell state and orchestration:

- sidebar state
- toolbar/tool mode switching
- settings panel mode
- URL handoff parsing
- editor library modal state
- notices/errors for remote library operations

It deliberately does **not** hold dungeon world state itself. That lives in the store.

---

## Zustand store: the editor's source of truth

`editor/src/store/useDungeonStore.ts` is the editor's single source of truth.

It owns:

- floors and floor order
- active floor working state
- rooms and painted cells
- blocked cells
- terrain height/style data
- placed objects and occupancy
- openings and inner walls
- tool/selection UI state
- camera preset state
- lighting/post-processing settings
- generated character metadata, including imported active actors
- undo/redo snapshots

There is no separate view model layer between the UI and the scene. React UI panels and canvas components subscribe directly to the store using selectors.

That is a deliberate performance choice:

- UI code reads the exact slices it needs
- canvas code reads the exact slices it needs
- floor switching works by swapping active snapshots rather than incrementally diffing a giant scene graph

---

## Multi-floor architecture

Each floor is represented as a `FloorRecord`:

```ts
type FloorRecord = {
  id: string
  name: string
  level: number
  snapshot: DungeonSnapshot
  history: DungeonSnapshot[]
  future: DungeonSnapshot[]
}
```

The active floor is "unpacked" into top-level working slices such as:

- `paintedCells`
- `placedObjects`
- `wallOpenings`
- `layers`
- `rooms`

When `switchFloor()` runs:

1. the current active slices are saved back into the current floor snapshot
2. the target floor snapshot is loaded into those same top-level slices

That means most editor code never needs special "current floor" awareness. It just reads the active slices.

In the scene, `Scene.tsx` uses:

```tsx
<FloorContent key={activeFloorId} />
```

That remount-by-key approach is a core architectural choice. Switching floors replaces the active floor render subtree entirely, keeping floor-specific rendering mostly stateless.

---

## Canvas architecture in `editor/src/components/canvas`

`editor/src/components/canvas/Scene.tsx` is the composition root for the 3D world.

It splits rendering into two layers:

## `GlobalContent`

Always mounted. It owns:

- environment lighting
- fog/background
- controls
- grid
- camera preset manager
- FPS meter
- frame driving
- floor transition controller

These systems should survive floor changes without remounting.

## `FloorContent`

Remounted on active floor changes. It owns:

- `DungeonRoom`
- `RoomResizeOverlay`
- `DungeonObject` instances
- post-processing attachment for the active floor view
- fire particle systems
- play-mode drag state for player tokens

This separation is what lets floor transitions stay simple while keeping global camera/lighting state stable.

---

## Demand-mode render loop

The editor canvas uses:

```tsx
<Canvas frameloop="demand" />
```

This means R3F only renders when something explicitly invalidates the frame.

The main drivers are:

- `FrameDriver` in `Scene.tsx`
- floor transition animation
- floor slide-in animation
- room resize interaction
- object drag interaction
- post-processing/focus debug updates
- fire/light effect systems

When the editor is idle, almost nothing renders. This is important because the editor can contain a lot of geometry and post-processing.

`FrameDriver` also respects the browser visibility state so background tabs stop spending cycles.

---

## Floor transitions

`editor/src/components/canvas/FloorTransitionController.tsx` drives floor switches almost entirely inside `useFrame`.

The transition system:

1. fades a DOM overlay to black
2. bumps the camera along Y with a spring-like offset
3. triggers the real `switchFloor()` at peak fade
4. lets the new `FloorContent` remount with a small `startY`
5. fades the overlay back out while the camera settles

This avoids introducing React state churn for what is really an animation problem.

---

## Object registry

`editor/src/components/canvas/objectRegistry.ts` is a small but important optimization.

It keeps:

```text
object id -> THREE.Object3D
```

Openings and objects register on mount and unregister on unmount. Systems such as post-processing and visibility logic can then resolve a selected object in O(1) instead of traversing the whole scene graph.

This is especially useful because the editor runs with:

- selection outlines
- visibility checks
- nested object hierarchies

without wanting repeated `scene.traverse()` scans.

---

## Data flow for editing

The normal flow is still:

1. a UI panel or canvas gesture decides on an operation
2. a store action mutates the dungeon state
3. subscribed canvas/UI components react to the changed slices
4. the canvas invalidates as needed

Example: painting a room

1. user drags in room mode
2. the editor computes affected cells
3. store actions update cell maps, room records, occupancy, and history
4. `DungeonRoom` re-derives render groups from store state
5. animation/render systems invalidate until the visual change completes

The important pattern is that render components derive from store state rather than accumulating their own authoritative copies.

---

## Serialization and file format

`editor/src/store/serialization.ts` owns dungeon file persistence.

Responsibilities:

- serialize active editor state into a portable file
- deserialize old and new file versions
- migrate older file schemas forward
- normalize missing/default data
- preserve multi-floor structure

Current format highlights:

- explicit `version`
- explicit floor list
- serialized objects/openings/cells
- map mode and outdoor terrain settings
- lighting and post-processing settings

This file is the compatibility boundary for saved dungeons. If the store shape changes in a breaking way, the serializer/migrator absorbs that complexity.

---

## Content packs and assets

The editor renders by asset/content ids, not by hardcoded imports inside scene logic.

That means:

- the store records asset ids
- canvas components ask the content registry for the runtime component/config
- pack metadata controls category, snapping, browser grouping, defaults, and related behavior
- runtime-generated player assets are rebuilt from `generatedCharacters`, which now includes active actors imported from `app/`

This keeps the editor data-driven and allows:

- core asset packs
- generated-character assets
- pack registry records from the authenticated app

without baking content assumptions directly into the render tree.

See [Content Packs](./content-packs.md) for the full content-pack model.

---

## Backend facade details

Two backend layers matter for the current architecture:

## Auth facade

`server/src/authFacade.ts` owns:

- auth cookies
- sign-in/sign-out endpoints
- session refresh
- bearer token resolution for server-side Convex calls

The browser never needs to hold the raw refresh-token flow itself.

## App facade

`server/src/appFacade.ts` owns:

- app data routes for explicit operations, such as `GET /api/app/viewer-context`, `GET /api/app/dungeons`, and `POST /api/app/sessions/create`
- storage upload proxy: `POST /api/app/storage/upload`
- editor dungeon proxies: `POST /api/editor/dungeons/*`
- editor actor proxy: `POST /api/editor/actors/list`
- session access consumption proxy: `POST /api/session-access/consume`

The browser never sends arbitrary Convex function names to this facade. Each browser-facing operation has a named route, and the server decides which Convex function, if any, handles that route.

---

## Mental model to keep in mind

If you are changing code in this repo, the safest high-level model is:

1. `app/` manages accounts, libraries, sessions, and admin tools
2. `editor/` is the editor/runtime for building and playing dungeons
3. `server/` is the only browser-facing backend
4. Convex is the current internal app-domain data/auth engine
5. `useDungeonStore` is the editor's single source of truth
6. the scene derives from store state; it does not own dungeon truth itself

That mental model matches the codebase much better than the old "browser app talks straight to Convex" design.
