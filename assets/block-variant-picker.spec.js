import { test, expect } from '@playwright/test'
import { EVENTS } from '@archetype-themes/utils/pubsub'

test.describe('block-variant-picker', () => {
  test('should publish the state of the selected variant', async ({ page }) => {
    // Given
    await page.goto('/')
    await page.getByRole('link', { name: 'block-variant-picker' }).click()
    await page.waitForLoadState()
    let variantPicker = await page.locator('block-variant-picker').first()
    let productId = await variantPicker.getAttribute('data-product-id')
    let eventName = `${EVENTS.variantChange}:${productId}`
    let eventPromise = page.evaluate(
      (eventName) => new Promise((resolve) => document.addEventListener(eventName, (event) => resolve(event.detail))),
      eventName
    )
    let radio = await page.getByRole('radio', { checked: false }).first()
    let text = await radio.getAttribute('value')
    let label = await page.getByText(text)
    // When
    await label.click()
    // Then
    expect(await eventPromise).toHaveProperty('variant')
    expect(await eventPromise).toHaveProperty('html')
    expect(await eventPromise).toHaveProperty('sectionId')
  })
})
