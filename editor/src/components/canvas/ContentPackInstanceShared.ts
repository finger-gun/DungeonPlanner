type ContentPackInstanceVariant = 'floor' | 'wall' | 'prop'

export function buildPropDescriptorKey({
  assetId,
  assetPath,
  hasComponent,
  objectProps,
  variant,
  variantKey,
}: {
  assetId: string | null
  assetPath?: string
  hasComponent: boolean
  objectProps?: Record<string, unknown>
  variant: ContentPackInstanceVariant
  variantKey?: string
}) {
  if (variant !== 'prop') {
    return null
  }

  if (hasComponent) {
    return [
      'component',
      assetId ?? 'unknown',
      variantKey ?? 'default',
      stableSerializeDescriptorProps(objectProps),
    ].join(':')
  }

  if (assetPath) {
    return `gltf:${assetPath}`
  }

  return [
    'fallback',
    assetId ?? 'unknown',
    variantKey ?? 'default',
  ].join(':')
}

function stableSerializeDescriptorProps(objectProps?: Record<string, unknown>) {
  return JSON.stringify(objectProps ?? null, (_key, value) => {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      return value
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey)),
    )
  })
}
