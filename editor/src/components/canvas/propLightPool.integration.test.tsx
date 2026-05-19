import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { PropLightPool } from './propLightPool'
import type { RegisteredLightSource } from './objectSourceRegistry'

const sceneRef = vi.hoisted(() => ({ current: null as THREE.Scene | null }))
const cameraRef = vi.hoisted(() => ({ current: null as THREE.PerspectiveCamera | null }))
const invalidateMock = vi.hoisted(() => vi.fn())
const registeredLightSourcesMock = vi.hoisted(() => [] as RegisteredLightSource[])
const useFrameMock = vi.hoisted(() => vi.fn())
const requestContinuousRenderMock = vi.hoisted(() => vi.fn())
const releaseContinuousRenderMock = vi.hoisted(() => vi.fn())
const useDungeonStoreMock = vi.hoisted(() => (
  (selector: (state: {
    lightFlickerEnabled: boolean
    selection: string | null
    tool: string
    objectLightPreviewOverrides: Record<string, unknown>
  }) => unknown) => selector({
    lightFlickerEnabled: false,
    selection: null,
    tool: 'select',
    objectLightPreviewOverrides: {},
  })
))

vi.mock('@react-three/fiber', () => ({
  useThree: () => ({
    camera: cameraRef.current,
    invalidate: invalidateMock,
    scene: sceneRef.current,
  }),
  useFrame: (callback: unknown) => useFrameMock(callback),
}))

vi.mock('../../store/useDungeonStore', () => ({
  useDungeonStore: useDungeonStoreMock,
}))

vi.mock('../../store/buildAnimations', () => ({
  hasActiveBuildAnimations: () => false,
  useBuildAnimationVersion: () => 0,
}))

vi.mock('../../rendering/renderActivity', () => ({
  requestContinuousRender: requestContinuousRenderMock,
  releaseContinuousRender: releaseContinuousRenderMock,
}))

vi.mock('./effectAnimationMode', () => ({
  shouldRunContinuousSceneEffects: () => false,
}))

vi.mock('./objectSourceRegistry', () => ({
  useRegisteredLightSources: () => registeredLightSourcesMock,
}))

vi.mock('../../rendering/dungeonLightField', () => ({
  DEFAULT_DYNAMIC_LIGHT_POOL_SIZE: 32,
  resolveRegisteredLightSources: (sources: RegisteredLightSource[]) => sources.map((source) => ({
    ...source,
    position: source.object.position,
    linearColor: [1, 1, 1] as [number, number, number],
  })),
  classifyDynamicLightSources: ({ lightSources }: { lightSources: Array<RegisteredLightSource & { position: [number, number, number] }> }) => ({
    dynamicLightSources: lightSources,
  }),
}))

describe('PropLightPool integration', () => {
  beforeEach(() => {
    sceneRef.current = new THREE.Scene()
    cameraRef.current = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
    cameraRef.current.position.set(0, 4, 8)
    cameraRef.current.lookAt(0, 0, 0)
    cameraRef.current.updateMatrixWorld()
    cameraRef.current.updateProjectionMatrix()
    invalidateMock.mockClear()
    useFrameMock.mockClear()
    requestContinuousRenderMock.mockClear()
    releaseContinuousRenderMock.mockClear()
    registeredLightSourcesMock.splice(0, registeredLightSourcesMock.length)
    registeredLightSourcesMock.push({
      key: 'torch-1',
      object: {
        id: 'torch-1',
        type: 'prop',
        assetId: 'dungeon.props_torch',
        position: [1, 2, 3],
        rotation: [0, 0, 0],
        supportCellKey: '0:0',
        localRotation: null,
        localPosition: null,
        parentObjectId: null,
        props: {},
        cell: [0, 0],
        cellKey: '0:0:floor',
        layerId: 'default',
      },
      light: {
        color: '#ff9944',
        intensity: 1.5,
        distance: 8,
        decay: 2,
      },
    })
  })

  afterEach(() => {
    cleanup()
    sceneRef.current?.clear()
  })

  it('adds pooled point lights to the scene for registered torch lights', () => {
    render(
      <PropLightPool
        scopeKey="floor-1"
        visibility={{
          active: false,
          getCellVisibility: () => 'visible',
          getObjectVisibility: () => 'visible',
          getWallVisibility: () => 'visible',
          visibleCellKeys: [],
          playerOrigins: [],
        }}
        maxLights={1}
      />,
    )

    const pooledLights = sceneRef.current!.children.filter((child) => child instanceof THREE.PointLight) as THREE.PointLight[]

    expect(pooledLights).toHaveLength(1)
    expect(pooledLights[0]!.visible).toBe(true)
    expect(pooledLights[0]!.position.toArray()).toEqual([1, 2, 3])
    expect(pooledLights[0]!.intensity).toBe(1.5)
    expect(pooledLights[0]!.distance).toBe(8)
  })
})
