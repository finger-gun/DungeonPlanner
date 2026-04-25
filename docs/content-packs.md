# Content Packs

Content packs are the asset system — the way tiles, props, and openings are defined, bundled, and made available to the editor. This page explains how the system works and how to add new assets.

---

## Core concepts

Everything you can place is a `ContentPackAsset`:

```ts
type ContentPackAsset = {
  id:        string                    // globally unique, e.g. "core.props_wall_torch"
  slug:      string                    // URL-safe short name, used in older file formats
  name:      string                    // human-readable display name
  category:  'floor' | 'wall' | 'prop' | 'opening'
  assetUrl:  string                    // path to the .glb, used for preloading
  Component: ComponentType<ContentPackComponentProps>  // React component that renders it
  metadata?: ContentPackAssetMetadata  // lights, connectors, opening width, etc.
}
```

A `ContentPack` is just a named bundle of assets:

```ts
type ContentPack = {
  id:     string
  name:   string
  assets: ContentPackAsset[]
}
```

The registry (`editor/src/content-packs/registry.ts`) collects all packs and exposes flat lookup helpers like `getContentPackAssetById("core.props_wall_torch")`.

---

## Categories

| Category | What it is | How it's placed |
|----------|-----------|-----------------|
| `floor` | The tile that fills each painted cell | Automatically, one per cell |
| `wall` | The segment placed on cell edges with no painted neighbour | Automatically, derived from painted cells |
| `prop` | A freestanding 3D object (torches, pillars, rubble, staircases) | Click in Prop tool |
| `opening` | A wall-replacing model (doors, archways) | Click in Opening tool — snaps to wall segments |

There's currently only one active `floor` asset and one active `wall` asset at a time (the global selection), though individual rooms can override these.

---

## The core pack

Located in `editor/src/content-packs/core/`, organised into three subdirectories:

```
core/
  tiles/
    Floor.tsx      — floor tile with 8 GLB variants (chosen by cell key hash)
    Wall.tsx       — stone wall with 6 GLB variants
  props/
    Pillar.tsx
    PillarWall.tsx
    Rubble.tsx
    WallTorch.tsx  — includes a flickering point light
  openings/
    DoorWall1.tsx  — single-width door (1 wall segment)
    DoorWall3.tsx  — triple-width archway (3 wall segments)
    StairCaseDown.tsx
    StairCaseUp.tsx
  index.ts         — assembles the coreContentPack
```

---

## Writing a new asset

### 1. Create the React component

Every asset component receives `ContentPackComponentProps` (a `group` element's props plus an optional `variantKey`):

```tsx
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import myModelUrl from '../../../assets/models/core/my_thing.glb'
import type { ContentPackAsset, ContentPackComponentProps } from '../../types'

// Pivot offset: adjusts where the model sits relative to the grid origin.
// Increase Y to move the model up. Tweak until it looks right in the editor.
const PIVOT = [0, 0, 0] as const

export function MyThing(props: ContentPackComponentProps) {
  const gltf = useGLTF(myModelUrl)
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene])

  return (
    <group position={PIVOT}>
      <group {...props}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

useGLTF.preload(myModelUrl)
```

The double-group pattern is intentional. The outer group applies the pivot correction; the inner group receives `position`, `rotation`, and event handlers from the placement system. Both are needed so the pivot offset doesn't fight with the world transform.

Always call `useGLTF.preload(url)` at module level so the model is fetched before it's first needed.

### 2. Define the asset descriptor

```ts
export const myThingAsset: ContentPackAsset = {
  id:       'core.my_thing',         // must be globally unique
  slug:     'my_thing',
  name:     'My Thing',
  category: 'prop',                  // or 'floor', 'wall', 'opening'
  assetUrl: myModelUrl,
  Component: MyThing,
  metadata: {
    connectsTo: 'WALL',              // optional — see metadata section below
  },
}
```

### 3. Register it

Open `editor/src/content-packs/core/index.ts` and add your asset to the `assets` array:

```ts
import { myThingAsset } from './props/MyThing'

export const coreContentPack: ContentPack = {
  id: 'core',
  name: 'Core Dungeon Pack',
  assets: [
    // ... existing assets ...
    myThingAsset,
  ],
}
```

That's it. The asset will show up in the Prop (or Opening) tool panel immediately.

---

## Asset metadata

`ContentPackAssetMetadata` holds optional configuration that changes how the placement system handles an asset:

### connectsTo

```ts
connectsTo?: 'FLOOR' | 'WALL' | 'WALLFLOOR'
```

Controls which surface the prop snaps to. `WALL` props snap to wall segments; `FLOOR` props snap to cell centres.

### openingWidth

```ts
openingWidth?: 1 | 2 | 3
```

Only meaningful for `category: 'opening'`. Tells the system how many wall segments the opening spans. A width-3 door centred on segment `4:2:north` will suppress segments `3:2:north`, `4:2:north`, and `5:2:north`.

### light

Adds a point light that's automatically parented to the prop's world position:

```ts
light?: {
  color:      string    // CSS hex or named colour
  intensity:  number    // Three.js point light intensity
  distance:   number    // world units (0 = infinite)
  decay?:     number    // physical falloff (default 2)
  castShadow?: boolean  // expensive! off by default
  flicker?:   boolean   // organic noise-based intensity variation
  offset?:    [x, y, z] // position relative to the prop's origin
}
```

The `offset` is important for props like the wall torch — the light should be at the flame's position, not the model's pivot. For the bundled torch, `offset: [0, 1.6, 0.25]` places the light up where the fire would be.

Flickering is driven by `PropPointLight` in `DungeonObject.tsx` using layered sine waves at inharmonic frequencies to produce an organic, non-repeating effect.

### receiveShadow

```ts
receiveShadow?: boolean   // defaults to true
```

Set to `false` for small detail props where shadow artefacts outweigh the realism benefit.

---

## Variants (floor and wall tiles)

Floor tiles and walls support visual variety — placing two adjacent cells doesn't produce an identical repeating pattern. Variants are selected deterministically from the cell or wall key using a simple hash, so the same dungeon always looks the same.

The `Wall` component ships with 6 GLB variants (`wall.glb`, `wall_001.glb` ... `wall_005.glb`). The hash of the wall key picks one:

```ts
function getVariantIndex(variantKey: string | undefined, variantCount: number) {
  let hash = 0
  for (let i = 0; i < variantKey.length; i++) {
    hash = (hash * 31 + variantKey.charCodeAt(i)) >>> 0
  }
  return hash % variantCount
}
```

To add more variants to a tile or wall, just add more GLB files to the `WALL_VARIANT_URLS` (or `FLOOR_VARIANT_URLS`) array in the component — the count is derived automatically.

---

## Adding a new content pack (future)

The registry in `editor/src/content-packs/registry.ts` simply imports and combines all packs:

```ts
export const contentPacks = [coreContentPack]
```

To add a second pack, create a new directory under `editor/src/content-packs/`, define its assets, export a `ContentPack` object, and add it to that array. Asset IDs must be globally unique — use your pack ID as a prefix (`mypack.asset_name`).

The file format stores asset IDs directly, so pack IDs form part of the saved dungeon data. If you rename or remove a pack, existing dungeons that reference its assets will show fallback boxes where the models used to be.
