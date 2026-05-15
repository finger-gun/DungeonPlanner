import type { DungeonState } from '../useDungeonStore'

type DungeonStoreSet = (updater: (state: DungeonState) => DungeonState) => void

type LayerActionKeys =
  | 'addLayer'
  | 'removeLayer'
  | 'renameLayer'
  | 'setLayerVisible'
  | 'setLayerLocked'
  | 'setActiveLayer'

export function createDungeonStoreLayerActions({
  set,
  cloneSnapshot,
  defaultLayerId,
  createObjectId,
}: {
  set: DungeonStoreSet
  cloneSnapshot: (state: DungeonState) => DungeonState['history'][number]
  defaultLayerId: string
  createObjectId: () => string
}): Pick<DungeonState, LayerActionKeys> {
  return {
    addLayer: (name) => {
      const id = createObjectId()
      set((current) => {
        const previousSnapshot = cloneSnapshot(current)
        return {
          ...current,
          layers: { ...current.layers, [id]: { id, name, visible: true, locked: false } },
          layerOrder: [...current.layerOrder, id],
          history: [...current.history, previousSnapshot],
          future: [],
        }
      })
      return id
    },
    removeLayer: (id) => {
      set((current) => {
        if (Object.keys(current.layers).length <= 1) {
          return current
        }

        const previousSnapshot = cloneSnapshot(current)
        const paintedCells = { ...current.paintedCells }
        Object.entries(paintedCells).forEach(([key, record]) => {
          if (record.layerId === id) {
            paintedCells[key] = { ...record, layerId: defaultLayerId }
          }
        })

        const placedObjects = { ...current.placedObjects }
        Object.entries(placedObjects).forEach(([objectId, object]) => {
          if (object.layerId === id) {
            placedObjects[objectId] = { ...object, layerId: defaultLayerId }
          }
        })

        const rooms = { ...current.rooms }
        Object.entries(rooms).forEach(([roomId, room]) => {
          if (room.layerId === id) {
            rooms[roomId] = { ...room, layerId: defaultLayerId }
          }
        })

        const layers = { ...current.layers }
        delete layers[id]

        return {
          ...current,
          layers,
          layerOrder: current.layerOrder.filter((layerId) => layerId !== id),
          activeLayerId: current.activeLayerId === id ? defaultLayerId : current.activeLayerId,
          paintedCells,
          placedObjects,
          rooms,
          history: [...current.history, previousSnapshot],
          future: [],
        }
      })
    },
    renameLayer: (id, name) => {
      set((current) => ({
        ...current,
        layers: { ...current.layers, [id]: { ...current.layers[id], name } },
      }))
    },
    setLayerVisible: (id, visible) => {
      set((current) => ({
        ...current,
        layers: { ...current.layers, [id]: { ...current.layers[id], visible } },
      }))
    },
    setLayerLocked: (id, locked) => {
      set((current) => ({
        ...current,
        layers: { ...current.layers, [id]: { ...current.layers[id], locked } },
      }))
    },
    setActiveLayer: (id) => {
      set((current) => ({ ...current, activeLayerId: id }))
    },
  }
}
