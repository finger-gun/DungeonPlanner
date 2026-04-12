import { expect, test, type Page } from '@playwright/test'

async function waitForDebugBridge(page: Page) {
  await page.waitForFunction(() => Boolean(window.__DUNGEON_DEBUG__))
}

test.describe('Dungeon editor smoke flow', () => {
  test('loads the editor without page errors', async ({ page }) => {
    const pageErrors: string[] = []
    const consoleErrors: string[] = []

    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })

    await page.goto('/')
    await waitForDebugBridge(page)
    // "Scene" heading is always visible at the top of the right panel (ScenePanel)
    await expect(page.getByText('Scene', { exact: true })).toBeVisible()
    // Room tool button is present in the toolbar
    await expect(page.getByRole('button', { name: 'Room' })).toBeVisible()
    await expect(page.locator('canvas').first()).toBeVisible()

    expect(pageErrors).toEqual([])
    expect(consoleErrors).toEqual([])
  })

  test('paints and removes a room cell through the debug bridge', async ({ page }) => {
    await page.goto('/')
    await waitForDebugBridge(page)

    const counter = page.getByTestId('placement-counter')
    await expect(counter).toContainText('0 room cells')

    await page.evaluate(() => window.__DUNGEON_DEBUG__?.placeAtCell([0, 0], 'room'))
    await expect(counter).toContainText('1 room cell')

    await page.evaluate(() => window.__DUNGEON_DEBUG__?.removeAtCell([0, 0], 'room'))
    await expect(counter).toContainText('0 room cells')
  })

  test('undo and redo work from the toolbar', async ({ page }) => {
    await page.goto('/')
    await waitForDebugBridge(page)

    const counter = page.getByTestId('placement-counter')

    await page.evaluate(() => window.__DUNGEON_DEBUG__?.paintRectangle([0, 0], [1, 1]))
    await expect(counter).toContainText('4 room cells')

    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(counter).toContainText('0 room cells')

    await page.getByRole('button', { name: 'Redo' }).click()
    await expect(counter).toContainText('4 room cells')
  })

  test('select tool clicks do not lock the camera', async ({ page }) => {
    await page.goto('/')
    await waitForDebugBridge(page)
    await page.waitForFunction(() => window.__DUNGEON_DEBUG__?.getCameraPose() !== null)

    const before = await page.evaluate(() => window.__DUNGEON_DEBUG__?.getCameraPose())
    expect(before).not.toBeNull()

    const canvas = page.locator('canvas').first()
    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()

    const startX = box!.x + box!.width / 2 + 24
    const startY = box!.y + box!.height / 2 + 24

    await page.getByRole('button', { name: 'Select' }).click()
    await page.mouse.move(startX, startY)
    await page.mouse.click(startX, startY)

    const strokeActive = await page.evaluate(() =>
      Boolean((window.__DUNGEON_DEBUG__?.getSnapshot() as { isPaintingStrokeActive?: boolean } | undefined)?.isPaintingStrokeActive),
    )
    expect(strokeActive).toBe(false)

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX + 120, startY - 60, { steps: 12 })
    await page.mouse.up()

    const after = await page.evaluate(() => window.__DUNGEON_DEBUG__?.getCameraPose())
    expect(after).not.toBeNull()
    expect(after).not.toEqual(before)
  })

  test('select tool can select characters', async ({ page }) => {
    await page.goto('/')
    await waitForDebugBridge(page)

    await page.evaluate(() => {
      const debug = window.__DUNGEON_DEBUG__
      const state = debug?.getSnapshot() as {
        paintCells: (cells: Array<[number, number]>) => number
        placeObject: (input: {
          type: 'player'
          assetId: string
          position: [number, number, number]
          rotation: [number, number, number]
          props: Record<string, unknown>
          cell: [number, number]
          cellKey: string
        }) => string | null
      }

      state.paintCells([[0, 0]])
      state.placeObject({
        type: 'player',
        assetId: 'core.player_barbarian',
        position: [1, 0, 1],
        rotation: [0, 0, 0],
        props: {},
        cell: [0, 0],
        cellKey: '0:0:floor',
      })
    })

    await page.getByRole('button', { name: 'Select' }).click()

    const canvas = page.locator('canvas').first()
    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()

    const clickX = box!.x + box!.width / 2 + 24
    const clickY = box!.y + box!.height / 2 + 24
    await page.mouse.click(clickX, clickY)

    await expect(page.getByText('Selected Character', { exact: true })).toBeVisible()
    await expect(page.getByText('Barbarian', { exact: true })).toBeVisible()
  })

  test('selected characters rotate with the R key', async ({ page }) => {
    await page.goto('/')
    await waitForDebugBridge(page)

    await page.evaluate(() => {
      const state = window.__DUNGEON_DEBUG__?.getSnapshot() as {
        paintCells: (cells: Array<[number, number]>) => number
        placeObject: (input: {
          type: 'player'
          assetId: string
          position: [number, number, number]
          rotation: [number, number, number]
          props: Record<string, unknown>
          cell: [number, number]
          cellKey: string
        }) => string | null
      }

      state.paintCells([[0, 0]])
      state.placeObject({
        type: 'player',
        assetId: 'core.player_barbarian',
        position: [1, 0, 1],
        rotation: [0, 0, 0],
        props: { connector: 'FLOOR', direction: null },
        cell: [0, 0],
        cellKey: '0:0:floor',
      })
    })

    await page.getByRole('button', { name: 'Select' }).click()

    const canvas = page.locator('canvas').first()
    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()

    const clickX = box!.x + box!.width / 2 + 24
    const clickY = box!.y + box!.height / 2 + 24
    await page.mouse.click(clickX, clickY)
    await page.keyboard.press('r')

    await page.waitForFunction(() => {
      const snapshot = window.__DUNGEON_DEBUG__?.getSnapshot() as {
        placedObjects?: Record<string, { type: string; rotation: [number, number, number] }>
        selection?: string | null
      } | undefined
      if (!snapshot?.selection) {
        return false
      }
      const object = snapshot.placedObjects?.[snapshot.selection]
      return Boolean(object && object.type === 'player' && Math.abs(object.rotation[1] - Math.PI / 2) < 1e-6)
    })
  })

  test('play mode hides the right panel', async ({ page }) => {
    await page.goto('/')
    await waitForDebugBridge(page)

    await expect(page.getByTestId('editor-right-panel')).toBeVisible()
    await page.getByRole('button', { name: 'Play' }).click()
    await expect(page.getByTestId('editor-right-panel')).toHaveCount(0)
    await expect(page.getByText('Play', { exact: true })).toBeVisible()
  })

  test('play mode can reset previously revealed cells', async ({ page }) => {
    await page.goto('/')
    await waitForDebugBridge(page)

    await page.evaluate(() => {
      const state = window.__DUNGEON_DEBUG__?.getSnapshot() as {
        paintCells: (cells: Array<[number, number]>) => number
        mergeExploredCells: (cellKeys: string[]) => void
      }

      state.paintCells([[0, 0], [1, 0]])
      state.mergeExploredCells(['0:0', '1:0'])
    })

    await page.getByRole('button', { name: 'Play' }).click()
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'F12',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      }))
    })

    await expect(page.getByTestId('debug-visibility-panel')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reset reveal' })).toBeEnabled()
    await page.getByRole('button', { name: 'Reset reveal' }).click()

    await page.waitForFunction(() => {
      const snapshot = window.__DUNGEON_DEBUG__?.getSnapshot() as {
        exploredCells?: Record<string, true>
      } | undefined

      return Object.keys(snapshot?.exploredCells ?? {}).length === 0
    })
  })

  test('debug visibility panel toggles LOS overlays', async ({ page }) => {
    await page.goto('/')
    await waitForDebugBridge(page)

    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'F12',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      }))
    })

    await expect(page.getByTestId('debug-visibility-panel')).toBeVisible()

    await page.getByRole('button', { name: 'Render LoS rays On' }).click()
    await page.getByRole('button', { name: 'Render LoS mask On' }).click()

    await page.waitForFunction(() => {
      const snapshot = window.__DUNGEON_DEBUG__?.getSnapshot() as {
        showLosDebugMask?: boolean
        showLosDebugRays?: boolean
      } | undefined

      return snapshot?.showLosDebugMask === false && snapshot?.showLosDebugRays === false
    })
  })

  test('play mode lets you drag a player to another cell', async ({ page }) => {
    await page.goto('/')
    await waitForDebugBridge(page)

    const playerId = await page.evaluate(() => {
      const state = window.__DUNGEON_DEBUG__?.getSnapshot() as {
        paintCells: (cells: Array<[number, number]>) => number
        placeObject: (input: {
          type: 'player'
          assetId: string
          position: [number, number, number]
          rotation: [number, number, number]
          props: Record<string, unknown>
          cell: [number, number]
          cellKey: string
        }) => string | null
      }

      window.__DUNGEON_DEBUG__?.setCameraPreset('top-down')
      state.paintCells([[0, 0], [1, 0]])
      return state.placeObject({
        type: 'player',
        assetId: 'core.player_barbarian',
        position: [1, 0, 1],
        rotation: [0, 0, 0],
        props: { connector: 'FLOOR', direction: null },
        cell: [0, 0],
        cellKey: '0:0:floor',
      })
    })
    expect(playerId).toBeTruthy()

    await page.getByRole('button', { name: 'Play' }).click()
    await page.waitForTimeout(200)

    await page.waitForFunction(
      (id) => window.__DUNGEON_DEBUG__?.getObjectScreenPosition(id) !== null,
      playerId,
    )

    const start = await page.evaluate((id) => window.__DUNGEON_DEBUG__?.getObjectScreenPosition(id), playerId)
    expect(start).not.toBeNull()

    await page.mouse.move(start!.x, start!.y)
    await page.mouse.down()
    await page.mouse.move(start!.x + 64, start!.y, { steps: 12 })
    await page.mouse.up()

    await page.waitForFunction(() => {
      const snapshot = window.__DUNGEON_DEBUG__?.getSnapshot() as {
        placedObjects?: Record<string, { type: string; cell: [number, number] }>
      } | undefined

      return Object.values(snapshot?.placedObjects ?? {}).some(
        (object) => object.type === 'player' && object.cell[0] === 1 && object.cell[1] === 0,
      )
    })
  })
})
