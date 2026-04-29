import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { createGeneratedStandeeCardSurfaceGeometry } from './GeneratedStandeeMeshes'

describe('GeneratedStandeeMeshes', () => {
  it('mirrors card surface UVs horizontally for reverse-side standees', () => {
    const frontGeometry = createGeneratedStandeeCardSurfaceGeometry(1.2, 2.4, false)
    const backGeometry = createGeneratedStandeeCardSurfaceGeometry(1.2, 2.4, true)

    try {
      const frontUv = frontGeometry.getAttribute('uv') as THREE.BufferAttribute
      const backUv = backGeometry.getAttribute('uv') as THREE.BufferAttribute

      expect(backUv.count).toBe(frontUv.count)

      for (let index = 0; index < frontUv.count; index += 1) {
        expect(backUv.getX(index)).toBeCloseTo(1 - frontUv.getX(index))
        expect(backUv.getY(index)).toBeCloseTo(frontUv.getY(index))
      }
    } finally {
      frontGeometry.dispose()
      backGeometry.dispose()
    }
  })
})
