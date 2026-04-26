import { describe, expect, it } from 'vitest'
import { extendOpenPassageBrush } from './openPassageBrush'

describe('extendOpenPassageBrush', () => {
  it('adds a valid wall segment once', () => {
    expect(extendOpenPassageBrush([], '2:3:east')).toEqual(['2:3:east'])
  })

  it('ignores invalid placements and duplicates', () => {
    const initial = ['2:3:east']

    expect(extendOpenPassageBrush(initial, '2:3:east')).toEqual(initial)
    expect(extendOpenPassageBrush(initial, null)).toEqual(initial)
  })
})
