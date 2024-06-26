import noUiSlider from 'nouislider'
import '@archetype-themes/scripts/config'
import '@archetype-themes/scripts/helpers/currency'
import '@archetype-themes/scripts/helpers/delegate'

if (typeof noUiSlider === 'undefined') {
  throw new Error('theme.PriceRange is missing vendor noUiSlider: // =require vendor/nouislider.js')
}

const defaultStep = 10
const selectors = {
  priceRange: '.price-range',
  priceRangeSlider: '.price-range__slider',
  priceRangeInputMin: '.price-range__input-min',
  priceRangeInputMax: '.price-range__input-max',
  priceRangeDisplayMin: '.price-range__display-min',
  priceRangeDisplayMax: '.price-range__display-max',
  filters: '#CollectionSidebarFilterWrap .filter-wrapper'
}

class PriceRange extends HTMLElement {
  constructor() {
    super()
    this.container = this
  }

  connectedCallback() {
    if (!theme.filtersPrime) {
      theme.filtersPrime = document.querySelector(selectors.filters).cloneNode(true)
    }

    this.init()
  }

  init() {
    if (!this.container.classList.contains('price-range')) {
      throw new Error('You must instantiate PriceRange with a valid container')
    }

    this.formEl = this.container.closest('form')
    this.sliderEl = this.container.querySelector(selectors.priceRangeSlider)
    this.inputMinEl = this.container.querySelector(selectors.priceRangeInputMin)
    this.inputMaxEl = this.container.querySelector(selectors.priceRangeInputMax)
    this.displayMinEl = this.container.querySelector(selectors.priceRangeDisplayMin)
    this.displayMaxEl = this.container.querySelector(selectors.priceRangeDisplayMax)

    this.minRange = parseFloat(this.container.dataset.min) || 0
    this.minValue = parseFloat(this.container.dataset.minValue) || 0
    this.maxRange = parseFloat(this.container.dataset.max) || 100
    this.maxValue = parseFloat(this.container.dataset.maxValue) || this.maxRange

    return this.createPriceRange()
  }

  createPriceRange() {
    if (this.sliderEl && this.sliderEl.noUiSlider && typeof this.sliderEl.noUiSlider.destroy === 'function') {
      this.sliderEl.noUiSlider.destroy()
    }

    const slider = noUiSlider.create(this.sliderEl, {
      connect: true,
      step: defaultStep,
      // Do not allow overriding these options
      start: [this.minValue, this.maxValue],
      range: {
        min: this.minRange,
        max: this.maxRange
      }
    })

    slider.on('update', (values) => {
      this.displayMinEl.innerHTML = theme.Currency.formatMoney(values[0], theme.settings.moneyFormat)
      this.displayMaxEl.innerHTML = theme.Currency.formatMoney(values[1], theme.settings.moneyFormat)

      /**
       * @event price-range:update
       * @description Triggered when the price range slider is updated.
       * @param {object} detail - The values of the price range slider.
       */
      document.dispatchEvent(
        new CustomEvent('price-range:update', {
          detail: values
        })
      )
    })

    slider.on('change', (values) => {
      this.inputMinEl.value = values[0]
      this.inputMaxEl.value = values[1]

      const formData = new FormData(this.formEl)

      /**
       * @event price-range:change
       * @description Triggered when the price range slider is changed.
       * @param {Object} formData - The form data.
       */
      document.dispatchEvent(
        new CustomEvent('price-range:change', {
          detail: formData
        })
      )
    })

    return slider
  }
}

customElements.define('price-range', PriceRange)
