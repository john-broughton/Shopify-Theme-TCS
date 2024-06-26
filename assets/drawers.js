import { prepareTransition } from '@archetype-themes/scripts/helpers/utils'
import {
  trapFocus,
  removeTrapFocus,
  lockMobileScrolling,
  unlockMobileScrolling
} from '@archetype-themes/scripts/helpers/a11y'
import '@archetype-themes/scripts/helpers/delegate'

export default class Drawers {
  constructor(id, name) {
    this.config = {
      id: id,
      close: '.js-drawer-close',
      open: '.js-drawer-open-' + name,
      openClass: 'js-drawer-open',
      closingClass: 'js-drawer-closing',
      activeDrawer: 'drawer--is-open',
      namespace: '.drawer-' + name
    }

    this.nodes = {
      page: document.querySelector('#MainContent')
    }

    this.drawer = document.querySelector('#' + id)
    this.isOpen = false

    if (!this.drawer) {
      return
    }

    this.init()
  }

  init() {
    // Setup open button(s)
    document.querySelectorAll(this.config.open).forEach((openBtn) => {
      openBtn.setAttribute('aria-expanded', 'false')
      openBtn.addEventListener('click', this.open.bind(this))
    })

    this.drawer.querySelector(this.config.close).addEventListener('click', this.close.bind(this))

    // Close modal if a drawer is opened
    document.addEventListener(
      'modalOpen',
      function () {
        this.close()
      }.bind(this)
    )
  }

  open(evt, returnFocusEl) {
    if (evt) {
      evt.preventDefault()
    }

    if (this.isOpen) {
      return
    }

    // Without this the drawer opens, the click event bubbles up to $nodes.page which closes the drawer.
    if (evt && evt.stopPropagation) {
      evt.stopPropagation()
      // save the source of the click, we'll focus to this on close
      evt.currentTarget.setAttribute('aria-expanded', 'true')
      this.activeSource = evt.currentTarget
    } else if (returnFocusEl) {
      returnFocusEl.setAttribute('aria-expanded', 'true')
      this.activeSource = returnFocusEl
    }

    prepareTransition(
      this.drawer,
      function () {
        this.drawer.classList.add(this.config.activeDrawer)
      }.bind(this)
    )

    document.documentElement.classList.add(this.config.openClass)
    this.isOpen = true

    trapFocus({
      container: this.drawer,
      namespace: 'drawer_focus'
    })

    document.dispatchEvent(new CustomEvent('drawerOpen'))
    document.dispatchEvent(new CustomEvent('drawerOpen.' + this.config.id))

    this.bindEvents()
  }

  close(evt) {
    if (!this.isOpen) {
      return
    }

    // Do not close if click event came from inside drawer
    if (evt) {
      if (evt.target.closest('.js-drawer-close')) {
        // Do not close if using the drawer close button
      } else if (evt.target.closest('.drawer')) {
        return
      }
    }

    // deselect any focused form elements
    document.activeElement.blur()

    prepareTransition(
      this.drawer,
      function () {
        this.drawer.classList.remove(this.config.activeDrawer)
      }.bind(this)
    )

    document.documentElement.classList.remove(this.config.openClass)
    document.documentElement.classList.add(this.config.closingClass)

    window.setTimeout(
      function () {
        document.documentElement.classList.remove(this.config.closingClass)
        if (this.activeSource && this.activeSource.getAttribute('aria-expanded')) {
          this.activeSource.setAttribute('aria-expanded', 'false')
          this.activeSource.focus()
        }
      }.bind(this),
      500
    )

    this.isOpen = false

    removeTrapFocus({
      container: this.drawer,
      namespace: 'drawer_focus'
    })

    this.unbindEvents()
  }

  bindEvents() {
    // Clicking out of drawer closes it
    window.on(
      'click' + this.config.namespace,
      function (evt) {
        this.close(evt)
        return
      }.bind(this)
    )

    // Pressing escape closes drawer
    window.on(
      'keyup' + this.config.namespace,
      function (evt) {
        if (evt.keyCode === 27) {
          this.close()
        }
      }.bind(this)
    )

    lockMobileScrolling(this.config.namespace, this.nodes.page)
  }

  unbindEvents() {
    window.off('click' + this.config.namespace)
    window.off('keyup' + this.config.namespace)

    unlockMobileScrolling(this.config.namespace, this.nodes.page)
  }
}
