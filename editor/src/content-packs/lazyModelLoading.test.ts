import { beforeEach, describe, expect, it, vi } from 'vitest'

const useGLTFMock = vi.hoisted(() => Object.assign(
  vi.fn(),
  { preload: vi.fn() },
))

vi.mock('../rendering/useGLTF', () => ({
  useGLTF: useGLTFMock,
}))

describe('content pack lazy model loading', () => {
  beforeEach(() => {
    vi.resetModules()
    useGLTFMock.mockClear()
    useGLTFMock.preload.mockClear()
  })

  it('does not preload static dungeon asset models during module import', async () => {
    await import('./dungeon/props/book_brown')

    expect(useGLTFMock.preload).not.toHaveBeenCalled()
    expect(useGLTFMock).not.toHaveBeenCalled()
  })

  it('does not preload dungeon wall models during asset creation', async () => {
    await import('./dungeon/tiles/walls/wall')

    expect(useGLTFMock.preload).not.toHaveBeenCalled()
    expect(useGLTFMock).not.toHaveBeenCalled()
  })

  it('does not preload atlas color variant models during asset creation', async () => {
    await import('./dungeon/props/banners/banner_blue')

    expect(useGLTFMock.preload).not.toHaveBeenCalled()
    expect(useGLTFMock).not.toHaveBeenCalled()
  })

  it('does not preload every stepped outdoor terrain model during module import', async () => {
    await import('./kaykit/terrain/steppedOutdoorTerrainAssets')

    expect(useGLTFMock.preload).not.toHaveBeenCalled()
    expect(useGLTFMock).not.toHaveBeenCalled()
  })
})
