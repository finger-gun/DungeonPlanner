export type LegacyContentRef =
  | { kind: 'namespaced'; ref: string; packId: string; localId: string }
  | { kind: 'legacy-flat'; ref: string; packId: string | null; localId: string }
  | { kind: 'runtime-generated'; ref: string }

const NAMESPACED_CONTENT_REF_PATTERN = /^[a-z0-9][a-z0-9-]*:[a-z0-9][a-z0-9._-]*$/i
const GENERATED_CHARACTER_REF_PATTERN = /^generated\.player\./i

export function createContentRef(packId: string, localId: string) {
  const normalizedPackId = normalizePackId(packId)
  const normalizedLocalId = normalizeLocalId(localId)
  return `${normalizedPackId}:${normalizedLocalId}`
}

export function parseContentRef(ref: string): LegacyContentRef | null {
  const normalizedRef = ref.trim()

  if (!normalizedRef) {
    return null
  }

  if (GENERATED_CHARACTER_REF_PATTERN.test(normalizedRef)) {
    return {
      kind: 'runtime-generated',
      ref: normalizedRef,
    }
  }

  if (NAMESPACED_CONTENT_REF_PATTERN.test(normalizedRef)) {
    const separatorIndex = normalizedRef.indexOf(':')
    return {
      kind: 'namespaced',
      ref: normalizedRef,
      packId: normalizedRef.slice(0, separatorIndex),
      localId: normalizedRef.slice(separatorIndex + 1),
    }
  }

  const separatorIndex = normalizedRef.indexOf('.')
  if (separatorIndex > 0 && separatorIndex < normalizedRef.length - 1) {
    return {
      kind: 'legacy-flat',
      ref: normalizedRef,
      packId: normalizePackId(normalizedRef.slice(0, separatorIndex)),
      localId: normalizeLocalId(normalizedRef.slice(separatorIndex + 1)),
    }
  }

  return {
    kind: 'legacy-flat',
    ref: normalizedRef,
    packId: null,
    localId: normalizeLocalId(normalizedRef),
  }
}

export function normalizeContentRef(ref: string, fallbackPackId?: string) {
  const parsed = parseContentRef(ref)

  if (!parsed) {
    return null
  }

  if (parsed.kind === 'runtime-generated' || parsed.kind === 'namespaced') {
    return parsed.ref
  }

  if (parsed.packId) {
    return createContentRef(parsed.packId, parsed.localId)
  }

  if (fallbackPackId) {
    return createContentRef(fallbackPackId, parsed.localId)
  }

  return parsed.ref
}

export function normalizePackId(packId: string) {
  return packId.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
}

export function normalizeLocalId(localId: string) {
  return localId.trim().replace(/[^a-z0-9._-]+/gi, '_').replace(/^_+|_+$/g, '')
}
