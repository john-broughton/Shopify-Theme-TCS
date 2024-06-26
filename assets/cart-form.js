import '@archetype-themes/scripts/config'
import '@archetype-themes/scripts/modules/cart-api'
import QtySelector from '@archetype-themes/scripts/modules/quantity-selectors'
import '@archetype-themes/scripts/helpers/currency'

/*============================================================================
  CartForm
  - Prevent checkout when terms checkbox exists
  - Listen to quantity changes, rebuild cart (both widget and page)
==============================================================================*/
export default class CartForm {
  constructor(form) {
    this.selectors = {
      products: '[data-products]',
      qtySelector: '.js-qty__wrapper',
      discounts: '[data-discounts]',
      savings: '[data-savings]',
      subTotal: '[data-subtotal]',

      cartBubble: '.cart-link__bubble',
      cartNote: '[name="note"]',
      termsCheckbox: '.cart__terms-checkbox',
      checkoutBtn: '.cart__checkout'
    }

    this.classes = {
      btnLoading: 'btn--loading'
    }

    this.config = {
      requiresTerms: false
    }

    if (!form) {
      return
    }

    this.form = form
    this.wrapper = form.parentNode
    this.location = form.dataset.location
    this.namespace = '.cart-' + this.location
    this.products = form.querySelector(this.selectors.products)
    this.submitBtn = form.querySelector(this.selectors.checkoutBtn)

    this.discounts = form.querySelector(this.selectors.discounts)
    this.savings = form.querySelector(this.selectors.savings)
    this.subtotal = form.querySelector(this.selectors.subTotal)
    this.termsCheckbox = form.querySelector(this.selectors.termsCheckbox)
    this.noteInput = form.querySelector(this.selectors.cartNote)

    this.cartItemsUpdated = false

    if (this.termsCheckbox) {
      this.config.requiresTerms = true
    }

    this.init()
  }

  init() {
    this.initQtySelectors()

    document.addEventListener('cart:quantity' + this.namespace, this.quantityChanged.bind(this))

    this.form.on('submit' + this.namespace, this.onSubmit.bind(this))

    if (this.noteInput) {
      this.noteInput.addEventListener('change', function () {
        const newNote = this.value
        theme.cart.updateNote(newNote)
      })
    }

    // Dev-friendly way to build the cart
    document.addEventListener(
      'cart:build',
      function () {
        this.buildCart()
      }.bind(this)
    )
  }

  reInit() {
    this.initQtySelectors()
  }

  onSubmit(evt) {
    this.submitBtn.classList.add(this.classes.btnLoading)

    /*
      Checks for drawer or cart open class on body element
      and then stops the form from being submitted. We are also
      checking against a custom property, this.cartItemsUpdated = false.

      Error is handled in the quantityChanged method

      For Expanse/Fetch/Gem/Vino quick add, if an error is present it is alerted
      through the add to cart fetch request in quick-add.js.

      Custom property this.cartItemsUpdated = false is reset in cart-drawer.js for
      Expanse/Fetch/Gem/Vino when using quick add
    */

    if (
      (document.documentElement.classList.contains('js-drawer-open') && this.cartItemsUpdated) ||
      (document.documentElement.classList.contains('cart-open') && this.cartItemsUpdated)
    ) {
      this.submitBtn.classList.remove(this.classes.btnLoading)
      evt.preventDefault()
      return false
    }

    if (this.config.requiresTerms) {
      if (this.termsCheckbox.checked) {
        // continue to checkout
      } else {
        alert(theme.strings.cartTermsConfirmation)
        this.submitBtn.classList.remove(this.classes.btnLoading)
        evt.preventDefault()
        return false
      }
    }
  }

  /*============================================================================
    Query cart page to get markup
  ==============================================================================*/
  _parseProductHTML(text) {
    const html = document.createElement('div')
    html.innerHTML = text

    return {
      items: html.querySelector('.cart__items'),
      discounts: html.querySelector('.cart__discounts')
    }
  }

  buildCart() {
    return theme.cart.getCartProductMarkup().then(this.cartMarkup.bind(this))
  }

