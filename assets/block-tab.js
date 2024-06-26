import { init } from '@archetype-themes/scripts/modules/collapsibles'

class BlockTab extends HTMLElement {
  constructor() {
    super()
  }

  connectedCallback() {
    init(this)
  }
}

customElements.define('block-tab', BlockTab)
