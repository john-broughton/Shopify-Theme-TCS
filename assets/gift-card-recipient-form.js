import { EVENTS, subscribe } from '@archetype-themes/utils/pubsub'

class GiftCardRecipientForm extends HTMLElement {
  constructor() {
    super()
    this.checkboxInput = this.querySelector('.recipient-form__checkbox')
    this.emailInput = this.querySelector('.recipient-form__email')
    this.nameInput = this.querySelector('.recipient-form__name')
    this.messageInput = this.querySelector('.recipient-form__message')
    this.dateInput = this.querySelector('.recipient-form__date')
    this.addEventListener('change', () => this.onChange())
    this.recipientFields = this.querySelector('.recipient-fields')

    this.checkboxInput.addEventListener('change', () => {
      this.recipientFields.style.display = this.checkboxInput.checked ? 'block' : 'none'
    })
  }

  connectedCallback() {
    subscribe(EVENTS.ajaxProductError, (event) => {
      const productVariantID = event.target.querySelector('[name="id"]').value
      if (productVariantID === this.dataset.productVariantId) {
        this.displayErrorMessage(event.detail.errorMessage)
      }
    })

    subscribe(EVENTS.ajaxProductAdded, (event) => {
      const productVariantID = event.target.querySelector('[name="id"]').value
      if (productVariantID === this.dataset.productVariantId) {
        this.clearInputFields()
        this.clearErrorMessage()
      }
    })
  }

  onChange() {
    if (!this.checkboxInput.checked) {
      this.clearInputFields()
      this.clearErrorMessage()
    }
  }

  clearInputFields() {
    for (const element of this.querySelectorAll('.field__input')) {
      element.value = ''
    }
  }

  displayErrorMessage(body) {
    this.clearErrorMessage()
    if (body) {
      return Object.entries(body).forEach(([key, value]) => {
        const inputElement = this[`${key}Input`]
        if (!inputElement) {
          return
        }

        inputElement.setAttribute('aria-invalid', true)
        inputElement.classList.add('field__input--error')
      })
    }
  }

  clearErrorMessage() {
    for (const inputElement of this.querySelectorAll('.field__input')) {
      inputElement.setAttribute('aria-invalid', false)
      inputElement.removeAttribute('aria-describedby')
      inputElement.classList.remove('field__input--error')
    }
  }
}

customElements.define('gift-card-recipient-form', GiftCardRecipientForm)
