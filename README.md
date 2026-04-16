<p align="center">
  <img src="docs/dungeonplanner.png" alt="DungeonPlanner" width="320" />
</p>

<h1 align="center">DungeonPlanner</h1>

<p align="center">
  A modern 3D dungeon editor for tabletop sessions
</p>

<p align="center">
  <a href="https://dungeonplanner.com/">Website</a>
  ·
  <a href="https://demo.dungeonplanner.com/">Demo</a>
  ·
  <a href="https://docs.dungeonplanner.com/">Docs</a>
  ·
  <a href="#quick-start-for-players">Quick Start</a>
  ·
  <a href="#developer-setup">Developer Setup</a>
  ·
  <a href="./CONTRIBUTING.md">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square" alt="React 19" />
  <img src="https://img.shields.io/badge/Three.js-0.182-black?logo=threedotjs&style=flat-square" alt="Three.js 0.182" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white&style=flat-square" alt="TypeScript 6" />
  <a href="https://github.com/finger-gun/DungeonPlanner/actions/workflows/test.yml">
    <img src="https://github.com/finger-gun/DungeonPlanner/actions/workflows/test.yml/badge.svg" alt="Test status" />
  </a>
  <a href="https://github.com/finger-gun/DungeonPlanner/actions/workflows/github-code-scanning/codeql">
    <img src="https://github.com/finger-gun/DungeonPlanner/actions/workflows/github-code-scanning/codeql/badge.svg" alt="CodeQL status" />
  </a>
</p>

---

## Why DungeonPlanner

DungeonPlanner is built for fast encounter prep: paint rooms, place interactive props, switch camera modes, and present clean tabletop-ready layouts.

### Highlights

- Grid painting and erase workflow
- Floor/wall content-pack assets
- Dynamic lighting with optional flicker
- Perspective, isometric, and top-down camera modes
- Undo/redo history for editing actions

## Quick Start for Players

1. Open the demo at **https://demo.dungeonplanner.com/**.
2. Use the **Room** tool to paint your layout.
3. Use the **Prop** tool to place doors, torches, and objects.
4. Switch camera mode from the Move panel depending on prep or presentation.

## Developer Setup

### Prerequisites

- Node.js 24+
- pnpm 10+

### Run locally

```bash
pnpm install
pnpm run dev
```

App runs at **http://localhost:5173**.

### Workspace commands

```bash
pnpm run dev:full     # app + server via Turborepo
pnpm run build        # app build
pnpm run build:all    # build all workspace packages
pnpm run test         # unit tests
pnpm run lint         # lint app
pnpm run verify       # lint + test + build + e2e
```

## Usage

| Tool | What it does |
|---|---|
| **Move** (hand icon) | Orbit, pan, zoom the camera. Activate camera presets and adjust the scene light rig. |
| **Room** (grid icon) | Left-drag to paint floor tiles, right-drag to erase. |
| **Prop** (torch icon) | Select a prop from the panel, click a floor tile to place it, right-click to remove. |

**Camera presets** (Move tool → right panel):

- **Perspective** — free orbit, great for building
- **Isometric** — locked true-isometric angle, good for screenshots
- **Top Down** — overhead fisheye view, ideal for printing battle maps

**Grid toggle** — shows an amber grid overlay projected over painted floor tiles. In editing tools the grid reveals in a soft circle around the cursor.

## Content Packs

Props and floor/wall tiles are defined as content packs — plain TypeScript objects that describe the asset path, connector type, and optional light configuration.

```ts
// Example: wall torch with a real flickering point light
export const propsWallTorchAsset: ContentPackAsset = {
  id: 'core/props/wall-torch',
  name: 'Wall Torch',
  metadata: {
    connectsTo: 'WALL',
    light: {
      color: '#ff9040',
      intensity: 6,
      distance: 8,
      offset: [0, 1.6, 0.25],
      flicker: true,
    },
  },
}
```

## Project Structure

```txt
src/
  components/canvas/    # R3F scene and 3D systems
  components/editor/    # UI panels and tools
  content-packs/        # asset definitions and metadata
  store/                # Zustand state and serialization
server/                 # multiplayer/backend package
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 |
| 3D | React Three Fiber + Three.js |
| Rendering | WebGPU-first with WebGL fallback |
| State | Zustand |
| Language | TypeScript |
| Testing | Vitest + Playwright |
| Monorepo tooling | pnpm + Turborepo |

## Roadmap

- [ ] Floor grid overlay radial reveal (TSL shader debugging in progress)
- [ ] Character token placement with movement range indicator
- [ ] Export to PNG (Top-Down view)
- [ ] More content packs (doors, traps, furniture)
- [ ] Multiplayer / shared sessions

## Contributing

Please read [CONTRIBUTING](./CONTRIBUTING.md) and [CODE OF CONDUCT](./CODE_OF_CONDUCT.md) before opening a pull request.

---

<div align="center">

<b>Made for TTRPG players who want their dungeon to look as good as it plays.</b>

Made with ❤️ in Skåne. A <a href="https://fingergun.dev/">Finger Gun</a> project, making nothing into something.

</div>
