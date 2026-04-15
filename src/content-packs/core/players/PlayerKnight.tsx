/* eslint-disable react-refresh/only-export-components */
import playerKnightAssetUrl from '../../../assets/models/core/player-knight.glb'
import playerKnightThumbnailUrl from '../../../assets/models/core/player-knight.png'
import type { ContentPackComponentProps } from '../../types'
import {
  AnimatedRigMediumPlayer,
  createRigMediumPlayerAsset,
  preloadAnimatedRigMediumPlayer,
} from './AnimatedRigMediumPlayer'

export function PlayerKnight(props: ContentPackComponentProps) {
  return <AnimatedRigMediumPlayer assetUrl={playerKnightAssetUrl} {...props} />
}

preloadAnimatedRigMediumPlayer(playerKnightAssetUrl)

export const playerKnightAsset = createRigMediumPlayerAsset({
  id: 'core.player_knight',
  slug: 'player_knight',
  name: 'Knight',
  assetUrl: playerKnightAssetUrl,
  thumbnailUrl: playerKnightThumbnailUrl,
  Component: PlayerKnight,
})
