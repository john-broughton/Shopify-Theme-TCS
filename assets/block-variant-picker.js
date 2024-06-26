import { EVENTS, publish } from '@archetype-themes/utils/pubsub'

class BlockVariantPicker extends HTMLElement {
  connectedCallback() {
    this.productInfo = new Map()

    this.addEventListener('change', this.handleVariantChange.bind(this))
    this.addEventListener('touchstart', this.handleElementEvent.bind(this))
    this.addEventListener('mousedown', this.handleElementEvent.bind(this))
  }

  handleElementEvent(event) {
    const target = event.target.previousElementSibling
    if (target?.tagName !== 'INPUT') {
      return
    }

    this.updateOptions(target)
    this.updateMasterId()
    // start preloading
    this.currentVariant && this.getProductInfo()
  }

  async handleVariantChange(event) {
    this.updateOptions()
    this.updateMasterId(event.target)
    if ('dynamicVariantsEnabled' in this.dataset) this.updateVariantStatuses(event.target)
    this.updateColorName(event.target)

    if (this.currentVariant) {
      this.updateURL()
      const html = await this.getProductInfo()

      publish(`${EVENTS.variantChange}:${this.dataset.productId}`, {
        detail: {
          sectionId: this.dataset.sectionId,
          html,
          variant: this.currentVariant
        }
      })
    } else {
      publish(`${EVENTS.variantChange}:${this.dataset.productId}`, {
        detail: {
          sectionId: this.dataset.sectionId,
          html: null,
          variant: null
        }
      })
    }
  }

  updateOptions(target) {
    this.options = Array.from(this.querySelectorAll('select, fieldset'), (element) => {
      if (element.tagName === 'SELECT') {
        return element.value
      }

      if (element.tagName === 'FIELDSET') {
        return Array.from(element.querySelectorAll('input')).find(
          (radio) => (target && radio === target) ?? radio.checked
        )?.value
      }
    })
  }

  updateMasterId(target) {
    const availableFullMatch = this.getFullMatch(true)
    const closestAvailableMatch = this.getClosestAvailableMatch(target)
    const fullMatch = this.getFullMatch(false)

    this.currentVariant =
      'dynamicVariantsEnabled' in this.dataset
        ? // Add some additional smarts to variant matching if Dynamic Variants are enabled
          availableFullMatch || closestAvailableMatch || fullMatch || null
        : // Only return a full match or null (variant doesn't exist) if Dynamic Variants are disabled
          fullMatch || null
  }

  getFullMatch(needsToBeAvailable) {
    return this.getVariantData().find((variant) => {
      const isMatch = this.options.every((value, index) => {
        return variant[this.getOptionName(index)] === value
      })

      if (needsToBeAvailable) {
        return isMatch && variant.available
      } else {
        return isMatch
      }
    })
  }

  // Find a variant that is available and best matches last selected option
  getClosestAvailableMatch(lastSelectedOption) {
    if (!lastSelectedOption) return null

    const potentialAvailableMatches =
      lastSelectedOption &&
      this.getVariantData().filter((variant) => {
        return (
          this.options
            .filter(
              // Only match based selected options that are equal and preceeding the last selected option
              (_, index) => index + 1 <= this.numberFromOptionKey(lastSelectedOption.dataset.index)
            )
            .every((value, index) => {
              // Variant needs to have options that match the current and preceeding selection options
              return variant[this.getOptionName(index)] === value
            }) && variant.available
        )
      })

    return potentialAvailableMatches.reduce((bestMatch, variant) => {
      // If this is the first potential match we've found, store it as the best match
      if (bestMatch === null) return variant

      // If this is not the first potential match, compare the number of options our current best match has in common
      // compared to the next contender.
      const bestMatchCount = this.getWeightedOptionMatchCount(bestMatch, lastSelectedOption)
      const newCount = this.getWeightedOptionMatchCount(variant, lastSelectedOption)

      return newCount > bestMatchCount ? variant : bestMatch
    }, null)
  }

  // Options should be ordered from highest to lowest priority. Make sure that priority
  // is represented using weighted values when finding best match
  getWeightedOptionMatchCount(variant) {
    return this.options.reduce((count, value, index) => {
      const weightedCount = 3 - index // The lower the index, the better the match we have
      return variant[this.getOptionName(index)] === value ? count + weightedCount : count
    }, 0)
  }

  // Pull the number out of the option index name, e.g. 'option1' -> 1
  numberFromOptionKey(key) {
    return parseInt(key.substr(-1))
  }

  getOptionName(index) {
    return `option${index + 1}`
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent)
    return this.variantData
  }

  updateVariantStatuses(lastSelectedOption) {
    const selectedOptionOneVariants = this.variantData.filter(
      (variant) => this.querySelector(':checked').value === variant.option1
    )
    const inputWrappers = [...this.querySelectorAll('fieldset, .variant-wrapper')]
    inputWrappers.forEach((option, index) => {
      if (index === 0 || lastSelectedOption.parentElement === option) return

      const optionInputs = [...option.querySelectorAll('input[type="radio"], option')]
      const previousOptionSelected = inputWrappers[index - 1].querySelector(':checked').value
      const availableOptionInputsValue = selectedOptionOneVariants
        .filter((variant) => variant.available && variant[`option${index}`] === previousOptionSelected)
        .map((variantOption) => variantOption[this.getOptionName(index)])

      this.setInputAvailability(optionInputs, availableOptionInputsValue)
    })
  }

  updateColorName(element) {
    if (element.tagName !== 'INPUT') return
    const fieldset = element.parentElement
    const colorLabel = fieldset.querySelector('[data-variant-color-label]')
    if (!colorLabel) return
    colorLabel.textContent = element.value
  }

  setInputAvailability(elementList, availableValuesList) {
    elementList.forEach((element) => {
      const value = element.getAttribute('value')
      const availableElement = availableValuesList.includes(value)

      if (element.tagName === 'INPUT') {
        element.toggleAttribute('data-disabled', !availableElement)
        this.currentVariant?.[element.dataset.index] === value && (element.checked = true)
      }
    })
  }

  updateURL() {
    if (!this.currentVariant || !('updateUrl' in this.dataset)) return
    window.history.replaceState({}, '', `${this.dataset.url}?variant=${this.currentVariant.id}`)
  }

  getProductInfo() {
    const requestedVariantId = this.currentVariant.id
    if (this.productInfo.has(requestedVariantId)) {
      return this.productInfo.get(requestedVariantId)
    }

    this.productInfo.set(
      requestedVariantId,
      fetch(`${this.dataset.url}?variant=${requestedVariantId}&section_id=${this.dataset.sectionId}`)
        .then((response) => response.text())
        .then((responseText) => new DOMParser().parseFromString(responseText, 'text/html'))
    )

    return this.productInfo.get(requestedVariantId)
  }
}

customElements.define('block-variant-picker', BlockVariantPicker)
