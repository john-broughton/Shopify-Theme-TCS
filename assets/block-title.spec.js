import { test, expect } from '@playwright/test'

test.describe('block-title', () => {
  test('should render title, vendor, sku of the product', async ({ page }) => {
    // Given
    await page.goto('/')
    await page.getByRole('link', { name: 'block-title' }).click()
    let data = JSON.parse(await page.getByTestId('product-json').innerText())
    // When
    let blockTitle = page.locator('.shopify-section').last()
    // Then
    await expect(blockTitle).toContainText(data.title)
    if (data.vendor) await expect(blockTitle).toContainText(data.vendor)
    if (data.selectedOrFirstAvailableVariant.sku)
      await expect(blockTitle).toContainText(data.selectedOrFirstAvailableVariant.sku)
  })
})
