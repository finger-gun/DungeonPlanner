import { getContentPackAssetById } from '../content-packs/registry'
import type { OpeningRecord } from './useDungeonStore'

const EMPTY_OPENING_PROPS: Record<string, unknown> = Object.freeze({})

export function getOpeningObjectProps(opening: OpeningRecord) {
  return opening.objectProps ?? EMPTY_OPENING_PROPS
}

export function isOpeningPassage(opening: OpeningRecord) {
  if (opening.assetId === null) {
    return true
  }

  return getContentPackAssetById(opening.assetId)?.metadata?.openingKind === 'passage'
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
