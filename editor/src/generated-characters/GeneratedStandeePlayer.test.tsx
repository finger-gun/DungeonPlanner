import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { GeneratedStandeePlayer } from './GeneratedStandeePlayer'
import type { GeneratedCharacterRecord } from './types'

const mockUseTexture = vi.fn()
const mockGeneratedStandeeBaseMesh = vi.fn((_: unknown) => <div data-testid="generated-standee-base-mesh" />)
const mockGeneratedStandeeCardSurfaceMesh = vi.fn((_: unknown) => <div data-testid="generated-standee-card-surface-mesh" />)
const mockGeneratedStandeeSilhouetteMesh = vi.fn((_: unknown) => <div data-testid="generated-standee-silhouette-mesh" />)

vi.mock('@react-three/drei', () => ({
  useTexture: (...args: unknown[]) => mockUseTexture(...args),
}))

vi.mock('./GeneratedStandeeMeshes', () => ({
  GeneratedStandeeBaseMesh: (props: unknown) => mockGeneratedStandeeBaseMesh(props),
  GeneratedStandeeCardSurfaceMesh: (props: unknown) => mockGeneratedStandeeCardSurfaceMesh(props),
  GeneratedStandeeSilhouetteMesh: (props: unknown) => mockGeneratedStandeeSilhouetteMesh(props),
}))

const TEST_CHARACTER: GeneratedCharacterRecord = {
  assetId: 'generated.player.test',
  storageId: 'storage-test',
  name: 'Generated Ranger',
  kind: 'player',
  prompt: 'A ranger on white background',
  model: 'x/z-image-turbo',
  size: 'M',
  originalImageUrl: 'data:image/png;base64,abc',
  processedImageUrl: 'data:image/png;base64,abc',
  alphaMaskUrl: 'data:image/png;base64,def',
  thumbnailUrl: 'data:image/png;base64,ghi',
  width: 300,
  height: 600,
  createdAt: '2026-04-16T00:00:00.000Z',
  updatedAt: '2026-04-16T00:00:00.000Z',
}

const TEST_NPC_CHARACTER: GeneratedCharacterRecord = {
  ...TEST_CHARACTER,
  assetId: 'generated.npc.test',
  kind: 'npc',
}

describe('GeneratedStandeePlayer', () => {
  beforeEach(() => {
    mockUseTexture.mockReset()
    mockGeneratedStandeeBaseMesh.mockClear()
    mockGeneratedStandeeCardSurfaceMesh.mockClear()
    mockGeneratedStandeeSilhouetteMesh.mockClear()
    mockUseTexture
      .mockReturnValueOnce(new THREE.Texture())
      .mockReturnValueOnce(new THREE.Texture())
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the back card surface as a rotated mirrored reverse side', () => {
    render(<GeneratedStandeePlayer character={TEST_CHARACTER} />)

    expect(mockGeneratedStandeeBaseMesh).toHaveBeenCalledTimes(1)
    expect(mockGeneratedStandeeSilhouetteMesh).toHaveBeenCalledTimes(1)
    expect(mockGeneratedStandeeCardSurfaceMesh).toHaveBeenCalledTimes(2)
    const firstSurfaceProps = mockGeneratedStandeeCardSurfaceMesh.mock.calls[0]?.[0] as
      | {
        bakedLightMode?: string
        mirrorX?: boolean
        rotation?: [number, number, number]
        excludeFromSelectionOutline?: boolean
      }
      | undefined
    const secondSurfaceProps = mockGeneratedStandeeCardSurfaceMesh.mock.calls[1]?.[0] as
      | {
        bakedLightMode?: string
        mirrorX?: boolean
        rotation?: [number, number, number]
        excludeFromSelectionOutline?: boolean
      }
      | undefined

    expect(firstSurfaceProps?.mirrorX).toBeUndefined()
    expect(firstSurfaceProps?.excludeFromSelectionOutline).toBe(true)
    expect(firstSurfaceProps?.bakedLightMode).toBe('prop')
    expect(secondSurfaceProps).toMatchObject({
      bakedLightMode: 'prop',
      mirrorX: true,
      rotation: [0, Math.PI, 0],
      excludeFromSelectionOutline: true,
    })
  })

  it('passes the character kind into the shared base mesh', () => {
    render(<GeneratedStandeePlayer character={TEST_NPC_CHARACTER} />)

    const baseProps = mockGeneratedStandeeBaseMesh.mock.calls[0]?.[0] as
      | { kind?: GeneratedCharacterRecord['kind'] }
      | undefined

    expect(baseProps?.kind).toBe('npc')
  })
})
