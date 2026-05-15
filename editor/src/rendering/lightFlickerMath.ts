export const BAKED_FLICKER_COEFFICIENT_SCALE = 0.08

export function getStableLightPhase(key: string) {
  return hashToUnitFloat(key, 0) * Math.PI * 2
}

export function getStableLightFlickerCoefficients(key: string) {
  const primary = buildCenteredSignedCoefficientSet(key, 1)
  const primaryLength = Math.hypot(primary[0], primary[1], primary[2])
  if (primaryLength > 1e-4) {
    return [
      primary[0] / primaryLength,
      primary[1] / primaryLength,
      primary[2] / primaryLength,
    ] as const
  }

  const fallback = buildCenteredSignedCoefficientSet(key, 4)
  const fallbackLength = Math.hypot(fallback[0], fallback[1], fallback[2])
  if (fallbackLength > 1e-4) {
    return [
      fallback[0] / fallbackLength,
      fallback[1] / fallbackLength,
      fallback[2] / fallbackLength,
    ] as const
  }

  return [0.8164965809, -0.4082482904, -0.4082482904] as const
}

function hashToUnitFloat(key: string, salt: number) {
  let hash = 2166136261 ^ Math.imul(salt + 1, 2654435761)
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0) / 4294967296
}

function hashToSignedFloat(key: string, salt: number) {
  return hashToUnitFloat(key, salt) * 2 - 1
}

function buildCenteredSignedCoefficientSet(key: string, saltOffset: number) {
  const coefficient0 = hashToSignedFloat(key, saltOffset)
  const coefficient1 = hashToSignedFloat(key, saltOffset + 1)
  const coefficient2 = hashToSignedFloat(key, saltOffset + 2)
  const mean = (coefficient0 + coefficient1 + coefficient2) / 3

  return [
    coefficient0 - mean,
    coefficient1 - mean,
    coefficient2 - mean,
  ] as const
}
