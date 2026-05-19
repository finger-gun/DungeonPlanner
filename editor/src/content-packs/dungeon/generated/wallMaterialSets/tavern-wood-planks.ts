import type { ContentPackWallMaterialSet } from '../../../types'

export const wallMaterialSet: ContentPackWallMaterialSet = {
  id: "tavern-wood-planks",
  name: "Tavern Wood Planks",
  previewImageUrl: new URL("../../../../assets/materials/dungeon/wall-materials/tavern-wood-planks/tavern-wood-planks1_preview.png", import.meta.url).href,
  textures: {
    albedoUrl: new URL("../../../../assets/materials/dungeon/wall-materials/tavern-wood-planks/tavern-wood-planks1_albedo.png", import.meta.url).href,
    normalUrl: new URL("../../../../assets/materials/dungeon/wall-materials/tavern-wood-planks/tavern-wood-planks1_normal-ogl.png", import.meta.url).href,
    aoUrl: new URL("../../../../assets/materials/dungeon/wall-materials/tavern-wood-planks/tavern-wood-planks1_ao.png", import.meta.url).href,
    heightUrl: new URL("../../../../assets/materials/dungeon/wall-materials/tavern-wood-planks/tavern-wood-planks1_height.png", import.meta.url).href,
  },
}
