import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import {
  createWebGpuCompatibleGeometry,
  getWebGpuCompatibleGeometryTemplate,
} from './webgpuGeometry'

describe('webgpuGeometry', () => {
  it('reuses one normalized template per source geometry', () => {
    const sourceGeometry = new THREE.BufferGeometry()
    sourceGeometry.setAttribute(
      'position',
      new THREE.Int16BufferAttribute([
        -32767, 0, -32767,
        32767, 0, -32767,
        32767, 0, 32767,
      ], 3, true),
    )

    const templateA = getWebGpuCompatibleGeometryTemplate(sourceGeometry)
    const templateB = getWebGpuCompatibleGeometryTemplate(sourceGeometry)

    expect(templateA).toBe(templateB)
    expect(templateA).not.toBe(sourceGeometry)
    expect(templateA.getAttribute('position').array).toBeInstanceOf(Float32Array)

    sourceGeometry.dispose()
    templateA.dispose()
  })

  it('clones cached templates before applying placement transforms', () => {
    const sourceGeometry = new THREE.BoxGeometry(1, 1, 1)
    const transform = new THREE.Matrix4().makeTranslation(2, 0, 0)
    const template = getWebGpuCompatibleGeometryTemplate(sourceGeometry)

    const geometryA = createWebGpuCompatibleGeometry(sourceGeometry, transform)
    const geometryB = createWebGpuCompatibleGeometry(sourceGeometry, transform)

    expect(geometryA).not.toBe(geometryB)

    geometryA.computeBoundingBox()
    geometryB.computeBoundingBox()
    expect(geometryA.boundingBox?.min.x).toBeCloseTo(1.5)
    expect(geometryB.boundingBox?.min.x).toBeCloseTo(1.5)

    sourceGeometry.dispose()
    template.dispose()
    geometryA.dispose()
    geometryB.dispose()
  })
})
