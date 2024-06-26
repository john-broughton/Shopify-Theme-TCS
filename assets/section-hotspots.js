// This is the javascript entrypoint for the hotspots section.
// This file and all its inclusions will be processed through esbuild

import '@archetype-themes/scripts/config'
import '@archetype-themes/scripts/helpers/delegate'

/*============================================================================
  HotSpots
==============================================================================*/

class HotSpots extends HTMLElement {
  constructor() {
    super()
    this.el = this
    this.buttons = this.querySelectorAll('[data-button]')
    this.hotspotBlocks = this.querySelectorAll('[data-hotspot-block]')
    this.blockContainer = this.querySelector('[data-block-container]')

    this._bindEvents()
  }

  /* Setup event listeners */
  _bindEvents() {
    this.buttons.forEach((button) => {
      const id = button.dataset.button

      button.on('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        this._showContent(id)
      })
    })

    // Display active hotspot block on theme editor select
    document.addEventListener('shopify:block:select', (e) => {
      const blockId = e.detail.blockId
      this._showContent(`${blockId}`)
    })
  }

  /* Toggle sidebar content */
  _showContent(id) {
    // Hide all hotspotBlock
    // Show the hotspotBlock with the id
    this.hotspotBlocks.forEach((block) => {
      if (block.dataset.hotspotBlock === id) {
        block.classList.add('is-active')
      } else {
        block.classList.remove('is-active')
      }
    })
  }
}

customElements.define('hot-spots', HotSpots)
