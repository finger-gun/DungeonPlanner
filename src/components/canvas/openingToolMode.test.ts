import { describe, expect, it } from 'vitest'
import { getOpeningToolMode } from './openingToolMode'

describe('getOpeningToolMode', () => {
  it('keeps floor-connected opening assets in floor placement only for door mode', () => {
    expect(getOpeningToolMode('door', { connectors: [{ type: 'FLOOR', point: [0, 0, 0] }] })).toBe('floor-asset')
    expect(getOpeningToolMode('open', { connectors: [{ type: 'FLOOR', point: [0, 0, 0] }] })).toBe('wall-connection')
    expect(getOpeningToolMode('wall', { connectors: [{ type: 'FLOOR', point: [0, 0, 0] }] })).toBe('wall-connection')
  })

  it('treats wall-connected assets as wall connections', () => {
    expect(getOpeningToolMode('door', { connectors: [{ type: 'WALL', point: [0, 0, 0] }] })).toBe('wall-connection')
    expect(getOpeningToolMode('open', { connectors: [{ type: 'WALL', point: [0, 0, 0] }] })).toBe('wall-connection')
  })

  it('still supports legacy connectsTo metadata while assets are migrating', () => {
    expect(getOpeningToolMode('door', { connectsTo: 'FLOOR' })).toBe('floor-asset')
  })
})
