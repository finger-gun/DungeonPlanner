declare module '*.mjs' {
  export function getModelPackConfig(target: string): {
    derivedTextures?: Array<{
      source: string
      output: string
      phase?: string
      transcode?: string
    }>
  } | null
  export function formatBytes(bytes: number): string
  export function isThumbnailForModel(filePath: string, modelBaseNames: Set<string>): boolean
  export function resolvePackSourceDir(
    target: string,
    source?: string | null,
    env?: Record<string, string | undefined>,
  ): string | null
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
