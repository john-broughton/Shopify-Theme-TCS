// This is the javascript entrypoint for the password-header section.
// This file and all its inclusions will be processed through postcss

import '@archetype-themes/scripts/config'
import Modals from '@archetype-themes/scripts/modules/modal'

class PasswordHeader extends HTMLElement {
  constructor() {
    super()
    this.sectionId = this.getAttribute('data-section-id')

    if (!document.querySelector('#LoginModal')) return

    const passwordModal = new Modals('LoginModal', 'login-modal', {
      focusIdOnOpen: 'password',
      solid: true
    })

    // Open modal if errors exist
    if (document.querySelectorAll('.errors').length) passwordModal.open()

    /**
     * @event password-header:loaded
     * @description Fired when the password header section has been loaded.
     * @param {string} detail.sectionId - The section's ID.
     * @param {boolean} bubbles - Whether the event bubbles up through the DOM or not.
     */
    document.dispatchEvent(
      new CustomEvent('password-header:loaded', {
        detail: {
          sectionID: this.sectionId
        },
        bubbles: true
      })
    )
  }
}

customElements.define('password-header', PasswordHeader)
