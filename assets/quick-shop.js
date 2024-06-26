import { config } from '@archetype-themes/scripts/config'
import { executeJSmodules } from '@archetype-themes/scripts/helpers/utils'

/*============================================================================
  QuickShop
  - Setup quick shop modals anywhere a product grid item exists
  - Duplicate product modals will be condensed down to one workable one
==============================================================================*/

class QuickShop extends HTMLElement {
  constructor() {
    super()

    this.selectors = {
      quickShopContainer: '[data-tool-tip-content]',
      blocksHolder: '[data-blocks-holder]',
      blocks: '[data-product-blocks]',
      form: '.product-single__form'
    }

    // No quick view on mobile breakpoint
    if (config.bpSmall) {
      return
    }

    this.container = this

    this.addEventListener('tooltip:interact', async (e) => {
      if (e.detail.context === 'QuickShop') {
        if (!this.quickShopData) {
          this.quickShopData = await this.loadQuickShopData(e)
        }
      }
    })

    this.addEventListener('tooltip:open', async (e) => {
      if (e.detail.context === 'QuickShop') {
        if (!this.quickShopData) {
          this.quickShopData = await this.loadQuickShopData(e)
        }

        const quickShopContainer = document.querySelector(this.selectors.quickShopContainer)
        const clonedQuickShopData = this.quickShopData.cloneNode(true)
        quickShopContainer.innerHTML = ''
        quickShopContainer.appendChild(clonedQuickShopData)

        /**
         * @event quickshop:opened
         * @description Triggered when the quick shop modal is opened.
         * @param {boolean} bubbles - Whether the event bubbles up through the DOM or not.
         */
        this.dispatchEvent(
          new CustomEvent('quickshop:opened', {
            bubbles: true
          })
        )

        if (Shopify && Shopify.PaymentButton) {
          Shopify.PaymentButton.init()
        }

        // Execute JS modules after the tooltip is opened
        const scripts = document.querySelectorAll(`tool-tip [data-product-id="${this.prodId}"] script[type="module"]`)
        executeJSmodules(scripts)
      }
    })

    // Set up product blocks content inside modal
    this.addEventListener('quickshop:opened', async () => {
      if (Shopify && Shopify.PaymentButton) {
        Shopify.PaymentButton.init()
      }
    })
  }

  async loadQuickShopData(evt) {
    const gridItem = evt.currentTarget.closest('.grid-product')
    this.handle = gridItem.firstElementChild.getAttribute('data-product-handle')
    this.prodId = gridItem.firstElementChild.getAttribute('data-product-id')

    if (!gridItem || !this.handle || !this.prodId) return

    let url = `${window.Shopify.routes.root}/products/${this.handle}`

    // remove double `/` in case shop might have /en or language in URL
    url = url.replace('//', '/')

    try {
      const response = await fetch(url)
      const text = await response.text()
      const responseHTML = new DOMParser().parseFromString(text, 'text/html')
      const fragment = document.createDocumentFragment()

      const div = responseHTML.querySelector(`.page-content[data-product-id="${this.prodId}"]`)
      this.processHTML(div)

      if (div) {
        div.dataset.modal = true
        fragment.appendChild(div.cloneNode(true))
      }

      /**
       * @event quickshop:loaded-${productId}
       * @description Triggered when the quick shop modal is loaded.
       */
      window.dispatchEvent(new CustomEvent(`quickshop:loaded-${this.prodId}`))

      /**
       * @event quickshop:loaded
       * @description Triggered when the quick shop modal is loaded.
       * @param {string} detail.productId - The product ID.
       * @param {string} detail.handle - The product handle.
       */
      document.dispatchEvent(
        new CustomEvent('quickshop:loaded', {
          detail: {
            productId: this.prodId,
            handle: this.handle
          }
        })
      )

      return fragment
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

customElements.define('quick-shop', QuickShop)
