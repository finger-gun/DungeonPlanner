import { describe, expect, it } from 'vitest'
import {
  MAX_OBJECT_INSTANCE_SCALE,
  MIN_OBJECT_INSTANCE_SCALE,
  getObjectInstanceScale,
  getObjectTintColor,
  withObjectInstanceScale,
  withObjectTintColor,
} from './objectAppearance'

describe('objectAppearance', () => {
  it('defaults missing object scale to 1', () => {
    expect(getObjectInstanceScale({})).toBe(1)
  })

  it('clamps stored object scale values into the supported range', () => {
    expect(getObjectInstanceScale({ instanceScale: MIN_OBJECT_INSTANCE_SCALE - 1 })).toBe(MIN_OBJECT_INSTANCE_SCALE)
    expect(getObjectInstanceScale({ instanceScale: MAX_OBJECT_INSTANCE_SCALE + 1 })).toBe(MAX_OBJECT_INSTANCE_SCALE)
  })

  it('removes the scale override when resetting back to default', () => {
    expect(withObjectInstanceScale({ foo: 'bar', instanceScale: 1.5 }, 1)).toEqual({ foo: 'bar' })
  })

  it('stores and clears valid tint colors', () => {
    expect(withObjectTintColor({ foo: 'bar' }, '#AABBCC')).toEqual({
      foo: 'bar',
      tintColor: '#aabbcc',
    })
    expect(withObjectTintColor({ foo: 'bar', tintColor: '#aabbcc' }, null)).toEqual({ foo: 'bar' })
    expect(getObjectTintColor({ tintColor: '#aabbcc' })).toBe('#aabbcc')
    expect(getObjectTintColor({ tintColor: 'not-a-color' })).toBeNull()
  })
})
