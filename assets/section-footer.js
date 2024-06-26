// This is the javascript entrypoint for the footer section.
// This file and all its inclusions will be processed through postcss

import '@archetype-themes/scripts/config'
import '@archetype-themes/scripts/modules/disclosure'
import { init as collapsiblesInit } from '@archetype-themes/scripts/modules/collapsibles'

class FooterSection extends HTMLElement {
  constructor() {
    super()

    this.selectors = {
      locale: '[data-disclosure-locale]',
      currency: '[data-disclosure-currency]'
    }

    this.ids = {
      mobileNav: 'MobileNav',
      footerNavWrap: 'FooterMobileNavWrap',
      footerNav: 'FooterMobileNav'
    }

    this.container = this
    this.localeDisclosure = null
    this.currencyDisclosure = null

    /**
     * @event footer-section:loaded
     * @description Fired when the footer section has been loaded.
     * @param {string} detail.sectionId - The section's ID.
     */
    document.dispatchEvent(
      new CustomEvent('footer-section:loaded', {
        detail: {
          sectionId: this.sectionId
        }
      })
    )

    this.init()
  }

  disconnectedCallback() {
    this.onUnload()
  }

  init() {
    const localeEl = this.container.querySelector(this.selectors.locale)
    const currencyEl = this.container.querySelector(this.selectors.currency)

    if (localeEl) {
      this.localeDisclosure = new theme.Disclosure(localeEl)
    }

    if (currencyEl) {
      this.currencyDisclosure = new theme.Disclosure(currencyEl)
    }

    // Change email icon to submit text
    const newsletterInput = document.querySelector('.footer__newsletter-input')
    if (newsletterInput) {
      newsletterInput.addEventListener('keyup', function () {
        newsletterInput.classList.add('footer__newsletter-input--active')
      })
    }

    // If on mobile, copy the mobile nav to the footer
    if (theme.config.bpSmall) {
      this.initDoubleMobileNav()
    }

    // Re-hook up collapsible box triggers
    collapsiblesInit(this.container)
  }

  initDoubleMobileNav() {
    const menuPlaceholder = document.getElementById(this.ids.footerNavWrap)
    if (!menuPlaceholder) {
      return
    }

    const mobileNav = document.getElementById(this.ids.mobileNav)
    const footerNav = document.getElementById(this.ids.footerNav)
    const clone = mobileNav.cloneNode(true)
    const navEl = clone.querySelector('.slide-nav__wrapper')

    // Append cloned nav to footer, initialize JS, then show it
    footerNav.appendChild(navEl)
    new theme.MobileNav({
      id: this.ids.footerNav,
      inHeader: false
    })

    menuPlaceholder.classList.remove('hide')
  }

  onUnload() {
    if (this.localeDisclosure) {
      this.localeDisclosure.destroy()
    }

    if (this.currencyDisclosure) {
      this.currencyDisclosure.destroy()
    }
  }
}

customElements.define('footer-section', FooterSection)
