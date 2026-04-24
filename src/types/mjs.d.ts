declare module '*.mjs' {
  export function getModelPackConfig(target: string): {
    derivedTextures?: Array<{
      source: string
      output: string
      phase?: string
      transcode?: string
      makeTileable?: boolean
      edgeBlendPx?: number
      sampleMode?: string
      sampleBandHeightPx?: number
      outputSize?: number
      sampleStripUv?: {
        minU: number
        maxU: number
        v: number
      }
    }>
  } | null
  export function createTiledStripTexture(
    data: Uint8Array | Uint8ClampedArray,
    width: number,
    height: number,
    channels?: number,
    outputWidth?: number,
    outputHeight?: number,
  ): Uint8ClampedArray
  export function makeTextureTileable(
    data: Uint8Array | Uint8ClampedArray,
    width: number,
    height: number,
    channels?: number,
    edgeBlendPx?: number,
  ): Uint8ClampedArray
  export function formatBytes(bytes: number): string
  export function isThumbnailForModel(filePath: string, modelBaseNames: Set<string>): boolean
  export function resolvePackSourceDir(
    target: string,
    source?: string | null,
    env?: Record<string, string | undefined>,
  ): string | null
  export function resolvePackDir(target: string): string
  export function getPreservedArtifactPaths(targetDir: string): Set<string>
  export function collectLocalArtifactPathsFromGltf(
    json: {
      buffers?: Array<{ uri?: string }>
      images?: Array<{ uri?: string }>
    },
    modelDir: string,
    modelPath: string,
  ): string[]
}
