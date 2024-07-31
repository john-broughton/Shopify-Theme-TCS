/* components v2.10.64 | Copyright © 2024 Archetype Themes Limited Partnership  | "Shopify Theme Store (https://www.shopify.com/legal/terms#9-additional-services)" License */
class VendorProducts extends HTMLElement {
  async connectedCallback() {
    this.outputContainer = this.querySelector(`#VendorProducts-${this.dataset.sectionId}`)
    let url = `${window.Shopify.routes.root}/collections/vendors?view=vendor-ajax&q=${this.dataset.vendor}`

    // Remove double `/` in case the shop might have `/en` or language in URL
    url = url.replace('//', '/')

    try {
      const response = await fetch(url)
      const text = await response.text()

      this.processProducts(text)
    } catch (error) {
      console.error('Error fetching vendor products:', error)
    }
  }

  processProducts(html) {
    let count = 0
    const products = []
    const modals = []
    const element = document.createElement('div')

    element.innerHTML = html

    const allProds = element.querySelectorAll('.grid-product')

    allProds.forEach((el) => {
      const id = el.firstElementChild.dataset.productId

      if (count === parseInt(this.dataset.maxProducts, 10)) return
      if (id === this.dataset.productId) return

      const modal = element.querySelector(`.modal[data-product-id="${id}"]`)

      if (modal) {
        modals.push(modal)
      }

      count++
      products.push(el)
    })

    this.updateOutputContainer(products, modals)
  }

  updateOutputContainer(products, modals) {
    this.outputContainer.innerHTML = ''

    if (products.length === 0) {
      this.classList.add('hide')
    } else {
      this.classList.remove('hide')
      this.outputContainer.append(...products)

      if (modals.length) {
        this.outputContainer.append(...modals)
      }
    }
  }
}

customElements.define('vendor-products', VendorProducts)