  cartMarkup(text) {
    const markup = this._parseProductHTML(text)
    const items = markup.items
    const count = parseInt(items.dataset.count)
    const subtotal = items.dataset.cartSubtotal
    const savings = items.dataset.cartSavings

    this.updateCartDiscounts(markup.discounts)
    this.updateSavings(savings)

    if (count > 0) {
      this.wrapper.classList.remove('is-empty')
    } else {
      this.wrapper.classList.add('is-empty')
    }

    this.updateCount(count)

    // Append item markup
    this.products.innerHTML = ''
    this.products.append(items)

    // Update subtotal
    this.subtotal.innerHTML = theme.Currency.formatMoney(subtotal, theme.settings.moneyFormat)

    this.reInit()

    if (Shopify && Shopify.StorefrontExpressButtons) {
      Shopify.StorefrontExpressButtons.initialize()
    }
  }

  updateCartDiscounts(markup) {
    if (!this.discounts) {
      return
    }
    this.discounts.innerHTML = ''
    this.discounts.append(markup)
  }

  /*============================================================================
    Quantity handling
  ==============================================================================*/
  initQtySelectors() {
    this.form.querySelectorAll(this.selectors.qtySelector).forEach((el) => {
      const selector = new QtySelector(el, {
        namespace: this.namespace,
        isCart: true
      })
    })
  }

  quantityChanged(evt) {
    const key = evt.detail[0]
    const qty = evt.detail[1]
    const el = evt.detail[2]

    if (!key || !qty) {
      return
    }

    // Disable qty selector so multiple clicks can't happen while loading
    if (el) {
      el.classList.add('is-loading')
    }

    theme.cart
      .changeItem(key, qty)
      .then(
        function (cart) {
          const parsedCart = JSON.parse(cart)

          if (parsedCart.status === 422) {
            alert(parsedCart.message)
          } else {
            const updatedItem = parsedCart.items.find((item) => item.key === key)

            // Update cartItemsUpdated property on object so we can reference later
            if (
              updatedItem &&
              (evt.type === 'cart:quantity.cart-cart-drawer' || evt.type === 'cart:quantity.cart-header')
            ) {
              this.cartItemsUpdated = true
            }

            if (
              (updatedItem && evt.type === 'cart:quantity.cart-cart-drawer') ||
              (updatedItem && evt.type === 'cart:quantity.cart-header')
            ) {
              if (updatedItem.quantity !== qty) {
              }
              // Reset property on object so that checkout button will work as usual
              this.cartItemsUpdated = false
            }

            if (parsedCart.item_count > 0) {
              this.wrapper.classList.remove('is-empty')
            } else {
              this.wrapper.classList.add('is-empty')
            }
          }

          this.buildCart()

          document.dispatchEvent(
            new CustomEvent('cart:updated', {
              detail: {
                cart: parsedCart
              }
            })
          )
        }.bind(this)
      )
      .catch(function (XMLHttpRequest) {})
  }

  /*============================================================================
    Update elements of the cart
  ==============================================================================*/
  updateSubtotal(subtotal) {
    this.form.querySelector(this.selectors.subTotal).innerHTML = theme.Currency.formatMoney(
      subtotal,
      theme.settings.moneyFormat
    )
  }

  updateSavings(savings) {
    if (!this.savings) {
      return
    }

    if (savings > 0) {
      const amount = theme.Currency.formatMoney(savings, theme.settings.moneyFormat)
      this.savings.classList.remove('hide')
      this.savings.innerHTML = theme.strings.cartSavings.replace('[savings]', amount)
    } else {
      this.savings.classList.add('hide')
    }
  }

  updateCount(count) {
    const countEls = document.querySelectorAll('.cart-link__bubble-num')

    if (countEls.length) {
      countEls.forEach((el) => {
        el.innerText = count
      })
    }

    // show/hide bubble(s)
    const bubbles = document.querySelectorAll(this.selectors.cartBubble)
    if (bubbles.length) {
      if (count > 0) {
        bubbles.forEach((b) => {
          b.classList.add('cart-link__bubble--visible')
        })
      } else {
        bubbles.forEach((b) => {
          b.classList.remove('cart-link__bubble--visible')
        })
      }
    }
  }
}
