import { init } from '@archetype-themes/scripts/modules/collapsibles'

class BlockContact extends HTMLElement {
  constructor() {
    super()
  }

  connectedCallback() {
    init(this)
  }
}

customElements.define('block-contact', BlockContact)
