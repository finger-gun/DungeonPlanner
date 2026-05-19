import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  bendDoorCustomFrameGeometry,
  buildDoorCustomBendPath,
  isDoorCustomBendContextRenderable,
} from './door_custom_component'

describe('door_custom_component', () => {
  it('extends the bend path to the full custom door frame width', () => {
    const bendPath = buildDoorCustomBendPath({
      clearSpan: 1.04,
      spanSamples: [
        {
          position: [-0.52, 0, 0],
          tangent: [1, 0, 0],
          normal: [0, 0, 1],
          distance: 0,
        },
        {
          position: [0.52, 0, 0],
          tangent: [1, 0, 0],
          normal: [0, 0, 1],
          distance: 1.04,
        },
      ],
    }, {
      minX: -1.2,
      maxX: 1.2,
    }, 0.5)

    expect(bendPath).not.toBeNull()
    expect(bendPath?.[0]?.position[0]).toBeCloseTo(-1.2, 4)
    expect(bendPath?.at(-1)?.position[0]).toBeCloseTo(1.2, 4)
    expect(bendPath?.at(-1)?.distance).toBeCloseTo(2.4, 4)
  })

  it('bends frame geometry along curved local opening samples', () => {
    const bendPath = buildDoorCustomBendPath({
      clearSpan: 1.04,
      spanSamples: [
        {
          position: [-0.52, 0, -0.12],
          tangent: [0.98, 0, 0.2],
          normal: [-0.2, 0, 0.98],
          distance: 0,
        },
        {
          position: [0, 0, 0],
          tangent: [1, 0, 0],
          normal: [0, 0, 1],
          distance: 0.52,
        },
        {
          position: [0.52, 0, 0.12],
          tangent: [0.98, 0, 0.2],
          normal: [-0.2, 0, 0.98],
          distance: 1.04,
        },
      ],
    }, {
      minX: -1.2,
      maxX: 1.2,
    }, 0.5)

    expect(bendPath).not.toBeNull()

    const geometry = bendDoorCustomFrameGeometry(
      new THREE.BoxGeometry(2.4, 1.4, 0.4, 6, 1, 1),
      bendPath!,
      {
        minX: -1.2,
        maxX: 1.2,
      },
    )
    geometry.computeBoundingBox()

    expect(geometry.boundingBox).not.toBeNull()
    expect(geometry.boundingBox!.max.z).toBeGreaterThan(0.28)
    expect(geometry.boundingBox!.min.z).toBeLessThan(-0.28)
  })

  it('treats missing span samples as non-renderable bend context', () => {
    expect(isDoorCustomBendContextRenderable({
      clearSpan: 1.04,
      spanSamples: [],
    })).toBe(false)
  })
})
