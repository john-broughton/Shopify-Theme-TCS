import '@archetype-themes/scripts/config'

theme.cart = {
  getCart: function () {
    var url = ''.concat(theme.routes.cart, '?t=').concat(Date.now())
    return fetch(url, {
      credentials: 'same-origin',
      method: 'GET'
    }).then((response) => response.json())
  },

  getCartProductMarkup: function () {
    var url = ''.concat(theme.routes.cartPage, '?t=').concat(Date.now())

    url = url.indexOf('?') === -1 ? url + '?view=ajax' : url + '&view=ajax'

    return fetch(url, {
      credentials: 'same-origin',
      method: 'GET'
    })
      .then((response) => response.text())
      .catch((e) => console.error(e))
  },

  changeItem: function (key, qty) {
    return this._updateCart({
      url: ''.concat(theme.routes.cartChange, '?t=').concat(Date.now()),
      data: JSON.stringify({
        id: key,
        quantity: qty
      })
    })
  },

  _updateCart: function (params) {
    return fetch(params.url, {
      method: 'POST',
      body: params.data,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json'
      }
    })
      .then((response) => {
        return response.text()
      })
      .then((cart) => {
        return cart
      })
  },

  updateAttribute: function (key, value) {
    return this._updateCart({
      url: '/cart/update.js',
      data: JSON.stringify({
        attributes: {
          [key]: theme.cart.attributeToString(value)
        }
      })
    })
  },

  updateNote: function (note) {
    return this._updateCart({
      url: '/cart/update.js',
      data: JSON.stringify({
        note: theme.cart.attributeToString(note)
      })
    })
  },

  attributeToString: function (attribute) {
    if (typeof attribute !== 'string') {
      attribute += ''
      if (attribute === 'undefined') {
        attribute = ''
      }
    }
    return attribute.trim()
  }
}
