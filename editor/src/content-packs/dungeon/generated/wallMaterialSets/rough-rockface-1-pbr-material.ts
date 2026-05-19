import type { ContentPackWallMaterialSet } from '../../../types'

export const wallMaterialSet: ContentPackWallMaterialSet = {
  id: "rough-rockface-1-pbr-material",
  name: "Rough Rockface 1 Pbr Material",
  textures: {
    albedoUrl: new URL("../../../../assets/materials/dungeon/wall-materials/rough-rockface-1-pbr-material/Rough-rockface1_Base_Color.png", import.meta.url).href,
    normalUrl: new URL("../../../../assets/materials/dungeon/wall-materials/rough-rockface-1-pbr-material/Rough-rockface1_Normal.png", import.meta.url).href,
    aoUrl: new URL("../../../../assets/materials/dungeon/wall-materials/rough-rockface-1-pbr-material/Rough-rockface1_Ambient_Occlusion.png", import.meta.url).href,
    heightUrl: new URL("../../../../assets/materials/dungeon/wall-materials/rough-rockface-1-pbr-material/Rough-rockface1_Height.png", import.meta.url).href,
  },
}
