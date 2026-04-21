import { describe, expect, it } from 'vitest'
import { createSyntheticLightBenchmarkObjects } from './lightBenchmark'

describe('createSyntheticLightBenchmarkObjects', () => {
  it('returns the requested number of synthetic torch objects', () => {
    const objects = createSyntheticLightBenchmarkObjects(5)

    expect(objects).toHaveLength(5)
    expect(objects.every((object) => object.assetId === 'core.props_wall_torch')).toBe(true)
    expect(objects.every((object) => object.props.lit === true)).toBe(true)
  })

  it('returns an empty array for non-positive counts', () => {
    expect(createSyntheticLightBenchmarkObjects(0)).toEqual([])
    expect(createSyntheticLightBenchmarkObjects(-10)).toEqual([])
  })

  it('lays objects out on a stable centered grid', () => {
    const objects = createSyntheticLightBenchmarkObjects(4)

    expect(objects.map((object) => object.position)).toEqual([
      [-1.25, 0, -1.25],
      [1.25, 0, -1.25],
      [-1.25, 0, 1.25],
      [1.25, 0, 1.25],
    ])
  })
})
