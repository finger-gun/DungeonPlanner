import { getAssetBrowserCategory, getAssetBrowserSubcategory } from '../../content-packs/browserMetadata'
import { getContentPackAssetById } from '../../content-packs/registry'
import type { DungeonState } from '../useDungeonStore'

type DungeonStoreSet = (updater: (state: DungeonState) => DungeonState) => void
type DungeonStoreGet = () => DungeonState

type EditorUiActionKeys =
  | 'clearSelection'
  | 'selectObject'
  | 'setTool'
  | 'setMapMode'
  | 'selectRoom'
  | 'setRoomResizeHandleActive'
  | 'setRoomEditMode'
  | 'setWallConnectionMode'
  | 'setWallConnectionWidth'
  | 'setSelectedAsset'
  | 'setSurfaceBrushAsset'
  | 'setAssetBrowserCategory'
  | 'setAssetBrowserSubcategory'
  | 'focusAssetBrowserForAsset'

export function createDungeonStoreEditorUiActions({
  set,
  get,
  cloneSnapshot,
}: {
  set: DungeonStoreSet
  get: DungeonStoreGet
  cloneSnapshot: (state: DungeonState) => DungeonState['history'][number]
}): Pick<DungeonState, EditorUiActionKeys> {
  return {
    clearSelection: () => {
      set((state) => (
        state.selection === null &&
        state.selectedRoomId === null &&
        state.pickedUpObject === null &&
        state.objectMoveDragPointer === null &&
        !state.isObjectDragActive &&
        Object.keys(state.objectScalePreviewOverrides).length === 0 &&
        Object.keys(state.objectRotationPreviewOverrides).length === 0
          ? state
          : {
              ...state,
              selection: null,
              selectedRoomId: null,
              isObjectDragActive: false,
              pickedUpObject: null,
              objectMoveDragPointer: null,
              objectScalePreviewOverrides: {},
              objectRotationPreviewOverrides: {},
            }
      ))
    },
    selectObject: (id) => {
      set((state) => ({
        ...state,
        selection: id,
      }))
    },
    setTool: (tool) => {
      const state = get()
      const normalizedTool = tool === 'opening' ? 'prop' : tool

      if (tool === 'opening') {
        get().focusAssetBrowserForAsset(state.selectedAssetIds.opening)
      }

      if (state.tool === normalizedTool) {
        return
      }

      const previousSnapshot = cloneSnapshot(state)

      set((current) => ({
        ...current,
        tool: normalizedTool,
        isRoomResizeHandleActive: normalizedTool === 'room' ? current.isRoomResizeHandleActive : false,
        roomEditMode: normalizedTool === 'room' ? 'rooms' : current.roomEditMode,
        history: [...current.history, previousSnapshot],
        future: [],
      }))
    },
    setMapMode: (mode) => {
      set((state) => (state.mapMode === mode
        ? state
        : {
            ...state,
            mapMode: mode,
            tool: mode === 'outdoor' && state.tool === 'opening' ? 'prop' : state.tool,
            roomEditMode: 'rooms',
            outdoorBrushMode: mode === 'outdoor' ? state.outdoorBrushMode : 'surroundings',
          }))
    },
    selectRoom: (id) => {
      set((current) => ({
        ...current,
        selectedRoomId: id,
      }))
    },
    setRoomResizeHandleActive: (active) => {
      set((current) => current.isRoomResizeHandleActive === active
        ? current
        : {
            ...current,
            isRoomResizeHandleActive: active,
          })
    },
    setRoomEditMode: (mode) => {
      set((current) => current.roomEditMode === mode
        ? current
        : {
            ...current,
            roomEditMode: mode,
          })
    },
    setWallConnectionMode: (mode) => {
      set((current) => current.wallConnectionMode === mode
        ? current
        : {
            ...current,
            wallConnectionMode: mode,
          })
    },
    setWallConnectionWidth: (width) => {
      set((current) => current.wallConnectionWidth === width
        ? current
        : {
            ...current,
            wallConnectionWidth: width,
          })
    },
    setSelectedAsset: (category, assetId) => {
      const state = get()

      if (state.selectedAssetIds[category] === assetId) {
        return
      }

      const previousSnapshot = cloneSnapshot(state)

      set((current) => {
        const selectedAsset = getContentPackAssetById(assetId)
        const nextBrowserState =
          (category === 'prop' || category === 'opening') && selectedAsset
            ? {
                category: getAssetBrowserCategory(selectedAsset),
                subcategory: getAssetBrowserSubcategory(selectedAsset),
              }
            : current.assetBrowser

        return {
          ...current,
          selectedAssetIds: {
            ...current.selectedAssetIds,
            [category]: assetId,
          },
          assetBrowser: nextBrowserState,
          history: [...current.history, previousSnapshot],
          future: [],
        }
      })
    },
    setSurfaceBrushAsset: (category, assetId) => {
      set((current) => current.surfaceBrushAssetIds[category] === assetId
        ? current
        : {
            ...current,
            surfaceBrushAssetIds: {
              ...current.surfaceBrushAssetIds,
              [category]: assetId,
            },
            assetBrowser: {
              category: 'surfaces',
              subcategory: category === 'floor' ? 'floors' : 'walls',
            },
          })
    },
    setAssetBrowserCategory: (category) => {
      set((current) => current.assetBrowser.category === category
        ? current
        : {
            ...current,
            assetBrowser: {
              category,
              subcategory: category === 'surfaces' ? 'floors' : null,
            },
          })
    },
    setAssetBrowserSubcategory: (subcategory) => {
      set((current) => current.assetBrowser.subcategory === subcategory
        ? current
        : {
            ...current,
            assetBrowser: {
              ...current.assetBrowser,
              subcategory,
            },
          })
    },
    focusAssetBrowserForAsset: (assetId) => {
      const asset = assetId ? getContentPackAssetById(assetId) : null
      if (!asset) {
        return
      }

      set((current) => ({
        ...current,
        assetBrowser: {
          category: getAssetBrowserCategory(asset),
          subcategory: getAssetBrowserSubcategory(asset),
        },
      }))
    },
  }
}
