import { normalizePostProcessingSettings } from '../../postprocessing/tiltShiftMath'
import type { DungeonState, OutdoorTerrainProfile, OutdoorTerrainType } from '../useDungeonStore'

type DungeonStoreSet = (updater: (state: DungeonState) => DungeonState) => void

type ViewActionKeys =
  | 'setPaintingStrokeActive'
  | 'setObjectDragActive'
  | 'setSceneLightingIntensity'
  | 'setPostProcessing'
  | 'setOutdoorTimeOfDay'
  | 'setOutdoorTerrainDensity'
  | 'setOutdoorTerrainType'
  | 'setOutdoorOverpaintRegenerate'
  | 'setOutdoorBrushMode'
  | 'setOutdoorTerrainSculptMode'
  | 'setDefaultOutdoorTerrainStyle'
  | 'setOutdoorTerrainStyleBrush'
  | 'setShowGrid'
  | 'setShowLosDebugMask'
  | 'setShowLosDebugRays'
  | 'setShowLensFocusDebugPoint'
  | 'setShowChunkDebugOverlay'
  | 'setShowProjectionDebugMesh'
  | 'setShowPropProbeDebug'
  | 'setSlowBuildAnimationDebug'
  | 'setBuildPerformanceTracingEnabled'
  | 'setLightEffectsEnabled'
  | 'setLightFlickerEnabled'
  | 'setParticleEffectsEnabled'
  | 'setFloorViewMode'
  | 'setFpsLimit'
  | 'setCameraPreset'
  | 'clearCameraPreset'

export function createDungeonStoreViewActions({
  set,
  getOutdoorTerrainProfile,
}: {
  set: DungeonStoreSet
  getOutdoorTerrainProfile: (
    terrainType: OutdoorTerrainType,
    profiles: Record<OutdoorTerrainType, OutdoorTerrainProfile>,
  ) => OutdoorTerrainProfile
}): Pick<DungeonState, ViewActionKeys> {
  return {
    setPaintingStrokeActive: (active) => {
      set((state) => {
        if (state.isPaintingStrokeActive === active) {
          return state
        }

        return {
          ...state,
          isPaintingStrokeActive: active,
        }
      })
    },
    setObjectDragActive: (active) => {
      set((state) => {
        if (state.isObjectDragActive === active) {
          return state
        }

        return {
          ...state,
          isObjectDragActive: active,
        }
      })
    },
    setSceneLightingIntensity: (intensity) => {
      set((state) => ({ ...state, sceneLighting: { ...state.sceneLighting, intensity } }))
    },
    setPostProcessing: (settings) => {
      set((state) => ({
        ...state,
        postProcessing: normalizePostProcessingSettings({ ...state.postProcessing, ...settings }),
      }))
    },
    setOutdoorTimeOfDay: (value) => {
      const clamped = Math.max(0, Math.min(1, value))
      set((state) => ({ ...state, outdoorTimeOfDay: clamped }))
    },
    setOutdoorTerrainDensity: (value) => {
      set((state) => {
        if (state.outdoorTerrainDensity === value) {
          return state
        }

        return {
          ...state,
          outdoorTerrainDensity: value,
          outdoorTerrainProfiles: {
            ...state.outdoorTerrainProfiles,
            [state.outdoorTerrainType]: {
              ...getOutdoorTerrainProfile(state.outdoorTerrainType, state.outdoorTerrainProfiles),
              density: value,
            },
          },
        }
      })
    },
    setOutdoorTerrainType: (value) => {
      set((state) => {
        if (state.outdoorTerrainType === value) {
          return state
        }

        const nextProfile = getOutdoorTerrainProfile(value, state.outdoorTerrainProfiles)
        return {
          ...state,
          outdoorTerrainType: value,
          outdoorTerrainDensity: nextProfile.density,
          outdoorOverpaintRegenerate: nextProfile.overpaintRegenerate,
        }
      })
    },
    setOutdoorOverpaintRegenerate: (value) => {
      set((state) => {
        if (state.outdoorOverpaintRegenerate === value) {
          return state
        }

        return {
          ...state,
          outdoorOverpaintRegenerate: value,
          outdoorTerrainProfiles: {
            ...state.outdoorTerrainProfiles,
            [state.outdoorTerrainType]: {
              ...getOutdoorTerrainProfile(state.outdoorTerrainType, state.outdoorTerrainProfiles),
              overpaintRegenerate: value,
            },
          },
        }
      })
    },
    setOutdoorBrushMode: (value) => {
      set((state) => (state.outdoorBrushMode === value ? state : { ...state, outdoorBrushMode: value }))
    },
    setOutdoorTerrainSculptMode: (value) => {
      set((state) => (state.outdoorTerrainSculptMode === value
        ? state
        : { ...state, outdoorTerrainSculptMode: value }))
    },
    setDefaultOutdoorTerrainStyle: (value) => {
      set((state) => (state.defaultOutdoorTerrainStyle === value
        ? state
        : { ...state, defaultOutdoorTerrainStyle: value }))
    },
    setOutdoorTerrainStyleBrush: (value) => {
      set((state) => (state.outdoorTerrainStyleBrush === value
        ? state
        : { ...state, outdoorTerrainStyleBrush: value }))
    },
    setShowGrid: (show) => {
      set((state) => ({ ...state, showGrid: show }))
    },
    setShowLosDebugMask: (show) => {
      set((state) => ({ ...state, showLosDebugMask: show }))
    },
    setShowLosDebugRays: (show) => {
      set((state) => ({ ...state, showLosDebugRays: show }))
    },
    setShowLensFocusDebugPoint: (show) => {
      set((state) => ({ ...state, showLensFocusDebugPoint: show }))
    },
    setShowChunkDebugOverlay: (show) => {
      set((state) => ({ ...state, showChunkDebugOverlay: show }))
    },
    setShowProjectionDebugMesh: (show) => {
      set((state) => ({ ...state, showProjectionDebugMesh: show }))
    },
    setShowPropProbeDebug: (show) => {
      set((state) => ({ ...state, showPropProbeDebug: show }))
    },
    setSlowBuildAnimationDebug: (show) => {
      set((state) => ({ ...state, slowBuildAnimationDebug: show }))
    },
    setBuildPerformanceTracingEnabled: (show) => {
      set((state) => ({ ...state, buildPerformanceTracingEnabled: show }))
    },
    setLightEffectsEnabled: (enabled) => {
      set((state) => ({ ...state, lightEffectsEnabled: enabled }))
    },
    setLightFlickerEnabled: (enabled) => {
      set((state) => ({ ...state, lightFlickerEnabled: enabled }))
    },
    setParticleEffectsEnabled: (enabled) => {
      set((state) => ({ ...state, particleEffectsEnabled: enabled }))
    },
    setFloorViewMode: (mode) => {
      set((state) => (state.floorViewMode === mode ? state : { ...state, floorViewMode: mode }))
    },
    setFpsLimit: (limit) => {
      set((state) => ({ ...state, fpsLimit: limit }))
    },
    setCameraPreset: (preset) => {
      set((state) => ({ ...state, cameraPreset: preset, activeCameraMode: preset }))
    },
    clearCameraPreset: () => {
      set((state) => ({ ...state, cameraPreset: null }))
    },
  }
}
