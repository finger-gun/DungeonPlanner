/* eslint-disable react-refresh/only-export-components */
import playerRogueAssetUrl from '../../../assets/models/core/player-rogue.glb'
import playerRogueThumbnailUrl from '../../../assets/models/core/player-rogue.png'
import type { ContentPackComponentProps } from '../../types'
import {
  AnimatedRigMediumPlayer,
  createRigMediumPlayerAsset,
  preloadAnimatedRigMediumPlayer,
} from './AnimatedRigMediumPlayer'

export function PlayerRogue(props: ContentPackComponentProps) {
  return <AnimatedRigMediumPlayer assetUrl={playerRogueAssetUrl} {...props} />
}

preloadAnimatedRigMediumPlayer(playerRogueAssetUrl)

export const playerRogueAsset = createRigMediumPlayerAsset({
  id: 'core.player_rogue',
  slug: 'player_rogue',
  name: 'Rogue',
  assetUrl: playerRogueAssetUrl,
  thumbnailUrl: playerRogueThumbnailUrl,
  Component: PlayerRogue,
})
