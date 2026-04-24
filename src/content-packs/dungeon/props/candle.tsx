import { useMemo } from 'react'
import type { ContentPackComponentProps } from '../../types'
import { useGLTF } from '../../../rendering/useGLTF'
import { cloneSceneWithNodeMaterials } from '../../../rendering/nodeMaterialUtils'
import { createDungeonAsset, resolveDungeonModelAssetUrl } from '../shared/createDungeonAsset'
import { createDungeonFlameEffectGetter, createDungeonFlameLightGetter } from '../shared/flame'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

const UNLIT_MODEL_NAME = 'candle'
const LIT_MODEL_NAME = 'candle_lit'
const unlitAssetUrl = resolveDungeonModelAssetUrl(UNLIT_MODEL_NAME)
const litAssetUrl = resolveDungeonModelAssetUrl(LIT_MODEL_NAME)

function DungeonCandleVariant({ objectProps, ...props }: ContentPackComponentProps) {
  const lit = objectProps?.lit !== false
  const modelUrl = lit ? litAssetUrl : unlitAssetUrl
  const gltf = useGLTF(modelUrl)
  const scene = useMemo(() => cloneSceneWithNodeMaterials(gltf.scene), [gltf.scene])

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

export const dungeonCandleAsset = createDungeonAsset({
  id: 'dungeon.props_candle',
  slug: 'dungeon-props-candle',
  name: 'Dungeon Candle',
  category: 'prop',
  modelName: UNLIT_MODEL_NAME,
  transform: DUNGEON_PROP_TRANSFORM,
  Component: DungeonCandleVariant,
  metadata: {
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
      intensity: 0.85,
      distance: 4.5,
      offset: [0, 0.58, 0],
    },
  }),
  getEffect: createDungeonFlameEffectGetter({
    defaultLit: true,
    emitters: [{ offset: [0, 0.4, 0], scale: 0.25, intensity: 0.72 }],
  }),
  getPlayModeNextProps: (objectProps) => {
    const lit = objectProps.lit !== false
    return { lit: !lit }
  },
})
