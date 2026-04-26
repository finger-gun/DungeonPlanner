import { metadataSupportsConnectorType } from '../../content-packs/connectors'
import type { ContentPackAssetMetadata } from '../../content-packs/types'
import type { WallConnectionMode } from '../../store/useDungeonStore'

export function getOpeningToolMode(
  wallConnectionMode: WallConnectionMode,
  metadata: ContentPackAssetMetadata | undefined,
) {
  if (wallConnectionMode === 'door' && metadataSupportsConnectorType(metadata, 'FLOOR')) {
    return 'floor-asset'
  }

  return 'wall-connection'
}
