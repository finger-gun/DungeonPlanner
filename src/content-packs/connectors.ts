import type { ConnectsTo, Connector, ContentPackAssetMetadata } from './types'

export function getMetadataConnectors(
  metadata?: ContentPackAssetMetadata,
): Connector[] {
  if (metadata?.connectors && metadata.connectors.length > 0) {
    return metadata.connectors as Connector[]
  }

  const connectsTo = metadata?.connectsTo ?? 'FLOOR'

  if (Array.isArray(connectsTo)) {
    return connectsTo.map((type) => ({
      point: [0, 0, 0] as const,
      type,
    }))
  }

  if (connectsTo === 'WALL') {
    return [{ point: [0, 0, 0], type: 'WALL' }]
  }

  if (connectsTo === 'SURFACE') {
    return [{ point: [0, 0, 0], type: 'SURFACE' }]
  }

  return [{ point: [0, 0, 0], type: 'FLOOR' }]
}

export function metadataSupportsConnectorType(
  metadata: ContentPackAssetMetadata | undefined,
  type: ConnectsTo,
) {
  return getMetadataConnectors(metadata).some((connector) => connector.type === type)
}
