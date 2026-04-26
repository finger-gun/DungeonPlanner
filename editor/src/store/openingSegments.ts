export function getOpeningSegments(wallKey: string, width: 1 | 2 | 3): string[] {
  if (width === 1) return [wallKey]

  const parts = wallKey.split(':')
  const cx = Number.parseInt(parts[0] ?? '', 10)
  const cz = Number.parseInt(parts[1] ?? '', 10)
  const dir = parts[2]
  const isNS = dir === 'north' || dir === 'south'
  const halfLeft = Math.floor((width - 1) / 2)
  const segments: string[] = []

  for (let index = -halfLeft; index < -halfLeft + width; index += 1) {
    const nx = isNS ? cx + index : cx
    const nz = isNS ? cz : cz + index
    segments.push(`${nx}:${nz}:${dir}`)
  }

  return segments
}
