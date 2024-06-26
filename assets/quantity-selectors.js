let selectors = {
  input: '.js-qty__num',
  plus: '.js-qty__adjust--plus',
  minus: '.js-qty__adjust--minus'
}

export default class QtySelector {
  constructor(el, options) {
    this.wrapper = el
    this.plus = el.querySelector(selectors.plus)
    this.minus = el.querySelector(selectors.minus)
    this.input = el.querySelector(selectors.input)
    this.minValue = this.input.getAttribute('min') || 1

    let defaults = {
      namespace: null,
      isCart: false,
      key: this.input.dataset.id
    }

    this.options = Object.assign({}, defaults, options)

    this.init()
  }

  init() {
    this.plus.addEventListener(
      'click',
      function () {
        let qty = this._getQty()
        this._change(qty + 1)
      }.bind(this)
    )

    this.minus.addEventListener(
      'click',
      function () {
        let qty = this._getQty()
        this._change(qty - 1)
      }.bind(this)
    )

    this.input.addEventListener(
      'change',
      function (evt) {
        this._change(this._getQty())
      }.bind(this)
    )
  }

  _getQty() {
    let qty = this.input.value
    if (parseFloat(qty) == parseInt(qty) && !isNaN(qty)) {
      // We have a valid number!
    } else {
      // Not a number. Default to 1.
      qty = 1
    }
    return parseInt(qty)
  }

  _change(qty) {
    if (qty <= this.minValue) {
      qty = this.minValue
    }

    this.input.value = qty

    if (this.options.isCart) {
      document.dispatchEvent(
        new CustomEvent('cart:quantity' + this.options.namespace, {
          detail: [this.options.key, qty, this.wrapper]
        })
      )
    }
  }
}
