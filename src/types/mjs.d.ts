declare module '*.mjs' {
  export function formatBytes(bytes: number): string
  export function isThumbnailForModel(filePath: string, modelBaseNames: Set<string>): boolean
  export function collectLocalArtifactPathsFromGltf(
    json: {
      buffers?: Array<{ uri?: string }>
      images?: Array<{ uri?: string }>
    },
    modelDir: string,
    modelPath: string,
  ): string[]
}
