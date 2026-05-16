import { ConvexError } from 'convex/values'
import { normalizeDragonbaneCharacterSheet } from '@dungeonplanner/shared/dragonbane/characterSheet'

export function normalizePersistedCharacterSheet(sheet: unknown) {
  if (!isDragonbaneSheetPayload(sheet)) {
    return sheet
  }

  const dragonbaneSheet = normalizeDragonbaneCharacterSheet(sheet)
  if (!dragonbaneSheet) {
    throw new ConvexError('Invalid Dragonbane character sheet.')
  }
  return dragonbaneSheet
}

function isDragonbaneSheetPayload(sheet: unknown): sheet is { system?: unknown } {
  return typeof sheet === 'object' && sheet !== null && 'system' in sheet && sheet.system === 'dragonbane'
}
