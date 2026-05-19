import type { ContentPackWallMaterialSet } from '../../../types'

export const wallMaterialSet: ContentPackWallMaterialSet = {
  id: "classy-art-deco-wallpaper",
  name: "Classy Art Deco Wallpaper",
  previewImageUrl: new URL("../../../../assets/materials/dungeon/wall-materials/classy-art-deco-wallpaper/classy-art-deco-wallpaper_preview.png", import.meta.url).href,
  textures: {
    albedoUrl: new URL("../../../../assets/materials/dungeon/wall-materials/classy-art-deco-wallpaper/classy-art-deco-wallpaper_albedo.png", import.meta.url).href,
    normalUrl: new URL("../../../../assets/materials/dungeon/wall-materials/classy-art-deco-wallpaper/classy-art-deco-wallpaper_normal-ogl.png", import.meta.url).href,
    aoUrl: new URL("../../../../assets/materials/dungeon/wall-materials/classy-art-deco-wallpaper/classy-art-deco-wallpaper_ao.png", import.meta.url).href,
    heightUrl: new URL("../../../../assets/materials/dungeon/wall-materials/classy-art-deco-wallpaper/classy-art-deco-wallpaper_height.png", import.meta.url).href,
  },
}
