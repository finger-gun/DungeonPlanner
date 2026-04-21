import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBannerTripleWhiteAsset = createDungeonAsset({
  id: 'dungeon.props_banners_banner_triple_white',
  slug: 'dungeon-props-banners-banner-triple-white',
  name: 'Dungeon Banner Triple White',
  category: 'prop',
  modelName: 'banner_triple_white',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [
      {
        point: [0, 0, 0.5],
        type: 'WALL',
      },
    ],
    blocksLineOfSight: false,
  },
})
