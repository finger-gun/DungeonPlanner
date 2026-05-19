import type { ContentPackWallMaterialSet } from '../../../types'

export const wallMaterialSet: ContentPackWallMaterialSet = {
  id: "modern-brick1",
  name: "Modern Brick1",
  textures: {
    albedoUrl: new URL("../../../../assets/materials/dungeon/wall-materials/modern-brick1/modern-brick1_albedo.png", import.meta.url).href,
    normalUrl: new URL("../../../../assets/materials/dungeon/wall-materials/modern-brick1/modern-brick1_normal-ogl.png", import.meta.url).href,
    aoUrl: new URL("../../../../assets/materials/dungeon/wall-materials/modern-brick1/modern-brick1_ao.png", import.meta.url).href,
    heightUrl: new URL("../../../../assets/materials/dungeon/wall-materials/modern-brick1/modern-brick1_height.png", import.meta.url).href,
  },
}
