import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'
import { useDungeonStore } from './store/useDungeonStore'

const handoffMock = vi.hoisted(() => ({
  parseEditorDungeonHandoff: vi.fn(),
  consumeEditorDungeonHandoff: vi.fn(),
  stripEditorDungeonHandoff: vi.fn(() => ''),
}))

vi.mock('./components/editor/EditorToolbar', () => ({
  EditorToolbar: ({
    settingsOpen,
    onOpenSettings,
    onSelectTool,
  }: {
    settingsOpen?: boolean
    onOpenSettings?: () => void
    onSelectTool?: (tool: string) => void
  }) => (
    <div>
      <div data-testid="toolbar-settings-state">{settingsOpen ? 'open' : 'closed'}</div>
      <button type="button" onClick={() => onOpenSettings?.()}>Open Settings</button>
      <button
        type="button"
        onClick={() => {
          useDungeonStore.getState().setTool('play')
          onSelectTool?.('play')
        }}
      >
        Choose Play
      </button>
    </div>
  ),
}))

vi.mock('./components/editor/CameraDropdown', () => ({
  CameraDropdown: ({ rightOffset }: { rightOffset?: number }) => <div data-testid="camera-offset">{rightOffset}</div>,
}))

vi.mock('./components/editor/MoveToolPanel', () => ({
  MoveToolPanel: () => <div>Move Panel</div>,
}))

vi.mock('./components/editor/RoomToolPanel', () => ({
  RoomToolPanel: () => <div>Room Panel</div>,
}))

vi.mock('./components/editor/PropToolPanel', () => ({
  PropToolPanel: () => <div>Prop Panel</div>,
}))

vi.mock('./components/editor/CharacterToolPanel', () => ({
  CharacterToolPanel: () => <div>Character Panel</div>,
}))

vi.mock('./components/editor/SelectToolPanel', () => ({
  SelectToolPanel: () => <div>Select Panel</div>,
}))

vi.mock('./components/editor/ScenePanel', () => ({
  ScenePanel: () => <div>Scene Graph</div>,
}))

vi.mock('./components/editor/CharacterSheetOverlay', () => ({
  CharacterSheetOverlay: () => <div>Character Sheet</div>,
}))

