import { init } from '@archetype-themes/scripts/modules/collapsibles'

class BlockDescription extends HTMLElement {
  constructor() {
    super()
  }

  connectedCallback() {
    init(this)
  }
}

customElements.define('block-description', BlockDescription)
