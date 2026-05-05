import type { TileUploadBudget } from '../../rendering/gpu/TileGpuUploadScheduler'

export { getTileGpuStreamMountId } from '../../rendering/gpu/TileGpuStream'

export function getTileStreamUploadBudget(isInteractionActive: boolean): TileUploadBudget {
  return isInteractionActive
    ? { maxMs: 0.5, maxPages: 1 }
    : { maxMs: 2, maxPages: 1 }
}
