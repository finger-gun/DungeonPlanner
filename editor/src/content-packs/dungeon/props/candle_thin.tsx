import { useMemo } from 'react'
import type { ContentPackComponentProps } from '../../types'
import { useGLTF } from '../../../rendering/useGLTF'
import { cloneSceneWithNodeMaterials } from '../../../rendering/nodeMaterialUtils'
import { remapSceneUvCells, resolveAtlasColorSwatchVariant } from '../../shared/atlasColorVariants'
import { createDungeonAsset, resolveDungeonModelAssetUrl } from '../shared/createDungeonAsset'
import { createDungeonFlameEffectGetter, createDungeonFlameLightGetter } from '../shared/flame'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'
import {
  DUNGEON_COLOR_ATLAS_COLUMNS,
  DUNGEON_COLOR_ATLAS_ROWS,
  DUNGEON_COLOR_SWATCHES,
} from '../shared/dungeonColorAtlas'

const UNLIT_MODEL_NAME = 'candle_thin'
const LIT_MODEL_NAME = 'candle_thin_lit'
const CANDLE_THIN_COLOR_SOURCE_CELLS = [[0, 3]] as const
const unlitAssetUrl = resolveDungeonModelAssetUrl(UNLIT_MODEL_NAME)
const litAssetUrl = resolveDungeonModelAssetUrl(LIT_MODEL_NAME)

function DungeonCandleThinVariant({ objectProps, ...props }: ContentPackComponentProps) {
  const lit = objectProps?.lit !== false
  const modelUrl = lit ? litAssetUrl : unlitAssetUrl
  const selectedCell = resolveAtlasColorSwatchVariant(
    objectProps?.colorVariant,
    'ivory',
    DUNGEON_COLOR_SWATCHES,
  ).cell
  const gltf = useGLTF(modelUrl)
  const scene = useMemo(() => {
    const clone = cloneSceneWithNodeMaterials(gltf.scene)
    remapSceneUvCells(clone, [...CANDLE_THIN_COLOR_SOURCE_CELLS], selectedCell, {
      columns: DUNGEON_COLOR_ATLAS_COLUMNS,
      rows: DUNGEON_COLOR_ATLAS_ROWS,
    })
    return clone
  }, [gltf.scene, selectedCell])

  return (
    <group {...props}>
      <group
        position={DUNGEON_PROP_TRANSFORM.position}
        rotation={DUNGEON_PROP_TRANSFORM.rotation}
        scale={DUNGEON_PROP_TRANSFORM.scale}
      >
        <primitive object={scene} />
      </group>
    </group>
  )
}

useGLTF.preload(unlitAssetUrl)
useGLTF.preload(litAssetUrl)

export const dungeonCandleThinAsset = createDungeonAsset({
  id: 'dungeon.props_candle_thin',
  slug: 'dungeon-props-candle-thin',
  name: 'Dungeon Candle Thin',
  category: 'prop',
  modelName: UNLIT_MODEL_NAME,
  transform: DUNGEON_PROP_TRANSFORM,
  Component: DungeonCandleThinVariant,
  metadata: {
    atlasColorVariants: {
      propKey: 'colorVariant',
      defaultVariantId: 'ivory',
      variants: DUNGEON_COLOR_SWATCHES,
    },
    snapsTo: 'FREE',
    connectors: [
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
      {
        point: [0, 0, 0],
        type: 'SURFACE',
      },
    ],
    blocksLineOfSight: false,
  },
  getLight: createDungeonFlameLightGetter({
    defaultLit: true,
    light: {
      intensity: 0.7,
      distance: 4,
      offset: [0, 0.74, 0],
    },
  }),
  getEffect: createDungeonFlameEffectGetter({
    defaultLit: true,
    emitters: [{ offset: [0, 0.42, 0], scale: 0.24, intensity: 0.58 }],
  }),
  getPlayModeNextProps: (objectProps) => {
    const lit = objectProps.lit !== false
    return { lit: !lit }
  },
})
