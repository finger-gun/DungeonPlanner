const WEBGPU_REQUIRED_MESSAGE =
  'DungeonPlanner requires WebGPU. Use a browser and GPU driver with WebGPU enabled.'

export function isWebGpuSupported() {
  return typeof navigator !== 'undefined' && navigator.gpu !== undefined
}

export function requireWebGpu() {
  if (!isWebGpuSupported()) {
    throw new Error(WEBGPU_REQUIRED_MESSAGE)
  }

  return navigator.gpu
}

export function getWebGpuSupportMessage(error?: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return WEBGPU_REQUIRED_MESSAGE
}