vi.mock('./components/RendererErrorBoundary', () => ({
  RendererErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('./components/WebGpuRequiredNotice', () => ({
  WebGpuRequiredNotice: ({ message }: { message: string }) => <div>{message}</div>,
}))

vi.mock('./generated-characters/migration', () => ({
  migrateLegacyGeneratedCharacters: vi.fn(async () => {}),
}))

vi.mock('./rendering/webgpuSupport', () => ({
  isWebGpuSupported: () => false,
  getWebGpuSupportMessage: () => 'WebGPU unavailable',
}))

vi.mock('./lib/editorDungeonHandoff', () => ({
  parseEditorDungeonHandoff: handoffMock.parseEditorDungeonHandoff,
  consumeEditorDungeonHandoff: handoffMock.consumeEditorDungeonHandoff,
  stripEditorDungeonHandoff: handoffMock.stripEditorDungeonHandoff,
}))

describe('App sidebar drawer', () => {
  beforeEach(() => {
    useDungeonStore.getState().reset()
    window.sessionStorage.clear()
    handoffMock.parseEditorDungeonHandoff.mockReset()
    handoffMock.consumeEditorDungeonHandoff.mockReset()
    handoffMock.stripEditorDungeonHandoff.mockReset()
    handoffMock.stripEditorDungeonHandoff.mockReturnValue('')
  })

  afterEach(() => {
    cleanup()
  })

  it('lets users hide and reopen the sidebar outside play mode', async () => {
    const user = userEvent.setup()
    render(<App />)

    const shell = screen.getByTestId('editor-right-panel-shell')
    expect(screen.getByTestId('toolbar-settings-state')).toHaveTextContent('closed')
    expect(shell).toHaveAttribute('data-sidebar-visible', 'true')
    expect(shell).toHaveAttribute('data-sidebar-panel', 'tool')
    expect(screen.getByTestId('camera-offset')).toHaveTextContent('400')
    expect(screen.getByText('Select Panel')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Hide sidebar' }))

    expect(shell).toHaveAttribute('data-sidebar-visible', 'false')
    expect(screen.getByTestId('camera-offset')).toHaveTextContent('16')

    await user.click(screen.getByRole('button', { name: 'Show sidebar' }))

    expect(shell).toHaveAttribute('data-sidebar-visible', 'true')
    expect(screen.getByTestId('camera-offset')).toHaveTextContent('400')
  })

  it('anchors the debug panel to the lower right and offsets it when the sidebar toggles', async () => {
    const user = userEvent.setup()
    render(<App />)

    fireEvent.keyDown(window, { key: 'F12', ctrlKey: true, shiftKey: true })

    const debugPanel = screen.getByTestId('debug-visibility-panel')
    expect(debugPanel).toHaveAttribute('data-sidebar-visible', 'true')
    expect(debugPanel).toHaveStyle({ right: '400px' })
    expect(debugPanel.className).toContain('bottom-4')

    await user.click(screen.getByRole('button', { name: 'Hide sidebar' }))

    expect(debugPanel).toHaveAttribute('data-sidebar-visible', 'false')
    expect(debugPanel).toHaveStyle({ right: '16px' })
  })

  it('toggles prop probe visualization from the debug panel', async () => {
    const user = userEvent.setup()
    render(<App />)

    fireEvent.keyDown(window, { key: 'F12', ctrlKey: true, shiftKey: true })

    expect(useDungeonStore.getState().showPropProbeDebug).toBe(false)

    await user.click(screen.getByRole('button', { name: /visualize prop probes/i }))

    expect(useDungeonStore.getState().showPropProbeDebug).toBe(true)
  })

  it('keeps the sidebar off-canvas in play mode without rendering the drawer tab', () => {
    useDungeonStore.getState().setTool('play')
    render(<App />)

    expect(screen.queryByRole('button', { name: /sidebar/i })).not.toBeInTheDocument()
    expect(screen.queryByTestId('editor-right-panel-shell')).not.toBeInTheDocument()
  })

  it('opens settings in play mode without changing the active tool', async () => {
    const user = userEvent.setup()
    useDungeonStore.getState().setTool('play')
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Open Settings' }))

    expect(useDungeonStore.getState().tool).toBe('play')
    expect(screen.getByTestId('toolbar-settings-state')).toHaveTextContent('open')
    expect(screen.getByTestId('editor-right-panel-shell')).toHaveAttribute('data-sidebar-panel', 'settings')
    expect(screen.queryByText('Scene Graph')).not.toBeInTheDocument()
    expect(screen.queryByText('Layers')).not.toBeInTheDocument()
  })

  it('closes settings from play mode with the back button', async () => {
    const user = userEvent.setup()
    useDungeonStore.getState().setTool('play')
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Open Settings' }))
    await user.click(screen.getByRole('button', { name: 'Back from settings' }))

    expect(useDungeonStore.getState().tool).toBe('play')
    expect(screen.getByTestId('toolbar-settings-state')).toHaveTextContent('closed')
    expect(screen.queryByTestId('editor-right-panel-shell')).not.toBeInTheDocument()
  })

  it('returns to the normal side panel outside play mode with the back button', async () => {
    const user = userEvent.setup()
    useDungeonStore.getState().setTool('room')
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Open Settings' }))
    await user.click(screen.getByRole('button', { name: 'Back from settings' }))

    expect(screen.getByTestId('toolbar-settings-state')).toHaveTextContent('closed')
    expect(screen.getByTestId('editor-right-panel-shell')).toHaveAttribute('data-sidebar-panel', 'tool')
    expect(screen.getByTestId('editor-right-panel-shell')).toHaveAttribute('data-sidebar-visible', 'true')
  })

  it('loads a remotely handed-off dungeon when editor launch params are present', async () => {
    handoffMock.parseEditorDungeonHandoff.mockReturnValue({
      dungeonId: 'dungeon-1',
      accessToken: 'ticket-123',
      backendUrl: 'http://127.0.0.1:3210',
    })
    handoffMock.consumeEditorDungeonHandoff.mockResolvedValue({
      _id: 'dungeon-1',
      title: 'Remote Keep',
      description: null,
      serializedDungeon: '{"version":1,"name":"Remote Keep","rooms":[]}',
      createdAt: 1,
      updatedAt: 2,
    })

    render(<App />)

    await waitFor(() => expect(useDungeonStore.getState().dungeonName).toBe('Remote Keep'))
    expect(handoffMock.consumeEditorDungeonHandoff).toHaveBeenCalledTimes(1)
  })
})
