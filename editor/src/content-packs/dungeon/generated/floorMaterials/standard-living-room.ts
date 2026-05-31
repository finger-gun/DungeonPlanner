import type { GeneratedFloorMaterialDefinition } from '../../shared/createGeneratedFloorMaterialAsset'

export const floorMaterial: GeneratedFloorMaterialDefinition = {
  id: "dungeon.floor_standard-living-room",
  slug: "dungeon-floor-standard-living-room",
  name: "Standard Living Room",
  thumbnailPath: new URL("../../../../assets/materials/dungeon/floor-materials/standard-living-room/preview.webp", import.meta.url).href,
  textures: {
    albedoPath: new URL("../../../../assets/materials/dungeon/floor-materials/standard-living-room/floor_albedo.ktx2", import.meta.url).href,
    normalPath: new URL("../../../../assets/materials/dungeon/floor-materials/standard-living-room/floor_normal.ktx2", import.meta.url).href,
    packedOrmHeightPath: new URL("../../../../assets/materials/dungeon/floor-materials/standard-living-room/floor_ormh.ktx2", import.meta.url).href,
  },
  shading: {
    tintColor: '#ffffff',
    roughness: 0.92,
    metalness: 0.02,
    bumpScale: 0.12,
  },
}
