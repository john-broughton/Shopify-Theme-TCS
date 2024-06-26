// This is the javascript entrypoint for the advanced accordion section.
// This file and all its inclusions will be processed through esbuild

import '@archetype-themes/scripts/config'

class AdvancedAccordion extends HTMLElement {
  constructor() {
    super()
    this.accordion = this.querySelector('.advanced-accordion')
    this.id = this.accordion.dataset.id

    document.addEventListener('shopify:block:select', (evt) => {
      if (evt.detail.sectionId === this.id) this.accordion.setAttribute('open', '')
    })

    document.addEventListener('shopify:section:load', (evt) => {
      if (evt.detail.sectionId === this.id) this.accordion.setAttribute('open', '')
    })
  }
}

customElements.define('advanced-accordion', AdvancedAccordion)
