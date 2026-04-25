import { useMemo } from 'react'
import type { ContentPackComponentProps, ContentPackModelTransform } from '../../types'
import { useGLTF } from '../../../rendering/useGLTF'
import { cloneSceneWithNodeMaterials } from '../../../rendering/nodeMaterialUtils'
import { createDungeonAsset, resolveDungeonModelAssetUrl } from '../shared/createDungeonAsset'
import { createDungeonFlameEffectGetter, createDungeonFlameLightGetter } from '../shared/flame'

const transform: ContentPackModelTransform = {
  position: [0, 0.35, 0],
  rotation: [0, 0, 0],
  scale: 1,
}

const UNLIT_MODEL_NAME = 'torch'
const LIT_MODEL_NAME = 'torch_lit'
const unlitAssetUrl = resolveDungeonModelAssetUrl(UNLIT_MODEL_NAME)
const litAssetUrl = resolveDungeonModelAssetUrl(LIT_MODEL_NAME)

function DungeonTorchVariant({ objectProps, ...props }: ContentPackComponentProps) {
  const lit = objectProps?.lit !== false
  const modelUrl = lit ? litAssetUrl : unlitAssetUrl
  const gltf = useGLTF(modelUrl)
  const scene = useMemo(() => cloneSceneWithNodeMaterials(gltf.scene), [gltf.scene])

  return (
    <group {...props}>
      <group
        position={transform.position}
        rotation={transform.rotation}
        scale={transform.scale}
      >
        <primitive object={scene} />
      </group>
    </group>
  )
}

useGLTF.preload(unlitAssetUrl)
useGLTF.preload(litAssetUrl)

export const dungeonTorchAsset = createDungeonAsset({
  id: 'dungeon.props_torch',
  slug: 'dungeon-props-torch',
  name: 'Dungeon Torch',
  category: 'prop',
  modelName: UNLIT_MODEL_NAME,
  transform,
  Component: DungeonTorchVariant,
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
  getLight: createDungeonFlameLightGetter({ defaultLit: true }),
  getEffect: createDungeonFlameEffectGetter({
    defaultLit: true,
    emitters: [{ offset: [0, 0.6, 0], scale: 1.1, intensity: 1.1 }],
  }),
  getPlayModeNextProps: (objectProps) => {
    const lit = objectProps.lit !== false
    return { lit: !lit }
  },
})
