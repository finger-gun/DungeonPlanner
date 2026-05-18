import type { ContentPackWallMaterialSet } from '../../../types'

export const wallMaterialSet: ContentPackWallMaterialSet = {
  id: "interior-rustic-cottage-packed-dried-mud-and-clay-627924782476288",
  name: "Rustic Cottage Packed Dried Mud And Clay 627924782476288",
  previewImageUrl: new URL("../../../../assets/materials/dungeon/wall-materials/interior-rustic-cottage-packed-dried-mud-and-clay-627924782476288/wall_albedo.png", import.meta.url).href,
  textures: {
    albedoUrl: new URL("../../../../assets/materials/dungeon/wall-materials/interior-rustic-cottage-packed-dried-mud-and-clay-627924782476288/wall_albedo.png", import.meta.url).href,
    normalUrl: new URL("../../../../assets/materials/dungeon/wall-materials/interior-rustic-cottage-packed-dried-mud-and-clay-627924782476288/wall_normal.png", import.meta.url).href,
    aoUrl: new URL("../../../../assets/materials/dungeon/wall-materials/interior-rustic-cottage-packed-dried-mud-and-clay-627924782476288/wall_ao.png", import.meta.url).href,
    heightUrl: new URL("../../../../assets/materials/dungeon/wall-materials/interior-rustic-cottage-packed-dried-mud-and-clay-627924782476288/wall_height.png", import.meta.url).href,
    roughnessUrl: new URL("../../../../assets/materials/dungeon/wall-materials/interior-rustic-cottage-packed-dried-mud-and-clay-627924782476288/wall_roughness.png", import.meta.url).href,
  },
  shading: {
    tintColor: '#ffffff',
    roughness: 0.86,
    metalness: 0,
    bumpScale: 0.16,
    parallaxScale: 0.12,
    parallaxSteps: 16,
    parallaxInvert: true,
    aoMapIntensity: 0.65,
    topSurfaceColor: '#262a31',
    topSurfaceRoughness: 0.82,
    topSurfaceMetalness: 0,
  },
  uv: {
    verticalMode: 'fit-height',
    verticalWrap: 'clamp',
  },
}
