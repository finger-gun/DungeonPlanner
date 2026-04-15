/* eslint-disable react-refresh/only-export-components */
import playerMageAssetUrl from '../../../assets/models/core/player-mage.glb'
import playerMageThumbnailUrl from '../../../assets/models/core/player-mage.png'
import type { ContentPackComponentProps } from '../../types'
import {
  AnimatedRigMediumPlayer,
  createRigMediumPlayerAsset,
  preloadAnimatedRigMediumPlayer,
} from './AnimatedRigMediumPlayer'

export function PlayerMage(props: ContentPackComponentProps) {
  return <AnimatedRigMediumPlayer assetUrl={playerMageAssetUrl} {...props} />
}

preloadAnimatedRigMediumPlayer(playerMageAssetUrl)

export const playerMageAsset = createRigMediumPlayerAsset({
  id: 'core.player_mage',
  slug: 'player_mage',
  name: 'Mage',
  assetUrl: playerMageAssetUrl,
  thumbnailUrl: playerMageThumbnailUrl,
  Component: PlayerMage,
})
