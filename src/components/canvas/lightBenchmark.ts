import type { DungeonObjectRecord } from '../../store/useDungeonStore'

const LIGHT_BENCHMARK_SPACING = 2.5

export function createSyntheticLightBenchmarkObjects(count: number): DungeonObjectRecord[] {
  const safeCount = Math.max(0, Math.floor(count))
  if (safeCount === 0) {
    return []
  }

  const columns = Math.max(1, Math.ceil(Math.sqrt(safeCount)))
  const halfSpan = (columns - 1) * LIGHT_BENCHMARK_SPACING * 0.5

  return Array.from({ length: safeCount }, (_, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    const x = column * LIGHT_BENCHMARK_SPACING - halfSpan
    const z = row * LIGHT_BENCHMARK_SPACING - halfSpan
    const roundedX = Number(x.toFixed(4))
    const roundedZ = Number(z.toFixed(4))

    return {
      id: `benchmark-light:${index}`,
      type: 'prop',
      assetId: 'core.props_wall_torch',
      position: [roundedX, 0, roundedZ],
      rotation: [0, 0, 0],
      props: { lit: true, benchmarkOnly: true },
      cell: [column, row],
      cellKey: `${column},${row}:floor`,
      layerId: 'benchmark-layer',
    }
  })
}
