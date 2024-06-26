// This is the javascript entrypoint for the newsletter-reminder snippet.
// This file and all its inclusions will be processed through esbuild

import Cookies from 'js-cookie'
import '@archetype-themes/scripts/config'
import Modals from '@archetype-themes/scripts/modules/modal'

/*============================================================================
  NewsletterReminder
==============================================================================*/

class NewsletterReminder extends HTMLElement {
  constructor() {
    super()
    this.closeBtn = this.querySelector('[data-close-button]')
    this.popupTrigger = this.querySelector('[data-message]')

    this.id = this.dataset.sectionId
    this.newsletterId = `NewsletterPopup-${this.id}`
    this.cookie = Cookies.get(`newsletter-${this.id}`)
    this.cookieName = `newsletter-${this.id}`
    this.secondsBeforeShow = this.dataset.delaySeconds
    this.expiry = parseInt(this.dataset.delayDays)
    this.modal = new Modals(`NewsletterPopup-${this.newsletterId}`, 'newsletter-popup-modal')

    this.init()
  }

  connectedCallback() {
    this.style.display = 'block'
  }

  init() {
    document.addEventListener('shopify:block:select', (evt) => {
      if (evt.detail.sectionId === this.id) {
        this.show(0, true)
      }
    })

    document.addEventListener('shopify:block:deselect', (evt) => {
      if (evt.detail.sectionId === this.id) {
        this.hide()
      }
    })

    document.addEventListener(`modalOpen.${this.newsletterId}`, () => this.hide())
    document.addEventListener(`modalClose.${this.newsletterId}`, () => this.show())
    document.addEventListener(`newsletter:openReminder`, () => this.show(0))

    this.closeBtn.addEventListener('click', () => {
      this.hide()
      Cookies.set(this.cookieName, 'opened', { path: '/', expires: this.expiry })
    })

    this.popupTrigger.addEventListener('click', () => {
      /**
       * @event reminder:openNewsletter
       * @description Fired when the reminder to open the newsletter is triggered.
       * @param {boolean} bubbles - Indicates whether the event bubbles up through the DOM or not.
       */
      const reminderOpen = new CustomEvent('reminder:openNewsletter', { bubbles: true })
      this.dispatchEvent(reminderOpen)

      this.hide()
    })
  }

  show(time = this.secondsBeforeShow, forceOpen = false) {
    const reminderAppeared = sessionStorage.getItem('reminderAppeared') === 'true'

    if (!reminderAppeared || forceOpen) {
      setTimeout(() => {
        this.dataset.enabled = 'true'
        sessionStorage.setItem('reminderAppeared', true)
      }, time * 1000)
    }
  }

  hide() {
    this.dataset.enabled = 'false'
  }
}

customElements.define('newsletter-reminder', NewsletterReminder)
