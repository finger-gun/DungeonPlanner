/* eslint-disable react-refresh/only-export-components */
import playerBarbarianAssetUrl from '../../../assets/models/core/player-barbarian.glb'
import playerBarbarianThumbnailUrl from '../../../assets/models/core/player-barbarian.png'
import type { ContentPackComponentProps } from '../../types'
import {
  AnimatedRigMediumPlayer,
  createRigMediumPlayerAsset,
  preloadAnimatedRigMediumPlayer,
} from './AnimatedRigMediumPlayer'

export function PlayerBarbarian(props: ContentPackComponentProps) {
  return <AnimatedRigMediumPlayer assetUrl={playerBarbarianAssetUrl} {...props} />
}

preloadAnimatedRigMediumPlayer(playerBarbarianAssetUrl)

export const playerBarbarianAsset = createRigMediumPlayerAsset({
  id: 'core.player_barbarian',
  slug: 'player_barbarian',
  name: 'Barbarian',
  assetUrl: playerBarbarianAssetUrl,
  thumbnailUrl: playerBarbarianThumbnailUrl,
  Component: PlayerBarbarian,
})
