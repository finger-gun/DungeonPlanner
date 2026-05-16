export type DragonbaneContentRef =
  `${string}:${'kin' | 'profession' | 'skill' | 'rule' | 'weapon' | 'armor'}.${string}`

export type ParsedDragonbaneContentRef = {
  ref: DragonbaneContentRef
  packId: string
  domain: DragonbaneContentRefDomain
  localId: string
}

export type DragonbaneContentRefDomain =
  | 'kin'
  | 'profession'
  | 'skill'
  | 'rule'
  | 'weapon'
  | 'armor'

const CONTENT_REF_PATTERN =
  /^([a-z0-9][a-z0-9-]*):(kin|profession|skill|rule|weapon|armor)\.([a-z0-9][a-z0-9._-]*)$/i

export function createDragonbaneContentRef(
  packId: string,
  domain: DragonbaneContentRefDomain,
  localId: string,
): DragonbaneContentRef {
  const normalizedPackId = normalizeDragonbanePackId(packId)
  const normalizedLocalId = normalizeDragonbaneLocalId(localId)

  if (!normalizedPackId || !normalizedLocalId) {
    throw new Error('Dragonbane content refs require a pack id and local id.')
  }

  return `${normalizedPackId}:${domain}.${normalizedLocalId}` as DragonbaneContentRef
}

export function parseDragonbaneContentRef(ref: string): ParsedDragonbaneContentRef | null {
  const match = CONTENT_REF_PATTERN.exec(ref.trim())

  if (!match) {
    return null
  }

  return {
    ref: `${match[1]}:${match[2]}.${match[3]}` as DragonbaneContentRef,
    packId: match[1],
    domain: match[2] as DragonbaneContentRefDomain,
    localId: match[3],
  }
}

export function normalizeDragonbaneContentRef(
  ref: string,
  domain: DragonbaneContentRefDomain,
  fallbackPackId?: string,
): DragonbaneContentRef | null {
  const trimmedRef = ref.trim()
  const parsed = parseDragonbaneContentRef(trimmedRef)

  if (parsed) {
    return parsed.domain === domain ? parsed.ref : null
  }

  const separatorIndex = trimmedRef.indexOf('.')
  if (separatorIndex > 0 && separatorIndex < trimmedRef.length - 1) {
    const packId = normalizeDragonbanePackId(trimmedRef.slice(0, separatorIndex))
    const localId = normalizeDragonbaneLocalId(trimmedRef.slice(separatorIndex + 1))
    return packId && localId ? createDragonbaneContentRef(packId, domain, localId) : null
  }

  if (!fallbackPackId) {
    return null
  }

  const localId = normalizeDragonbaneLocalId(trimmedRef)
  return localId ? createDragonbaneContentRef(fallbackPackId, domain, localId) : null
}

export function normalizeDragonbanePackId(packId: string) {
  return packId.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
}

export function normalizeDragonbaneLocalId(localId: string) {
  return localId.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '')
}
