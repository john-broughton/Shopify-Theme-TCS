import '@archetype-themes/scripts/config'
import Swatches from '@archetype-themes/scripts/modules/swatches'

class ProductGridItem extends HTMLElement {
  constructor() {
    super()

    this.swatches = new Swatches(this)

    /**
     * @event product-grid-item:loaded
     * @description Fires when the product grid item has been loaded.
     */
    document.dispatchEvent(new CustomEvent('product-grid-item:loaded'))
  }
}

customElements.define('product-grid-item', ProductGridItem)
