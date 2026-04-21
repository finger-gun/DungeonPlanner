import { describe, expect, it } from 'vitest'
import {
  shouldRotateSelectionFromShortcut,
  supportsPlacementRotationShortcut,
} from './rotationShortcuts'

describe('rotationShortcuts', () => {
  it('reserves selected-object rotation for select mode', () => {
    expect(shouldRotateSelectionFromShortcut('select')).toBe(true)
    expect(shouldRotateSelectionFromShortcut('prop')).toBe(false)
    expect(shouldRotateSelectionFromShortcut('character')).toBe(false)
  })

  it('allows placement rotation in active placement tools', () => {
    expect(supportsPlacementRotationShortcut({
      tool: 'prop',
      isUnifiedSurfaceMode: false,
      isUnifiedOpeningMode: false,
      isFloorOpeningMode: false,
      isWallOpeningMode: false,
    })).toBe(true)

    expect(supportsPlacementRotationShortcut({
      tool: 'prop',
      isUnifiedSurfaceMode: false,
      isUnifiedOpeningMode: true,
      isFloorOpeningMode: true,
      isWallOpeningMode: false,
    })).toBe(true)
  })

  it('blocks placement rotation in non-placement asset modes', () => {
    expect(supportsPlacementRotationShortcut({
      tool: 'prop',
      isUnifiedSurfaceMode: true,
      isUnifiedOpeningMode: false,
      isFloorOpeningMode: false,
      isWallOpeningMode: false,
    })).toBe(false)

    expect(supportsPlacementRotationShortcut({
      tool: 'select',
      isUnifiedSurfaceMode: false,
      isUnifiedOpeningMode: false,
      isFloorOpeningMode: false,
      isWallOpeningMode: false,
    })).toBe(false)
  })
})
