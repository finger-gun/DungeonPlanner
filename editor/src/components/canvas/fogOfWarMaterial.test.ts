import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { int, uniform, vec4 } from 'three/tsl'
import { createStandardCompatibleMaterial } from '../../rendering/nodeMaterialUtils'
import { applyFogOfWarToMaterial } from './fogOfWar'

type TestNodeMaterial = THREE.Material & {
  isNodeMaterial?: boolean
  colorNode?: unknown
  emissiveNode?: unknown
  metalnessNode?: unknown
  roughnessNode?: unknown
  opacityNode?: unknown
  alphaTest?: number
  needsUpdate?: boolean
  userData: Record<string, unknown>
}

function createRuntimeStub() {
  return {
    occupancy: { element: () => int(0) },
    exploredStates: { element: () => int(1) },
    visibilityMasks: [{ sample: () => vec4(1, 1, 1, 1) }],
    visibilityMaskTextures: [],
    visibilityMaskComputes: [],
    playerOrigins: [uniform(new THREE.Vector2(0, 0))],
    minCellX: uniform(0),
    minCellZ: uniform(0),
    width: uniform(1),
    height: uniform(1),
    cellSize: uniform(1),
    minWorldX: uniform(0),
    minWorldZ: uniform(0),
    occupancyWidth: uniform(1),
    occupancyHeight: uniform(1),
    occupancyCellSize: uniform(1),
    originCount: uniform(1),
    visionRadius: uniform(8),
    visionEdge: uniform(1),
  }
}

describe('fogOfWar material reuse', () => {
  it('reuses cached fog nodes when the fog signature is unchanged', () => {
    const material = createStandardCompatibleMaterial({
      color: '#ffffff',
      roughness: 0.4,
      metalness: 0.1,
    }) as TestNodeMaterial
    const runtime = createRuntimeStub()

    material.isNodeMaterial = true

    applyFogOfWarToMaterial(material, runtime as never, {
      variant: 'floor',
      useCellAttribute: true,
    })

    const firstColorNode = material.colorNode
    const firstOpacityNode = material.opacityNode
    material.needsUpdate = false

    applyFogOfWarToMaterial(material, runtime as never, {
      variant: 'floor',
      useCellAttribute: true,
    })

    expect(material.colorNode).toBe(firstColorNode)
    expect(material.opacityNode).toBe(firstOpacityNode)
    expect(material.needsUpdate).not.toBe(true)
  })
})
