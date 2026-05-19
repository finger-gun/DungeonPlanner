import { buildBakedLightFieldPipelineSignature } from './batchDescriptors'
import type { StaticTileEntry } from './tileEntries'

export function buildChunkEntrySignature(entries: readonly StaticTileEntry[]) {
  return entries.map((entry) => [
    entry.key,
    entry.assetId,
    entry.position.join(','),
    entry.rotation.join(','),
    entry.variant,
    entry.variantKey ?? '',
    entry.visibility,
    entry.buildAnimationStart ?? '',
    entry.buildAnimationDelay ?? '',
    entry.buildAnimationDirection ?? '',
    entry.fogCell?.join(',') ?? '',
    entry.bakedLight?.join(',') ?? '',
    buildBakedLightFieldPipelineSignature(entry.bakedLightField),
    entry.bakedLightDirection?.join(',') ?? '',
    entry.bakedLightDirectionSecondary?.join(',') ?? '',
    JSON.stringify(entry.objectProps ?? null),
  ].join('|')).join(';')
}
