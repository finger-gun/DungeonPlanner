/* eslint-disable react-refresh/only-export-components */
import playerRogueHoodedAssetUrl from '../../../assets/models/core/player-rogue-hooded.glb'
import playerRogueHoodedThumbnailUrl from '../../../assets/models/core/player-rogue-hooded.png'
import type { ContentPackComponentProps } from '../../types'
import {
  AnimatedRigMediumPlayer,
  createRigMediumPlayerAsset,
  preloadAnimatedRigMediumPlayer,
} from './AnimatedRigMediumPlayer'

export function PlayerRogueHooded(props: ContentPackComponentProps) {
  return <AnimatedRigMediumPlayer assetUrl={playerRogueHoodedAssetUrl} {...props} />
}

preloadAnimatedRigMediumPlayer(playerRogueHoodedAssetUrl)

export const playerRogueHoodedAsset = createRigMediumPlayerAsset({
  id: 'core.player_rogue_hooded',
  slug: 'player_rogue_hooded',
  name: 'Rogue (Hooded)',
  assetUrl: playerRogueHoodedAssetUrl,
  thumbnailUrl: playerRogueHoodedThumbnailUrl,
  Component: PlayerRogueHooded,
})
