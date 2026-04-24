## Context

The authenticated `app/` workspace already contains all signed-in product behavior, but its presentation uses a separate visual treatment from the public `web/` landing page. `web/` already establishes the DungeonPlanner brand with Cinzel headings, Inter body copy, a dark stone-like background, warm gold accents, glassy cards, and the official logo treatment. The app shell currently uses a cooler cyan palette and generic gradients, which makes the product feel visually split at the exact point where users move from public marketing into authenticated use.

This refresh is primarily a frontend styling change centered in `app/index.html`, `app/src/index.css`, `app/src/App.css`, and structural updates in `app/src/App.tsx`. The core constraint is that branding must improve perceived product quality without reducing readability for dense authenticated workflows such as dungeon saves, session membership, character editing, and admin pack management.

## Goals / Non-Goals

**Goals:**
- Align the authenticated app shell with the visual identity already established in `web/`.
- Reuse the existing DungeonPlanner logo, typography, colors, and surface language in `app/`.
- Preserve clear affordances for role-aware workflows, form-heavy panels, and status messaging under the new theme.
- Keep the implementation local to `app/` so the public site and backend behavior remain unchanged.

**Non-Goals:**
- Creating a cross-workspace design token package.
- Rebuilding the authenticated product into a new information architecture.
- Changing authenticated product behavior, permissions, or data flows.
- Turning `app/` into a pixel-perfect copy of the marketing page where that would harm dense application usability.

## Decisions

### 1. Reuse the `web/` brand language as the source of truth
Mirror the core brand primitives from `web/` inside `app/`: dark background values, gold accent colors, Cinzel headings, Inter body text, translucent surfaces, and logo treatment.

**Rationale:** The landing page already defines the intended DungeonPlanner look and feel. Reusing that language is faster and more coherent than designing a separate authenticated theme.

**Alternatives considered:**
- **Keep the current app palette and only swap the logo:** too small a change; the shell would still feel disconnected.
- **Build an all-new authenticated-only theme:** higher effort with less brand continuity.

### 2. Add a branded shell layer without rewriting product logic
Keep the existing `App.tsx` data flow and role-based rendering structure, but introduce targeted markup updates where needed for a branded header, hero framing, and stronger visual grouping.

**Rationale:** The request is about look and feel, not a functional rewrite. Preserving the current structure reduces risk to the authenticated flows added in the previous change.

**Alternatives considered:**
- **Large component extraction before styling:** helpful long term, but unnecessary scope for this visual refresh.

### 3. Mirror the public-site header closely
Use the same header structure and link treatment as `web/` for the authenticated app, adding only a login/workspace entry that points into the app experience.

**Rationale:** The user explicitly wants continuity between the public site and product shell. Reusing the established header treatment is the fastest path to that continuity.

**Alternatives considered:**
- **Keep a separate app-only header:** simpler to preserve existing code, but it leaves the product feeling split.

### 4. Keep application surfaces denser than the marketing page
Apply the `web/` theme to cards, buttons, inputs, sections, and status blocks, but retain compact layouts, clear labels, and scan-friendly spacing for library/admin workflows.

**Rationale:** The marketing page optimizes for storytelling; the authenticated app optimizes for task completion. The same brand should adapt to a more operational layout.

**Alternatives considered:**
- **Directly copy `web/styles.css` wholesale:** would likely overfit the app shell to landing-page patterns and weaken usability.

### 5. Use hash-routed workspace pages instead of one long surface
Organize the signed-in experience into lightweight hash-routed pages for overview, dungeons, sessions, characters, and admin areas, with nested admin navigation for users and packs.

**Rationale:** The current single-scroll layout makes the admin space and module boundaries harder to scan. Hash-based routing adds page structure without introducing a new routing dependency or changing data flow.

**Alternatives considered:**
- **Keep one scrolling page with anchor links:** lower effort, but it does not address the user’s request for clearer page organization.
- **Introduce React Router:** more flexible, but unnecessary for this scoped refresh.

### 6. Split public landing and login into separate routes
Use the unauthenticated default route as a marketing landing page that mirrors `web/`, and reserve `#/login` for the sign-in form.

**Rationale:** The user wants the signed-out experience to feel identical to the public site while still keeping login available inside the app. Separate hash routes provide both without mixing marketing and auth UI into one screen.

**Alternatives considered:**
- **Keep login embedded in the landing view:** simpler, but does not satisfy the request for a distinct login screen.

### 7. Load product typography in the authenticated workspace itself
Update `app/index.html` to load the same Google fonts used by `web/` and revise the page metadata/favicon treatment to match the product brand.

**Rationale:** Typography is one of the most noticeable differences between the two surfaces and is cheap to align cleanly.

**Alternatives considered:**
- **Approximate the font stack with local fallbacks only:** weaker fidelity to the established brand.

### 8. Reuse existing brand assets through app-local public paths
Place the required logo asset(s) in an app-accessible public location so the authenticated shell can reference them directly and independently during local app builds.

**Rationale:** The app should not rely on the static `web/` folder structure at runtime. Copying or re-homing the approved assets keeps the workspace self-contained.

**Alternatives considered:**
- **Reference assets directly from `../web/`:** brittle across build and hosting boundaries.

## Risks / Trade-offs

- **[Reduced contrast in dense forms]** A warmer branded palette could make inputs, notices, or selection states less distinct. → **Mitigation:** keep strong contrast ratios, explicit borders, and clear focus states for form controls and selected records.
- **[Over-styled productivity UI]** Importing too much marketing-page styling could make the authenticated app harder to scan. → **Mitigation:** preserve compact grid/list layouts and only borrow the brand primitives, not the full landing-page composition.
- **[Asset drift]** Copying brand assets into `app/` can diverge from `web/` over time. → **Mitigation:** reuse the same source files where practical and keep the copied set minimal.
- **[Test fragility]** Small markup changes in the shell could break app tests that assume exact headings or text arrangements. → **Mitigation:** update tests around stable branded landmarks and key flows rather than brittle styling details.
