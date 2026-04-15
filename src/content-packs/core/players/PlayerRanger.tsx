/* eslint-disable react-refresh/only-export-components */
import playerRangerAssetUrl from '../../../assets/models/core/player-ranger.glb'
import playerRangerThumbnailUrl from '../../../assets/models/core/player-ranger.png'
import type { ContentPackComponentProps } from '../../types'
import {
  AnimatedRigMediumPlayer,
  createRigMediumPlayerAsset,
  preloadAnimatedRigMediumPlayer,
} from './AnimatedRigMediumPlayer'

export function PlayerRanger(props: ContentPackComponentProps) {
  return <AnimatedRigMediumPlayer assetUrl={playerRangerAssetUrl} {...props} />
}

preloadAnimatedRigMediumPlayer(playerRangerAssetUrl)

export const playerRangerAsset = createRigMediumPlayerAsset({
  id: 'core.player_ranger',
  slug: 'player_ranger',
  name: 'Ranger',
  assetUrl: playerRangerAssetUrl,
  thumbnailUrl: playerRangerThumbnailUrl,
  Component: PlayerRanger,
})
