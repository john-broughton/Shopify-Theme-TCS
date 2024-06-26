import { test, expect } from '@playwright/test'

test.describe('block-size-chart', () => {
  test('should open up a modal', async ({ page }) => {
    // Given
    await page.goto('/')
    await page.getByRole('link', { name: 'block-size-chart' }).click()
    await page.waitForLoadState()
    let blockVariantPicker = await page.locator('block-variant-picker').last()
    let trigger = await blockVariantPicker.locator('[data-tool-tip="size-chart"]').last()
    let eventName = 'tooltip:open'
    let eventPromise = page.evaluate(
      (eventName) => new Promise((resolve) => document.addEventListener(eventName, (event) => resolve(event))),
      eventName
    )
    // When
    await trigger.click()
    // Then
    expect(await eventPromise).toBeTruthy()
  })
})
