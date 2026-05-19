## 1. Spline wall query foundation

- [x] 1.1 Add shared spline wall query utilities for nearest-segment lookup, segment sampling, wall crossing, cutout lookup, and room containment.
- [x] 1.2 Add cached room-boundary and segment-query data structures that can be reused by placement, movement, LOS, and occlusion systems.
- [x] 1.3 Add focused unit tests for spline wall query behavior on straight, diagonal, and rounded walls.

## 2. Opening and wall-targeted placement migration

- [x] 2.1 Refactor opening records and placement flows to use spline segment ownership plus local placement data instead of legacy wall keys.
- [x] 2.2 Update door/window/shared-passage cutout syncing so spline segments and cutouts remain authoritative after edits, reloads, and migrations.
- [x] 2.3 Update unified placement and wall-targeted previews so doors and other wall assets target spline geometry on straight, diagonal, and rounded walls.
- [x] 2.4 Add regression coverage for diagonal and rounded opening placement, cutout preservation, and migrated legacy opening data.

## 3. Wall-mounted props and editor tooling

- [x] 3.1 Refactor wall-mounted prop snapping/orientation to use nearest eligible spline wall surfaces and local tangent/normal data.
- [ ] 3.2 Update wall selection, wall variant editing, and related inspector/tooling flows to target spline segments and cutouts instead of wall keys.
- [x] 3.3 Replace shared/open wall editing helpers with spline-native segment/cutout editing behavior.
- [ ] 3.4 Add regression coverage for wall-mounted prop snapping, wall selection, and shared passage editing on non-cardinal walls.

## 4. Gameplay and occlusion migration

- [x] 4.1 Refactor indoor LOS and visibility masking to block against spline walls and pass through spline cutouts.
- [x] 4.2 Refactor indoor movement to require spline wall crossing checks and destination cells that are at least 75 percent inside the room interior.
- [x] 4.3 Update fog/light occlusion inputs to consume spline wall geometry instead of legacy wall-key sets.
- [x] 4.4 Add regression coverage for visibility, movement, and occlusion on straight, diagonal, and rounded spline walls.

## 5. Rendering, state, and serialization cleanup

- [ ] 5.1 Remove indoor wall rendering/cache fallbacks that still branch through legacy painted-wall or wall-key systems.
- [ ] 5.2 Add load-time migration for legacy wall/opening data and remove obsolete runtime dependencies on legacy wall records.
- [ ] 5.3 Delete unused legacy wall modules, constants, and state fields after all runtime references are removed.
- [ ] 5.4 Update/replace tests that still depend on legacy wall-key behavior.

## 6. Validation

- [x] 6.1 Run targeted editor tests for wall queries, openings, placement, movement, LOS, and serialization during implementation.
- [x] 6.2 Run `pnpm --filter dungeonplanner-editor lint`, `pnpm --filter dungeonplanner-editor build`, and `pnpm --filter dungeonplanner-editor test` after the migration is integrated.
- [ ] 6.3 Run browser-based manual verification for diagonal, rounded, and shared-wall placement/play flows where unit tests are insufficient.
