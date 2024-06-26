import { trapFocus, removeTrapFocus } from '@archetype-themes/scripts/helpers/a11y'
import '@archetype-themes/scripts/helpers/delegate'

export default class Modals {
  constructor(id, name, options) {
    this.id = id
    this.modal = document.getElementById(id)

    if (!this.modal) {
      return false
    }

    this.modalContent = this.modal.querySelector('.modal__inner')

    const defaults = {
      close: '.js-modal-close',
      open: '.js-modal-open-' + name,
      openClass: 'modal--is-active',
      closingClass: 'modal--is-closing',
      bodyOpenClass: ['modal-open'],
      bodyOpenSolidClass: 'modal-open--solid',
      bodyClosingClass: 'modal-closing',
      closeOffContentClick: true
    }

    this.config = Object.assign(defaults, options)
    this.modalIsOpen = false
    this.focusOnOpen = this.config.focusIdOnOpen ? document.getElementById(this.config.focusIdOnOpen) : this.modal
    this.isSolid = this.config.solid

    this.init()
  }

  init = function () {
    document.querySelectorAll(this.config.open).forEach((btn) => {
      btn.setAttribute('aria-expanded', 'false')
      btn.addEventListener('click', this.open.bind(this))
    })

    this.modal.querySelectorAll(this.config.close).forEach((btn) => {
      btn.addEventListener('click', this.close.bind(this))
    })

    // Close modal if a drawer is opened
    document.addEventListener(
      'drawerOpen',
      function () {
        this.close()
      }.bind(this)
    )
  }

  open = function (evt) {
    // Keep track if modal was opened from a click, or called by another function
    let externalCall = false

    // don't open an opened modal
    if (this.modalIsOpen) {
      return
    }

    // Prevent following href if link is clicked
    if (evt) {
      evt.preventDefault()
    } else {
      externalCall = true
    }

    // Without this, the modal opens, the click event bubbles up to $nodes.page
    // which closes the modal.
    if (evt && evt.stopPropagation) {
      evt.stopPropagation()
      // save the source of the click, we'll focus to this on close
      this.activeSource = evt.currentTarget.setAttribute('aria-expanded', 'true')
    }

    if (this.modalIsOpen && !externalCall) {
      this.close()
    }

    this.modal.classList.add(this.config.openClass)

    document.documentElement.classList.add(...this.config.bodyOpenClass)

    if (this.isSolid) {
      document.documentElement.classList.add(this.config.bodyOpenSolidClass)
    }

    this.modalIsOpen = true

    // Delay trap focus to ensure elements are seen by screen readers
    setTimeout(() => {
      trapFocus({
        container: this.modal,
        elementToFocus: this.focusOnOpen,
        namespace: 'modal_focus'
      })
    }, 100)

    document.dispatchEvent(new CustomEvent('modalOpen'))
    document.dispatchEvent(new CustomEvent('modalOpen.' + this.id))

    this.bindEvents()
  }

  close = function (evt) {
    // don't close a closed modal
    if (!this.modalIsOpen) {
      return
    }

    // Do not close modal if click happens inside modal content
    if (evt) {
      if (evt.target.closest('.js-modal-close')) {
        // Do not close if using the modal close button
      } else if (evt.target.closest('.modal__inner')) {
        return
      }
    }

    // deselect any focused form elements
    document.activeElement.blur()

    this.modal.classList.remove(this.config.openClass)
    this.modal.classList.add(this.config.closingClass)

    document.documentElement.classList.remove(...this.config.bodyOpenClass)
    document.documentElement.classList.add(this.config.bodyClosingClass)

    window.setTimeout(
      function () {
        document.documentElement.classList.remove(this.config.bodyClosingClass)
        this.modal.classList.remove(this.config.closingClass)
        if (this.activeSource && this.activeSource.getAttribute('aria-expanded')) {
          this.activeSource.setAttribute('aria-expanded', 'false').focus()
        }
      }.bind(this),
      500
    ) // modal close css transition

    if (this.isSolid) {
      document.documentElement.classList.remove(this.config.bodyOpenSolidClass)
    }

    this.modalIsOpen = false

    removeTrapFocus({
      container: this.modal,
      namespace: 'modal_focus'
    })

    document.dispatchEvent(new CustomEvent('modalClose.' + this.id))

    this.unbindEvents()
  }

  bindEvents() {
    window.on(
      'keyup.modal',
      function (evt) {
        if (evt.keyCode === 27) {
          this.close()
        }
      }.bind(this)
    )

    if (this.config.closeOffContentClick) {
      // Clicking outside of the modal content also closes it
      this.modal.on('click.modal', this.close.bind(this))
    }
  }

  unbindEvents() {
    document.documentElement.off('.modal')

    if (this.config.closeOffContentClick) {
      this.modal.off('.modal')
    }
  }
}
