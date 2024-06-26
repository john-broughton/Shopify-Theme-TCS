// This is the javascript entrypoint for the main-cart section.
// This file and all its inclusions will be processed through postcss

import '@archetype-themes/scripts/config'
import CartForm from '@archetype-themes/scripts/modules/cart-form'
import '@archetype-themes/scripts/helpers/sections'

if (document.body.classList.contains('template-cart')) {
  var cartPageForm = document.getElementById('CartPageForm')
  if (cartPageForm) {
    var cartForm = new CartForm(cartPageForm)

    var noteBtn = cartPageForm.querySelector('.add-note')
    if (noteBtn) {
      noteBtn.addEventListener('click', function () {
        noteBtn.classList.toggle('is-active')
        cartPageForm.querySelector('.cart__note').classList.toggle('hide')
      })
    }

    document.addEventListener(
      'ajaxProduct:added',
      function (evt) {
        cartForm.buildCart()
      }.bind(this)
    )
  }
}
