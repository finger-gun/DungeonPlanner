let getWebGpuPostProcessingPrewarm: null | (() => boolean) = null

export function registerWebGpuPostProcessingPrewarmCallback(
  callback: null | (() => boolean),
) {
  getWebGpuPostProcessingPrewarm = callback
}

export function getWebGpuPostProcessingPrewarmCallback() {
  return getWebGpuPostProcessingPrewarm
}
