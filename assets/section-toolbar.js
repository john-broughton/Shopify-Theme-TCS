// This is the javascript entrypoint for the toolbar section.
// This file and all its inclusions will be processed through postcss

import '@archetype-themes/scripts/config'
import '@archetype-themes/scripts/modules/disclosure'
import 'components/announcement-bar'

class Toolbar extends HTMLElement {
  constructor() {
    super()
    this.container = this
    this.sectionId = this.container.getAttribute('data-section-id')
    this.localeEl = this.container.querySelector('[data-disclosure-locale]')
    this.currencyEl = this.container.querySelector('[data-disclosure-currency]')

    this.addEventListener('shopify:block:select', this.onBlockSelect)
    this.addEventListener('shopify:block:deselect', this.onBlockDeselect)

    /**
     * @event toolbar:loaded
     * @description Fired when the toolbar section has been loaded.
     * @param {string} detail.sectionId - The section's ID.
     */
    document.dispatchEvent(
      new CustomEvent('toolbar:loaded', {
        detail: {
          sectionId: this.sectionId
        }
      })
    )
  }

  connectedCallback() {
    this.initDisclosures()
    theme.announcementBar.init()
  }

  initDisclosures() {
    if (this.localeEl) this.localeDisclosure = new theme.Disclosure(this.localeEl)
    if (this.currencyEl) this.currencyDisclosure = new theme.Disclosure(this.currencyEl)
  }

  onBlockSelect(evt) {
    theme.announcementBar.onBlockSelect(evt.detail.blockId)
  }

  onBlockDeselect() {
    theme.announcementBar.onBlockDeselect()
  }

  disconnectedCallback() {
    theme.announcementBar.unload()

    if (this.localeDisclosure) {
      this.localeDisclosure.destroy()
    }

    if (this.currencyDisclosure) {
      this.currencyDisclosure.destroy()
    }
  }
}

customElements.define('toolbar-section', Toolbar)
