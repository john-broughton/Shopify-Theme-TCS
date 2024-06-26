import '@archetype-themes/scripts/config'
import CartForm from '@archetype-themes/scripts/modules/cart-form'
import '@archetype-themes/scripts/modules/header-nav'
import { lockMobileScrolling, unlockMobileScrolling } from '@archetype-themes/scripts/helpers/a11y'
import { prepareTransition } from '@archetype-themes/scripts/helpers/utils'
import '@archetype-themes/scripts/helpers/size-drawer'
import '@archetype-themes/scripts/helpers/delegate'
import { EVENTS, subscribe } from '@archetype-themes/utils/pubsub'

export default class HeaderCart {
  constructor() {
    this.selectors = {
      cartTrigger: '#HeaderCartTrigger',
      cart: '#HeaderCart',

      closeBtn: '.js-close-header-cart',
      noteBtn: '.add-note'
    }

    this.classes = {
      hidden: 'hide'
    }

    this.config = {
      cartOpen: false,
      namespace: '.cart-header'
    }

    this.wrapper = document.querySelector(this.selectors.cart)
    if (!this.wrapper) {
      return
    }
    this.trigger = document.querySelector(this.selectors.cartTrigger)
    this.noteBtn = this.wrapper.querySelector(this.selectors.noteBtn)
    this.form = this.wrapper.querySelector('form')

    // Close header cart
    document.addEventListener('MobileNav:open', this.close.bind(this))
    document.addEventListener('modalOpen', this.close.bind(this))

    this.init()
  }

  disconnectedCallback() {
    this.productAddedUnsubscriber?.()
  }

  init() {
    this.cartForm = new CartForm(this.form)
    this.cartForm.buildCart()

    this.trigger.on('click', this.open.bind(this))

    document.querySelectorAll(this.selectors.closeBtn).forEach((btn) => {
      btn.addEventListener(
        'click',
        function () {
          this.close()
        }.bind(this)
      )
    })

    if (this.noteBtn) {
      this.noteBtn.addEventListener(
        'click',
        function () {
          this.noteBtn.classList.toggle('is-active')
          this.wrapper.querySelector('.cart__note').classList.toggle('hide')
        }.bind(this)
      )
    }

    this.productAddedUnsubscriber = subscribe(EVENTS.ajaxProductAdded, this.handleCartChange.bind(this))

    // Dev-friendly way to open cart
    document.addEventListener('cart:open', this.open.bind(this))
    document.addEventListener('cart:close', this.close.bind(this))
  }

  async handleCartChange(evt) {
    await this.cartForm.buildCart()
    if (!this.config.cartOpen) {
      this.open()
    }

    // Resets cart property so that the form submit button can work
    if (this.cartForm.cartItemsUpdated) {
      this.cartForm.cartItemsUpdated = false
    }
  }

  open(evt) {
    if (theme.settings.cartType !== 'dropdown') {
      return
    }

    if (evt) {
      evt.preventDefault()
    }

    theme.sizeDrawer()

    prepareTransition(
      this.wrapper,
      function () {
        this.wrapper.classList.add('is-active')
        this.wrapper.scrollTop = 0
      }.bind(this)
    )

    document.documentElement.classList.add('cart-open')

    // Don't lock mobile scrolling if sticky header isn't present
    if (!theme.config.bpSmall && theme.settings.overlayHeader) {
      lockMobileScrolling(this.config.namespace)
    }

    // Esc closes cart popup
    window.on(
      'keyup' + this.config.namespace,
      function (evt) {
        if (evt.keyCode === 27) {
          this.close()
        }
      }.bind(this)
    )

    theme.headerNav.removeOverlayClass()

    document.dispatchEvent(new CustomEvent('CartDrawer:open'))
    document.dispatchEvent(new CustomEvent('drawerOpen'))

    // Clicking out of cart closes it. Timeout to prevent immediate bubbling
    setTimeout(
      function () {
        window.on(
          'click' + this.config.namespace,
          function (evt) {
            this.close(evt)
          }.bind(this)
        )
      }.bind(this),
      0
    )

    this.config.cartOpen = true
  }

  close(evt) {
    if (theme.settings.cartType !== 'dropdown') {
      return
    }

    // Do not close if click event came from inside drawer
    if (evt && evt.target.closest && evt.target.closest('.site-header__cart')) {
      return
    }

    if (!this.config.cartOpen) {
      return
    }

    // If custom event, close without transition
    if (evt && evt.type === 'MobileNav:open') {
      this.wrapper.classList.remove('is-active')
    } else {
      prepareTransition(
        this.wrapper,
        function () {
          this.wrapper.classList.remove('is-active')
        }.bind(this)
      )
    }

    window.off('keyup' + this.config.namespace)
    window.off('click' + this.config.namespace)

    if (!theme.config.bpSmall && theme.settings.overlayHeader) {
      unlockMobileScrolling(this.config.namespace)
    }

    document.documentElement.classList.remove('cart-open')

    this.config.cartOpen = false
  }
}
