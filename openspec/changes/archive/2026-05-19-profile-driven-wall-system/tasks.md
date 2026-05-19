## 1. Wall-style data model

- [x] 1.1 Add wall-style content-pack types and registry plumbing for first-slice styles covering structural core, room-owned faces, pillar/cover rules, join settings, curvature limits, and opening modes
- [x] 1.2 Create the initial wall-style asset definitions needed to exercise shared-room faces, exposed exterior faces, and pillar placement without relying on legacy room sets or wall material sets
- [x] 1.3 Extend dungeon store and serialization to persist per-graph-segment-side wall-style assignments for shared and exposed boundary sections

## 2. Boundary analysis and wall assembly generation

- [x] 2.1 Implement a boundary-analysis stage that derives stable sampled sections, room-owned face ownership, exposed-face detection, and semantic anchors from `splineWallGraph`
- [x] 2.2 Implement the first-slice CPU wall assembly generator for structural core and room-owned face layers using the analyzed boundary sections
- [x] 2.3 Add semantic insert generation for endpoint, corner, curvature-change, and interval anchors so pillar or cover pieces stay attached to analyzed wall sections
- [x] 2.4 Add cache and invalidation updates so only affected wall runs and segment-side assignments rebuild when wall geometry or styles change

## 3. Opening integration

- [x] 3.1 Replace wall-cutout-only assumptions with a shared opening capability model that resolves door and window assets through explicit opening modes and compatibility rules
- [x] 3.2 Integrate framed, sleeve, and structural opening behavior into the wall assembly pipeline so structural cuts and face terminations come from wall-style rules
- [x] 3.3 Preserve analyzed wall continuity outside opening spans so curved walls do not gain extra faceting or unrelated re-sectioning when openings are added

## 4. Editor workflow and runtime adoption

- [x] 4.1 Add editor controls for assigning and inspecting wall styles per graph segment side while keeping the existing wall drawing workflow intact
- [x] 4.2 Update canvas rendering and opening placement/runtime plumbing to consume wall-style assignments, analyzed wall assemblies, and style-aware openings end to end
- [x] 4.3 Remove obsolete legacy wall-surface, room-set, and wall-material-set assumptions from the active wall runtime once the new wall-style path covers baseline dungeon walls

## 5. Validation

- [x] 5.1 Add regression tests for wall-style assignments, room-owned face ownership, exposed/shared section transitions, and serialization of segment-side wall styles
- [x] 5.2 Add rendering and opening regressions for first-slice wall assemblies, semantic pillar placement, opening compatibility rules, and preserved curved-wall continuity outside opening spans
- [x] 5.3 Run `pnpm run test` and `pnpm run lint`
- [x] 5.4 Run `pnpm run build`
- [x] 5.5 Run `pnpm run verify`
