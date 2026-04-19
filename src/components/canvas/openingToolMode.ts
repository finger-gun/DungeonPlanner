import type { PropConnector, ConnectsTo } from '../../content-packs/types'
import type { WallConnectionMode } from '../../store/useDungeonStore'

export function getOpeningToolMode(
  wallConnectionMode: WallConnectionMode,
  connector: PropConnector | ConnectsTo | ConnectsTo[] | undefined,
) {
  // Handle arrays - check if any connector is FLOOR
  if (Array.isArray(connector)) {
    const hasFloor = connector.includes('FLOOR')
    if (wallConnectionMode === 'door' && hasFloor) {
      return 'floor-asset'
    }
    return 'wall-connection'
  }
  
  if (wallConnectionMode === 'door' && (connector ?? 'FLOOR') === 'FLOOR') {
    return 'floor-asset'
  }

  return 'wall-connection'
}
