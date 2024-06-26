// This is the javascript entrypoint for the age-verification-popup section.
// This file and all its inclusions will be processed through esbuild

import Cookies from 'js-cookie'
import '@archetype-themes/scripts/config'
import Modals from '@archetype-themes/scripts/modules/modal'
import '@archetype-themes/scripts/helpers/sections'
import { lockMobileScrolling, unlockMobileScrolling } from '@archetype-themes/scripts/helpers/a11y'

class AgeVerificationPopup extends HTMLElement {
  constructor() {
    super()

    this.cookieName = this.id
    this.cookie = Cookies.get(this.cookieName)

    this.classes = {
      activeContent: 'age-verification-popup__content--active',
      inactiveContent: 'age-verification-popup__content--inactive',
      inactiveDeclineContent: 'age-verification-popup__decline-content--inactive',
      activeDeclineContent: 'age-verification-popup__decline-content--active'
    }

    this.declineButton = this.querySelector('[data-age-verification-popup-decline-button]')
    this.declineContent = this.querySelector('[data-age-verification-popup-decline-content]')
    this.content = this.querySelector('[data-age-verification-popup-content]')
    this.returnButton = this.querySelector('[data-age-verification-popup-return-button]')
    this.exitButton = this.querySelector('[data-age-verification-popup-exit-button]')
    this.backgroundImage = this.querySelector('[data-background-image]')
    this.mobileBackgroundImage = this.querySelector('[data-mobile-background-image]')

    if (Shopify.designMode) {
      document.addEventListener('shopify:section:select', (event) => {
        if (event.detail.sectionId === this.dataset.sectionId) {
          this.init()
        }
      })

      document.addEventListener('shopify:section:load', (event) => {
        if (event.detail.sectionId === this.dataset.sectionId) {
          this.init()

          // If 'Test mode' is enabled, remove the cookie we've set
          if (this.dataset.testMode === 'true' && this.cookie) {
            Cookies.remove(this.cookieName)
          }

          // Check session storage if user was editing on the second view
          const secondViewVisited = sessionStorage.getItem(this.id)

          if (!secondViewVisited) return

          this.showDeclineContent()
        }
      })

      document.addEventListener('shopify:section:unload', (event) => {
        if (event.detail.sectionId === this.dataset.sectionId) {
          this.modal.close()
        }
      })
    }

    // Age verification popup will only be hidden if test mode is disabled AND
    // either a cookie exists OR visibility is toggled in the editor
    if (this.cookie && this.dataset.testMode === 'false') return

    this.init()
  }

  init() {
    this.modal = new Modals(this.id, 'age-verification-popup-modal', {
      closeOffContentClick: false
    })

    if (this.backgroundImage) {
      this.backgroundImage.style.display = 'block'
    }

    if (theme.config.bpSmall && this.mobileBackgroundImage) {
      this.mobileBackgroundImage.style.display = 'block'
    }

    this.modal.open()

    lockMobileScrolling(`#${this.id}`, document.querySelector('#MainContent'))

    if (this.declineButton) {
      this.declineButton.addEventListener('click', (e) => {
        e.preventDefault()
        this.showDeclineContent()

        // If in editor, save to session storage to indicate that user has moved on to the second view
        // Allows view to persist while making changes in the editor
        if (Shopify.designMode) {
          sessionStorage.setItem(this.id, 'second-view')
        }
      })
    }

    if (this.returnButton) {
      this.returnButton.addEventListener('click', (e) => {
        e.preventDefault()
        this.hideDeclineContent()

        // Remove data from session storage so second view doesn't persist
        const secondViewVisited = sessionStorage.getItem(this.id)

        if (Shopify.designMode && secondViewVisited) {
          sessionStorage.removeItem(this.id)
        }
      })
    }

    if (this.exitButton) {
      this.exitButton.addEventListener('click', (e) => {
        e.preventDefault()

        // We don't want to set a cookie if in test mode
        if (this.dataset.testMode === 'false') {
          Cookies.set(this.cookieName, 'entered', { expires: 30, sameSite: 'none', secure: true })
        }

        if (this.backgroundImage) {
          this.backgroundImage.style.display = 'none'
        }

        if (theme.config.bpSmall && this.mobileBackgroundImage) {
          this.mobileBackgroundImage.style.display = 'none'
        }

        this.modal.close()

        unlockMobileScrolling(`#${this.id}`, document.querySelector('#MainContent'))
      })
    }
  }

  showDeclineContent() {
    this.declineContent.classList.remove(this.classes.inactiveDeclineContent)
    this.declineContent.classList.add(this.classes.activeDeclineContent)

    this.content.classList.add(this.classes.inactiveContent)
    this.content.classList.remove(this.classes.activeContent)
  }

  hideDeclineContent() {
    this.declineContent.classList.add(this.classes.inactiveDeclineContent)
    this.declineContent.classList.remove(this.classes.activeDeclineContent)

    this.content.classList.remove(this.classes.inactiveContent)
    this.content.classList.add(this.classes.activeContent)
  }
}

customElements.define('age-verification-popup', AgeVerificationPopup)
