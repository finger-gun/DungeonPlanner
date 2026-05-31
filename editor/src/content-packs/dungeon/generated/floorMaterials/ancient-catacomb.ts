import type { GeneratedFloorMaterialDefinition } from '../../shared/createGeneratedFloorMaterialAsset'

export const floorMaterial: GeneratedFloorMaterialDefinition = {
  id: "dungeon.floor_ancient-catacomb",
  slug: "dungeon-floor-ancient-catacomb",
  name: "Ancient Catacomb",
  thumbnailPath: new URL("../../../../assets/materials/dungeon/floor-materials/ancient-catacomb/preview.webp", import.meta.url).href,
  textures: {
    albedoPath: new URL("../../../../assets/materials/dungeon/floor-materials/ancient-catacomb/floor_albedo.ktx2", import.meta.url).href,
    normalPath: new URL("../../../../assets/materials/dungeon/floor-materials/ancient-catacomb/floor_normal.ktx2", import.meta.url).href,
    packedOrmHeightPath: new URL("../../../../assets/materials/dungeon/floor-materials/ancient-catacomb/floor_ormh.ktx2", import.meta.url).href,
  },
  shading: {
    tintColor: '#ffffff',
    roughness: 0.92,
    metalness: 0.02,
    bumpScale: 0.12,
  },
}
