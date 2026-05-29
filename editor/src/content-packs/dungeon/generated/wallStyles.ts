import type { ContentPackWallStyle } from '../../types'
import { createWallStyleFromRecipe, type WallStyleRecipe } from '../wallStyleProfiles'

const wallStyleRecipes = [
  {
    "id": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-bone-white-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001",
    "name": "Abyssal Coral With Calcified Tube Worm Ridges And Porous Bone White Barnacle Texture Clusters, With A Thick Petrified Driftwood Support Beam Encrusted In The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-bone-white-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001/preview.webp",
    "browser": {
      "family": "Abyssal Coral",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-bone-white-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-bone-white-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-bone-white-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-burnt-orange-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001",
    "name": "Abyssal Coral With Calcified Tube Worm Ridges And Porous Burnt Orange Barnacle Texture Clusters, With A Thick Petrified Driftwood Support Beam Encrusted In The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-burnt-orange-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001/preview.webp",
    "browser": {
      "family": "Abyssal Coral",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-burnt-orange-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-burnt-orange-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-burnt-orange-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-charcoal-black-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001",
    "name": "Abyssal Coral With Calcified Tube Worm Ridges And Porous Charcoal Black Barnacle Texture Clusters, With A Thick Petrified Driftwood Support Beam Encrusted In The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-charcoal-black-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001/preview.webp",
    "browser": {
      "family": "Abyssal Coral",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-charcoal-black-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-charcoal-black-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-charcoal-black-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-cobalt-blue-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001",
    "name": "Abyssal Coral With Calcified Tube Worm Ridges And Porous Cobalt Blue Barnacle Texture Clusters, With A Thick Petrified Driftwood Support Beam Encrusted In The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-cobalt-blue-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001/preview.webp",
    "browser": {
      "family": "Abyssal Coral",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-cobalt-blue-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-cobalt-blue-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-cobalt-blue-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-crimson-red-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001",
    "name": "Abyssal Coral With Calcified Tube Worm Ridges And Porous Crimson Red Barnacle Texture Clusters, With A Thick Petrified Driftwood Support Beam Encrusted In The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-crimson-red-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001/preview.webp",
    "browser": {
      "family": "Abyssal Coral",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-crimson-red-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-crimson-red-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-crimson-red-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-deep-violet-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001",
    "name": "Abyssal Coral With Calcified Tube Worm Ridges And Porous Deep Violet Barnacle Texture Clusters, With A Thick Petrified Driftwood Support Beam Encrusted In The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-deep-violet-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001/preview.webp",
    "browser": {
      "family": "Abyssal Coral",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-deep-violet-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-deep-violet-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-deep-violet-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-moss-green-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001",
    "name": "Abyssal Coral With Calcified Tube Worm Ridges And Porous Moss Green Barnacle Texture Clusters, With A Thick Petrified Driftwood Support Beam Encrusted In The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-moss-green-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001/preview.webp",
    "browser": {
      "family": "Abyssal Coral",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-moss-green-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-moss-green-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-moss-green-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-ochre-yellow-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001",
    "name": "Abyssal Coral With Calcified Tube Worm Ridges And Porous Ochre Yellow Barnacle Texture Clusters, With A Thick Petrified Driftwood Support Beam Encrusted In The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-ochre-yellow-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001/preview.webp",
    "browser": {
      "family": "Abyssal Coral",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-ochre-yellow-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-ochre-yellow-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-ochre-yellow-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-rust-brown-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001",
    "name": "Abyssal Coral With Calcified Tube Worm Ridges And Porous Rust Brown Barnacle Texture Clusters, With A Thick Petrified Driftwood Support Beam Encrusted In The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-rust-brown-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001/preview.webp",
    "browser": {
      "family": "Abyssal Coral",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-rust-brown-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-rust-brown-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-rust-brown-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-slate-grey-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001",
    "name": "Abyssal Coral With Calcified Tube Worm Ridges And Porous Slate Grey Barnacle Texture Clusters, With A Thick Petrified Driftwood Support Beam Encrusted In The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-slate-grey-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001/preview.webp",
    "browser": {
      "family": "Abyssal Coral",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-slate-grey-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-slate-grey-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-abyssal-coral-with-calcified-tube-worm-ridges-and-porous-slate-grey-barnacle-texture-clusters-with-a-thick-petrified-driftwood-support-beam-encrusted-in-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-arcane-crystalline-with-faceted-bone-white-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001",
    "name": "Arcane Crystalline With Faceted Bone White Quartz Formations And Raised Runic Borders, With A Large Glowing Crystal Cluster Pillar Integrated Into The Center 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-arcane-crystalline-with-faceted-bone-white-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001/preview.webp",
    "browser": {
      "family": "Arcane Crystalline",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "arcane"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-arcane-crystalline-with-faceted-bone-white-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-arcane-crystalline-with-faceted-bone-white-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-arcane-crystalline-with-faceted-bone-white-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-arcane-crystalline-with-faceted-burnt-orange-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001",
    "name": "Arcane Crystalline With Faceted Burnt Orange Quartz Formations And Raised Runic Borders, With A Large Glowing Crystal Cluster Pillar Integrated Into The Center 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-arcane-crystalline-with-faceted-burnt-orange-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001/preview.webp",
    "browser": {
      "family": "Arcane Crystalline",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "arcane"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-arcane-crystalline-with-faceted-burnt-orange-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-arcane-crystalline-with-faceted-burnt-orange-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-arcane-crystalline-with-faceted-burnt-orange-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-arcane-crystalline-with-faceted-charcoal-black-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001",
    "name": "Arcane Crystalline With Faceted Charcoal Black Quartz Formations And Raised Runic Borders, With A Large Glowing Crystal Cluster Pillar Integrated Into The Center 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-arcane-crystalline-with-faceted-charcoal-black-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001/preview.webp",
    "browser": {
      "family": "Arcane Crystalline",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "arcane"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-arcane-crystalline-with-faceted-charcoal-black-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-arcane-crystalline-with-faceted-charcoal-black-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-arcane-crystalline-with-faceted-charcoal-black-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-arcane-crystalline-with-faceted-cobalt-blue-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001",
    "name": "Arcane Crystalline With Faceted Cobalt Blue Quartz Formations And Raised Runic Borders, With A Large Glowing Crystal Cluster Pillar Integrated Into The Center 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-arcane-crystalline-with-faceted-cobalt-blue-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001/preview.webp",
    "browser": {
      "family": "Arcane Crystalline",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "arcane"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-arcane-crystalline-with-faceted-cobalt-blue-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-arcane-crystalline-with-faceted-cobalt-blue-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-arcane-crystalline-with-faceted-cobalt-blue-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-arcane-crystalline-with-faceted-crimson-red-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001",
    "name": "Arcane Crystalline With Faceted Crimson Red Quartz Formations And Raised Runic Borders, With A Large Glowing Crystal Cluster Pillar Integrated Into The Center 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-arcane-crystalline-with-faceted-crimson-red-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001/preview.webp",
    "browser": {
      "family": "Arcane Crystalline",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "arcane"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-arcane-crystalline-with-faceted-crimson-red-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-arcane-crystalline-with-faceted-crimson-red-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-arcane-crystalline-with-faceted-crimson-red-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-arcane-crystalline-with-faceted-deep-violet-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001",
    "name": "Arcane Crystalline With Faceted Deep Violet Quartz Formations And Raised Runic Borders, With A Large Glowing Crystal Cluster Pillar Integrated Into The Center 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-arcane-crystalline-with-faceted-deep-violet-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001/preview.webp",
    "browser": {
      "family": "Arcane Crystalline",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "arcane"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-arcane-crystalline-with-faceted-deep-violet-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-arcane-crystalline-with-faceted-deep-violet-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-arcane-crystalline-with-faceted-deep-violet-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-arcane-crystalline-with-faceted-moss-green-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001",
    "name": "Arcane Crystalline With Faceted Moss Green Quartz Formations And Raised Runic Borders, With A Large Glowing Crystal Cluster Pillar Integrated Into The Center 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-arcane-crystalline-with-faceted-moss-green-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001/preview.webp",
    "browser": {
      "family": "Arcane Crystalline",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "organic",
        "arcane"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-arcane-crystalline-with-faceted-moss-green-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-arcane-crystalline-with-faceted-moss-green-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-arcane-crystalline-with-faceted-moss-green-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-arcane-crystalline-with-faceted-ochre-yellow-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001",
    "name": "Arcane Crystalline With Faceted Ochre Yellow Quartz Formations And Raised Runic Borders, With A Large Glowing Crystal Cluster Pillar Integrated Into The Center 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-arcane-crystalline-with-faceted-ochre-yellow-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001/preview.webp",
    "browser": {
      "family": "Arcane Crystalline",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "arcane"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-arcane-crystalline-with-faceted-ochre-yellow-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-arcane-crystalline-with-faceted-ochre-yellow-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-arcane-crystalline-with-faceted-ochre-yellow-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-arcane-crystalline-with-faceted-rust-brown-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001",
    "name": "Arcane Crystalline With Faceted Rust Brown Quartz Formations And Raised Runic Borders, With A Large Glowing Crystal Cluster Pillar Integrated Into The Center 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-arcane-crystalline-with-faceted-rust-brown-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001/preview.webp",
    "browser": {
      "family": "Arcane Crystalline",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "arcane"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-arcane-crystalline-with-faceted-rust-brown-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-arcane-crystalline-with-faceted-rust-brown-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-arcane-crystalline-with-faceted-rust-brown-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-arcane-crystalline-with-faceted-slate-grey-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001",
    "name": "Arcane Crystalline With Faceted Slate Grey Quartz Formations And Raised Runic Borders, With A Large Glowing Crystal Cluster Pillar Integrated Into The Center 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-arcane-crystalline-with-faceted-slate-grey-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001/preview.webp",
    "browser": {
      "family": "Arcane Crystalline",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "arcane"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-arcane-crystalline-with-faceted-slate-grey-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-arcane-crystalline-with-faceted-slate-grey-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-arcane-crystalline-with-faceted-slate-grey-quartz-formations-and-raised-runic-borders-with-a-large-glowing-crystal-cluster-pillar-integrated-into-the-center-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-bone-white-braces-with-a-central-vertical-iron-plated-structural-pillar-00001",
    "name": "Bastion Reinforced With Interlocking Stone Blocks And Heavy Protruding Bone White Braces, With A Central Vertical Iron Plated Structural Pillar 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-bone-white-braces-with-a-central-vertical-iron-plated-structural-pillar-00001/preview.webp",
    "browser": {
      "family": "Bastion Reinforced",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "stone",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-bone-white-braces-with-a-central-vertical-iron-plated-structural-pillar-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-bone-white-braces-with-a-central-vertical-iron-plated-structural-pillar-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-bone-white-braces-with-a-central-vertical-iron-plated-structural-pillar-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-burnt-orange-braces-with-a-central-vertical-iron-plated-structural-pillar-00001",
    "name": "Bastion Reinforced With Interlocking Stone Blocks And Heavy Protruding Burnt Orange Braces, With A Central Vertical Iron Plated Structural Pillar 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-burnt-orange-braces-with-a-central-vertical-iron-plated-structural-pillar-00001/preview.webp",
    "browser": {
      "family": "Bastion Reinforced",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "stone",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-burnt-orange-braces-with-a-central-vertical-iron-plated-structural-pillar-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-burnt-orange-braces-with-a-central-vertical-iron-plated-structural-pillar-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-burnt-orange-braces-with-a-central-vertical-iron-plated-structural-pillar-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-charcoal-black-braces-with-a-central-vertical-iron-plated-structural-pillar-00001",
    "name": "Bastion Reinforced With Interlocking Stone Blocks And Heavy Protruding Charcoal Black Braces, With A Central Vertical Iron Plated Structural Pillar 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-charcoal-black-braces-with-a-central-vertical-iron-plated-structural-pillar-00001/preview.webp",
    "browser": {
      "family": "Bastion Reinforced",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "stone",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-charcoal-black-braces-with-a-central-vertical-iron-plated-structural-pillar-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-charcoal-black-braces-with-a-central-vertical-iron-plated-structural-pillar-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-charcoal-black-braces-with-a-central-vertical-iron-plated-structural-pillar-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-cobalt-blue-braces-with-a-central-vertical-iron-plated-structural-pillar-00001",
    "name": "Bastion Reinforced With Interlocking Stone Blocks And Heavy Protruding Cobalt Blue Braces, With A Central Vertical Iron Plated Structural Pillar 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-cobalt-blue-braces-with-a-central-vertical-iron-plated-structural-pillar-00001/preview.webp",
    "browser": {
      "family": "Bastion Reinforced",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "stone",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-cobalt-blue-braces-with-a-central-vertical-iron-plated-structural-pillar-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-cobalt-blue-braces-with-a-central-vertical-iron-plated-structural-pillar-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-cobalt-blue-braces-with-a-central-vertical-iron-plated-structural-pillar-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-crimson-red-braces-with-a-central-vertical-iron-plated-structural-pillar-00001",
    "name": "Bastion Reinforced With Interlocking Stone Blocks And Heavy Protruding Crimson Red Braces, With A Central Vertical Iron Plated Structural Pillar 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-crimson-red-braces-with-a-central-vertical-iron-plated-structural-pillar-00001/preview.webp",
    "browser": {
      "family": "Bastion Reinforced",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "stone",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-crimson-red-braces-with-a-central-vertical-iron-plated-structural-pillar-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-crimson-red-braces-with-a-central-vertical-iron-plated-structural-pillar-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-crimson-red-braces-with-a-central-vertical-iron-plated-structural-pillar-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-deep-violet-braces-with-a-central-vertical-iron-plated-structural-pillar-00001",
    "name": "Bastion Reinforced With Interlocking Stone Blocks And Heavy Protruding Deep Violet Braces, With A Central Vertical Iron Plated Structural Pillar 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-deep-violet-braces-with-a-central-vertical-iron-plated-structural-pillar-00001/preview.webp",
    "browser": {
      "family": "Bastion Reinforced",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "stone",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-deep-violet-braces-with-a-central-vertical-iron-plated-structural-pillar-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-deep-violet-braces-with-a-central-vertical-iron-plated-structural-pillar-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-deep-violet-braces-with-a-central-vertical-iron-plated-structural-pillar-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-moss-green-braces-with-a-central-vertical-iron-plated-structural-pillar-00001",
    "name": "Bastion Reinforced With Interlocking Stone Blocks And Heavy Protruding Moss Green Braces, With A Central Vertical Iron Plated Structural Pillar 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-moss-green-braces-with-a-central-vertical-iron-plated-structural-pillar-00001/preview.webp",
    "browser": {
      "family": "Bastion Reinforced",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "stone",
        "metal",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-moss-green-braces-with-a-central-vertical-iron-plated-structural-pillar-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-moss-green-braces-with-a-central-vertical-iron-plated-structural-pillar-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-moss-green-braces-with-a-central-vertical-iron-plated-structural-pillar-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-ochre-yellow-braces-with-a-central-vertical-iron-plated-structural-pillar-00001",
    "name": "Bastion Reinforced With Interlocking Stone Blocks And Heavy Protruding Ochre Yellow Braces, With A Central Vertical Iron Plated Structural Pillar 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-ochre-yellow-braces-with-a-central-vertical-iron-plated-structural-pillar-00001/preview.webp",
    "browser": {
      "family": "Bastion Reinforced",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "stone",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-ochre-yellow-braces-with-a-central-vertical-iron-plated-structural-pillar-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-ochre-yellow-braces-with-a-central-vertical-iron-plated-structural-pillar-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-ochre-yellow-braces-with-a-central-vertical-iron-plated-structural-pillar-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-rust-brown-braces-with-a-central-vertical-iron-plated-structural-pillar-00001",
    "name": "Bastion Reinforced With Interlocking Stone Blocks And Heavy Protruding Rust Brown Braces, With A Central Vertical Iron Plated Structural Pillar 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-rust-brown-braces-with-a-central-vertical-iron-plated-structural-pillar-00001/preview.webp",
    "browser": {
      "family": "Bastion Reinforced",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "stone",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-rust-brown-braces-with-a-central-vertical-iron-plated-structural-pillar-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-rust-brown-braces-with-a-central-vertical-iron-plated-structural-pillar-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-rust-brown-braces-with-a-central-vertical-iron-plated-structural-pillar-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-slate-grey-braces-with-a-central-vertical-iron-plated-structural-pillar-00001",
    "name": "Bastion Reinforced With Interlocking Stone Blocks And Heavy Protruding Slate Grey Braces, With A Central Vertical Iron Plated Structural Pillar 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-slate-grey-braces-with-a-central-vertical-iron-plated-structural-pillar-00001/preview.webp",
    "browser": {
      "family": "Bastion Reinforced",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "stone",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-slate-grey-braces-with-a-central-vertical-iron-plated-structural-pillar-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-slate-grey-braces-with-a-central-vertical-iron-plated-structural-pillar-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-bastion-reinforced-with-interlocking-stone-blocks-and-heavy-protruding-slate-grey-braces-with-a-central-vertical-iron-plated-structural-pillar-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-bone-white-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001",
    "name": "Castle Stone With Massive Ashlar Masonry Blocks And Weathered Bone White Bevel Edges, With A Heavy Stone Corbel Protruding Near The Top Edge 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-bone-white-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/preview.webp",
    "browser": {
      "family": "Castle Stone",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-bone-white-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-bone-white-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-bone-white-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-burnt-orange-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001",
    "name": "Castle Stone With Massive Ashlar Masonry Blocks And Weathered Burnt Orange Bevel Edges, With A Heavy Stone Corbel Protruding Near The Top Edge 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-burnt-orange-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/preview.webp",
    "browser": {
      "family": "Castle Stone",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-burnt-orange-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-burnt-orange-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-burnt-orange-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-charcoal-black-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001",
    "name": "Castle Stone With Massive Ashlar Masonry Blocks And Weathered Charcoal Black Bevel Edges, With A Heavy Stone Corbel Protruding Near The Top Edge 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-charcoal-black-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/preview.webp",
    "browser": {
      "family": "Castle Stone",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-charcoal-black-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-charcoal-black-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-charcoal-black-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-cobalt-blue-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001",
    "name": "Castle Stone With Massive Ashlar Masonry Blocks And Weathered Cobalt Blue Bevel Edges, With A Heavy Stone Corbel Protruding Near The Top Edge 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-cobalt-blue-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/preview.webp",
    "browser": {
      "family": "Castle Stone",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-cobalt-blue-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-cobalt-blue-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-cobalt-blue-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-crimson-red-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001",
    "name": "Castle Stone With Massive Ashlar Masonry Blocks And Weathered Crimson Red Bevel Edges, With A Heavy Stone Corbel Protruding Near The Top Edge 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-crimson-red-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/preview.webp",
    "browser": {
      "family": "Castle Stone",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-crimson-red-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-crimson-red-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-crimson-red-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-deep-violet-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001",
    "name": "Castle Stone With Massive Ashlar Masonry Blocks And Weathered Deep Violet Bevel Edges, With A Heavy Stone Corbel Protruding Near The Top Edge 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-deep-violet-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/preview.webp",
    "browser": {
      "family": "Castle Stone",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-deep-violet-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-deep-violet-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-deep-violet-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-moss-green-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001",
    "name": "Castle Stone With Massive Ashlar Masonry Blocks And Weathered Moss Green Bevel Edges, With A Heavy Stone Corbel Protruding Near The Top Edge 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-moss-green-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/preview.webp",
    "browser": {
      "family": "Castle Stone",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "stone",
        "organic",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-moss-green-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-moss-green-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-moss-green-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-ochre-yellow-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001",
    "name": "Castle Stone With Massive Ashlar Masonry Blocks And Weathered Ochre Yellow Bevel Edges, With A Heavy Stone Corbel Protruding Near The Top Edge 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-ochre-yellow-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/preview.webp",
    "browser": {
      "family": "Castle Stone",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-ochre-yellow-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-ochre-yellow-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-ochre-yellow-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-rust-brown-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001",
    "name": "Castle Stone With Massive Ashlar Masonry Blocks And Weathered Rust Brown Bevel Edges, With A Heavy Stone Corbel Protruding Near The Top Edge 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-rust-brown-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/preview.webp",
    "browser": {
      "family": "Castle Stone",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-rust-brown-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-rust-brown-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-rust-brown-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-slate-grey-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001",
    "name": "Castle Stone With Massive Ashlar Masonry Blocks And Weathered Slate Grey Bevel Edges, With A Heavy Stone Corbel Protruding Near The Top Edge 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-slate-grey-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/preview.webp",
    "browser": {
      "family": "Castle Stone",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-slate-grey-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-slate-grey-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-slate-grey-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cavern-slime-with-smooth-wet-bone-white-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001",
    "name": "Cavern Slime With Smooth Wet Bone White Rock Undulations And Deep Recessed Erosion Pockets, With A Natural Limestone Flowstone Column Embedded Flat Against The Background 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cavern-slime-with-smooth-wet-bone-white-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001/preview.webp",
    "browser": {
      "family": "Cavern Slime",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "stone",
        "organic",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cavern-slime-with-smooth-wet-bone-white-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cavern-slime-with-smooth-wet-bone-white-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cavern-slime-with-smooth-wet-bone-white-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cavern-slime-with-smooth-wet-burnt-orange-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001",
    "name": "Cavern Slime With Smooth Wet Burnt Orange Rock Undulations And Deep Recessed Erosion Pockets, With A Natural Limestone Flowstone Column Embedded Flat Against The Background 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cavern-slime-with-smooth-wet-burnt-orange-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001/preview.webp",
    "browser": {
      "family": "Cavern Slime",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "stone",
        "organic",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cavern-slime-with-smooth-wet-burnt-orange-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cavern-slime-with-smooth-wet-burnt-orange-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cavern-slime-with-smooth-wet-burnt-orange-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cavern-slime-with-smooth-wet-charcoal-black-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001",
    "name": "Cavern Slime With Smooth Wet Charcoal Black Rock Undulations And Deep Recessed Erosion Pockets, With A Natural Limestone Flowstone Column Embedded Flat Against The Background 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cavern-slime-with-smooth-wet-charcoal-black-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001/preview.webp",
    "browser": {
      "family": "Cavern Slime",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "stone",
        "organic",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cavern-slime-with-smooth-wet-charcoal-black-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cavern-slime-with-smooth-wet-charcoal-black-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cavern-slime-with-smooth-wet-charcoal-black-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cavern-slime-with-smooth-wet-cobalt-blue-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001",
    "name": "Cavern Slime With Smooth Wet Cobalt Blue Rock Undulations And Deep Recessed Erosion Pockets, With A Natural Limestone Flowstone Column Embedded Flat Against The Background 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cavern-slime-with-smooth-wet-cobalt-blue-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001/preview.webp",
    "browser": {
      "family": "Cavern Slime",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "stone",
        "organic",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cavern-slime-with-smooth-wet-cobalt-blue-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cavern-slime-with-smooth-wet-cobalt-blue-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cavern-slime-with-smooth-wet-cobalt-blue-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cavern-slime-with-smooth-wet-crimson-red-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001",
    "name": "Cavern Slime With Smooth Wet Crimson Red Rock Undulations And Deep Recessed Erosion Pockets, With A Natural Limestone Flowstone Column Embedded Flat Against The Background 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cavern-slime-with-smooth-wet-crimson-red-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001/preview.webp",
    "browser": {
      "family": "Cavern Slime",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "stone",
        "organic",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cavern-slime-with-smooth-wet-crimson-red-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cavern-slime-with-smooth-wet-crimson-red-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cavern-slime-with-smooth-wet-crimson-red-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cavern-slime-with-smooth-wet-deep-violet-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001",
    "name": "Cavern Slime With Smooth Wet Deep Violet Rock Undulations And Deep Recessed Erosion Pockets, With A Natural Limestone Flowstone Column Embedded Flat Against The Background 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cavern-slime-with-smooth-wet-deep-violet-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001/preview.webp",
    "browser": {
      "family": "Cavern Slime",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "stone",
        "organic",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cavern-slime-with-smooth-wet-deep-violet-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cavern-slime-with-smooth-wet-deep-violet-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cavern-slime-with-smooth-wet-deep-violet-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cavern-slime-with-smooth-wet-moss-green-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001",
    "name": "Cavern Slime With Smooth Wet Moss Green Rock Undulations And Deep Recessed Erosion Pockets, With A Natural Limestone Flowstone Column Embedded Flat Against The Background 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cavern-slime-with-smooth-wet-moss-green-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001/preview.webp",
    "browser": {
      "family": "Cavern Slime",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "stone",
        "organic",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cavern-slime-with-smooth-wet-moss-green-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cavern-slime-with-smooth-wet-moss-green-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cavern-slime-with-smooth-wet-moss-green-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cavern-slime-with-smooth-wet-ochre-yellow-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001",
    "name": "Cavern Slime With Smooth Wet Ochre Yellow Rock Undulations And Deep Recessed Erosion Pockets, With A Natural Limestone Flowstone Column Embedded Flat Against The Background 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cavern-slime-with-smooth-wet-ochre-yellow-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001/preview.webp",
    "browser": {
      "family": "Cavern Slime",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "stone",
        "organic",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cavern-slime-with-smooth-wet-ochre-yellow-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cavern-slime-with-smooth-wet-ochre-yellow-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cavern-slime-with-smooth-wet-ochre-yellow-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cavern-slime-with-smooth-wet-rust-brown-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001",
    "name": "Cavern Slime With Smooth Wet Rust Brown Rock Undulations And Deep Recessed Erosion Pockets, With A Natural Limestone Flowstone Column Embedded Flat Against The Background 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cavern-slime-with-smooth-wet-rust-brown-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001/preview.webp",
    "browser": {
      "family": "Cavern Slime",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "stone",
        "organic",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cavern-slime-with-smooth-wet-rust-brown-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cavern-slime-with-smooth-wet-rust-brown-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cavern-slime-with-smooth-wet-rust-brown-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cavern-slime-with-smooth-wet-slate-grey-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001",
    "name": "Cavern Slime With Smooth Wet Slate Grey Rock Undulations And Deep Recessed Erosion Pockets, With A Natural Limestone Flowstone Column Embedded Flat Against The Background 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cavern-slime-with-smooth-wet-slate-grey-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001/preview.webp",
    "browser": {
      "family": "Cavern Slime",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "stone",
        "organic",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cavern-slime-with-smooth-wet-slate-grey-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cavern-slime-with-smooth-wet-slate-grey-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cavern-slime-with-smooth-wet-slate-grey-rock-undulations-and-deep-recessed-erosion-pockets-with-a-natural-limestone-flowstone-column-embedded-flat-against-the-background-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001",
    "name": "Cottage Plaster With Patches Of Exposed Underlying Lath And Rough Bone White Finger Troweled Textures, With A Rough Hewn Wooden Tie Beam Cutting Horizontally Through The Middle 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001/preview.webp",
    "browser": {
      "family": "Cottage Plaster",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "wood",
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-burnt-orange-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001",
    "name": "Cottage Plaster With Patches Of Exposed Underlying Lath And Rough Burnt Orange Finger Troweled Textures, With A Rough Hewn Wooden Tie Beam Cutting Horizontally Through The Middle 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-burnt-orange-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001/preview.webp",
    "browser": {
      "family": "Cottage Plaster",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "wood",
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-burnt-orange-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-burnt-orange-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-burnt-orange-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-charcoal-black-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001",
    "name": "Cottage Plaster With Patches Of Exposed Underlying Lath And Rough Charcoal Black Finger Troweled Textures, With A Rough Hewn Wooden Tie Beam Cutting Horizontally Through The Middle 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-charcoal-black-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001/preview.webp",
    "browser": {
      "family": "Cottage Plaster",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "wood",
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-charcoal-black-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-charcoal-black-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-charcoal-black-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-cobalt-blue-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001",
    "name": "Cottage Plaster With Patches Of Exposed Underlying Lath And Rough Cobalt Blue Finger Troweled Textures, With A Rough Hewn Wooden Tie Beam Cutting Horizontally Through The Middle 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-cobalt-blue-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001/preview.webp",
    "browser": {
      "family": "Cottage Plaster",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "wood",
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-cobalt-blue-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-cobalt-blue-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-cobalt-blue-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-crimson-red-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001",
    "name": "Cottage Plaster With Patches Of Exposed Underlying Lath And Rough Crimson Red Finger Troweled Textures, With A Rough Hewn Wooden Tie Beam Cutting Horizontally Through The Middle 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-crimson-red-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001/preview.webp",
    "browser": {
      "family": "Cottage Plaster",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "wood",
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-crimson-red-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-crimson-red-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-crimson-red-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-deep-violet-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001",
    "name": "Cottage Plaster With Patches Of Exposed Underlying Lath And Rough Deep Violet Finger Troweled Textures, With A Rough Hewn Wooden Tie Beam Cutting Horizontally Through The Middle 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-deep-violet-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001/preview.webp",
    "browser": {
      "family": "Cottage Plaster",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "wood",
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-deep-violet-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-deep-violet-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-deep-violet-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-moss-green-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001",
    "name": "Cottage Plaster With Patches Of Exposed Underlying Lath And Rough Moss Green Finger Troweled Textures, With A Rough Hewn Wooden Tie Beam Cutting Horizontally Through The Middle 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-moss-green-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001/preview.webp",
    "browser": {
      "family": "Cottage Plaster",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "wood",
        "plaster",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-moss-green-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-moss-green-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-moss-green-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-ochre-yellow-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001",
    "name": "Cottage Plaster With Patches Of Exposed Underlying Lath And Rough Ochre Yellow Finger Troweled Textures, With A Rough Hewn Wooden Tie Beam Cutting Horizontally Through The Middle 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-ochre-yellow-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001/preview.webp",
    "browser": {
      "family": "Cottage Plaster",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "wood",
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-ochre-yellow-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-ochre-yellow-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-ochre-yellow-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-rust-brown-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001",
    "name": "Cottage Plaster With Patches Of Exposed Underlying Lath And Rough Rust Brown Finger Troweled Textures, With A Rough Hewn Wooden Tie Beam Cutting Horizontally Through The Middle 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-rust-brown-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001/preview.webp",
    "browser": {
      "family": "Cottage Plaster",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "wood",
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-rust-brown-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-rust-brown-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-rust-brown-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-slate-grey-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001",
    "name": "Cottage Plaster With Patches Of Exposed Underlying Lath And Rough Slate Grey Finger Troweled Textures, With A Rough Hewn Wooden Tie Beam Cutting Horizontally Through The Middle 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-slate-grey-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001/preview.webp",
    "browser": {
      "family": "Cottage Plaster",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "wood",
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-slate-grey-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-slate-grey-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-slate-grey-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-crypt-tiles-with-cracked-bone-white-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001",
    "name": "Crypt Tiles With Cracked Bone White Squares And Deep Dark Grout Channels, With An Inset Stone Alcove Arch Casting A Shallow Shadow 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-crypt-tiles-with-cracked-bone-white-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001/preview.webp",
    "browser": {
      "family": "Crypt Tiles",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "stone",
        "ruined",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-crypt-tiles-with-cracked-bone-white-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-crypt-tiles-with-cracked-bone-white-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-crypt-tiles-with-cracked-bone-white-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-crypt-tiles-with-cracked-burnt-orange-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001",
    "name": "Crypt Tiles With Cracked Burnt Orange Squares And Deep Dark Grout Channels, With An Inset Stone Alcove Arch Casting A Shallow Shadow 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-crypt-tiles-with-cracked-burnt-orange-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001/preview.webp",
    "browser": {
      "family": "Crypt Tiles",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "stone",
        "ruined",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-crypt-tiles-with-cracked-burnt-orange-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-crypt-tiles-with-cracked-burnt-orange-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-crypt-tiles-with-cracked-burnt-orange-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-crypt-tiles-with-cracked-charcoal-black-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001",
    "name": "Crypt Tiles With Cracked Charcoal Black Squares And Deep Dark Grout Channels, With An Inset Stone Alcove Arch Casting A Shallow Shadow 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-crypt-tiles-with-cracked-charcoal-black-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001/preview.webp",
    "browser": {
      "family": "Crypt Tiles",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "stone",
        "ruined",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-crypt-tiles-with-cracked-charcoal-black-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-crypt-tiles-with-cracked-charcoal-black-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-crypt-tiles-with-cracked-charcoal-black-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-crypt-tiles-with-cracked-cobalt-blue-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001",
    "name": "Crypt Tiles With Cracked Cobalt Blue Squares And Deep Dark Grout Channels, With An Inset Stone Alcove Arch Casting A Shallow Shadow 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-crypt-tiles-with-cracked-cobalt-blue-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001/preview.webp",
    "browser": {
      "family": "Crypt Tiles",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "stone",
        "ruined",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-crypt-tiles-with-cracked-cobalt-blue-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-crypt-tiles-with-cracked-cobalt-blue-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-crypt-tiles-with-cracked-cobalt-blue-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-crypt-tiles-with-cracked-crimson-red-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001",
    "name": "Crypt Tiles With Cracked Crimson Red Squares And Deep Dark Grout Channels, With An Inset Stone Alcove Arch Casting A Shallow Shadow 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-crypt-tiles-with-cracked-crimson-red-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001/preview.webp",
    "browser": {
      "family": "Crypt Tiles",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "stone",
        "ruined",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-crypt-tiles-with-cracked-crimson-red-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-crypt-tiles-with-cracked-crimson-red-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-crypt-tiles-with-cracked-crimson-red-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-crypt-tiles-with-cracked-deep-violet-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001",
    "name": "Crypt Tiles With Cracked Deep Violet Squares And Deep Dark Grout Channels, With An Inset Stone Alcove Arch Casting A Shallow Shadow 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-crypt-tiles-with-cracked-deep-violet-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001/preview.webp",
    "browser": {
      "family": "Crypt Tiles",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "stone",
        "ruined",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-crypt-tiles-with-cracked-deep-violet-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-crypt-tiles-with-cracked-deep-violet-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-crypt-tiles-with-cracked-deep-violet-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-crypt-tiles-with-cracked-moss-green-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001",
    "name": "Crypt Tiles With Cracked Moss Green Squares And Deep Dark Grout Channels, With An Inset Stone Alcove Arch Casting A Shallow Shadow 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-crypt-tiles-with-cracked-moss-green-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001/preview.webp",
    "browser": {
      "family": "Crypt Tiles",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "stone",
        "organic",
        "ruined",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-crypt-tiles-with-cracked-moss-green-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-crypt-tiles-with-cracked-moss-green-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-crypt-tiles-with-cracked-moss-green-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-crypt-tiles-with-cracked-ochre-yellow-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001",
    "name": "Crypt Tiles With Cracked Ochre Yellow Squares And Deep Dark Grout Channels, With An Inset Stone Alcove Arch Casting A Shallow Shadow 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-crypt-tiles-with-cracked-ochre-yellow-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001/preview.webp",
    "browser": {
      "family": "Crypt Tiles",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "stone",
        "ruined",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-crypt-tiles-with-cracked-ochre-yellow-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-crypt-tiles-with-cracked-ochre-yellow-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-crypt-tiles-with-cracked-ochre-yellow-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-crypt-tiles-with-cracked-rust-brown-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001",
    "name": "Crypt Tiles With Cracked Rust Brown Squares And Deep Dark Grout Channels, With An Inset Stone Alcove Arch Casting A Shallow Shadow 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-crypt-tiles-with-cracked-rust-brown-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001/preview.webp",
    "browser": {
      "family": "Crypt Tiles",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "stone",
        "ruined",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-crypt-tiles-with-cracked-rust-brown-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-crypt-tiles-with-cracked-rust-brown-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-crypt-tiles-with-cracked-rust-brown-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-crypt-tiles-with-cracked-slate-grey-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001",
    "name": "Crypt Tiles With Cracked Slate Grey Squares And Deep Dark Grout Channels, With An Inset Stone Alcove Arch Casting A Shallow Shadow 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-crypt-tiles-with-cracked-slate-grey-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001/preview.webp",
    "browser": {
      "family": "Crypt Tiles",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "stone",
        "ruined",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-crypt-tiles-with-cracked-slate-grey-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-crypt-tiles-with-cracked-slate-grey-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-crypt-tiles-with-cracked-slate-grey-squares-and-deep-dark-grout-channels-with-an-inset-stone-alcove-arch-casting-a-shallow-shadow-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-bone-white-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001",
    "name": "Desert Adobe With Coarse Straw Flecks And Horizontal Sun Baked Bone White Finger Grooves, With Projecting Wooden Roof Support Logs Casting A Soft Shadow Downward 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-bone-white-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001/preview.webp",
    "browser": {
      "family": "Desert Adobe",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-bone-white-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-bone-white-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-bone-white-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-burnt-orange-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001",
    "name": "Desert Adobe With Coarse Straw Flecks And Horizontal Sun Baked Burnt Orange Finger Grooves, With Projecting Wooden Roof Support Logs Casting A Soft Shadow Downward 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-burnt-orange-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001/preview.webp",
    "browser": {
      "family": "Desert Adobe",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-burnt-orange-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-burnt-orange-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-burnt-orange-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-charcoal-black-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001",
    "name": "Desert Adobe With Coarse Straw Flecks And Horizontal Sun Baked Charcoal Black Finger Grooves, With Projecting Wooden Roof Support Logs Casting A Soft Shadow Downward 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-charcoal-black-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001/preview.webp",
    "browser": {
      "family": "Desert Adobe",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-charcoal-black-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-charcoal-black-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-charcoal-black-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-cobalt-blue-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001",
    "name": "Desert Adobe With Coarse Straw Flecks And Horizontal Sun Baked Cobalt Blue Finger Grooves, With Projecting Wooden Roof Support Logs Casting A Soft Shadow Downward 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-cobalt-blue-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001/preview.webp",
    "browser": {
      "family": "Desert Adobe",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-cobalt-blue-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-cobalt-blue-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-cobalt-blue-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-crimson-red-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001",
    "name": "Desert Adobe With Coarse Straw Flecks And Horizontal Sun Baked Crimson Red Finger Grooves, With Projecting Wooden Roof Support Logs Casting A Soft Shadow Downward 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-crimson-red-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001/preview.webp",
    "browser": {
      "family": "Desert Adobe",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-crimson-red-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-crimson-red-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-crimson-red-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-deep-violet-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001",
    "name": "Desert Adobe With Coarse Straw Flecks And Horizontal Sun Baked Deep Violet Finger Grooves, With Projecting Wooden Roof Support Logs Casting A Soft Shadow Downward 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-deep-violet-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001/preview.webp",
    "browser": {
      "family": "Desert Adobe",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-deep-violet-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-deep-violet-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-deep-violet-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-moss-green-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001",
    "name": "Desert Adobe With Coarse Straw Flecks And Horizontal Sun Baked Moss Green Finger Grooves, With Projecting Wooden Roof Support Logs Casting A Soft Shadow Downward 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-moss-green-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001/preview.webp",
    "browser": {
      "family": "Desert Adobe",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "plaster",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-moss-green-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-moss-green-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-moss-green-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-ochre-yellow-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001",
    "name": "Desert Adobe With Coarse Straw Flecks And Horizontal Sun Baked Ochre Yellow Finger Grooves, With Projecting Wooden Roof Support Logs Casting A Soft Shadow Downward 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-ochre-yellow-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001/preview.webp",
    "browser": {
      "family": "Desert Adobe",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-ochre-yellow-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-ochre-yellow-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-ochre-yellow-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-rust-brown-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001",
    "name": "Desert Adobe With Coarse Straw Flecks And Horizontal Sun Baked Rust Brown Finger Grooves, With Projecting Wooden Roof Support Logs Casting A Soft Shadow Downward 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-rust-brown-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001/preview.webp",
    "browser": {
      "family": "Desert Adobe",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-rust-brown-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-rust-brown-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-rust-brown-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-slate-grey-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001",
    "name": "Desert Adobe With Coarse Straw Flecks And Horizontal Sun Baked Slate Grey Finger Grooves, With Projecting Wooden Roof Support Logs Casting A Soft Shadow Downward 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-slate-grey-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001/preview.webp",
    "browser": {
      "family": "Desert Adobe",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-slate-grey-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-slate-grey-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-desert-adobe-with-coarse-straw-flecks-and-horizontal-sun-baked-slate-grey-finger-grooves-with-projecting-wooden-roof-support-logs-casting-a-soft-shadow-downward-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-dread-ironclad-with-overlapping-riveted-bone-white-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001",
    "name": "Dread Ironclad With Overlapping Riveted Bone White Metal Plates And Heavy Industrial Weld Beads, With Thick Vertical Iron T Beams Bolted Down The Center 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-dread-ironclad-with-overlapping-riveted-bone-white-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001/preview.webp",
    "browser": {
      "family": "Dread Ironclad",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-dread-ironclad-with-overlapping-riveted-bone-white-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dread-ironclad-with-overlapping-riveted-bone-white-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dread-ironclad-with-overlapping-riveted-bone-white-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-dread-ironclad-with-overlapping-riveted-burnt-orange-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001",
    "name": "Dread Ironclad With Overlapping Riveted Burnt Orange Metal Plates And Heavy Industrial Weld Beads, With Thick Vertical Iron T Beams Bolted Down The Center 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-dread-ironclad-with-overlapping-riveted-burnt-orange-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001/preview.webp",
    "browser": {
      "family": "Dread Ironclad",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-dread-ironclad-with-overlapping-riveted-burnt-orange-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dread-ironclad-with-overlapping-riveted-burnt-orange-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dread-ironclad-with-overlapping-riveted-burnt-orange-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-dread-ironclad-with-overlapping-riveted-charcoal-black-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001",
    "name": "Dread Ironclad With Overlapping Riveted Charcoal Black Metal Plates And Heavy Industrial Weld Beads, With Thick Vertical Iron T Beams Bolted Down The Center 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-dread-ironclad-with-overlapping-riveted-charcoal-black-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001/preview.webp",
    "browser": {
      "family": "Dread Ironclad",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-dread-ironclad-with-overlapping-riveted-charcoal-black-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dread-ironclad-with-overlapping-riveted-charcoal-black-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dread-ironclad-with-overlapping-riveted-charcoal-black-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-dread-ironclad-with-overlapping-riveted-cobalt-blue-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001",
    "name": "Dread Ironclad With Overlapping Riveted Cobalt Blue Metal Plates And Heavy Industrial Weld Beads, With Thick Vertical Iron T Beams Bolted Down The Center 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-dread-ironclad-with-overlapping-riveted-cobalt-blue-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001/preview.webp",
    "browser": {
      "family": "Dread Ironclad",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-dread-ironclad-with-overlapping-riveted-cobalt-blue-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dread-ironclad-with-overlapping-riveted-cobalt-blue-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dread-ironclad-with-overlapping-riveted-cobalt-blue-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-dread-ironclad-with-overlapping-riveted-crimson-red-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001",
    "name": "Dread Ironclad With Overlapping Riveted Crimson Red Metal Plates And Heavy Industrial Weld Beads, With Thick Vertical Iron T Beams Bolted Down The Center 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-dread-ironclad-with-overlapping-riveted-crimson-red-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001/preview.webp",
    "browser": {
      "family": "Dread Ironclad",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-dread-ironclad-with-overlapping-riveted-crimson-red-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dread-ironclad-with-overlapping-riveted-crimson-red-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dread-ironclad-with-overlapping-riveted-crimson-red-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-dread-ironclad-with-overlapping-riveted-deep-violet-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001",
    "name": "Dread Ironclad With Overlapping Riveted Deep Violet Metal Plates And Heavy Industrial Weld Beads, With Thick Vertical Iron T Beams Bolted Down The Center 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-dread-ironclad-with-overlapping-riveted-deep-violet-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001/preview.webp",
    "browser": {
      "family": "Dread Ironclad",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-dread-ironclad-with-overlapping-riveted-deep-violet-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dread-ironclad-with-overlapping-riveted-deep-violet-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dread-ironclad-with-overlapping-riveted-deep-violet-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-dread-ironclad-with-overlapping-riveted-moss-green-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001",
    "name": "Dread Ironclad With Overlapping Riveted Moss Green Metal Plates And Heavy Industrial Weld Beads, With Thick Vertical Iron T Beams Bolted Down The Center 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-dread-ironclad-with-overlapping-riveted-moss-green-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001/preview.webp",
    "browser": {
      "family": "Dread Ironclad",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "metal",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-dread-ironclad-with-overlapping-riveted-moss-green-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dread-ironclad-with-overlapping-riveted-moss-green-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dread-ironclad-with-overlapping-riveted-moss-green-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-dread-ironclad-with-overlapping-riveted-ochre-yellow-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001",
    "name": "Dread Ironclad With Overlapping Riveted Ochre Yellow Metal Plates And Heavy Industrial Weld Beads, With Thick Vertical Iron T Beams Bolted Down The Center 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-dread-ironclad-with-overlapping-riveted-ochre-yellow-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001/preview.webp",
    "browser": {
      "family": "Dread Ironclad",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-dread-ironclad-with-overlapping-riveted-ochre-yellow-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dread-ironclad-with-overlapping-riveted-ochre-yellow-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dread-ironclad-with-overlapping-riveted-ochre-yellow-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-dread-ironclad-with-overlapping-riveted-rust-brown-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001",
    "name": "Dread Ironclad With Overlapping Riveted Rust Brown Metal Plates And Heavy Industrial Weld Beads, With Thick Vertical Iron T Beams Bolted Down The Center 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-dread-ironclad-with-overlapping-riveted-rust-brown-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001/preview.webp",
    "browser": {
      "family": "Dread Ironclad",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-dread-ironclad-with-overlapping-riveted-rust-brown-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dread-ironclad-with-overlapping-riveted-rust-brown-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dread-ironclad-with-overlapping-riveted-rust-brown-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-dread-ironclad-with-overlapping-riveted-slate-grey-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001",
    "name": "Dread Ironclad With Overlapping Riveted Slate Grey Metal Plates And Heavy Industrial Weld Beads, With Thick Vertical Iron T Beams Bolted Down The Center 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-dread-ironclad-with-overlapping-riveted-slate-grey-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001/preview.webp",
    "browser": {
      "family": "Dread Ironclad",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-dread-ironclad-with-overlapping-riveted-slate-grey-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dread-ironclad-with-overlapping-riveted-slate-grey-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dread-ironclad-with-overlapping-riveted-slate-grey-metal-plates-and-heavy-industrial-weld-beads-with-thick-vertical-iron-t-beams-bolted-down-the-center-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-bone-white-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001",
    "name": "Dwarf Brick With Heavy Geometric Chisel Marks And Deep Recessed Bone White Mortar, With An Integrated Flat Pillar Decorated With Geometric Dwarven Runes 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-bone-white-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001/preview.webp",
    "browser": {
      "family": "Dwarf Brick",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-bone-white-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-bone-white-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-bone-white-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-burnt-orange-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001",
    "name": "Dwarf Brick With Heavy Geometric Chisel Marks And Deep Recessed Burnt Orange Mortar, With An Integrated Flat Pillar Decorated With Geometric Dwarven Runes 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-burnt-orange-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001/preview.webp",
    "browser": {
      "family": "Dwarf Brick",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-burnt-orange-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-burnt-orange-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-burnt-orange-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-charcoal-black-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001",
    "name": "Dwarf Brick With Heavy Geometric Chisel Marks And Deep Recessed Charcoal Black Mortar, With An Integrated Flat Pillar Decorated With Geometric Dwarven Runes 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-charcoal-black-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001/preview.webp",
    "browser": {
      "family": "Dwarf Brick",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-charcoal-black-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-charcoal-black-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-charcoal-black-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-cobalt-blue-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001",
    "name": "Dwarf Brick With Heavy Geometric Chisel Marks And Deep Recessed Cobalt Blue Mortar, With An Integrated Flat Pillar Decorated With Geometric Dwarven Runes 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-cobalt-blue-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001/preview.webp",
    "browser": {
      "family": "Dwarf Brick",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-cobalt-blue-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-cobalt-blue-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-cobalt-blue-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-crimson-red-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001",
    "name": "Dwarf Brick With Heavy Geometric Chisel Marks And Deep Recessed Crimson Red Mortar, With An Integrated Flat Pillar Decorated With Geometric Dwarven Runes 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-crimson-red-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001/preview.webp",
    "browser": {
      "family": "Dwarf Brick",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-crimson-red-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-crimson-red-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-crimson-red-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-deep-violet-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001",
    "name": "Dwarf Brick With Heavy Geometric Chisel Marks And Deep Recessed Deep Violet Mortar, With An Integrated Flat Pillar Decorated With Geometric Dwarven Runes 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-deep-violet-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001/preview.webp",
    "browser": {
      "family": "Dwarf Brick",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-deep-violet-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-deep-violet-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-deep-violet-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-moss-green-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001",
    "name": "Dwarf Brick With Heavy Geometric Chisel Marks And Deep Recessed Moss Green Mortar, With An Integrated Flat Pillar Decorated With Geometric Dwarven Runes 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-moss-green-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001/preview.webp",
    "browser": {
      "family": "Dwarf Brick",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-moss-green-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-moss-green-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-moss-green-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-ochre-yellow-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001",
    "name": "Dwarf Brick With Heavy Geometric Chisel Marks And Deep Recessed Ochre Yellow Mortar, With An Integrated Flat Pillar Decorated With Geometric Dwarven Runes 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-ochre-yellow-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001/preview.webp",
    "browser": {
      "family": "Dwarf Brick",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-ochre-yellow-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-ochre-yellow-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-ochre-yellow-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-rust-brown-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001",
    "name": "Dwarf Brick With Heavy Geometric Chisel Marks And Deep Recessed Rust Brown Mortar, With An Integrated Flat Pillar Decorated With Geometric Dwarven Runes 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-rust-brown-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001/preview.webp",
    "browser": {
      "family": "Dwarf Brick",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-rust-brown-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-rust-brown-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-rust-brown-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-slate-grey-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001",
    "name": "Dwarf Brick With Heavy Geometric Chisel Marks And Deep Recessed Slate Grey Mortar, With An Integrated Flat Pillar Decorated With Geometric Dwarven Runes 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-slate-grey-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001/preview.webp",
    "browser": {
      "family": "Dwarf Brick",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-slate-grey-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-slate-grey-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-slate-grey-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-bone-white-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001",
    "name": "Elven Wood With Elegant Swirling Vine Engravings And Subtle Metallic Bone White Filigree, With Arched Wooden Trim Framing The Outer Edges 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-bone-white-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001/preview.webp",
    "browser": {
      "family": "Elven Wood",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "wood",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-bone-white-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-bone-white-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-bone-white-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-burnt-orange-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001",
    "name": "Elven Wood With Elegant Swirling Vine Engravings And Subtle Metallic Burnt Orange Filigree, With Arched Wooden Trim Framing The Outer Edges 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-burnt-orange-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001/preview.webp",
    "browser": {
      "family": "Elven Wood",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "wood",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-burnt-orange-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-burnt-orange-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-burnt-orange-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-charcoal-black-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001",
    "name": "Elven Wood With Elegant Swirling Vine Engravings And Subtle Metallic Charcoal Black Filigree, With Arched Wooden Trim Framing The Outer Edges 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-charcoal-black-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001/preview.webp",
    "browser": {
      "family": "Elven Wood",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "wood",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-charcoal-black-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-charcoal-black-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-charcoal-black-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-cobalt-blue-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001",
    "name": "Elven Wood With Elegant Swirling Vine Engravings And Subtle Metallic Cobalt Blue Filigree, With Arched Wooden Trim Framing The Outer Edges 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-cobalt-blue-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001/preview.webp",
    "browser": {
      "family": "Elven Wood",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "wood",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-cobalt-blue-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-cobalt-blue-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-cobalt-blue-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-crimson-red-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001",
    "name": "Elven Wood With Elegant Swirling Vine Engravings And Subtle Metallic Crimson Red Filigree, With Arched Wooden Trim Framing The Outer Edges 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-crimson-red-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001/preview.webp",
    "browser": {
      "family": "Elven Wood",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "wood",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-crimson-red-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-crimson-red-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-crimson-red-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-deep-violet-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001",
    "name": "Elven Wood With Elegant Swirling Vine Engravings And Subtle Metallic Deep Violet Filigree, With Arched Wooden Trim Framing The Outer Edges 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-deep-violet-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001/preview.webp",
    "browser": {
      "family": "Elven Wood",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "wood",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-deep-violet-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-deep-violet-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-deep-violet-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-moss-green-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001",
    "name": "Elven Wood With Elegant Swirling Vine Engravings And Subtle Metallic Moss Green Filigree, With Arched Wooden Trim Framing The Outer Edges 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-moss-green-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001/preview.webp",
    "browser": {
      "family": "Elven Wood",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "wood",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-moss-green-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-moss-green-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-moss-green-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-ochre-yellow-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001",
    "name": "Elven Wood With Elegant Swirling Vine Engravings And Subtle Metallic Ochre Yellow Filigree, With Arched Wooden Trim Framing The Outer Edges 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-ochre-yellow-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001/preview.webp",
    "browser": {
      "family": "Elven Wood",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "wood",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-ochre-yellow-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-ochre-yellow-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-ochre-yellow-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-rust-brown-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001",
    "name": "Elven Wood With Elegant Swirling Vine Engravings And Subtle Metallic Rust Brown Filigree, With Arched Wooden Trim Framing The Outer Edges 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-rust-brown-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001/preview.webp",
    "browser": {
      "family": "Elven Wood",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "wood",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-rust-brown-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-rust-brown-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-rust-brown-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-slate-grey-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001",
    "name": "Elven Wood With Elegant Swirling Vine Engravings And Subtle Metallic Slate Grey Filigree, With Arched Wooden Trim Framing The Outer Edges 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-slate-grey-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001/preview.webp",
    "browser": {
      "family": "Elven Wood",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "wood",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-slate-grey-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-slate-grey-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-elven-wood-with-elegant-swirling-vine-engravings-and-subtle-metallic-slate-grey-filigree-with-arched-wooden-trim-framing-the-outer-edges-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-forge-soot-with-heavily-charred-bone-white-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001",
    "name": "Forge Soot With Heavily Charred Bone White Oak Grain And Thick Layered Carbon Crusts, With A Heavy Riveted Iron Ventilation Plate Frame Flush With The Wall 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-forge-soot-with-heavily-charred-bone-white-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001/preview.webp",
    "browser": {
      "family": "Forge Soot",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "wood",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-forge-soot-with-heavily-charred-bone-white-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-forge-soot-with-heavily-charred-bone-white-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-forge-soot-with-heavily-charred-bone-white-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-forge-soot-with-heavily-charred-burnt-orange-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001",
    "name": "Forge Soot With Heavily Charred Burnt Orange Oak Grain And Thick Layered Carbon Crusts, With A Heavy Riveted Iron Ventilation Plate Frame Flush With The Wall 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-forge-soot-with-heavily-charred-burnt-orange-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001/preview.webp",
    "browser": {
      "family": "Forge Soot",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "wood",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-forge-soot-with-heavily-charred-burnt-orange-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-forge-soot-with-heavily-charred-burnt-orange-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-forge-soot-with-heavily-charred-burnt-orange-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-forge-soot-with-heavily-charred-charcoal-black-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001",
    "name": "Forge Soot With Heavily Charred Charcoal Black Oak Grain And Thick Layered Carbon Crusts, With A Heavy Riveted Iron Ventilation Plate Frame Flush With The Wall 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-forge-soot-with-heavily-charred-charcoal-black-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001/preview.webp",
    "browser": {
      "family": "Forge Soot",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "wood",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-forge-soot-with-heavily-charred-charcoal-black-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-forge-soot-with-heavily-charred-charcoal-black-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-forge-soot-with-heavily-charred-charcoal-black-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-forge-soot-with-heavily-charred-cobalt-blue-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001",
    "name": "Forge Soot With Heavily Charred Cobalt Blue Oak Grain And Thick Layered Carbon Crusts, With A Heavy Riveted Iron Ventilation Plate Frame Flush With The Wall 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-forge-soot-with-heavily-charred-cobalt-blue-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001/preview.webp",
    "browser": {
      "family": "Forge Soot",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "wood",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-forge-soot-with-heavily-charred-cobalt-blue-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-forge-soot-with-heavily-charred-cobalt-blue-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-forge-soot-with-heavily-charred-cobalt-blue-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-forge-soot-with-heavily-charred-crimson-red-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001",
    "name": "Forge Soot With Heavily Charred Crimson Red Oak Grain And Thick Layered Carbon Crusts, With A Heavy Riveted Iron Ventilation Plate Frame Flush With The Wall 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-forge-soot-with-heavily-charred-crimson-red-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001/preview.webp",
    "browser": {
      "family": "Forge Soot",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "wood",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-forge-soot-with-heavily-charred-crimson-red-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-forge-soot-with-heavily-charred-crimson-red-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-forge-soot-with-heavily-charred-crimson-red-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-forge-soot-with-heavily-charred-deep-violet-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001",
    "name": "Forge Soot With Heavily Charred Deep Violet Oak Grain And Thick Layered Carbon Crusts, With A Heavy Riveted Iron Ventilation Plate Frame Flush With The Wall 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-forge-soot-with-heavily-charred-deep-violet-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001/preview.webp",
    "browser": {
      "family": "Forge Soot",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "wood",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-forge-soot-with-heavily-charred-deep-violet-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-forge-soot-with-heavily-charred-deep-violet-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-forge-soot-with-heavily-charred-deep-violet-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-forge-soot-with-heavily-charred-moss-green-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001",
    "name": "Forge Soot With Heavily Charred Moss Green Oak Grain And Thick Layered Carbon Crusts, With A Heavy Riveted Iron Ventilation Plate Frame Flush With The Wall 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-forge-soot-with-heavily-charred-moss-green-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001/preview.webp",
    "browser": {
      "family": "Forge Soot",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "wood",
        "metal",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-forge-soot-with-heavily-charred-moss-green-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-forge-soot-with-heavily-charred-moss-green-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-forge-soot-with-heavily-charred-moss-green-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-forge-soot-with-heavily-charred-ochre-yellow-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001",
    "name": "Forge Soot With Heavily Charred Ochre Yellow Oak Grain And Thick Layered Carbon Crusts, With A Heavy Riveted Iron Ventilation Plate Frame Flush With The Wall 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-forge-soot-with-heavily-charred-ochre-yellow-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001/preview.webp",
    "browser": {
      "family": "Forge Soot",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "wood",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-forge-soot-with-heavily-charred-ochre-yellow-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-forge-soot-with-heavily-charred-ochre-yellow-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-forge-soot-with-heavily-charred-ochre-yellow-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-forge-soot-with-heavily-charred-rust-brown-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001",
    "name": "Forge Soot With Heavily Charred Rust Brown Oak Grain And Thick Layered Carbon Crusts, With A Heavy Riveted Iron Ventilation Plate Frame Flush With The Wall 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-forge-soot-with-heavily-charred-rust-brown-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001/preview.webp",
    "browser": {
      "family": "Forge Soot",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "wood",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-forge-soot-with-heavily-charred-rust-brown-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-forge-soot-with-heavily-charred-rust-brown-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-forge-soot-with-heavily-charred-rust-brown-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-forge-soot-with-heavily-charred-slate-grey-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001",
    "name": "Forge Soot With Heavily Charred Slate Grey Oak Grain And Thick Layered Carbon Crusts, With A Heavy Riveted Iron Ventilation Plate Frame Flush With The Wall 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-forge-soot-with-heavily-charred-slate-grey-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001/preview.webp",
    "browser": {
      "family": "Forge Soot",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "wood",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-forge-soot-with-heavily-charred-slate-grey-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-forge-soot-with-heavily-charred-slate-grey-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-forge-soot-with-heavily-charred-slate-grey-oak-grain-and-thick-layered-carbon-crusts-with-a-heavy-riveted-iron-ventilation-plate-frame-flush-with-the-wall-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-fort-palisade-with-split-vertical-bone-white-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001",
    "name": "Fort Palisade With Split Vertical Bone White Log Textures And Thick Iron Binding Bands, With A Massive Horizontal Wooden Cross Brace Securing The Logs Together 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-fort-palisade-with-split-vertical-bone-white-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001/preview.webp",
    "browser": {
      "family": "Fort Palisade",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "wood",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-fort-palisade-with-split-vertical-bone-white-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-fort-palisade-with-split-vertical-bone-white-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-fort-palisade-with-split-vertical-bone-white-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-fort-palisade-with-split-vertical-burnt-orange-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001",
    "name": "Fort Palisade With Split Vertical Burnt Orange Log Textures And Thick Iron Binding Bands, With A Massive Horizontal Wooden Cross Brace Securing The Logs Together 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-fort-palisade-with-split-vertical-burnt-orange-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001/preview.webp",
    "browser": {
      "family": "Fort Palisade",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "wood",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-fort-palisade-with-split-vertical-burnt-orange-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-fort-palisade-with-split-vertical-burnt-orange-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-fort-palisade-with-split-vertical-burnt-orange-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-fort-palisade-with-split-vertical-charcoal-black-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001",
    "name": "Fort Palisade With Split Vertical Charcoal Black Log Textures And Thick Iron Binding Bands, With A Massive Horizontal Wooden Cross Brace Securing The Logs Together 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-fort-palisade-with-split-vertical-charcoal-black-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001/preview.webp",
    "browser": {
      "family": "Fort Palisade",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "wood",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-fort-palisade-with-split-vertical-charcoal-black-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-fort-palisade-with-split-vertical-charcoal-black-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-fort-palisade-with-split-vertical-charcoal-black-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-fort-palisade-with-split-vertical-cobalt-blue-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001",
    "name": "Fort Palisade With Split Vertical Cobalt Blue Log Textures And Thick Iron Binding Bands, With A Massive Horizontal Wooden Cross Brace Securing The Logs Together 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-fort-palisade-with-split-vertical-cobalt-blue-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001/preview.webp",
    "browser": {
      "family": "Fort Palisade",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "wood",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-fort-palisade-with-split-vertical-cobalt-blue-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-fort-palisade-with-split-vertical-cobalt-blue-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-fort-palisade-with-split-vertical-cobalt-blue-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-fort-palisade-with-split-vertical-crimson-red-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001",
    "name": "Fort Palisade With Split Vertical Crimson Red Log Textures And Thick Iron Binding Bands, With A Massive Horizontal Wooden Cross Brace Securing The Logs Together 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-fort-palisade-with-split-vertical-crimson-red-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001/preview.webp",
    "browser": {
      "family": "Fort Palisade",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "wood",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-fort-palisade-with-split-vertical-crimson-red-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-fort-palisade-with-split-vertical-crimson-red-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-fort-palisade-with-split-vertical-crimson-red-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-fort-palisade-with-split-vertical-deep-violet-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001",
    "name": "Fort Palisade With Split Vertical Deep Violet Log Textures And Thick Iron Binding Bands, With A Massive Horizontal Wooden Cross Brace Securing The Logs Together 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-fort-palisade-with-split-vertical-deep-violet-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001/preview.webp",
    "browser": {
      "family": "Fort Palisade",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "wood",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-fort-palisade-with-split-vertical-deep-violet-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-fort-palisade-with-split-vertical-deep-violet-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-fort-palisade-with-split-vertical-deep-violet-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-fort-palisade-with-split-vertical-moss-green-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001",
    "name": "Fort Palisade With Split Vertical Moss Green Log Textures And Thick Iron Binding Bands, With A Massive Horizontal Wooden Cross Brace Securing The Logs Together 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-fort-palisade-with-split-vertical-moss-green-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001/preview.webp",
    "browser": {
      "family": "Fort Palisade",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "wood",
        "metal",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-fort-palisade-with-split-vertical-moss-green-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-fort-palisade-with-split-vertical-moss-green-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-fort-palisade-with-split-vertical-moss-green-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-fort-palisade-with-split-vertical-ochre-yellow-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001",
    "name": "Fort Palisade With Split Vertical Ochre Yellow Log Textures And Thick Iron Binding Bands, With A Massive Horizontal Wooden Cross Brace Securing The Logs Together 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-fort-palisade-with-split-vertical-ochre-yellow-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001/preview.webp",
    "browser": {
      "family": "Fort Palisade",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "wood",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-fort-palisade-with-split-vertical-ochre-yellow-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-fort-palisade-with-split-vertical-ochre-yellow-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-fort-palisade-with-split-vertical-ochre-yellow-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-fort-palisade-with-split-vertical-rust-brown-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001",
    "name": "Fort Palisade With Split Vertical Rust Brown Log Textures And Thick Iron Binding Bands, With A Massive Horizontal Wooden Cross Brace Securing The Logs Together 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-fort-palisade-with-split-vertical-rust-brown-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001/preview.webp",
    "browser": {
      "family": "Fort Palisade",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "wood",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-fort-palisade-with-split-vertical-rust-brown-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-fort-palisade-with-split-vertical-rust-brown-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-fort-palisade-with-split-vertical-rust-brown-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-fort-palisade-with-split-vertical-slate-grey-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001",
    "name": "Fort Palisade With Split Vertical Slate Grey Log Textures And Thick Iron Binding Bands, With A Massive Horizontal Wooden Cross Brace Securing The Logs Together 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-fort-palisade-with-split-vertical-slate-grey-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001/preview.webp",
    "browser": {
      "family": "Fort Palisade",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "wood",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-fort-palisade-with-split-vertical-slate-grey-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-fort-palisade-with-split-vertical-slate-grey-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-fort-palisade-with-split-vertical-slate-grey-log-textures-and-thick-iron-binding-bands-with-a-massive-horizontal-wooden-cross-brace-securing-the-logs-together-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-glacier-ice-with-translucent-packed-bone-white-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001",
    "name": "Glacier Ice With Translucent Packed Bone White Frost Steps And Deep Internal Fracture Lines, With A Thick Structural Ice Pillar Projecting Slightly From The Wall Sheet 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-glacier-ice-with-translucent-packed-bone-white-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001/preview.webp",
    "browser": {
      "family": "Glacier Ice",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "ice"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-glacier-ice-with-translucent-packed-bone-white-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-glacier-ice-with-translucent-packed-bone-white-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-glacier-ice-with-translucent-packed-bone-white-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-glacier-ice-with-translucent-packed-burnt-orange-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001",
    "name": "Glacier Ice With Translucent Packed Burnt Orange Frost Steps And Deep Internal Fracture Lines, With A Thick Structural Ice Pillar Projecting Slightly From The Wall Sheet 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-glacier-ice-with-translucent-packed-burnt-orange-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001/preview.webp",
    "browser": {
      "family": "Glacier Ice",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "ice"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-glacier-ice-with-translucent-packed-burnt-orange-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-glacier-ice-with-translucent-packed-burnt-orange-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-glacier-ice-with-translucent-packed-burnt-orange-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-glacier-ice-with-translucent-packed-charcoal-black-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001",
    "name": "Glacier Ice With Translucent Packed Charcoal Black Frost Steps And Deep Internal Fracture Lines, With A Thick Structural Ice Pillar Projecting Slightly From The Wall Sheet 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-glacier-ice-with-translucent-packed-charcoal-black-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001/preview.webp",
    "browser": {
      "family": "Glacier Ice",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "ice"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-glacier-ice-with-translucent-packed-charcoal-black-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-glacier-ice-with-translucent-packed-charcoal-black-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-glacier-ice-with-translucent-packed-charcoal-black-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-glacier-ice-with-translucent-packed-cobalt-blue-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001",
    "name": "Glacier Ice With Translucent Packed Cobalt Blue Frost Steps And Deep Internal Fracture Lines, With A Thick Structural Ice Pillar Projecting Slightly From The Wall Sheet 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-glacier-ice-with-translucent-packed-cobalt-blue-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001/preview.webp",
    "browser": {
      "family": "Glacier Ice",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "ice"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-glacier-ice-with-translucent-packed-cobalt-blue-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-glacier-ice-with-translucent-packed-cobalt-blue-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-glacier-ice-with-translucent-packed-cobalt-blue-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-glacier-ice-with-translucent-packed-crimson-red-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001",
    "name": "Glacier Ice With Translucent Packed Crimson Red Frost Steps And Deep Internal Fracture Lines, With A Thick Structural Ice Pillar Projecting Slightly From The Wall Sheet 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-glacier-ice-with-translucent-packed-crimson-red-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001/preview.webp",
    "browser": {
      "family": "Glacier Ice",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "ice"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-glacier-ice-with-translucent-packed-crimson-red-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-glacier-ice-with-translucent-packed-crimson-red-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-glacier-ice-with-translucent-packed-crimson-red-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-glacier-ice-with-translucent-packed-deep-violet-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001",
    "name": "Glacier Ice With Translucent Packed Deep Violet Frost Steps And Deep Internal Fracture Lines, With A Thick Structural Ice Pillar Projecting Slightly From The Wall Sheet 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-glacier-ice-with-translucent-packed-deep-violet-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001/preview.webp",
    "browser": {
      "family": "Glacier Ice",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "ice"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-glacier-ice-with-translucent-packed-deep-violet-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-glacier-ice-with-translucent-packed-deep-violet-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-glacier-ice-with-translucent-packed-deep-violet-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-glacier-ice-with-translucent-packed-moss-green-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001",
    "name": "Glacier Ice With Translucent Packed Moss Green Frost Steps And Deep Internal Fracture Lines, With A Thick Structural Ice Pillar Projecting Slightly From The Wall Sheet 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-glacier-ice-with-translucent-packed-moss-green-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001/preview.webp",
    "browser": {
      "family": "Glacier Ice",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "organic",
        "ice"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-glacier-ice-with-translucent-packed-moss-green-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-glacier-ice-with-translucent-packed-moss-green-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-glacier-ice-with-translucent-packed-moss-green-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-glacier-ice-with-translucent-packed-ochre-yellow-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001",
    "name": "Glacier Ice With Translucent Packed Ochre Yellow Frost Steps And Deep Internal Fracture Lines, With A Thick Structural Ice Pillar Projecting Slightly From The Wall Sheet 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-glacier-ice-with-translucent-packed-ochre-yellow-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001/preview.webp",
    "browser": {
      "family": "Glacier Ice",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "ice"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-glacier-ice-with-translucent-packed-ochre-yellow-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-glacier-ice-with-translucent-packed-ochre-yellow-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-glacier-ice-with-translucent-packed-ochre-yellow-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-glacier-ice-with-translucent-packed-rust-brown-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001",
    "name": "Glacier Ice With Translucent Packed Rust Brown Frost Steps And Deep Internal Fracture Lines, With A Thick Structural Ice Pillar Projecting Slightly From The Wall Sheet 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-glacier-ice-with-translucent-packed-rust-brown-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001/preview.webp",
    "browser": {
      "family": "Glacier Ice",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "ice"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-glacier-ice-with-translucent-packed-rust-brown-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-glacier-ice-with-translucent-packed-rust-brown-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-glacier-ice-with-translucent-packed-rust-brown-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-glacier-ice-with-translucent-packed-slate-grey-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001",
    "name": "Glacier Ice With Translucent Packed Slate Grey Frost Steps And Deep Internal Fracture Lines, With A Thick Structural Ice Pillar Projecting Slightly From The Wall Sheet 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-glacier-ice-with-translucent-packed-slate-grey-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001/preview.webp",
    "browser": {
      "family": "Glacier Ice",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "ice"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-glacier-ice-with-translucent-packed-slate-grey-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-glacier-ice-with-translucent-packed-slate-grey-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-glacier-ice-with-translucent-packed-slate-grey-frost-steps-and-deep-internal-fracture-lines-with-a-thick-structural-ice-pillar-projecting-slightly-from-the-wall-sheet-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-goblin-cave-with-jagged-asymmetric-bone-white-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001",
    "name": "Goblin Cave With Jagged Asymmetric Bone White Rock Strata And Crude Tool Pickaxe Gouges, With An Uneven Stone Buttress Rough Hewn Directly Into The Cave Wall 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-goblin-cave-with-jagged-asymmetric-bone-white-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001/preview.webp",
    "browser": {
      "family": "Goblin Cave",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "stone",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-goblin-cave-with-jagged-asymmetric-bone-white-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-goblin-cave-with-jagged-asymmetric-bone-white-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-goblin-cave-with-jagged-asymmetric-bone-white-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-goblin-cave-with-jagged-asymmetric-burnt-orange-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001",
    "name": "Goblin Cave With Jagged Asymmetric Burnt Orange Rock Strata And Crude Tool Pickaxe Gouges, With An Uneven Stone Buttress Rough Hewn Directly Into The Cave Wall 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-goblin-cave-with-jagged-asymmetric-burnt-orange-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001/preview.webp",
    "browser": {
      "family": "Goblin Cave",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "stone",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-goblin-cave-with-jagged-asymmetric-burnt-orange-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-goblin-cave-with-jagged-asymmetric-burnt-orange-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-goblin-cave-with-jagged-asymmetric-burnt-orange-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-goblin-cave-with-jagged-asymmetric-charcoal-black-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001",
    "name": "Goblin Cave With Jagged Asymmetric Charcoal Black Rock Strata And Crude Tool Pickaxe Gouges, With An Uneven Stone Buttress Rough Hewn Directly Into The Cave Wall 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-goblin-cave-with-jagged-asymmetric-charcoal-black-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001/preview.webp",
    "browser": {
      "family": "Goblin Cave",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "stone",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-goblin-cave-with-jagged-asymmetric-charcoal-black-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-goblin-cave-with-jagged-asymmetric-charcoal-black-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-goblin-cave-with-jagged-asymmetric-charcoal-black-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-goblin-cave-with-jagged-asymmetric-cobalt-blue-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001",
    "name": "Goblin Cave With Jagged Asymmetric Cobalt Blue Rock Strata And Crude Tool Pickaxe Gouges, With An Uneven Stone Buttress Rough Hewn Directly Into The Cave Wall 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-goblin-cave-with-jagged-asymmetric-cobalt-blue-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001/preview.webp",
    "browser": {
      "family": "Goblin Cave",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "stone",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-goblin-cave-with-jagged-asymmetric-cobalt-blue-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-goblin-cave-with-jagged-asymmetric-cobalt-blue-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-goblin-cave-with-jagged-asymmetric-cobalt-blue-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-goblin-cave-with-jagged-asymmetric-crimson-red-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001",
    "name": "Goblin Cave With Jagged Asymmetric Crimson Red Rock Strata And Crude Tool Pickaxe Gouges, With An Uneven Stone Buttress Rough Hewn Directly Into The Cave Wall 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-goblin-cave-with-jagged-asymmetric-crimson-red-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001/preview.webp",
    "browser": {
      "family": "Goblin Cave",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "stone",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-goblin-cave-with-jagged-asymmetric-crimson-red-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-goblin-cave-with-jagged-asymmetric-crimson-red-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-goblin-cave-with-jagged-asymmetric-crimson-red-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-goblin-cave-with-jagged-asymmetric-deep-violet-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001",
    "name": "Goblin Cave With Jagged Asymmetric Deep Violet Rock Strata And Crude Tool Pickaxe Gouges, With An Uneven Stone Buttress Rough Hewn Directly Into The Cave Wall 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-goblin-cave-with-jagged-asymmetric-deep-violet-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001/preview.webp",
    "browser": {
      "family": "Goblin Cave",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "stone",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-goblin-cave-with-jagged-asymmetric-deep-violet-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-goblin-cave-with-jagged-asymmetric-deep-violet-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-goblin-cave-with-jagged-asymmetric-deep-violet-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-goblin-cave-with-jagged-asymmetric-moss-green-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001",
    "name": "Goblin Cave With Jagged Asymmetric Moss Green Rock Strata And Crude Tool Pickaxe Gouges, With An Uneven Stone Buttress Rough Hewn Directly Into The Cave Wall 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-goblin-cave-with-jagged-asymmetric-moss-green-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001/preview.webp",
    "browser": {
      "family": "Goblin Cave",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "stone",
        "organic",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-goblin-cave-with-jagged-asymmetric-moss-green-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-goblin-cave-with-jagged-asymmetric-moss-green-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-goblin-cave-with-jagged-asymmetric-moss-green-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-goblin-cave-with-jagged-asymmetric-ochre-yellow-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001",
    "name": "Goblin Cave With Jagged Asymmetric Ochre Yellow Rock Strata And Crude Tool Pickaxe Gouges, With An Uneven Stone Buttress Rough Hewn Directly Into The Cave Wall 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-goblin-cave-with-jagged-asymmetric-ochre-yellow-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001/preview.webp",
    "browser": {
      "family": "Goblin Cave",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "stone",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-goblin-cave-with-jagged-asymmetric-ochre-yellow-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-goblin-cave-with-jagged-asymmetric-ochre-yellow-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-goblin-cave-with-jagged-asymmetric-ochre-yellow-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-goblin-cave-with-jagged-asymmetric-rust-brown-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001",
    "name": "Goblin Cave With Jagged Asymmetric Rust Brown Rock Strata And Crude Tool Pickaxe Gouges, With An Uneven Stone Buttress Rough Hewn Directly Into The Cave Wall 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-goblin-cave-with-jagged-asymmetric-rust-brown-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001/preview.webp",
    "browser": {
      "family": "Goblin Cave",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "stone",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-goblin-cave-with-jagged-asymmetric-rust-brown-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-goblin-cave-with-jagged-asymmetric-rust-brown-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-goblin-cave-with-jagged-asymmetric-rust-brown-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-goblin-cave-with-jagged-asymmetric-slate-grey-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001",
    "name": "Goblin Cave With Jagged Asymmetric Slate Grey Rock Strata And Crude Tool Pickaxe Gouges, With An Uneven Stone Buttress Rough Hewn Directly Into The Cave Wall 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-goblin-cave-with-jagged-asymmetric-slate-grey-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001/preview.webp",
    "browser": {
      "family": "Goblin Cave",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "stone",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-goblin-cave-with-jagged-asymmetric-slate-grey-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-goblin-cave-with-jagged-asymmetric-slate-grey-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-goblin-cave-with-jagged-asymmetric-slate-grey-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-bone-white-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001",
    "name": "Golem Concrete With Industrial Formwork Seam Lines And Embedded Bone White Rivet Heads, With Thick Horizontal Steel Reinforcement Bands Bracing The Plates 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-bone-white-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001/preview.webp",
    "browser": {
      "family": "Golem Concrete",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-bone-white-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-bone-white-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-bone-white-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-burnt-orange-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001",
    "name": "Golem Concrete With Industrial Formwork Seam Lines And Embedded Burnt Orange Rivet Heads, With Thick Horizontal Steel Reinforcement Bands Bracing The Plates 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-burnt-orange-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001/preview.webp",
    "browser": {
      "family": "Golem Concrete",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-burnt-orange-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-burnt-orange-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-burnt-orange-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-charcoal-black-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001",
    "name": "Golem Concrete With Industrial Formwork Seam Lines And Embedded Charcoal Black Rivet Heads, With Thick Horizontal Steel Reinforcement Bands Bracing The Plates 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-charcoal-black-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001/preview.webp",
    "browser": {
      "family": "Golem Concrete",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-charcoal-black-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-charcoal-black-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-charcoal-black-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-cobalt-blue-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001",
    "name": "Golem Concrete With Industrial Formwork Seam Lines And Embedded Cobalt Blue Rivet Heads, With Thick Horizontal Steel Reinforcement Bands Bracing The Plates 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-cobalt-blue-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001/preview.webp",
    "browser": {
      "family": "Golem Concrete",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-cobalt-blue-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-cobalt-blue-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-cobalt-blue-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-crimson-red-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001",
    "name": "Golem Concrete With Industrial Formwork Seam Lines And Embedded Crimson Red Rivet Heads, With Thick Horizontal Steel Reinforcement Bands Bracing The Plates 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-crimson-red-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001/preview.webp",
    "browser": {
      "family": "Golem Concrete",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-crimson-red-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-crimson-red-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-crimson-red-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-deep-violet-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001",
    "name": "Golem Concrete With Industrial Formwork Seam Lines And Embedded Deep Violet Rivet Heads, With Thick Horizontal Steel Reinforcement Bands Bracing The Plates 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-deep-violet-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001/preview.webp",
    "browser": {
      "family": "Golem Concrete",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-deep-violet-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-deep-violet-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-deep-violet-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-moss-green-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001",
    "name": "Golem Concrete With Industrial Formwork Seam Lines And Embedded Moss Green Rivet Heads, With Thick Horizontal Steel Reinforcement Bands Bracing The Plates 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-moss-green-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001/preview.webp",
    "browser": {
      "family": "Golem Concrete",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "metal",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-moss-green-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-moss-green-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-moss-green-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-ochre-yellow-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001",
    "name": "Golem Concrete With Industrial Formwork Seam Lines And Embedded Ochre Yellow Rivet Heads, With Thick Horizontal Steel Reinforcement Bands Bracing The Plates 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-ochre-yellow-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001/preview.webp",
    "browser": {
      "family": "Golem Concrete",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-ochre-yellow-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-ochre-yellow-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-ochre-yellow-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-rust-brown-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001",
    "name": "Golem Concrete With Industrial Formwork Seam Lines And Embedded Rust Brown Rivet Heads, With Thick Horizontal Steel Reinforcement Bands Bracing The Plates 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-rust-brown-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001/preview.webp",
    "browser": {
      "family": "Golem Concrete",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-rust-brown-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-rust-brown-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-rust-brown-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-slate-grey-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001",
    "name": "Golem Concrete With Industrial Formwork Seam Lines And Embedded Slate Grey Rivet Heads, With Thick Horizontal Steel Reinforcement Bands Bracing The Plates 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-slate-grey-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001/preview.webp",
    "browser": {
      "family": "Golem Concrete",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-slate-grey-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-slate-grey-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-golem-concrete-with-industrial-formwork-seam-lines-and-embedded-slate-grey-rivet-heads-with-thick-horizontal-steel-reinforcement-bands-bracing-the-plates-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-grove-wood-with-living-interlocking-bone-white-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001",
    "name": "Grove Wood With Living Interlocking Bone White Bark Ridges And Smooth Polished Burls, With An Interwoven Lattice Of Living Roots Forming A Natural Structural Border 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-grove-wood-with-living-interlocking-bone-white-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001/preview.webp",
    "browser": {
      "family": "Grove Wood",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "wood",
        "organic",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-grove-wood-with-living-interlocking-bone-white-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-grove-wood-with-living-interlocking-bone-white-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-grove-wood-with-living-interlocking-bone-white-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-grove-wood-with-living-interlocking-burnt-orange-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001",
    "name": "Grove Wood With Living Interlocking Burnt Orange Bark Ridges And Smooth Polished Burls, With An Interwoven Lattice Of Living Roots Forming A Natural Structural Border 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-grove-wood-with-living-interlocking-burnt-orange-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001/preview.webp",
    "browser": {
      "family": "Grove Wood",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "wood",
        "organic",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-grove-wood-with-living-interlocking-burnt-orange-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-grove-wood-with-living-interlocking-burnt-orange-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-grove-wood-with-living-interlocking-burnt-orange-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-grove-wood-with-living-interlocking-charcoal-black-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001",
    "name": "Grove Wood With Living Interlocking Charcoal Black Bark Ridges And Smooth Polished Burls, With An Interwoven Lattice Of Living Roots Forming A Natural Structural Border 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-grove-wood-with-living-interlocking-charcoal-black-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001/preview.webp",
    "browser": {
      "family": "Grove Wood",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "wood",
        "organic",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-grove-wood-with-living-interlocking-charcoal-black-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-grove-wood-with-living-interlocking-charcoal-black-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-grove-wood-with-living-interlocking-charcoal-black-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-grove-wood-with-living-interlocking-cobalt-blue-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001",
    "name": "Grove Wood With Living Interlocking Cobalt Blue Bark Ridges And Smooth Polished Burls, With An Interwoven Lattice Of Living Roots Forming A Natural Structural Border 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-grove-wood-with-living-interlocking-cobalt-blue-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001/preview.webp",
    "browser": {
      "family": "Grove Wood",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "wood",
        "organic",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-grove-wood-with-living-interlocking-cobalt-blue-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-grove-wood-with-living-interlocking-cobalt-blue-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-grove-wood-with-living-interlocking-cobalt-blue-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-grove-wood-with-living-interlocking-crimson-red-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001",
    "name": "Grove Wood With Living Interlocking Crimson Red Bark Ridges And Smooth Polished Burls, With An Interwoven Lattice Of Living Roots Forming A Natural Structural Border 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-grove-wood-with-living-interlocking-crimson-red-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001/preview.webp",
    "browser": {
      "family": "Grove Wood",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "wood",
        "organic",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-grove-wood-with-living-interlocking-crimson-red-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-grove-wood-with-living-interlocking-crimson-red-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-grove-wood-with-living-interlocking-crimson-red-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-grove-wood-with-living-interlocking-deep-violet-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001",
    "name": "Grove Wood With Living Interlocking Deep Violet Bark Ridges And Smooth Polished Burls, With An Interwoven Lattice Of Living Roots Forming A Natural Structural Border 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-grove-wood-with-living-interlocking-deep-violet-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001/preview.webp",
    "browser": {
      "family": "Grove Wood",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "wood",
        "organic",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-grove-wood-with-living-interlocking-deep-violet-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-grove-wood-with-living-interlocking-deep-violet-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-grove-wood-with-living-interlocking-deep-violet-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-grove-wood-with-living-interlocking-moss-green-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001",
    "name": "Grove Wood With Living Interlocking Moss Green Bark Ridges And Smooth Polished Burls, With An Interwoven Lattice Of Living Roots Forming A Natural Structural Border 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-grove-wood-with-living-interlocking-moss-green-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001/preview.webp",
    "browser": {
      "family": "Grove Wood",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "wood",
        "organic",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-grove-wood-with-living-interlocking-moss-green-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-grove-wood-with-living-interlocking-moss-green-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-grove-wood-with-living-interlocking-moss-green-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-grove-wood-with-living-interlocking-ochre-yellow-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001",
    "name": "Grove Wood With Living Interlocking Ochre Yellow Bark Ridges And Smooth Polished Burls, With An Interwoven Lattice Of Living Roots Forming A Natural Structural Border 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-grove-wood-with-living-interlocking-ochre-yellow-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001/preview.webp",
    "browser": {
      "family": "Grove Wood",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "wood",
        "organic",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-grove-wood-with-living-interlocking-ochre-yellow-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-grove-wood-with-living-interlocking-ochre-yellow-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-grove-wood-with-living-interlocking-ochre-yellow-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-grove-wood-with-living-interlocking-rust-brown-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001",
    "name": "Grove Wood With Living Interlocking Rust Brown Bark Ridges And Smooth Polished Burls, With An Interwoven Lattice Of Living Roots Forming A Natural Structural Border 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-grove-wood-with-living-interlocking-rust-brown-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001/preview.webp",
    "browser": {
      "family": "Grove Wood",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "wood",
        "organic",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-grove-wood-with-living-interlocking-rust-brown-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-grove-wood-with-living-interlocking-rust-brown-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-grove-wood-with-living-interlocking-rust-brown-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-grove-wood-with-living-interlocking-slate-grey-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001",
    "name": "Grove Wood With Living Interlocking Slate Grey Bark Ridges And Smooth Polished Burls, With An Interwoven Lattice Of Living Roots Forming A Natural Structural Border 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-grove-wood-with-living-interlocking-slate-grey-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001/preview.webp",
    "browser": {
      "family": "Grove Wood",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "wood",
        "organic",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-grove-wood-with-living-interlocking-slate-grey-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-grove-wood-with-living-interlocking-slate-grey-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-grove-wood-with-living-interlocking-slate-grey-bark-ridges-and-smooth-polished-burls-with-an-interwoven-lattice-of-living-roots-forming-a-natural-structural-border-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-bone-white-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001",
    "name": "Infernal Magma With Hardened Basalt Crust Tiles And Wide Recessed Bone White Lava Fissures, With An Angular Obsidian Stone Pillar Bracing The Unstable Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-bone-white-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001/preview.webp",
    "browser": {
      "family": "Infernal Magma",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "stone",
        "lava"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-bone-white-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-bone-white-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-bone-white-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-burnt-orange-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001",
    "name": "Infernal Magma With Hardened Basalt Crust Tiles And Wide Recessed Burnt Orange Lava Fissures, With An Angular Obsidian Stone Pillar Bracing The Unstable Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-burnt-orange-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001/preview.webp",
    "browser": {
      "family": "Infernal Magma",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "stone",
        "lava"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-burnt-orange-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-burnt-orange-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-burnt-orange-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-charcoal-black-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001",
    "name": "Infernal Magma With Hardened Basalt Crust Tiles And Wide Recessed Charcoal Black Lava Fissures, With An Angular Obsidian Stone Pillar Bracing The Unstable Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-charcoal-black-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001/preview.webp",
    "browser": {
      "family": "Infernal Magma",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "stone",
        "lava"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-charcoal-black-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-charcoal-black-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-charcoal-black-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-cobalt-blue-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001",
    "name": "Infernal Magma With Hardened Basalt Crust Tiles And Wide Recessed Cobalt Blue Lava Fissures, With An Angular Obsidian Stone Pillar Bracing The Unstable Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-cobalt-blue-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001/preview.webp",
    "browser": {
      "family": "Infernal Magma",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "stone",
        "lava"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-cobalt-blue-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-cobalt-blue-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-cobalt-blue-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-crimson-red-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001",
    "name": "Infernal Magma With Hardened Basalt Crust Tiles And Wide Recessed Crimson Red Lava Fissures, With An Angular Obsidian Stone Pillar Bracing The Unstable Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-crimson-red-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001/preview.webp",
    "browser": {
      "family": "Infernal Magma",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "stone",
        "lava"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-crimson-red-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-crimson-red-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-crimson-red-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-deep-violet-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001",
    "name": "Infernal Magma With Hardened Basalt Crust Tiles And Wide Recessed Deep Violet Lava Fissures, With An Angular Obsidian Stone Pillar Bracing The Unstable Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-deep-violet-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001/preview.webp",
    "browser": {
      "family": "Infernal Magma",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "stone",
        "lava"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-deep-violet-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-deep-violet-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-deep-violet-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-moss-green-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001",
    "name": "Infernal Magma With Hardened Basalt Crust Tiles And Wide Recessed Moss Green Lava Fissures, With An Angular Obsidian Stone Pillar Bracing The Unstable Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-moss-green-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001/preview.webp",
    "browser": {
      "family": "Infernal Magma",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "stone",
        "organic",
        "lava"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-moss-green-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-moss-green-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-moss-green-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-ochre-yellow-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001",
    "name": "Infernal Magma With Hardened Basalt Crust Tiles And Wide Recessed Ochre Yellow Lava Fissures, With An Angular Obsidian Stone Pillar Bracing The Unstable Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-ochre-yellow-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001/preview.webp",
    "browser": {
      "family": "Infernal Magma",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "stone",
        "lava"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-ochre-yellow-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-ochre-yellow-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-ochre-yellow-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-rust-brown-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001",
    "name": "Infernal Magma With Hardened Basalt Crust Tiles And Wide Recessed Rust Brown Lava Fissures, With An Angular Obsidian Stone Pillar Bracing The Unstable Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-rust-brown-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001/preview.webp",
    "browser": {
      "family": "Infernal Magma",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "stone",
        "lava"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-rust-brown-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-rust-brown-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-rust-brown-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-slate-grey-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001",
    "name": "Infernal Magma With Hardened Basalt Crust Tiles And Wide Recessed Slate Grey Lava Fissures, With An Angular Obsidian Stone Pillar Bracing The Unstable Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-slate-grey-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001/preview.webp",
    "browser": {
      "family": "Infernal Magma",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "stone",
        "lava"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-slate-grey-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-slate-grey-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-infernal-magma-with-hardened-basalt-crust-tiles-and-wide-recessed-slate-grey-lava-fissures-with-an-angular-obsidian-stone-pillar-bracing-the-unstable-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-keep-granite-with-rugged-bone-white-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001",
    "name": "Keep Granite With Rugged Bone White Fortress Block Edges And Deep Structural Stress Fractures, With An Iron Reinforced Stone Archway Frame Flush Against The Masonry 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-keep-granite-with-rugged-bone-white-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001/preview.webp",
    "browser": {
      "family": "Keep Granite",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "stone",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-keep-granite-with-rugged-bone-white-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-keep-granite-with-rugged-bone-white-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-keep-granite-with-rugged-bone-white-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-keep-granite-with-rugged-burnt-orange-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001",
    "name": "Keep Granite With Rugged Burnt Orange Fortress Block Edges And Deep Structural Stress Fractures, With An Iron Reinforced Stone Archway Frame Flush Against The Masonry 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-keep-granite-with-rugged-burnt-orange-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001/preview.webp",
    "browser": {
      "family": "Keep Granite",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "stone",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-keep-granite-with-rugged-burnt-orange-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-keep-granite-with-rugged-burnt-orange-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-keep-granite-with-rugged-burnt-orange-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-keep-granite-with-rugged-charcoal-black-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001",
    "name": "Keep Granite With Rugged Charcoal Black Fortress Block Edges And Deep Structural Stress Fractures, With An Iron Reinforced Stone Archway Frame Flush Against The Masonry 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-keep-granite-with-rugged-charcoal-black-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001/preview.webp",
    "browser": {
      "family": "Keep Granite",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "stone",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-keep-granite-with-rugged-charcoal-black-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-keep-granite-with-rugged-charcoal-black-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-keep-granite-with-rugged-charcoal-black-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-keep-granite-with-rugged-cobalt-blue-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001",
    "name": "Keep Granite With Rugged Cobalt Blue Fortress Block Edges And Deep Structural Stress Fractures, With An Iron Reinforced Stone Archway Frame Flush Against The Masonry 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-keep-granite-with-rugged-cobalt-blue-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001/preview.webp",
    "browser": {
      "family": "Keep Granite",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "stone",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-keep-granite-with-rugged-cobalt-blue-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-keep-granite-with-rugged-cobalt-blue-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-keep-granite-with-rugged-cobalt-blue-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-keep-granite-with-rugged-crimson-red-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001",
    "name": "Keep Granite With Rugged Crimson Red Fortress Block Edges And Deep Structural Stress Fractures, With An Iron Reinforced Stone Archway Frame Flush Against The Masonry 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-keep-granite-with-rugged-crimson-red-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001/preview.webp",
    "browser": {
      "family": "Keep Granite",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "stone",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-keep-granite-with-rugged-crimson-red-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-keep-granite-with-rugged-crimson-red-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-keep-granite-with-rugged-crimson-red-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-keep-granite-with-rugged-deep-violet-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001",
    "name": "Keep Granite With Rugged Deep Violet Fortress Block Edges And Deep Structural Stress Fractures, With An Iron Reinforced Stone Archway Frame Flush Against The Masonry 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-keep-granite-with-rugged-deep-violet-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001/preview.webp",
    "browser": {
      "family": "Keep Granite",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "stone",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-keep-granite-with-rugged-deep-violet-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-keep-granite-with-rugged-deep-violet-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-keep-granite-with-rugged-deep-violet-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-keep-granite-with-rugged-moss-green-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001",
    "name": "Keep Granite With Rugged Moss Green Fortress Block Edges And Deep Structural Stress Fractures, With An Iron Reinforced Stone Archway Frame Flush Against The Masonry 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-keep-granite-with-rugged-moss-green-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001/preview.webp",
    "browser": {
      "family": "Keep Granite",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "stone",
        "metal",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-keep-granite-with-rugged-moss-green-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-keep-granite-with-rugged-moss-green-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-keep-granite-with-rugged-moss-green-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-keep-granite-with-rugged-ochre-yellow-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001",
    "name": "Keep Granite With Rugged Ochre Yellow Fortress Block Edges And Deep Structural Stress Fractures, With An Iron Reinforced Stone Archway Frame Flush Against The Masonry 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-keep-granite-with-rugged-ochre-yellow-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001/preview.webp",
    "browser": {
      "family": "Keep Granite",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "stone",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-keep-granite-with-rugged-ochre-yellow-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-keep-granite-with-rugged-ochre-yellow-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-keep-granite-with-rugged-ochre-yellow-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-keep-granite-with-rugged-rust-brown-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001",
    "name": "Keep Granite With Rugged Rust Brown Fortress Block Edges And Deep Structural Stress Fractures, With An Iron Reinforced Stone Archway Frame Flush Against The Masonry 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-keep-granite-with-rugged-rust-brown-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001/preview.webp",
    "browser": {
      "family": "Keep Granite",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "stone",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-keep-granite-with-rugged-rust-brown-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-keep-granite-with-rugged-rust-brown-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-keep-granite-with-rugged-rust-brown-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-keep-granite-with-rugged-slate-grey-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001",
    "name": "Keep Granite With Rugged Slate Grey Fortress Block Edges And Deep Structural Stress Fractures, With An Iron Reinforced Stone Archway Frame Flush Against The Masonry 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-keep-granite-with-rugged-slate-grey-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001/preview.webp",
    "browser": {
      "family": "Keep Granite",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "stone",
        "metal"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-keep-granite-with-rugged-slate-grey-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-keep-granite-with-rugged-slate-grey-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-keep-granite-with-rugged-slate-grey-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-manor-wainscoting-with-raised-rectangular-bone-white-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001",
    "name": "Manor Wainscoting With Raised Rectangular Bone White Panels And Ornate Crown Molding Bevels, With A Heavy Dark Oak Chair Rail Dividing The Upper And Lower Sections 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-manor-wainscoting-with-raised-rectangular-bone-white-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001/preview.webp",
    "browser": {
      "family": "Manor Wainscoting",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "wood",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-manor-wainscoting-with-raised-rectangular-bone-white-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-manor-wainscoting-with-raised-rectangular-bone-white-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-manor-wainscoting-with-raised-rectangular-bone-white-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-manor-wainscoting-with-raised-rectangular-burnt-orange-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001",
    "name": "Manor Wainscoting With Raised Rectangular Burnt Orange Panels And Ornate Crown Molding Bevels, With A Heavy Dark Oak Chair Rail Dividing The Upper And Lower Sections 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-manor-wainscoting-with-raised-rectangular-burnt-orange-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001/preview.webp",
    "browser": {
      "family": "Manor Wainscoting",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "wood",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-manor-wainscoting-with-raised-rectangular-burnt-orange-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-manor-wainscoting-with-raised-rectangular-burnt-orange-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-manor-wainscoting-with-raised-rectangular-burnt-orange-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-manor-wainscoting-with-raised-rectangular-charcoal-black-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001",
    "name": "Manor Wainscoting With Raised Rectangular Charcoal Black Panels And Ornate Crown Molding Bevels, With A Heavy Dark Oak Chair Rail Dividing The Upper And Lower Sections 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-manor-wainscoting-with-raised-rectangular-charcoal-black-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001/preview.webp",
    "browser": {
      "family": "Manor Wainscoting",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "wood",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-manor-wainscoting-with-raised-rectangular-charcoal-black-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-manor-wainscoting-with-raised-rectangular-charcoal-black-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-manor-wainscoting-with-raised-rectangular-charcoal-black-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-manor-wainscoting-with-raised-rectangular-cobalt-blue-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001",
    "name": "Manor Wainscoting With Raised Rectangular Cobalt Blue Panels And Ornate Crown Molding Bevels, With A Heavy Dark Oak Chair Rail Dividing The Upper And Lower Sections 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-manor-wainscoting-with-raised-rectangular-cobalt-blue-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001/preview.webp",
    "browser": {
      "family": "Manor Wainscoting",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "wood",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-manor-wainscoting-with-raised-rectangular-cobalt-blue-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-manor-wainscoting-with-raised-rectangular-cobalt-blue-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-manor-wainscoting-with-raised-rectangular-cobalt-blue-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-manor-wainscoting-with-raised-rectangular-crimson-red-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001",
    "name": "Manor Wainscoting With Raised Rectangular Crimson Red Panels And Ornate Crown Molding Bevels, With A Heavy Dark Oak Chair Rail Dividing The Upper And Lower Sections 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-manor-wainscoting-with-raised-rectangular-crimson-red-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001/preview.webp",
    "browser": {
      "family": "Manor Wainscoting",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "wood",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-manor-wainscoting-with-raised-rectangular-crimson-red-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-manor-wainscoting-with-raised-rectangular-crimson-red-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-manor-wainscoting-with-raised-rectangular-crimson-red-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-manor-wainscoting-with-raised-rectangular-deep-violet-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001",
    "name": "Manor Wainscoting With Raised Rectangular Deep Violet Panels And Ornate Crown Molding Bevels, With A Heavy Dark Oak Chair Rail Dividing The Upper And Lower Sections 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-manor-wainscoting-with-raised-rectangular-deep-violet-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001/preview.webp",
    "browser": {
      "family": "Manor Wainscoting",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "wood",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-manor-wainscoting-with-raised-rectangular-deep-violet-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-manor-wainscoting-with-raised-rectangular-deep-violet-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-manor-wainscoting-with-raised-rectangular-deep-violet-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-manor-wainscoting-with-raised-rectangular-moss-green-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001",
    "name": "Manor Wainscoting With Raised Rectangular Moss Green Panels And Ornate Crown Molding Bevels, With A Heavy Dark Oak Chair Rail Dividing The Upper And Lower Sections 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-manor-wainscoting-with-raised-rectangular-moss-green-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001/preview.webp",
    "browser": {
      "family": "Manor Wainscoting",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "wood",
        "organic",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-manor-wainscoting-with-raised-rectangular-moss-green-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-manor-wainscoting-with-raised-rectangular-moss-green-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-manor-wainscoting-with-raised-rectangular-moss-green-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-manor-wainscoting-with-raised-rectangular-ochre-yellow-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001",
    "name": "Manor Wainscoting With Raised Rectangular Ochre Yellow Panels And Ornate Crown Molding Bevels, With A Heavy Dark Oak Chair Rail Dividing The Upper And Lower Sections 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-manor-wainscoting-with-raised-rectangular-ochre-yellow-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001/preview.webp",
    "browser": {
      "family": "Manor Wainscoting",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "wood",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-manor-wainscoting-with-raised-rectangular-ochre-yellow-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-manor-wainscoting-with-raised-rectangular-ochre-yellow-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-manor-wainscoting-with-raised-rectangular-ochre-yellow-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-manor-wainscoting-with-raised-rectangular-rust-brown-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001",
    "name": "Manor Wainscoting With Raised Rectangular Rust Brown Panels And Ornate Crown Molding Bevels, With A Heavy Dark Oak Chair Rail Dividing The Upper And Lower Sections 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-manor-wainscoting-with-raised-rectangular-rust-brown-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001/preview.webp",
    "browser": {
      "family": "Manor Wainscoting",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "wood",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-manor-wainscoting-with-raised-rectangular-rust-brown-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-manor-wainscoting-with-raised-rectangular-rust-brown-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-manor-wainscoting-with-raised-rectangular-rust-brown-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-manor-wainscoting-with-raised-rectangular-slate-grey-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001",
    "name": "Manor Wainscoting With Raised Rectangular Slate Grey Panels And Ornate Crown Molding Bevels, With A Heavy Dark Oak Chair Rail Dividing The Upper And Lower Sections 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-manor-wainscoting-with-raised-rectangular-slate-grey-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001/preview.webp",
    "browser": {
      "family": "Manor Wainscoting",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "wood",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-manor-wainscoting-with-raised-rectangular-slate-grey-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-manor-wainscoting-with-raised-rectangular-slate-grey-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-manor-wainscoting-with-raised-rectangular-slate-grey-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-myconid-fungal-with-layered-porous-bone-white-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001",
    "name": "Myconid Fungal With Layered Porous Bone White Shelf Mushrooms And Thick Raised Mycelium Veins, With A Thick Petrified Root System Weaving Vertically Through The Stone 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-myconid-fungal-with-layered-porous-bone-white-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001/preview.webp",
    "browser": {
      "family": "Myconid Fungal",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "stone",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-myconid-fungal-with-layered-porous-bone-white-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-myconid-fungal-with-layered-porous-bone-white-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-myconid-fungal-with-layered-porous-bone-white-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-myconid-fungal-with-layered-porous-burnt-orange-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001",
    "name": "Myconid Fungal With Layered Porous Burnt Orange Shelf Mushrooms And Thick Raised Mycelium Veins, With A Thick Petrified Root System Weaving Vertically Through The Stone 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-myconid-fungal-with-layered-porous-burnt-orange-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001/preview.webp",
    "browser": {
      "family": "Myconid Fungal",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "stone",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-myconid-fungal-with-layered-porous-burnt-orange-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-myconid-fungal-with-layered-porous-burnt-orange-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-myconid-fungal-with-layered-porous-burnt-orange-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-myconid-fungal-with-layered-porous-charcoal-black-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001",
    "name": "Myconid Fungal With Layered Porous Charcoal Black Shelf Mushrooms And Thick Raised Mycelium Veins, With A Thick Petrified Root System Weaving Vertically Through The Stone 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-myconid-fungal-with-layered-porous-charcoal-black-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001/preview.webp",
    "browser": {
      "family": "Myconid Fungal",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "stone",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-myconid-fungal-with-layered-porous-charcoal-black-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-myconid-fungal-with-layered-porous-charcoal-black-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-myconid-fungal-with-layered-porous-charcoal-black-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-myconid-fungal-with-layered-porous-cobalt-blue-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001",
    "name": "Myconid Fungal With Layered Porous Cobalt Blue Shelf Mushrooms And Thick Raised Mycelium Veins, With A Thick Petrified Root System Weaving Vertically Through The Stone 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-myconid-fungal-with-layered-porous-cobalt-blue-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001/preview.webp",
    "browser": {
      "family": "Myconid Fungal",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "stone",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-myconid-fungal-with-layered-porous-cobalt-blue-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-myconid-fungal-with-layered-porous-cobalt-blue-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-myconid-fungal-with-layered-porous-cobalt-blue-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-myconid-fungal-with-layered-porous-crimson-red-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001",
    "name": "Myconid Fungal With Layered Porous Crimson Red Shelf Mushrooms And Thick Raised Mycelium Veins, With A Thick Petrified Root System Weaving Vertically Through The Stone 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-myconid-fungal-with-layered-porous-crimson-red-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001/preview.webp",
    "browser": {
      "family": "Myconid Fungal",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "stone",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-myconid-fungal-with-layered-porous-crimson-red-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-myconid-fungal-with-layered-porous-crimson-red-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-myconid-fungal-with-layered-porous-crimson-red-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-myconid-fungal-with-layered-porous-deep-violet-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001",
    "name": "Myconid Fungal With Layered Porous Deep Violet Shelf Mushrooms And Thick Raised Mycelium Veins, With A Thick Petrified Root System Weaving Vertically Through The Stone 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-myconid-fungal-with-layered-porous-deep-violet-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001/preview.webp",
    "browser": {
      "family": "Myconid Fungal",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "stone",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-myconid-fungal-with-layered-porous-deep-violet-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-myconid-fungal-with-layered-porous-deep-violet-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-myconid-fungal-with-layered-porous-deep-violet-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-myconid-fungal-with-layered-porous-moss-green-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001",
    "name": "Myconid Fungal With Layered Porous Moss Green Shelf Mushrooms And Thick Raised Mycelium Veins, With A Thick Petrified Root System Weaving Vertically Through The Stone 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-myconid-fungal-with-layered-porous-moss-green-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001/preview.webp",
    "browser": {
      "family": "Myconid Fungal",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "stone",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-myconid-fungal-with-layered-porous-moss-green-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-myconid-fungal-with-layered-porous-moss-green-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-myconid-fungal-with-layered-porous-moss-green-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-myconid-fungal-with-layered-porous-ochre-yellow-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001",
    "name": "Myconid Fungal With Layered Porous Ochre Yellow Shelf Mushrooms And Thick Raised Mycelium Veins, With A Thick Petrified Root System Weaving Vertically Through The Stone 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-myconid-fungal-with-layered-porous-ochre-yellow-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001/preview.webp",
    "browser": {
      "family": "Myconid Fungal",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "stone",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-myconid-fungal-with-layered-porous-ochre-yellow-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-myconid-fungal-with-layered-porous-ochre-yellow-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-myconid-fungal-with-layered-porous-ochre-yellow-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-myconid-fungal-with-layered-porous-rust-brown-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001",
    "name": "Myconid Fungal With Layered Porous Rust Brown Shelf Mushrooms And Thick Raised Mycelium Veins, With A Thick Petrified Root System Weaving Vertically Through The Stone 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-myconid-fungal-with-layered-porous-rust-brown-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001/preview.webp",
    "browser": {
      "family": "Myconid Fungal",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "stone",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-myconid-fungal-with-layered-porous-rust-brown-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-myconid-fungal-with-layered-porous-rust-brown-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-myconid-fungal-with-layered-porous-rust-brown-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-myconid-fungal-with-layered-porous-slate-grey-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001",
    "name": "Myconid Fungal With Layered Porous Slate Grey Shelf Mushrooms And Thick Raised Mycelium Veins, With A Thick Petrified Root System Weaving Vertically Through The Stone 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-myconid-fungal-with-layered-porous-slate-grey-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001/preview.webp",
    "browser": {
      "family": "Myconid Fungal",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "stone",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-myconid-fungal-with-layered-porous-slate-grey-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-myconid-fungal-with-layered-porous-slate-grey-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-myconid-fungal-with-layered-porous-slate-grey-shelf-mushrooms-and-thick-raised-mycelium-veins-with-a-thick-petrified-root-system-weaving-vertically-through-the-stone-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-noble-wallpaper-with-recessed-bone-white-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001",
    "name": "Noble Wallpaper With Recessed Bone White Damask Fabric Patterns And Thin Raised Trim Stripes, With Dark Polished Wooden Paneling Covering The Lower Third 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-noble-wallpaper-with-recessed-bone-white-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001/preview.webp",
    "browser": {
      "family": "Noble Wallpaper",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "plaster",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-noble-wallpaper-with-recessed-bone-white-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-noble-wallpaper-with-recessed-bone-white-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-noble-wallpaper-with-recessed-bone-white-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-noble-wallpaper-with-recessed-burnt-orange-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001",
    "name": "Noble Wallpaper With Recessed Burnt Orange Damask Fabric Patterns And Thin Raised Trim Stripes, With Dark Polished Wooden Paneling Covering The Lower Third 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-noble-wallpaper-with-recessed-burnt-orange-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001/preview.webp",
    "browser": {
      "family": "Noble Wallpaper",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "plaster",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-noble-wallpaper-with-recessed-burnt-orange-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-noble-wallpaper-with-recessed-burnt-orange-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-noble-wallpaper-with-recessed-burnt-orange-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-noble-wallpaper-with-recessed-charcoal-black-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001",
    "name": "Noble Wallpaper With Recessed Charcoal Black Damask Fabric Patterns And Thin Raised Trim Stripes, With Dark Polished Wooden Paneling Covering The Lower Third 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-noble-wallpaper-with-recessed-charcoal-black-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001/preview.webp",
    "browser": {
      "family": "Noble Wallpaper",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "plaster",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-noble-wallpaper-with-recessed-charcoal-black-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-noble-wallpaper-with-recessed-charcoal-black-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-noble-wallpaper-with-recessed-charcoal-black-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-noble-wallpaper-with-recessed-cobalt-blue-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001",
    "name": "Noble Wallpaper With Recessed Cobalt Blue Damask Fabric Patterns And Thin Raised Trim Stripes, With Dark Polished Wooden Paneling Covering The Lower Third 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-noble-wallpaper-with-recessed-cobalt-blue-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001/preview.webp",
    "browser": {
      "family": "Noble Wallpaper",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "plaster",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-noble-wallpaper-with-recessed-cobalt-blue-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-noble-wallpaper-with-recessed-cobalt-blue-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-noble-wallpaper-with-recessed-cobalt-blue-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-noble-wallpaper-with-recessed-crimson-red-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001",
    "name": "Noble Wallpaper With Recessed Crimson Red Damask Fabric Patterns And Thin Raised Trim Stripes, With Dark Polished Wooden Paneling Covering The Lower Third 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-noble-wallpaper-with-recessed-crimson-red-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001/preview.webp",
    "browser": {
      "family": "Noble Wallpaper",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "plaster",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-noble-wallpaper-with-recessed-crimson-red-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-noble-wallpaper-with-recessed-crimson-red-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-noble-wallpaper-with-recessed-crimson-red-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-noble-wallpaper-with-recessed-deep-violet-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001",
    "name": "Noble Wallpaper With Recessed Deep Violet Damask Fabric Patterns And Thin Raised Trim Stripes, With Dark Polished Wooden Paneling Covering The Lower Third 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-noble-wallpaper-with-recessed-deep-violet-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001/preview.webp",
    "browser": {
      "family": "Noble Wallpaper",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "plaster",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-noble-wallpaper-with-recessed-deep-violet-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-noble-wallpaper-with-recessed-deep-violet-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-noble-wallpaper-with-recessed-deep-violet-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-noble-wallpaper-with-recessed-moss-green-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001",
    "name": "Noble Wallpaper With Recessed Moss Green Damask Fabric Patterns And Thin Raised Trim Stripes, With Dark Polished Wooden Paneling Covering The Lower Third 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-noble-wallpaper-with-recessed-moss-green-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001/preview.webp",
    "browser": {
      "family": "Noble Wallpaper",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "plaster",
        "organic",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-noble-wallpaper-with-recessed-moss-green-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-noble-wallpaper-with-recessed-moss-green-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-noble-wallpaper-with-recessed-moss-green-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-noble-wallpaper-with-recessed-ochre-yellow-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001",
    "name": "Noble Wallpaper With Recessed Ochre Yellow Damask Fabric Patterns And Thin Raised Trim Stripes, With Dark Polished Wooden Paneling Covering The Lower Third 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-noble-wallpaper-with-recessed-ochre-yellow-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001/preview.webp",
    "browser": {
      "family": "Noble Wallpaper",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "plaster",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-noble-wallpaper-with-recessed-ochre-yellow-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-noble-wallpaper-with-recessed-ochre-yellow-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-noble-wallpaper-with-recessed-ochre-yellow-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-noble-wallpaper-with-recessed-rust-brown-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001",
    "name": "Noble Wallpaper With Recessed Rust Brown Damask Fabric Patterns And Thin Raised Trim Stripes, With Dark Polished Wooden Paneling Covering The Lower Third 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-noble-wallpaper-with-recessed-rust-brown-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001/preview.webp",
    "browser": {
      "family": "Noble Wallpaper",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "plaster",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-noble-wallpaper-with-recessed-rust-brown-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-noble-wallpaper-with-recessed-rust-brown-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-noble-wallpaper-with-recessed-rust-brown-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-noble-wallpaper-with-recessed-slate-grey-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001",
    "name": "Noble Wallpaper With Recessed Slate Grey Damask Fabric Patterns And Thin Raised Trim Stripes, With Dark Polished Wooden Paneling Covering The Lower Third 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-noble-wallpaper-with-recessed-slate-grey-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001/preview.webp",
    "browser": {
      "family": "Noble Wallpaper",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "plaster",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-noble-wallpaper-with-recessed-slate-grey-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-noble-wallpaper-with-recessed-slate-grey-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-noble-wallpaper-with-recessed-slate-grey-damask-fabric-patterns-and-thin-raised-trim-stripes-with-dark-polished-wooden-paneling-covering-the-lower-third-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-bone-white-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001",
    "name": "Ossuary Catacomb With Crumbling Brickwork Framework And Embedded Stylized Bone White Skull Shapes, With A Low Hanging Brick Archway Integrated Into The Upper Tile Edge 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-bone-white-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001/preview.webp",
    "browser": {
      "family": "Ossuary Catacomb",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "ruined",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-bone-white-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-bone-white-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-bone-white-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-burnt-orange-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001",
    "name": "Ossuary Catacomb With Crumbling Brickwork Framework And Embedded Stylized Burnt Orange Skull Shapes, With A Low Hanging Brick Archway Integrated Into The Upper Tile Edge 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-burnt-orange-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001/preview.webp",
    "browser": {
      "family": "Ossuary Catacomb",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "ruined",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-burnt-orange-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-burnt-orange-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-burnt-orange-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-charcoal-black-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001",
    "name": "Ossuary Catacomb With Crumbling Brickwork Framework And Embedded Stylized Charcoal Black Skull Shapes, With A Low Hanging Brick Archway Integrated Into The Upper Tile Edge 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-charcoal-black-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001/preview.webp",
    "browser": {
      "family": "Ossuary Catacomb",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "ruined",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-charcoal-black-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-charcoal-black-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-charcoal-black-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-cobalt-blue-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001",
    "name": "Ossuary Catacomb With Crumbling Brickwork Framework And Embedded Stylized Cobalt Blue Skull Shapes, With A Low Hanging Brick Archway Integrated Into The Upper Tile Edge 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-cobalt-blue-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001/preview.webp",
    "browser": {
      "family": "Ossuary Catacomb",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "ruined",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-cobalt-blue-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-cobalt-blue-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-cobalt-blue-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-crimson-red-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001",
    "name": "Ossuary Catacomb With Crumbling Brickwork Framework And Embedded Stylized Crimson Red Skull Shapes, With A Low Hanging Brick Archway Integrated Into The Upper Tile Edge 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-crimson-red-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001/preview.webp",
    "browser": {
      "family": "Ossuary Catacomb",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "ruined",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-crimson-red-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-crimson-red-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-crimson-red-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-deep-violet-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001",
    "name": "Ossuary Catacomb With Crumbling Brickwork Framework And Embedded Stylized Deep Violet Skull Shapes, With A Low Hanging Brick Archway Integrated Into The Upper Tile Edge 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-deep-violet-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001/preview.webp",
    "browser": {
      "family": "Ossuary Catacomb",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "ruined",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-deep-violet-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-deep-violet-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-deep-violet-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-moss-green-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001",
    "name": "Ossuary Catacomb With Crumbling Brickwork Framework And Embedded Stylized Moss Green Skull Shapes, With A Low Hanging Brick Archway Integrated Into The Upper Tile Edge 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-moss-green-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001/preview.webp",
    "browser": {
      "family": "Ossuary Catacomb",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "organic",
        "ruined",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-moss-green-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-moss-green-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-moss-green-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-ochre-yellow-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001",
    "name": "Ossuary Catacomb With Crumbling Brickwork Framework And Embedded Stylized Ochre Yellow Skull Shapes, With A Low Hanging Brick Archway Integrated Into The Upper Tile Edge 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-ochre-yellow-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001/preview.webp",
    "browser": {
      "family": "Ossuary Catacomb",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "ruined",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-ochre-yellow-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-ochre-yellow-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-ochre-yellow-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-rust-brown-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001",
    "name": "Ossuary Catacomb With Crumbling Brickwork Framework And Embedded Stylized Rust Brown Skull Shapes, With A Low Hanging Brick Archway Integrated Into The Upper Tile Edge 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-rust-brown-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001/preview.webp",
    "browser": {
      "family": "Ossuary Catacomb",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "ruined",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-rust-brown-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-rust-brown-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-rust-brown-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-slate-grey-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001",
    "name": "Ossuary Catacomb With Crumbling Brickwork Framework And Embedded Stylized Slate Grey Skull Shapes, With A Low Hanging Brick Archway Integrated Into The Upper Tile Edge 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-slate-grey-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001/preview.webp",
    "browser": {
      "family": "Ossuary Catacomb",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "ruined",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-slate-grey-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-slate-grey-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ossuary-catacomb-with-crumbling-brickwork-framework-and-embedded-stylized-slate-grey-skull-shapes-with-a-low-hanging-brick-archway-integrated-into-the-upper-tile-edge-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-bone-white-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001",
    "name": "Palace Marble With Polished Decorative Relief Borders And Intricate Bone White Hieroglyph Patterns, With A Flat Marble Pilaster Flanking The Side Of The Texture 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-bone-white-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001/preview.webp",
    "browser": {
      "family": "Palace Marble",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "stone",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-bone-white-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-bone-white-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-bone-white-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-burnt-orange-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001",
    "name": "Palace Marble With Polished Decorative Relief Borders And Intricate Burnt Orange Hieroglyph Patterns, With A Flat Marble Pilaster Flanking The Side Of The Texture 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-burnt-orange-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001/preview.webp",
    "browser": {
      "family": "Palace Marble",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "stone",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-burnt-orange-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-burnt-orange-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-burnt-orange-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-charcoal-black-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001",
    "name": "Palace Marble With Polished Decorative Relief Borders And Intricate Charcoal Black Hieroglyph Patterns, With A Flat Marble Pilaster Flanking The Side Of The Texture 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-charcoal-black-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001/preview.webp",
    "browser": {
      "family": "Palace Marble",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "stone",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-charcoal-black-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-charcoal-black-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-charcoal-black-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-cobalt-blue-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001",
    "name": "Palace Marble With Polished Decorative Relief Borders And Intricate Cobalt Blue Hieroglyph Patterns, With A Flat Marble Pilaster Flanking The Side Of The Texture 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-cobalt-blue-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001/preview.webp",
    "browser": {
      "family": "Palace Marble",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "stone",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-cobalt-blue-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-cobalt-blue-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-cobalt-blue-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-crimson-red-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001",
    "name": "Palace Marble With Polished Decorative Relief Borders And Intricate Crimson Red Hieroglyph Patterns, With A Flat Marble Pilaster Flanking The Side Of The Texture 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-crimson-red-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001/preview.webp",
    "browser": {
      "family": "Palace Marble",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "stone",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-crimson-red-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-crimson-red-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-crimson-red-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-deep-violet-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001",
    "name": "Palace Marble With Polished Decorative Relief Borders And Intricate Deep Violet Hieroglyph Patterns, With A Flat Marble Pilaster Flanking The Side Of The Texture 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-deep-violet-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001/preview.webp",
    "browser": {
      "family": "Palace Marble",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "stone",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-deep-violet-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-deep-violet-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-deep-violet-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-moss-green-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001",
    "name": "Palace Marble With Polished Decorative Relief Borders And Intricate Moss Green Hieroglyph Patterns, With A Flat Marble Pilaster Flanking The Side Of The Texture 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-moss-green-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001/preview.webp",
    "browser": {
      "family": "Palace Marble",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "stone",
        "organic",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-moss-green-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-moss-green-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-moss-green-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-ochre-yellow-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001",
    "name": "Palace Marble With Polished Decorative Relief Borders And Intricate Ochre Yellow Hieroglyph Patterns, With A Flat Marble Pilaster Flanking The Side Of The Texture 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-ochre-yellow-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001/preview.webp",
    "browser": {
      "family": "Palace Marble",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "stone",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-ochre-yellow-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-ochre-yellow-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-ochre-yellow-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-rust-brown-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001",
    "name": "Palace Marble With Polished Decorative Relief Borders And Intricate Rust Brown Hieroglyph Patterns, With A Flat Marble Pilaster Flanking The Side Of The Texture 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-rust-brown-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001/preview.webp",
    "browser": {
      "family": "Palace Marble",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "stone",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-rust-brown-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-rust-brown-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-rust-brown-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-slate-grey-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001",
    "name": "Palace Marble With Polished Decorative Relief Borders And Intricate Slate Grey Hieroglyph Patterns, With A Flat Marble Pilaster Flanking The Side Of The Texture 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-slate-grey-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001/preview.webp",
    "browser": {
      "family": "Palace Marble",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "stone",
        "noble"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-slate-grey-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-slate-grey-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-slate-grey-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-ruined-sandstone-with-eroded-bone-white-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001",
    "name": "Ruined Sandstone With Eroded Bone White Sandstone Layers And Defaced Ancient Glyph Reliefs, With A Crumbling Stone Lintel Casting A Soft Shadow Near The Top 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-ruined-sandstone-with-eroded-bone-white-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001/preview.webp",
    "browser": {
      "family": "Ruined Sandstone",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-ruined-sandstone-with-eroded-bone-white-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ruined-sandstone-with-eroded-bone-white-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ruined-sandstone-with-eroded-bone-white-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-ruined-sandstone-with-eroded-burnt-orange-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001",
    "name": "Ruined Sandstone With Eroded Burnt Orange Sandstone Layers And Defaced Ancient Glyph Reliefs, With A Crumbling Stone Lintel Casting A Soft Shadow Near The Top 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-ruined-sandstone-with-eroded-burnt-orange-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001/preview.webp",
    "browser": {
      "family": "Ruined Sandstone",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-ruined-sandstone-with-eroded-burnt-orange-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ruined-sandstone-with-eroded-burnt-orange-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ruined-sandstone-with-eroded-burnt-orange-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-ruined-sandstone-with-eroded-charcoal-black-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001",
    "name": "Ruined Sandstone With Eroded Charcoal Black Sandstone Layers And Defaced Ancient Glyph Reliefs, With A Crumbling Stone Lintel Casting A Soft Shadow Near The Top 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-ruined-sandstone-with-eroded-charcoal-black-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001/preview.webp",
    "browser": {
      "family": "Ruined Sandstone",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-ruined-sandstone-with-eroded-charcoal-black-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ruined-sandstone-with-eroded-charcoal-black-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ruined-sandstone-with-eroded-charcoal-black-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-ruined-sandstone-with-eroded-cobalt-blue-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001",
    "name": "Ruined Sandstone With Eroded Cobalt Blue Sandstone Layers And Defaced Ancient Glyph Reliefs, With A Crumbling Stone Lintel Casting A Soft Shadow Near The Top 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-ruined-sandstone-with-eroded-cobalt-blue-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001/preview.webp",
    "browser": {
      "family": "Ruined Sandstone",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-ruined-sandstone-with-eroded-cobalt-blue-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ruined-sandstone-with-eroded-cobalt-blue-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ruined-sandstone-with-eroded-cobalt-blue-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-ruined-sandstone-with-eroded-crimson-red-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001",
    "name": "Ruined Sandstone With Eroded Crimson Red Sandstone Layers And Defaced Ancient Glyph Reliefs, With A Crumbling Stone Lintel Casting A Soft Shadow Near The Top 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-ruined-sandstone-with-eroded-crimson-red-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001/preview.webp",
    "browser": {
      "family": "Ruined Sandstone",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-ruined-sandstone-with-eroded-crimson-red-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ruined-sandstone-with-eroded-crimson-red-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ruined-sandstone-with-eroded-crimson-red-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-ruined-sandstone-with-eroded-deep-violet-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001",
    "name": "Ruined Sandstone With Eroded Deep Violet Sandstone Layers And Defaced Ancient Glyph Reliefs, With A Crumbling Stone Lintel Casting A Soft Shadow Near The Top 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-ruined-sandstone-with-eroded-deep-violet-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001/preview.webp",
    "browser": {
      "family": "Ruined Sandstone",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-ruined-sandstone-with-eroded-deep-violet-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ruined-sandstone-with-eroded-deep-violet-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ruined-sandstone-with-eroded-deep-violet-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-ruined-sandstone-with-eroded-moss-green-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001",
    "name": "Ruined Sandstone With Eroded Moss Green Sandstone Layers And Defaced Ancient Glyph Reliefs, With A Crumbling Stone Lintel Casting A Soft Shadow Near The Top 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-ruined-sandstone-with-eroded-moss-green-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001/preview.webp",
    "browser": {
      "family": "Ruined Sandstone",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "stone",
        "organic",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-ruined-sandstone-with-eroded-moss-green-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ruined-sandstone-with-eroded-moss-green-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ruined-sandstone-with-eroded-moss-green-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-ruined-sandstone-with-eroded-ochre-yellow-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001",
    "name": "Ruined Sandstone With Eroded Ochre Yellow Sandstone Layers And Defaced Ancient Glyph Reliefs, With A Crumbling Stone Lintel Casting A Soft Shadow Near The Top 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-ruined-sandstone-with-eroded-ochre-yellow-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001/preview.webp",
    "browser": {
      "family": "Ruined Sandstone",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-ruined-sandstone-with-eroded-ochre-yellow-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ruined-sandstone-with-eroded-ochre-yellow-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ruined-sandstone-with-eroded-ochre-yellow-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-ruined-sandstone-with-eroded-rust-brown-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001",
    "name": "Ruined Sandstone With Eroded Rust Brown Sandstone Layers And Defaced Ancient Glyph Reliefs, With A Crumbling Stone Lintel Casting A Soft Shadow Near The Top 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-ruined-sandstone-with-eroded-rust-brown-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001/preview.webp",
    "browser": {
      "family": "Ruined Sandstone",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-ruined-sandstone-with-eroded-rust-brown-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ruined-sandstone-with-eroded-rust-brown-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ruined-sandstone-with-eroded-rust-brown-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-ruined-sandstone-with-eroded-slate-grey-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001",
    "name": "Ruined Sandstone With Eroded Slate Grey Sandstone Layers And Defaced Ancient Glyph Reliefs, With A Crumbling Stone Lintel Casting A Soft Shadow Near The Top 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-ruined-sandstone-with-eroded-slate-grey-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001/preview.webp",
    "browser": {
      "family": "Ruined Sandstone",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-ruined-sandstone-with-eroded-slate-grey-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ruined-sandstone-with-eroded-slate-grey-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-ruined-sandstone-with-eroded-slate-grey-sandstone-layers-and-defaced-ancient-glyph-reliefs-with-a-crumbling-stone-lintel-casting-a-soft-shadow-near-the-top-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-sunken-eroded-with-water-carved-bone-white-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001",
    "name": "Sunken Eroded With Water Carved Bone White Limestone Fluting And Smooth Wavy Friction Channels, With A Smooth Water Worn Stone Shelf Protruding Slightly From The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-sunken-eroded-with-water-carved-bone-white-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001/preview.webp",
    "browser": {
      "family": "Sunken Eroded",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-sunken-eroded-with-water-carved-bone-white-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-sunken-eroded-with-water-carved-bone-white-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-sunken-eroded-with-water-carved-bone-white-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-sunken-eroded-with-water-carved-burnt-orange-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001",
    "name": "Sunken Eroded With Water Carved Burnt Orange Limestone Fluting And Smooth Wavy Friction Channels, With A Smooth Water Worn Stone Shelf Protruding Slightly From The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-sunken-eroded-with-water-carved-burnt-orange-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001/preview.webp",
    "browser": {
      "family": "Sunken Eroded",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-sunken-eroded-with-water-carved-burnt-orange-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-sunken-eroded-with-water-carved-burnt-orange-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-sunken-eroded-with-water-carved-burnt-orange-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-sunken-eroded-with-water-carved-charcoal-black-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001",
    "name": "Sunken Eroded With Water Carved Charcoal Black Limestone Fluting And Smooth Wavy Friction Channels, With A Smooth Water Worn Stone Shelf Protruding Slightly From The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-sunken-eroded-with-water-carved-charcoal-black-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001/preview.webp",
    "browser": {
      "family": "Sunken Eroded",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-sunken-eroded-with-water-carved-charcoal-black-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-sunken-eroded-with-water-carved-charcoal-black-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-sunken-eroded-with-water-carved-charcoal-black-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-sunken-eroded-with-water-carved-cobalt-blue-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001",
    "name": "Sunken Eroded With Water Carved Cobalt Blue Limestone Fluting And Smooth Wavy Friction Channels, With A Smooth Water Worn Stone Shelf Protruding Slightly From The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-sunken-eroded-with-water-carved-cobalt-blue-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001/preview.webp",
    "browser": {
      "family": "Sunken Eroded",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-sunken-eroded-with-water-carved-cobalt-blue-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-sunken-eroded-with-water-carved-cobalt-blue-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-sunken-eroded-with-water-carved-cobalt-blue-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-sunken-eroded-with-water-carved-crimson-red-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001",
    "name": "Sunken Eroded With Water Carved Crimson Red Limestone Fluting And Smooth Wavy Friction Channels, With A Smooth Water Worn Stone Shelf Protruding Slightly From The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-sunken-eroded-with-water-carved-crimson-red-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001/preview.webp",
    "browser": {
      "family": "Sunken Eroded",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-sunken-eroded-with-water-carved-crimson-red-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-sunken-eroded-with-water-carved-crimson-red-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-sunken-eroded-with-water-carved-crimson-red-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-sunken-eroded-with-water-carved-deep-violet-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001",
    "name": "Sunken Eroded With Water Carved Deep Violet Limestone Fluting And Smooth Wavy Friction Channels, With A Smooth Water Worn Stone Shelf Protruding Slightly From The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-sunken-eroded-with-water-carved-deep-violet-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001/preview.webp",
    "browser": {
      "family": "Sunken Eroded",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-sunken-eroded-with-water-carved-deep-violet-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-sunken-eroded-with-water-carved-deep-violet-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-sunken-eroded-with-water-carved-deep-violet-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-sunken-eroded-with-water-carved-moss-green-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001",
    "name": "Sunken Eroded With Water Carved Moss Green Limestone Fluting And Smooth Wavy Friction Channels, With A Smooth Water Worn Stone Shelf Protruding Slightly From The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-sunken-eroded-with-water-carved-moss-green-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001/preview.webp",
    "browser": {
      "family": "Sunken Eroded",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "stone",
        "organic",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-sunken-eroded-with-water-carved-moss-green-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-sunken-eroded-with-water-carved-moss-green-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-sunken-eroded-with-water-carved-moss-green-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-sunken-eroded-with-water-carved-ochre-yellow-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001",
    "name": "Sunken Eroded With Water Carved Ochre Yellow Limestone Fluting And Smooth Wavy Friction Channels, With A Smooth Water Worn Stone Shelf Protruding Slightly From The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-sunken-eroded-with-water-carved-ochre-yellow-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001/preview.webp",
    "browser": {
      "family": "Sunken Eroded",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-sunken-eroded-with-water-carved-ochre-yellow-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-sunken-eroded-with-water-carved-ochre-yellow-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-sunken-eroded-with-water-carved-ochre-yellow-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-sunken-eroded-with-water-carved-rust-brown-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001",
    "name": "Sunken Eroded With Water Carved Rust Brown Limestone Fluting And Smooth Wavy Friction Channels, With A Smooth Water Worn Stone Shelf Protruding Slightly From The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-sunken-eroded-with-water-carved-rust-brown-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001/preview.webp",
    "browser": {
      "family": "Sunken Eroded",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-sunken-eroded-with-water-carved-rust-brown-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-sunken-eroded-with-water-carved-rust-brown-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-sunken-eroded-with-water-carved-rust-brown-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-sunken-eroded-with-water-carved-slate-grey-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001",
    "name": "Sunken Eroded With Water Carved Slate Grey Limestone Fluting And Smooth Wavy Friction Channels, With A Smooth Water Worn Stone Shelf Protruding Slightly From The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-sunken-eroded-with-water-carved-slate-grey-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001/preview.webp",
    "browser": {
      "family": "Sunken Eroded",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-sunken-eroded-with-water-carved-slate-grey-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-sunken-eroded-with-water-carved-slate-grey-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-sunken-eroded-with-water-carved-slate-grey-limestone-fluting-and-smooth-wavy-friction-channels-with-a-smooth-water-worn-stone-shelf-protruding-slightly-from-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-bone-white-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001",
    "name": "Swamp Mossy With Rotting Vertical Plank Grooves And Thick Spongy Bone White Moss Blankets, With A Rotten Vertical Support Beam Barely Holding Together 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-bone-white-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001/preview.webp",
    "browser": {
      "family": "Swamp Mossy",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "wood",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-bone-white-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-bone-white-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-bone-white-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-burnt-orange-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001",
    "name": "Swamp Mossy With Rotting Vertical Plank Grooves And Thick Spongy Burnt Orange Moss Blankets, With A Rotten Vertical Support Beam Barely Holding Together 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-burnt-orange-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001/preview.webp",
    "browser": {
      "family": "Swamp Mossy",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "wood",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-burnt-orange-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-burnt-orange-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-burnt-orange-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-charcoal-black-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001",
    "name": "Swamp Mossy With Rotting Vertical Plank Grooves And Thick Spongy Charcoal Black Moss Blankets, With A Rotten Vertical Support Beam Barely Holding Together 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-charcoal-black-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001/preview.webp",
    "browser": {
      "family": "Swamp Mossy",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "wood",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-charcoal-black-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-charcoal-black-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-charcoal-black-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-cobalt-blue-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001",
    "name": "Swamp Mossy With Rotting Vertical Plank Grooves And Thick Spongy Cobalt Blue Moss Blankets, With A Rotten Vertical Support Beam Barely Holding Together 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-cobalt-blue-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001/preview.webp",
    "browser": {
      "family": "Swamp Mossy",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "wood",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-cobalt-blue-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-cobalt-blue-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-cobalt-blue-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-crimson-red-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001",
    "name": "Swamp Mossy With Rotting Vertical Plank Grooves And Thick Spongy Crimson Red Moss Blankets, With A Rotten Vertical Support Beam Barely Holding Together 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-crimson-red-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001/preview.webp",
    "browser": {
      "family": "Swamp Mossy",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "wood",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-crimson-red-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-crimson-red-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-crimson-red-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-deep-violet-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001",
    "name": "Swamp Mossy With Rotting Vertical Plank Grooves And Thick Spongy Deep Violet Moss Blankets, With A Rotten Vertical Support Beam Barely Holding Together 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-deep-violet-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001/preview.webp",
    "browser": {
      "family": "Swamp Mossy",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "wood",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-deep-violet-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-deep-violet-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-deep-violet-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-moss-green-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001",
    "name": "Swamp Mossy With Rotting Vertical Plank Grooves And Thick Spongy Moss Green Moss Blankets, With A Rotten Vertical Support Beam Barely Holding Together 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-moss-green-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001/preview.webp",
    "browser": {
      "family": "Swamp Mossy",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "wood",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-moss-green-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-moss-green-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-moss-green-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-ochre-yellow-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001",
    "name": "Swamp Mossy With Rotting Vertical Plank Grooves And Thick Spongy Ochre Yellow Moss Blankets, With A Rotten Vertical Support Beam Barely Holding Together 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-ochre-yellow-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001/preview.webp",
    "browser": {
      "family": "Swamp Mossy",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "wood",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-ochre-yellow-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-ochre-yellow-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-ochre-yellow-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-rust-brown-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001",
    "name": "Swamp Mossy With Rotting Vertical Plank Grooves And Thick Spongy Rust Brown Moss Blankets, With A Rotten Vertical Support Beam Barely Holding Together 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-rust-brown-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001/preview.webp",
    "browser": {
      "family": "Swamp Mossy",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "wood",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-rust-brown-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-rust-brown-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-rust-brown-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-slate-grey-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001",
    "name": "Swamp Mossy With Rotting Vertical Plank Grooves And Thick Spongy Slate Grey Moss Blankets, With A Rotten Vertical Support Beam Barely Holding Together 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-slate-grey-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001/preview.webp",
    "browser": {
      "family": "Swamp Mossy",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "wood",
        "organic"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-slate-grey-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-slate-grey-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-swamp-mossy-with-rotting-vertical-plank-grooves-and-thick-spongy-slate-grey-moss-blankets-with-a-rotten-vertical-support-beam-barely-holding-together-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-tavern-tudor-with-crumbling-bone-white-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001",
    "name": "Tavern Tudor With Crumbling Bone White Daub And Visible Red Bricks Showing Through Cracks, With A Thick Crooked Oak Vertical Structural Post Embedded In The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-tavern-tudor-with-crumbling-bone-white-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001/preview.webp",
    "browser": {
      "family": "Tavern Tudor",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "wood",
        "plaster",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-tavern-tudor-with-crumbling-bone-white-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-tavern-tudor-with-crumbling-bone-white-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-tavern-tudor-with-crumbling-bone-white-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-tavern-tudor-with-crumbling-burnt-orange-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001",
    "name": "Tavern Tudor With Crumbling Burnt Orange Daub And Visible Red Bricks Showing Through Cracks, With A Thick Crooked Oak Vertical Structural Post Embedded In The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-tavern-tudor-with-crumbling-burnt-orange-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001/preview.webp",
    "browser": {
      "family": "Tavern Tudor",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "wood",
        "plaster",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-tavern-tudor-with-crumbling-burnt-orange-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-tavern-tudor-with-crumbling-burnt-orange-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-tavern-tudor-with-crumbling-burnt-orange-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-tavern-tudor-with-crumbling-charcoal-black-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001",
    "name": "Tavern Tudor With Crumbling Charcoal Black Daub And Visible Red Bricks Showing Through Cracks, With A Thick Crooked Oak Vertical Structural Post Embedded In The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-tavern-tudor-with-crumbling-charcoal-black-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001/preview.webp",
    "browser": {
      "family": "Tavern Tudor",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "wood",
        "plaster",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-tavern-tudor-with-crumbling-charcoal-black-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-tavern-tudor-with-crumbling-charcoal-black-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-tavern-tudor-with-crumbling-charcoal-black-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-tavern-tudor-with-crumbling-cobalt-blue-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001",
    "name": "Tavern Tudor With Crumbling Cobalt Blue Daub And Visible Red Bricks Showing Through Cracks, With A Thick Crooked Oak Vertical Structural Post Embedded In The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-tavern-tudor-with-crumbling-cobalt-blue-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001/preview.webp",
    "browser": {
      "family": "Tavern Tudor",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "wood",
        "plaster",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-tavern-tudor-with-crumbling-cobalt-blue-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-tavern-tudor-with-crumbling-cobalt-blue-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-tavern-tudor-with-crumbling-cobalt-blue-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-tavern-tudor-with-crumbling-crimson-red-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001",
    "name": "Tavern Tudor With Crumbling Crimson Red Daub And Visible Red Bricks Showing Through Cracks, With A Thick Crooked Oak Vertical Structural Post Embedded In The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-tavern-tudor-with-crumbling-crimson-red-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001/preview.webp",
    "browser": {
      "family": "Tavern Tudor",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "wood",
        "plaster",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-tavern-tudor-with-crumbling-crimson-red-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-tavern-tudor-with-crumbling-crimson-red-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-tavern-tudor-with-crumbling-crimson-red-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-tavern-tudor-with-crumbling-deep-violet-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001",
    "name": "Tavern Tudor With Crumbling Deep Violet Daub And Visible Red Bricks Showing Through Cracks, With A Thick Crooked Oak Vertical Structural Post Embedded In The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-tavern-tudor-with-crumbling-deep-violet-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001/preview.webp",
    "browser": {
      "family": "Tavern Tudor",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "wood",
        "plaster",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-tavern-tudor-with-crumbling-deep-violet-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-tavern-tudor-with-crumbling-deep-violet-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-tavern-tudor-with-crumbling-deep-violet-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-tavern-tudor-with-crumbling-moss-green-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001",
    "name": "Tavern Tudor With Crumbling Moss Green Daub And Visible Red Bricks Showing Through Cracks, With A Thick Crooked Oak Vertical Structural Post Embedded In The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-tavern-tudor-with-crumbling-moss-green-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001/preview.webp",
    "browser": {
      "family": "Tavern Tudor",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "wood",
        "plaster",
        "organic",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-tavern-tudor-with-crumbling-moss-green-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-tavern-tudor-with-crumbling-moss-green-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-tavern-tudor-with-crumbling-moss-green-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-tavern-tudor-with-crumbling-ochre-yellow-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001",
    "name": "Tavern Tudor With Crumbling Ochre Yellow Daub And Visible Red Bricks Showing Through Cracks, With A Thick Crooked Oak Vertical Structural Post Embedded In The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-tavern-tudor-with-crumbling-ochre-yellow-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001/preview.webp",
    "browser": {
      "family": "Tavern Tudor",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "wood",
        "plaster",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-tavern-tudor-with-crumbling-ochre-yellow-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-tavern-tudor-with-crumbling-ochre-yellow-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-tavern-tudor-with-crumbling-ochre-yellow-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-tavern-tudor-with-crumbling-rust-brown-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001",
    "name": "Tavern Tudor With Crumbling Rust Brown Daub And Visible Red Bricks Showing Through Cracks, With A Thick Crooked Oak Vertical Structural Post Embedded In The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-tavern-tudor-with-crumbling-rust-brown-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001/preview.webp",
    "browser": {
      "family": "Tavern Tudor",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "wood",
        "plaster",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-tavern-tudor-with-crumbling-rust-brown-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-tavern-tudor-with-crumbling-rust-brown-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-tavern-tudor-with-crumbling-rust-brown-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-tavern-tudor-with-crumbling-slate-grey-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001",
    "name": "Tavern Tudor With Crumbling Slate Grey Daub And Visible Red Bricks Showing Through Cracks, With A Thick Crooked Oak Vertical Structural Post Embedded In The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-tavern-tudor-with-crumbling-slate-grey-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001/preview.webp",
    "browser": {
      "family": "Tavern Tudor",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "wood",
        "plaster",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-tavern-tudor-with-crumbling-slate-grey-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-tavern-tudor-with-crumbling-slate-grey-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-tavern-tudor-with-crumbling-slate-grey-daub-and-visible-red-bricks-showing-through-cracks-with-a-thick-crooked-oak-vertical-structural-post-embedded-in-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-underdark-bioluminescent-with-bone-white-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001",
    "name": "Underdark Bioluminescent With Bone White Crystal Cluster Protrusions And Glowing Geometric Rune Veins, With A Natural Stalagmite Pillar Formation Merged Flat Into The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-underdark-bioluminescent-with-bone-white-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001/preview.webp",
    "browser": {
      "family": "Underdark Bioluminescent",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "arcane",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-underdark-bioluminescent-with-bone-white-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-underdark-bioluminescent-with-bone-white-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-underdark-bioluminescent-with-bone-white-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-underdark-bioluminescent-with-burnt-orange-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001",
    "name": "Underdark Bioluminescent With Burnt Orange Crystal Cluster Protrusions And Glowing Geometric Rune Veins, With A Natural Stalagmite Pillar Formation Merged Flat Into The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-underdark-bioluminescent-with-burnt-orange-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001/preview.webp",
    "browser": {
      "family": "Underdark Bioluminescent",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "arcane",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-underdark-bioluminescent-with-burnt-orange-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-underdark-bioluminescent-with-burnt-orange-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-underdark-bioluminescent-with-burnt-orange-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-underdark-bioluminescent-with-charcoal-black-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001",
    "name": "Underdark Bioluminescent With Charcoal Black Crystal Cluster Protrusions And Glowing Geometric Rune Veins, With A Natural Stalagmite Pillar Formation Merged Flat Into The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-underdark-bioluminescent-with-charcoal-black-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001/preview.webp",
    "browser": {
      "family": "Underdark Bioluminescent",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "arcane",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-underdark-bioluminescent-with-charcoal-black-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-underdark-bioluminescent-with-charcoal-black-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-underdark-bioluminescent-with-charcoal-black-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-underdark-bioluminescent-with-cobalt-blue-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001",
    "name": "Underdark Bioluminescent With Cobalt Blue Crystal Cluster Protrusions And Glowing Geometric Rune Veins, With A Natural Stalagmite Pillar Formation Merged Flat Into The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-underdark-bioluminescent-with-cobalt-blue-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001/preview.webp",
    "browser": {
      "family": "Underdark Bioluminescent",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "arcane",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-underdark-bioluminescent-with-cobalt-blue-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-underdark-bioluminescent-with-cobalt-blue-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-underdark-bioluminescent-with-cobalt-blue-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-underdark-bioluminescent-with-crimson-red-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001",
    "name": "Underdark Bioluminescent With Crimson Red Crystal Cluster Protrusions And Glowing Geometric Rune Veins, With A Natural Stalagmite Pillar Formation Merged Flat Into The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-underdark-bioluminescent-with-crimson-red-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001/preview.webp",
    "browser": {
      "family": "Underdark Bioluminescent",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "arcane",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-underdark-bioluminescent-with-crimson-red-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-underdark-bioluminescent-with-crimson-red-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-underdark-bioluminescent-with-crimson-red-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-underdark-bioluminescent-with-deep-violet-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001",
    "name": "Underdark Bioluminescent With Deep Violet Crystal Cluster Protrusions And Glowing Geometric Rune Veins, With A Natural Stalagmite Pillar Formation Merged Flat Into The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-underdark-bioluminescent-with-deep-violet-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001/preview.webp",
    "browser": {
      "family": "Underdark Bioluminescent",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "arcane",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-underdark-bioluminescent-with-deep-violet-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-underdark-bioluminescent-with-deep-violet-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-underdark-bioluminescent-with-deep-violet-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-underdark-bioluminescent-with-moss-green-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001",
    "name": "Underdark Bioluminescent With Moss Green Crystal Cluster Protrusions And Glowing Geometric Rune Veins, With A Natural Stalagmite Pillar Formation Merged Flat Into The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-underdark-bioluminescent-with-moss-green-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001/preview.webp",
    "browser": {
      "family": "Underdark Bioluminescent",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "organic",
        "arcane",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-underdark-bioluminescent-with-moss-green-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-underdark-bioluminescent-with-moss-green-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-underdark-bioluminescent-with-moss-green-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-underdark-bioluminescent-with-ochre-yellow-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001",
    "name": "Underdark Bioluminescent With Ochre Yellow Crystal Cluster Protrusions And Glowing Geometric Rune Veins, With A Natural Stalagmite Pillar Formation Merged Flat Into The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-underdark-bioluminescent-with-ochre-yellow-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001/preview.webp",
    "browser": {
      "family": "Underdark Bioluminescent",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "arcane",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-underdark-bioluminescent-with-ochre-yellow-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-underdark-bioluminescent-with-ochre-yellow-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-underdark-bioluminescent-with-ochre-yellow-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-underdark-bioluminescent-with-rust-brown-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001",
    "name": "Underdark Bioluminescent With Rust Brown Crystal Cluster Protrusions And Glowing Geometric Rune Veins, With A Natural Stalagmite Pillar Formation Merged Flat Into The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-underdark-bioluminescent-with-rust-brown-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001/preview.webp",
    "browser": {
      "family": "Underdark Bioluminescent",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "arcane",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-underdark-bioluminescent-with-rust-brown-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-underdark-bioluminescent-with-rust-brown-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-underdark-bioluminescent-with-rust-brown-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-underdark-bioluminescent-with-slate-grey-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001",
    "name": "Underdark Bioluminescent With Slate Grey Crystal Cluster Protrusions And Glowing Geometric Rune Veins, With A Natural Stalagmite Pillar Formation Merged Flat Into The Surface 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-underdark-bioluminescent-with-slate-grey-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001/preview.webp",
    "browser": {
      "family": "Underdark Bioluminescent",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "arcane",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-underdark-bioluminescent-with-slate-grey-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-underdark-bioluminescent-with-slate-grey-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-underdark-bioluminescent-with-slate-grey-crystal-cluster-protrusions-and-glowing-geometric-rune-veins-with-a-natural-stalagmite-pillar-formation-merged-flat-into-the-surface-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-bone-white-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001",
    "name": "Volcanic Obsidian With Glassy Conchoidal Fractures And Sharp Stepped Bone White Rock Edges, With A Heavy Interlocking Basalt Column Structure Framing The Side 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-bone-white-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001/preview.webp",
    "browser": {
      "family": "Volcanic Obsidian",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "stone",
        "lava",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-bone-white-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-bone-white-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-bone-white-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-burnt-orange-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001",
    "name": "Volcanic Obsidian With Glassy Conchoidal Fractures And Sharp Stepped Burnt Orange Rock Edges, With A Heavy Interlocking Basalt Column Structure Framing The Side 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-burnt-orange-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001/preview.webp",
    "browser": {
      "family": "Volcanic Obsidian",
      "variant": "Burnt Orange",
      "colorway": "Burnt Orange",
      "swatchColor": "#b65d2f",
      "tags": [
        "stone",
        "lava",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-burnt-orange-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-burnt-orange-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-burnt-orange-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-charcoal-black-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001",
    "name": "Volcanic Obsidian With Glassy Conchoidal Fractures And Sharp Stepped Charcoal Black Rock Edges, With A Heavy Interlocking Basalt Column Structure Framing The Side 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-charcoal-black-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001/preview.webp",
    "browser": {
      "family": "Volcanic Obsidian",
      "variant": "Charcoal Black",
      "colorway": "Charcoal Black",
      "swatchColor": "#252525",
      "tags": [
        "stone",
        "lava",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-charcoal-black-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-charcoal-black-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-charcoal-black-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-cobalt-blue-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001",
    "name": "Volcanic Obsidian With Glassy Conchoidal Fractures And Sharp Stepped Cobalt Blue Rock Edges, With A Heavy Interlocking Basalt Column Structure Framing The Side 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-cobalt-blue-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001/preview.webp",
    "browser": {
      "family": "Volcanic Obsidian",
      "variant": "Cobalt Blue",
      "colorway": "Cobalt Blue",
      "swatchColor": "#2d5faa",
      "tags": [
        "stone",
        "lava",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-cobalt-blue-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-cobalt-blue-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-cobalt-blue-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-crimson-red-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001",
    "name": "Volcanic Obsidian With Glassy Conchoidal Fractures And Sharp Stepped Crimson Red Rock Edges, With A Heavy Interlocking Basalt Column Structure Framing The Side 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-crimson-red-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001/preview.webp",
    "browser": {
      "family": "Volcanic Obsidian",
      "variant": "Crimson Red",
      "colorway": "Crimson Red",
      "swatchColor": "#a73535",
      "tags": [
        "stone",
        "lava",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-crimson-red-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-crimson-red-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-crimson-red-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-deep-violet-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001",
    "name": "Volcanic Obsidian With Glassy Conchoidal Fractures And Sharp Stepped Deep Violet Rock Edges, With A Heavy Interlocking Basalt Column Structure Framing The Side 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-deep-violet-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001/preview.webp",
    "browser": {
      "family": "Volcanic Obsidian",
      "variant": "Deep Violet",
      "colorway": "Deep Violet",
      "swatchColor": "#5f3f8d",
      "tags": [
        "stone",
        "lava",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-deep-violet-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-deep-violet-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-deep-violet-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-moss-green-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001",
    "name": "Volcanic Obsidian With Glassy Conchoidal Fractures And Sharp Stepped Moss Green Rock Edges, With A Heavy Interlocking Basalt Column Structure Framing The Side 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-moss-green-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001/preview.webp",
    "browser": {
      "family": "Volcanic Obsidian",
      "variant": "Moss Green",
      "colorway": "Moss Green",
      "swatchColor": "#617544",
      "tags": [
        "stone",
        "organic",
        "lava",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-moss-green-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-moss-green-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-moss-green-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-ochre-yellow-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001",
    "name": "Volcanic Obsidian With Glassy Conchoidal Fractures And Sharp Stepped Ochre Yellow Rock Edges, With A Heavy Interlocking Basalt Column Structure Framing The Side 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-ochre-yellow-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001/preview.webp",
    "browser": {
      "family": "Volcanic Obsidian",
      "variant": "Ochre Yellow",
      "colorway": "Ochre Yellow",
      "swatchColor": "#c29a3b",
      "tags": [
        "stone",
        "lava",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-ochre-yellow-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-ochre-yellow-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-ochre-yellow-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-rust-brown-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001",
    "name": "Volcanic Obsidian With Glassy Conchoidal Fractures And Sharp Stepped Rust Brown Rock Edges, With A Heavy Interlocking Basalt Column Structure Framing The Side 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-rust-brown-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001/preview.webp",
    "browser": {
      "family": "Volcanic Obsidian",
      "variant": "Rust Brown",
      "colorway": "Rust Brown",
      "swatchColor": "#7b4a32",
      "tags": [
        "stone",
        "lava",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-rust-brown-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-rust-brown-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-rust-brown-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-slate-grey-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001",
    "name": "Volcanic Obsidian With Glassy Conchoidal Fractures And Sharp Stepped Slate Grey Rock Edges, With A Heavy Interlocking Basalt Column Structure Framing The Side 00001",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-slate-grey-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001/preview.webp",
    "browser": {
      "family": "Volcanic Obsidian",
      "variant": "Slate Grey",
      "colorway": "Slate Grey",
      "swatchColor": "#6f7780",
      "tags": [
        "stone",
        "lava",
        "cave"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-slate-grey-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-slate-grey-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-volcanic-obsidian-with-glassy-conchoidal-fractures-and-sharp-stepped-slate-grey-rock-edges-with-a-heavy-interlocking-basalt-column-structure-framing-the-side-00001"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-bone-white-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00002",
    "name": "Castle Stone With Massive Ashlar Masonry Blocks And Weathered Bone White Bevel Edges, With A Heavy Stone Corbel Protruding Near The Top Edge 00002",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-bone-white-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00002/preview.webp",
    "browser": {
      "family": "Castle Stone",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "stone",
        "ruined"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-bone-white-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00002",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-bone-white-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00002"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-bone-white-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00002"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00002",
    "name": "Cottage Plaster With Patches Of Exposed Underlying Lath And Rough Bone White Finger Troweled Textures, With A Rough Hewn Wooden Tie Beam Cutting Horizontally Through The Middle 00002",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00002/preview.webp",
    "browser": {
      "family": "Cottage Plaster",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "wood",
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00002",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00002"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00002"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00003",
    "name": "Cottage Plaster With Patches Of Exposed Underlying Lath And Rough Bone White Finger Troweled Textures, With A Rough Hewn Wooden Tie Beam Cutting Horizontally Through The Middle 00003",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00003/preview.webp",
    "browser": {
      "family": "Cottage Plaster",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "wood",
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00003",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00003"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00003"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00004",
    "name": "Cottage Plaster With Patches Of Exposed Underlying Lath And Rough Bone White Finger Troweled Textures, With A Rough Hewn Wooden Tie Beam Cutting Horizontally Through The Middle 00004",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00004/preview.webp",
    "browser": {
      "family": "Cottage Plaster",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "wood",
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00004",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00004"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00004"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00005",
    "name": "Cottage Plaster With Patches Of Exposed Underlying Lath And Rough Bone White Finger Troweled Textures, With A Rough Hewn Wooden Tie Beam Cutting Horizontally Through The Middle 00005",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00005/preview.webp",
    "browser": {
      "family": "Cottage Plaster",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "wood",
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00005",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00005"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00005"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00006",
    "name": "Cottage Plaster With Patches Of Exposed Underlying Lath And Rough Bone White Finger Troweled Textures, With A Rough Hewn Wooden Tie Beam Cutting Horizontally Through The Middle 00006",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00006/preview.webp",
    "browser": {
      "family": "Cottage Plaster",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "wood",
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00006",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00006"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00006"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00007",
    "name": "Cottage Plaster With Patches Of Exposed Underlying Lath And Rough Bone White Finger Troweled Textures, With A Rough Hewn Wooden Tie Beam Cutting Horizontally Through The Middle 00007",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00007/preview.webp",
    "browser": {
      "family": "Cottage Plaster",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "wood",
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00007",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00007"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00007"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  },
  {
    "id": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00008",
    "name": "Cottage Plaster With Patches Of Exposed Underlying Lath And Rough Bone White Finger Troweled Textures, With A Rough Hewn Wooden Tie Beam Cutting Horizontally Through The Middle 00008",
    "previewImagePath": "../../assets/materials/dungeon/wall-materials/generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00008/preview.webp",
    "browser": {
      "family": "Cottage Plaster",
      "variant": "Bone White",
      "colorway": "Bone White",
      "swatchColor": "#ddd6b8",
      "tags": [
        "wood",
        "plaster"
      ],
      "source": "generated"
    },
    "structuralCore": {
      "profile": "thick-stone-core",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00008",
      "render": {
        "hiddenProfileSegmentIndices": [
          0,
          1,
          2
        ]
      }
    },
    "roomFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00008"
    },
    "exteriorFace": {
      "profile": "ai-gothic-wall-face",
      "material": "generated-cottage-plaster-with-patches-of-exposed-underlying-lath-and-rough-bone-white-finger-troweled-textures-with-a-rough-hewn-wooden-tie-beam-cutting-horizontally-through-the-middle-00008"
    },
    "joinMode": "cover-piece",
    "curvatureLimits": {
      "minInnerRadius": 1.2,
      "maxTurnDegrees": 135
    },
    "openingRules": {
      "defaultMode": "structural",
      "supportedModes": [
        "framed",
        "structural"
      ],
      "supportedKinds": [
        "door",
        "window",
        "passage"
      ],
      "compatibleAssetIds": [
        "core.opening_door_custom",
        "core.opening_door_wall_1",
        "dungeon.wall_wall_opening"
      ]
    }
  }
] as const satisfies readonly WallStyleRecipe[]

export const dungeonWallStyles: ContentPackWallStyle[] = wallStyleRecipes.map(createWallStyleFromRecipe)
