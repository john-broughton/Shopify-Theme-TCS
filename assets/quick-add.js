import { executeJSmodules } from '@archetype-themes/scripts/helpers/utils'
import { EVENTS, publish } from '@archetype-themes/utils/pubsub'

/*============================================================================
  QuickAdd
  - Setup quick add buttons/forms on a product grid item
==============================================================================*/
class QuickAdd extends HTMLElement {
  constructor() {
    super()

    this.selectors = {
      quickAddBtn: '[data-single-variant-quick-add]',
      quickAddHolder: '[data-tool-tip-content]'
    }

    this.container = this
    this.init()
  }

  init() {
    // When a single variant, auto add it to cart
    const quickAddBtn = this.container.querySelector(this.selectors.quickAddBtn)
    if (quickAddBtn) {
      quickAddBtn.addEventListener('click', this.addToCart.bind(this))
    } else {
      // Listen for a tool tip quick add event
      this.addEventListener('tooltip:interact', async (e) => {
        if (e.detail.context === 'QuickAdd') {
          if (!this.quickAddData) {
            this.quickAddData = await this.loadQuickAddForm(e)
          }
        }
      })

      this.addEventListener('tooltip:open', async (e) => {
        if (e.detail.context === 'QuickAdd') {
          if (!this.quickAddData) {
            this.quickAddData = await this.loadQuickAddForm(e)
          }

          const quickAddContainer = document.querySelector(this.selectors.quickAddHolder)
          quickAddContainer.innerHTML = this.quickAddData.outerHTML

          /**
           * @event quickshop:opened
           * @description Triggered when the quick add modal is opened.
           */
          document.dispatchEvent(new CustomEvent('quickshop:opened'))

          if (Shopify && Shopify.PaymentButton) {
            Shopify.PaymentButton.init()
          }

          // Execute JS modules after the tooltip is opened
          const scripts = document.querySelectorAll(`tool-tip [data-product-id="${this.prodId}"] script[type="module"]`)
          executeJSmodules(scripts)
        }
      })
    }
  }

  addToCart(evt) {
    const btn = evt.currentTarget
    const visibleBtn = btn.querySelector('.btn')
    const id = btn.dataset.id
    visibleBtn.classList.add('btn--loading')

    const data = {
      items: [
        {
          id: id,
          quantity: 1
        }
      ]
    }

    const endpoint = 'cart/add.js'
    fetch(window.Shopify.routes.root + endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 422 || data.status === 'bad_request') {
          if (data.description) {
            alert(data.description)
          }
        } else {
          publish(EVENTS.ajaxProductAdded, {
            detail: {
              product: data,
              addToCartBtn: btn
            }
          })
        }

        visibleBtn.classList.remove('btn--loading')
      })
  }

  async loadQuickAddForm(evt) {
    const gridItem = evt.currentTarget.closest('.grid-product')
    const handle = gridItem.firstElementChild.getAttribute('data-product-handle')
    this.prodId = gridItem.firstElementChild.getAttribute('data-product-id')

    let url = `${window.Shopify.routes.root}/products/${handle}?view=form`

    // remove double `/` in case shop might have /en or language in URL
    url = url.replace('//', '/')

    try {
      const response = await fetch(url)
      const html = await response.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      const div = doc.querySelector(`.page-content[data-product-id="${this.prodId}"]`)
      this.processHTML(div)

      /**
       * @event quickadd:loaded:${productId}
       * @description Triggered when the quick add form is loaded.
       */
      window.dispatchEvent(new CustomEvent(`quickadd:loaded:-${this.prodId}`))

      /**
       * @event quickadd:loaded
       * @description Triggered when the quick add form is loaded.
       * @param {string} detail.productId - The product ID.
       * @param {string} detail.handle - The product handle.
       */
      document.dispatchEvent(
        new CustomEvent('quickadd:loaded', {
          detail: {
            productId: this.prodId,
            handle: handle
          }
        })
      )

      return div
    } catch (error) {
      console.error('Error:', error)
    }
  }

  processHTML(productElement) {
    this.removeBreadcrumbs(productElement)
    this.preventVariantURLSwitching(productElement)
  }

  removeBreadcrumbs(productElement) {
    const breadcrumbs = productElement.querySelector('.breadcrumb')
    if (!breadcrumbs) return

    breadcrumbs.remove()
  }

  preventVariantURLSwitching(productElement) {
    const variantPicker = productElement.querySelector('block-variant-picker')
    if (!variantPicker) return

    variantPicker.removeAttribute('data-update-url')
  }
}

customElements.define('quick-add', QuickAdd)
