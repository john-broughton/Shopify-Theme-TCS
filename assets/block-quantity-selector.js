import QtySelector from '@archetype-themes/scripts/modules/quantity-selectors'

class BlockQuantitySelector extends HTMLElement {
  constructor() {
    super()
    new QtySelector(this.querySelector('.js-qty__wrapper'), {
      namespace: '.product'
    })
  }
}

customElements.define('block-quantity-selector', BlockQuantitySelector)
