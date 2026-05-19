import type { ContentPackWallMaterialSet } from '../../../types'

export const wallMaterialSet: ContentPackWallMaterialSet = {
  id: "victorian-brick",
  name: "Victorian Brick",
  previewImageUrl: new URL("../../../../assets/materials/dungeon/wall-materials/victorian-brick/victorian-brick_preview.png", import.meta.url).href,
  textures: {
    albedoUrl: new URL("../../../../assets/materials/dungeon/wall-materials/victorian-brick/victorian-brick_albedo.png", import.meta.url).href,
    normalUrl: new URL("../../../../assets/materials/dungeon/wall-materials/victorian-brick/victorian-brick_normal-ogl.png", import.meta.url).href,
    aoUrl: new URL("../../../../assets/materials/dungeon/wall-materials/victorian-brick/victorian-brick_ao.png", import.meta.url).href,
    heightUrl: new URL("../../../../assets/materials/dungeon/wall-materials/victorian-brick/victorian-brick_height.png", import.meta.url).href,
  },
}
