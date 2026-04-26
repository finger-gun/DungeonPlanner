export function getTiledLightGridDimension(size: number, tileSize: number) {
  return Math.max(1, Math.floor(size / tileSize))
}

export function getTiledLightWorkgroupCount(width: number, height: number, tileSize: number) {
  return getTiledLightGridDimension(width, tileSize) * getTiledLightGridDimension(height, tileSize)
}
