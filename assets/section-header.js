// This is the javascript entrypoint for the header section.
// This file and all its inclusions will be processed through esbuild

import '@archetype-themes/scripts/config'
import '@archetype-themes/scripts/modules/disclosure'
import '@archetype-themes/scripts/modules/mobile-nav'
import '@archetype-themes/scripts/modules/header-search'
import '@archetype-themes/scripts/modules/header-nav'
import HeaderCart from '@archetype-themes/scripts/modules/cart-drawer'
import { debounce } from '@archetype-themes/scripts/helpers/utils'
import '@archetype-themes/scripts/helpers/size-drawer'

class HeaderSection extends HTMLElement {
  constructor() {
    super()

    this.namespace = '.header'
    this.headerFooter = this.querySelector('#MobileNavFooter')
    this.footerMenus = document.querySelector('#FooterMenus')
    this.container = this
    this.sectionID = this.container.getAttribute('data-section-id')
    this.detailsEl = this.container.querySelectorAll('[data-section-type="header"] details[data-hover="true"]')

    this.init()

    /**
     * @event header-section:loaded
     * @description Fired when the header section has been loaded.
     * @param {string} detail.sectionId - The section's ID.
     * @param {boolean} bubbles - Whether the event bubbles up through the DOM or not.
     */
    document.dispatchEvent(
      new CustomEvent('header-section:loaded', {
        detail: {
          sectionID: this.sectionID
        },
        bubbles: true
      })
    )
  }

  init() {
    if (Shopify && Shopify.designMode) {
      // Set a timer to resize the header in case the logo changes size
      setTimeout(function () {
        window.dispatchEvent(new Event('resize'))
      }, 500)
    }

    theme.headerNav.init()
    theme.headerSearch.init()

    this.hoverMenu()

    // Enable header cart drawer when not on cart page
    if (!document.body.classList.contains('template-cart')) {
      new HeaderCart()
    }
    new theme.MobileNav({
      id: 'MobileNav',
      inHeader: true
    })

    if (theme.config.bpSmall) {
      this.cloneFooter()
    }

    window.on('resize' + this.namespace, debounce(300, theme.sizeDrawer))
  }

  hoverMenu() {
    this.detailsEl.forEach((detail) => {
      const summary = detail.querySelector('summary')
      const summaryLink = summary.dataset.link

      summary.addEventListener('click', (e) => {
        e.preventDefault()

        if (!detail.hasAttribute('open')) {
          detail.setAttribute('open', '')
          detail.setAttribute('aria-expanded', 'true')
        } else {
          window.location.href = summaryLink
        }
      })

      detail.addEventListener('focusout', (e) => {
        const isChild = detail.contains(e.relatedTarget)

        if (!isChild) {
          detail.removeAttribute('open')
          detail.setAttribute('aria-expanded', 'false')
        }
      })

      detail.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && detail.hasAttribute('open')) {
          detail.removeAttribute('open')
          detail.setAttribute('aria-expanded', 'false')
          summary.focus()
        }
      })

      detail.addEventListener('mouseover', () => {
        if (!detail.hasAttribute('open')) {
          detail.setAttribute('open', '')
          detail.setAttribute('aria-expanded', 'true')
        }
      })

      detail.addEventListener('mouseleave', () => {
        if (detail.hasAttribute('open')) {
          detail.removeAttribute('open')
          detail.setAttribute('aria-expanded', 'false')
        }
      })
    })
  }

  cloneFooter() {
    if (!this.headerFooter) {
      return
    }

    const clone = this.footerMenus.cloneNode(true)
    clone.id = ''

    // Append cloned footer menus to mobile nav
    this.headerFooter.appendChild(clone)

    // If localization form, update IDs so they don't match footer
    const localizationForm = this.headerFooter.querySelector('.multi-selectors')
    if (localizationForm) {
      // Loop disclosure buttons and update ids and aria attributes
      localizationForm.querySelectorAll('[data-disclosure-toggle]').forEach((el) => {
        const controls = el.getAttribute('aria-controls')
        const describedby = el.getAttribute('aria-describedby')

        el.setAttribute('aria-controls', controls + '-header')
        el.setAttribute('aria-describedby', describedby + '-header')

        const list = document.getElementById(controls)
        if (list) {
          list.id = controls + '-header'
        }

        const label = document.getElementById(describedby)
        if (label) {
          label.id = describedby + '-header'
        }

        // Initialize language/currency selectors
        const parent = el.parentNode
        if (parent) {
          new theme.Disclosure(parent)
        }
      })
    }
  }
}

customElements.define('header-section', HeaderSection)
