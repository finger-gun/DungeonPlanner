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
    await expect(page.getByText('Dungeon Maker')).toBeVisible()
    await expect(page.getByRole('button', { name: /Room Active/i })).toBeVisible()
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
})
