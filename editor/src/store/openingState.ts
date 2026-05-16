import { getContentPackAssetById } from '../content-packs/registry'
import type { ContentPackWallStyleOpeningKind } from '../content-packs/types'
import type { OpeningRecord } from './useDungeonStore'

const EMPTY_OPENING_PROPS: Record<string, unknown> = Object.freeze({})

export function getOpeningObjectProps(opening: OpeningRecord) {
  return opening.objectProps ?? EMPTY_OPENING_PROPS
}

export function getOpeningKind(opening: Pick<OpeningRecord, 'assetId'>): ContentPackWallStyleOpeningKind {
  if (opening.assetId === null) {
    return 'passage'
  }

  const metadataKind = getContentPackAssetById(opening.assetId)?.metadata?.openingKind
  return metadataKind === 'passage' || metadataKind === 'window' ? metadataKind : 'door'
}

export function isOpeningPassage(opening: OpeningRecord) {
  return getOpeningKind(opening) === 'passage'
}

export function isOpeningOpen(opening: OpeningRecord) {
  return isOpeningPassage(opening) || opening.objectProps?.open === true
}

export function getOpeningPlayModeNextProps(opening: OpeningRecord) {
  if (!opening.assetId || isOpeningPassage(opening)) {
    return null
  }

  const asset = getContentPackAssetById(opening.assetId)
  return asset?.getPlayModeNextProps?.(getOpeningObjectProps(opening)) ?? null
}
