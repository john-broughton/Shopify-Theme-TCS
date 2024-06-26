// This is the javascript entrypoint for the image-element snippet.
// This file and all its inclusions will be processed through esbuild

import '@archetype-themes/scripts/config'
import '@archetype-themes/scripts/helpers/sections'

/*============================================================================
  AtIcon
==============================================================================*/

class AtIcon extends HTMLElement {
  constructor() {
    super()
    this.src = this.getAttribute('src')
    this.name = this.getAttribute('data-name')
  }

  connectedCallback() {
    if (!this.src) return

    fetch(this.src)
      .then((response) => response.text())
      .then((svg) => {
        // check if svg has doctype
        if (svg.indexOf('<!DOCTYPE') > -1) {
          return
        }

        this.innerHTML = svg

        this.querySelector('svg').classList.add('icon', `icon-${this.name}`)
      })
      .catch((error) => {
        console.log('Error:', error)
      })
  }
}

customElements.define('at-icon', AtIcon)
