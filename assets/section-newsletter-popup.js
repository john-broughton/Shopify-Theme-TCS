// This is the javascript entrypoint for the newsletter-popup section.
// This file and all its inclusions will be processed through esbuild

import Cookies from 'js-cookie'
import '@archetype-themes/scripts/config'
import Modals from '@archetype-themes/scripts/modules/modal'

class NewsletterPopup extends HTMLElement {
  constructor() {
    super()
    this.container = this
    this.sectionId = this.container.getAttribute('data-section-id')
    this.cookieName = 'newsletter-' + this.sectionId
    this.cookie = Cookies.get(this.cookieName)
  }

  connectedCallback() {
    if (!this.container) return
    // Prevent popup on Shopify robot challenge page
    if (window.location.pathname === '/challenge') return
    // Prevent popup on password page
    if (window.location.pathname === '/password') return

    this.data = {
      secondsBeforeShow: this.container.dataset.delaySeconds,
      daysBeforeReappear: this.container.dataset.delayDays,
      hasReminder: this.container.dataset.hasReminder,
      testMode: this.container.dataset.testMode
    }

    this.modal = new Modals('NewsletterPopup-' + this.sectionId, 'newsletter-popup-modal')

    // Set cookie if optional button is clicked
    const btn = this.container.querySelector('.popup-cta a')
    if (btn) {
      btn.addEventListener(
        'click',
        function () {
          this.closePopup(true)
        }.bind(this)
      )
    }

    // Open modal if errors or success message exist
    if (this.container.querySelector('.errors') || this.container.querySelector('.note--success')) {
      this.modal.open()
    }

    // Set cookie as opened if success message
    if (this.container.querySelector('.note--success')) {
      this.closePopup(true)
      return
    }

    document.addEventListener('modalClose.' + this.container.id, this.closePopup.bind(this))

    if (!this.cookie) {
      this.initPopupDelay()
    }

    // Open modal if triggered by newsletter reminder
    document.addEventListener('reminder:openNewsletter', () => {
      this.modal.open()
    })

    document.addEventListener('shopify:section:select', (e) => {
      if (e.detail.sectionId === this.sectionId) {
        this.modal.open()
      } else {
        this.modal.close()
      }
    })

    document.addEventListener('shopify:section:deselect', (e) => {
      if (e.detail.sectionId === this.sectionId) this.modal.close()
    })

    document.addEventListener('shopify:block:select', (e) => {
      if (e.detail.sectionId === this.sectionId) this.modal.close()
    })

    document.addEventListener('shopify:block:deselect', (e) => {
      if (e.detail.sectionId === this.sectionId) {
        this.modal.open()
      } else {
        this.modal.close()
      }
    })

    /**
     * @event newsletter-popup:loaded
     * @description Fired when the newsletter popup section has been loaded.
     * @param {string} detail.sectionId - The section's ID.
     * @param {boolean} bubbles - Whether the event bubbles up through the DOM or not.
     */
    document.dispatchEvent(
      new CustomEvent('newsletter-popup:loaded', {
        detail: {
          sectionID: this.sectionId
        },
        bubbles: true
      })
    )
  }

  initPopupDelay() {
    if (this.data.testMode === 'true') {
      return
    }
    setTimeout(() => {
      const newsletterAppeared = sessionStorage.getItem('newsletterAppeared') === 'true'
      if (newsletterAppeared) {
        /**
         * @event newsletter:openReminder
         * @description Triggered when the newsletter reminder is opened.
         * @param {boolean} bubbles - Whether the event bubbles up through the DOM or not.
         */
        const openReminder = new CustomEvent('newsletter:openReminder', { bubbles: true })
        this.container.dispatchEvent(openReminder)
      } else {
        this.modal.open()
        sessionStorage.setItem('newsletterAppeared', true)
      }
    }, this.data.secondsBeforeShow * 1000)
  }

  closePopup(success) {
    // Remove a cookie in case it was set in test mode
    if (this.data.testMode === 'true') {
      Cookies.remove(this.cookieName, { path: '/' })
      return
    }

    const expires = success ? 200 : this.data.daysBeforeReappear
    const hasReminder = this.data.hasReminder === 'true'
    const reminderAppeared = sessionStorage.getItem('reminderAppeared') === 'true'

    if (hasReminder && reminderAppeared) {
      Cookies.set(this.cookieName, 'opened', { path: '/', expires: expires })
    } else if (!hasReminder) {
      Cookies.set(this.cookieName, 'opened', { path: '/', expires: expires })
    }
  }
}

customElements.define('newsletter-popup', NewsletterPopup)
