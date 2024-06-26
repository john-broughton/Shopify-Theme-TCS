import { EVENTS, subscribe } from '@archetype-themes/utils/pubsub'

class ProductInventory extends HTMLElement {
  connectedCallback() {
    this.classes = {
      hidden: 'hide',
      lowInventory: 'inventory--low'
    }

    this.selectors = {
      variantJson: '[data-current-variant-json]',
      inventory: '[data-product-inventory]',
      incomingInventory: '[data-incoming-inventory]',
      inventory: '[data-product-inventory]',
      locales: '[data-locales-json]',
      inventories: '[data-inventories-json]'
    }

    this.settings = {
      inventoryThreshold: 10
    }

    this.productId = this.dataset.productId
    this.currentVariant = JSON.parse(this.querySelector(this.selectors.variantJson).textContent)
    const inventoryEl = this.querySelector(this.selectors.inventory)
    this.settings.inventory = true
    this.settings.inventoryThreshold = inventoryEl.dataset.threshold
    // Update inventory on page load
    this.updateInventory({ detail: { variant: this.currentVariant } })
    subscribe(`${EVENTS.variantChange}:${this.productId}`, this.updateInventory.bind(this))
  }

  updateInventory(evt) {
    const variant = evt.detail.variant

    // Override to display in stock message for sold out variants with policy set to continue
    // Must be set to true in order to display in stock message for sold out variants
    const inStockForOOSAndContinueSelling = false

    if (!variant) {
      // Variant is unavailable
      // So we want to hide both the inventory quantity + incoming transfer notice
      this.toggleInventoryQuantity('hidden', false)
      this.toggleIncomingInventory(false)
      return
    }

    // Inventory management is nil
    // So we want to hide the low inventory message but show an In stock status
    // And hide the incoming transfer notice
    if (!variant.inventory_management) {
      this.toggleInventoryQuantity('visible', false)
      this.toggleIncomingInventory(false)
      return
    }

    if (variant.inventory_management === 'shopify' && this.getInventories()) {
      const variantInventoryObject = this.getInventories()[variant.id]

      const { quantity, policy, incoming, next_incoming_date } = variantInventoryObject || {}

      this.toggleInventoryQuantity(undefined, quantity)

      if (inStockForOOSAndContinueSelling) {
        if (quantity <= 0 && policy === 'continue') {
          this.toggleInventoryQuantity('visible', false)
          this.toggleIncomingInventory(false)
          return
        }
      }

      if ((incoming && !variant.available) || (quantity <= 0 && policy === 'continue')) {
        this.toggleIncomingInventory(true, next_incoming_date, policy)
      } else {
        this.toggleIncomingInventory(false)
      }
    }
  }

  toggleInventoryQuantity(state = undefined, quantity) {
    const productInventoryEl = this.querySelector(this.selectors.inventory)
    const inventorySalesPoint = productInventoryEl.closest('.sales-point')

    if (state && state === 'hidden') {
      // variant is unavailable
      // hide and return
      if (inventorySalesPoint) {
        inventorySalesPoint.classList.add(this.classes.hidden)
      }

      return
    }

    let showLowInventoryMessage = false

    // Check if we should show low inventory message
    if (parseInt(quantity) <= parseInt(this.settings.inventoryThreshold) && parseInt(quantity) > 0) {
      showLowInventoryMessage = true
    }

    if (parseInt(quantity) > 0 || (state && state === 'visible')) {
      if (showLowInventoryMessage) {
        productInventoryEl.parentNode.classList.add(this.classes.lowInventory)
        if (quantity > 1) {
          productInventoryEl.textContent = this.getLocales().otherStockLabel.replace('[count]', quantity)
        } else {
          productInventoryEl.textContent = this.getLocales().oneStockLabel.replace('[count]', quantity)
        }
      } else {
        productInventoryEl.parentNode.classList.remove(this.classes.lowInventory)
        productInventoryEl.textContent = this.getLocales().inStockLabel
      }

      if (inventorySalesPoint) {
        inventorySalesPoint.classList.remove(this.classes.hidden)
      }
    } else {
      if (inventorySalesPoint) {
        inventorySalesPoint.classList.add(this.classes.hidden)
      }
    }
  }

  toggleIncomingInventory(showIncomingInventory, incomingInventoryDate, policy) {
    const incomingInventoryEl = this.querySelector(this.selectors.incomingInventory)
    const incomingInventoryIcon = incomingInventoryEl.querySelector('.icon-and-text')

    if (!incomingInventoryEl) return

    const incomingInventoryBlockEnabled = incomingInventoryEl.dataset.enabled === 'true'
    const textEl = incomingInventoryEl.querySelector('.js-incoming-text')

    // If incoming inventory block is disabled, hide it
    if (!incomingInventoryBlockEnabled) {
      incomingInventoryEl.classList.add(this.classes.hidden)
      return
    }

    if (showIncomingInventory) {
      if (incomingInventoryDate) {
        textEl.textContent = this.getLocales().willBeInStockAfter.replace('[date]', incomingInventoryDate)
        incomingInventoryEl.classList.remove(this.classes.hidden)
      } else {
        textEl.textContent = this.getLocales().waitingForStock
        incomingInventoryEl.classList.remove(this.classes.hidden)
      }

      // When OOS and incoming inventory and continue selling disabled, update icon to low inventory
      if (incomingInventoryIcon) {
        if (policy !== 'continue') {
          incomingInventoryIcon.classList.add(this.classes.lowInventory)
        } else {
          incomingInventoryIcon.classList.remove(this.classes.lowInventory)
        }
      }
    } else {
      incomingInventoryEl.classList.add(this.classes.hidden)
    }
  }

  getLocales() {
    this.locales = this.locales || JSON.parse(this.querySelector(this.selectors.locales).textContent)
    return this.locales
  }

  getInventories() {
    this.inventories = this.inventories || JSON.parse(this.querySelector(this.selectors.inventories).textContent)
    return this.inventories
  }
}

customElements.define('product-inventory', ProductInventory)
