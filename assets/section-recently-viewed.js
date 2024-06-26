// This is the javascript entrypoint for the recently-viewed section.
// This file and all its inclusions will be processed through esbuild

import '@archetype-themes/scripts/config'

theme.recentlyViewedIds = []

if (theme.config.hasLocalStorage) {
  const recentIds = window.localStorage.getItem('recently-viewed')
  if (recentIds && typeof recentIds !== undefined) {
    theme.recentlyViewedIds = JSON.parse(recentIds)
  }
}

class RecentlyViewed extends HTMLElement {
  constructor() {
    super()

    this.initialized = false
    this.container = this
    this.sectionId = this.container.getAttribute('data-section-id')
    this.maxProducts = this.container.getAttribute('data-max-products')

    this.init()

    /**
     * @event recently-viewed:loaded
     * @description Fired when the recently viewed section has been loaded.
     * @param {string} detail.sectionId - The section's ID.
     */
    document.dispatchEvent(
      new CustomEvent('recently-viewed:loaded', {
        detail: {
          sectionId: this.sectionId
        }
      })
    )
  }

  addIdToRecentlyViewed(id) {
    if (!id) return

    // Remove current product if already in recently viewed array
    if (theme.recentlyViewedIds.includes(id)) {
      theme.recentlyViewedIds.splice(theme.recentlyViewedIds.indexOf(id), 1)
    }

    // Add id to array
    theme.recentlyViewedIds.unshift(id)

    if (theme.config.hasLocalStorage) {
      window.localStorage.setItem('recently-viewed', JSON.stringify(theme.recentlyViewedIds))
    }
  }

  init() {
    // Add current product to recently viewed
    this.addIdToRecentlyViewed(this.dataset.productId)

    if (this.initialized) {
      return
    }

    this.initialized = true

    // Stop if no data
    if (!theme.recentlyViewedIds.length) {
      this.container.classList.add('hide')
      return
    }

    this.outputContainer = this.container.querySelector(`#RecentlyViewed-${this.sectionId}`)
    const currentId = this.container.getAttribute('data-product-id')

    let url = `${theme.routes.search}?view=recently-viewed&type=product&q=`

    let products = ''
    let i = 0
    theme.recentlyViewedIds.forEach((val) => {
      // Skip current product
      if (val === currentId) {
        return
      }

      // Stop at max
      if (i >= this.maxProducts) {
        return
      }

      products += `id:${val} OR `
      i++
    })

    url = url + encodeURIComponent(products)

    fetch(url)
      .then((response) => response.text())
      .then((text) => {
        const html = document.createElement('div')
        html.innerHTML = text
        const count = html.querySelectorAll('.grid-product').length

        if (count > 0) {
          const results = html.querySelector('.product-grid')
          this.outputContainer.append(results)
        } else {
          this.container.classList.add('hide')
        }
      })
      .catch((e) => {
        console.error(e)
      })
  }

  disconnectedCallback() {
    this.initialized = false
  }
}

customElements.define('recently-viewed', RecentlyViewed)
