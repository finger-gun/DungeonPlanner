## Why

The authenticated `app/` surface works functionally, but it still looks like a temporary internal shell rather than the DungeonPlanner product. That visual gap makes the signed-in experience feel disconnected from `web/`, weakens brand continuity, and reduces confidence as users move from the public site into the real application.

This change brings the signed-in app into the same visual language now that the product surface is durable enough to benefit from a cohesive logo, theme, typography, and presentation system without changing the public landing page itself.

## What Changes

- Update `app/` to use DungeonPlanner brand styling derived from `web/`, including logo treatment, typography, color palette, surfaces, and call-to-action styling.
- Refresh the authenticated app shell so the header, hero, cards, forms, status treatments, and navigation feel like one product instead of a separate prototype.
- Make the authenticated app header visually match `web/` navigation, with the same brand treatment and external links plus a login/workspace entry point.
- Remove internal implementation-facing copy so the product presents itself simply as DungeonPlanner rather than exposing backend or prototype language.
- Organize the signed-in modules into dedicated subpages with clearer workspace and admin navigation instead of one long scrolling surface.
- Make the signed-out default route render the same marketing experience as `web/`, while moving authentication onto its own login screen reached through navigation.
- Preserve the existing role-aware flows, data interactions, and public-site boundaries while improving readability and consistency across authenticated modules.
- Add or update tests that cover the branded shell so the product identity remains stable as authenticated features expand.

### In Scope

- Shared visual tokens in `app/` for brand colors, typography, backgrounds, and surfaces
- Reuse or copy approved brand assets needed by the authenticated app shell
- Branded updates for the signed-out auth view and signed-in shell components already rendered by `app/src/App.tsx`
- Readability and interaction-state adjustments needed to keep forms, cards, and role-based modules usable under the new theme
- Workspace page organization and admin sub-navigation inside `app/`
- A dedicated login route separate from the public landing route

### Out of Scope

- Re-architecting the authenticated app into new routes or component modules beyond what the visual refresh requires
- Changing Convex auth, roles, dungeon/session/character/pack behavior, or server authorization logic
- Redesigning `web/` or consolidating public and authenticated surfaces into one deployment
- Introducing a new design system package shared across repo workspaces

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `authenticated-app-shell`: The dedicated signed-in app surface must present the same DungeonPlanner brand identity and visual quality as the public `web/` experience while preserving authenticated workflows.

## Impact

- Affected frontend scope: `app/index.html`, `app/src/index.css`, `app/src/App.css`, `app/src/App.tsx`, related app assets, and authenticated app tests.
- Affected UX: public landing presentation, dedicated login routing, web-aligned primary navigation, signed-in shell branding, workspace page routing, admin sub-navigation, card hierarchy, and action emphasis for dungeon/session/character/admin workflows.
- No backend, schema, serialization, or server protocol changes are expected.
- Compatibility risk is low because the work is visual, but the updated theme must preserve form clarity, role visibility, and action affordances across admin, DM, and player states.
