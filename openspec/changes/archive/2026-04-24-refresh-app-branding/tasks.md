## 1. Brand foundation in the authenticated app

- [x] 1.1 Update `app/index.html` and app-accessible assets so the authenticated workspace uses the DungeonPlanner title, logo, favicon treatment, and typography from `web/`.
- [x] 1.2 Replace the current app-level theme tokens in `app/src/index.css` with DungeonPlanner brand colors, fonts, backgrounds, and shared surface styles derived from `web/`.

## 2. Authenticated shell visual refresh

- [x] 2.1 Update the shell structure in `app/src/App.tsx` where needed to present a branded header, hero, and clearer section framing without changing authenticated behavior.
- [x] 2.2 Restyle `app/src/App.css` so auth, signed-in overview, navigation, cards, forms, lists, and notices use the DungeonPlanner look and feel while keeping dense workflows readable.

## 3. Regression coverage and verification

- [x] 3.1 Update `app/src/App.test.tsx` to cover branded shell landmarks while preserving the existing auth and workflow assertions.
- [x] 3.2 Run the existing app and repo validation needed for the refresh, including `pnpm exec vitest run app/src/App.test.tsx`, `pnpm run app:build`, and `pnpm run build`.

## 4. Navigation and workspace organization refinements

- [x] 4.1 Update the primary app header so it matches `web/` navigation, adding only the login or workspace entry point into `app/`.
- [x] 4.2 Remove implementation-facing product copy and present the app simply as DungeonPlanner across signed-out and signed-in views.
- [x] 4.3 Organize signed-in modules into dedicated pages with clearer workspace navigation and nested admin navigation for users and packs.
- [x] 4.4 Make the signed-out default route match the `web/` landing page instead of mixing marketing and auth on one screen.
- [x] 4.5 Move authentication to its own `#/login` screen and update tests for the public landing versus login routing split.
