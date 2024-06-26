import { test, expect } from '@playwright/test'
import { EVENTS } from '@archetype-themes/utils/pubsub'

test.describe('product-images', () => {
  test('should zoom images', async ({ page }) => {
    // Given
    await page.goto('/')
    await page.getByRole('link', { name: 'product-images' }).click()
    await page.waitForLoadState()
    let zoomButton = await page.getByRole('button', { name: 'Zoom' })
    let zoomEventPromise = page.evaluate(
      () =>
        new Promise((resolve) =>
          document.querySelector('product-images').addEventListener('photoswipe:afterInit', (event) => resolve(event))
        )
    )
    let radio = await page.getByRole('radio', { checked: false }).first()
    // When
    await zoomButton.click()
    // Then
    expect(await zoomEventPromise).toBeTruthy()
  })

  test('should change images per color', async ({ page }) => {
    // Given
    await page.goto('/')
    await page.getByRole('link', { name: 'product-images' }).click()
    await page.waitForLoadState()
    let productImages = await page.locator('product-images').first()
    let productId = await productImages.getAttribute('data-product-id')
    let eventName = `${EVENTS.variantChange}:${productId}`
    let variant = JSON.parse(await page.getByTestId('variant-json').innerText())
    let data = { eventName, options: { detail: { variant } } }
    let updateImageSetPromise = page.evaluate(
      () =>
        new Promise((resolve) => document.addEventListener('product-images:updateImageSet', (event) => resolve(event)))
    )
    // When
    await page.evaluate(({ eventName, options }) => document.dispatchEvent(new CustomEvent(eventName, options)), data)
    // Then
    expect(await updateImageSetPromise).toBeTruthy()
  })
})
