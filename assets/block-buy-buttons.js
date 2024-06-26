import { EVENTS, publish, subscribe } from '@archetype-themes/utils/pubsub'

class BlockBuyButtons extends HTMLElement {
  connectedCallback() {
    this.addEventListener('submit', this.handleSubmit.bind(this))

    this.variantChangeUnsubscriber = subscribe(
      `${EVENTS.variantChange}:${this.dataset.productId}`,
      this.handleVariantChange.bind(this)
    )
    this.cartType = this.dataset.cartType
  }

  disconnectedCallback() {
    this.variantChangeUnsubscriber()
  }

  handleVariantChange({ detail }) {
    const { html, variant } = detail

    if (!variant) {
      this.toggleAddButton(true, this.getLocales().unavailable)
      return
    }

    this.updateVariantInput(variant)
    this.renderProductInfo(html)
  }

  renderProductInfo(html) {
    const addButtonUpdated = html.getElementById(`ProductSubmitButton-${this.dataset.sectionId}`)

    if (addButtonUpdated) {
      this.toggleAddButton(addButtonUpdated.hasAttribute('disabled'), this.getLocales().soldOut)
    }
  }

  getLocales() {
    this.locales = this.locales || JSON.parse(this.querySelector('[type="application/json"]').textContent)
    return this.locales
  }

  toggleAddButton(disable = true, text) {
    const productForm = this.querySelector(`#product-form-${this.dataset.sectionId}`)

    if (!productForm) return

    const addButton = productForm.querySelector('[name="add"]')
    const addButtonText = productForm.querySelector('[name="add"] > span')

    if (!addButton) return

    if (disable) {
      addButton.setAttribute('disabled', 'disabled')
      if (text) addButtonText.textContent = text
    } else {
      addButton.removeAttribute('disabled')
      addButtonText.textContent = this.getLocales().addToCart
    }
  }

  updateVariantInput(variant) {
    const productForms = this.querySelectorAll(
      `#product-form-${this.dataset.sectionId}, #product-form-installment-${this.dataset.sectionId}`
    )

    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]')
      input.value = variant.id

      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
  }

  async handleSubmit(event) {
    if (this.cartType == 'page') return

    event.preventDefault()
    this.disableAddToCartButton()

    try {
      const responseJson = await this.addVariantToCart()

      publish(EVENTS.ajaxProductAdded, {
        detail: {
          product: responseJson,
          addToCartBtn: this.querySelector(`#ProductSubmitButton-${this.dataset.sectionId}`)
        }
      })
    } catch (error) {
      this.handleError(error)
    } finally {
      this.enableAddToCartButton()
    }
  }

  handleError(error) {
    if (!error.description) {
      console.warn(error)
      return
    }

    let form = this.querySelector('form')
    let errors = this.querySelector('form .errors')

    if (errors) errors.remove()

    let errorDiv = document.createElement('div')
    errorDiv.classList.add('errors', 'text-center')

    if (typeof error.description === 'object') {
      errorDiv.textContent = error.message
    } else {
      errorDiv.textContent = error.description
    }

    form.append(errorDiv)

    publish(EVENTS.ajaxProductError, {
      detail: {
        errorMessage: error.description
      }
    })
  }

  async addVariantToCart() {
    const formData = this.getFormDataWithSections()

    const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      body: formData
    })

    if (!response.ok) {
      throw await response.json()
    }

    return response.json()
  }

  async fetchCart() {
    return (await fetch(`${window.Shopify.routes.root}cart.js`)).json()
  }

  getFormDataWithSections() {
    const productForm = this.querySelector(`#product-form-${this.dataset.sectionId}`)
    const formData = new FormData(productForm)

    formData.set('sections_url', `${window.Shopify.routes.root}variants/${productForm.id.value}`)

    return formData
  }

  enableAddToCartButton() {
    const productForm = this.querySelector(`#product-form-${this.dataset.sectionId}`)

    if (!productForm) return

    const addButton = productForm.querySelector('[name="add"]')
    addButton.removeAttribute('aria-busy')
    addButton.classList.remove('btn--loading')
  }

  disableAddToCartButton() {
    const productForm = this.querySelector(`#product-form-${this.dataset.sectionId}`)
    const errors = this.querySelector('form .errors')

    if (errors) errors.remove()
    if (!productForm) return

    const addButton = productForm.querySelector('[name="add"]')
    addButton.setAttribute('aria-busy', 'true')
    addButton.classList.add('btn--loading')
  }
}

customElements.define('block-buy-buttons', BlockBuyButtons)
