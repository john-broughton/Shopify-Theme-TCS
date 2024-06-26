import '@archetype-themes/scripts/helpers/delegate'

export function trapFocus(options) {
  let eventsName = {
    focusin: options.namespace ? 'focusin.' + options.namespace : 'focusin',
    focusout: options.namespace ? 'focusout.' + options.namespace : 'focusout',
    keydown: options.namespace ? 'keydown.' + options.namespace : 'keydown.handleFocus'
  }

  // Get every possible visible focusable element
  let focusableEls = options.container.querySelectorAll(
    'button, [href], input, select, textarea, label, [tabindex]:not([tabindex^="-"])'
  )
  let elArray = [].slice.call(focusableEls)
  let focusableElements = elArray.filter((el) => el.offsetParent !== null)

  let firstFocusable = focusableElements[0]
  let lastFocusable = focusableElements[focusableElements.length - 1]

  if (!options.elementToFocus) {
    options.elementToFocus = options.container
  }

  options.container.setAttribute('tabindex', '-1')
  options.elementToFocus.focus()

  document.documentElement.off('focusin')
  document.documentElement.on(eventsName.focusout, function () {
    document.documentElement.off(eventsName.keydown)
  })

  document.documentElement.on(eventsName.focusin, function (evt) {
    if (evt.target !== options.container && evt.target !== lastFocusable && evt.target !== firstFocusable) return

    document.documentElement.on(eventsName.keydown, function (evt) {
      _manageFocus(evt)
    })
  })

  function _manageFocus(evt) {
    if (evt.keyCode !== 9) return
    /**
     * On the first focusable element and tab backward,
     * focus the last element
     */
    if (evt.target === lastFocusable && !evt.shiftKey) {
      evt.preventDefault()
      firstFocusable.focus()
    }
  }
}

export function removeTrapFocus(options) {
  let eventName = options.namespace ? 'focusin.' + options.namespace : 'focusin'

  if (options.container) {
    options.container.removeAttribute('tabindex')
  }

  document.documentElement.off(eventName)
}

export function lockMobileScrolling(namespace, element) {
  let el = element ? element : document.documentElement
  document.documentElement.classList.add('lock-scroll')
  el.on('touchmove' + namespace, function () {
    return true
  })
}

export function unlockMobileScrolling(namespace, element) {
  document.documentElement.classList.remove('lock-scroll')
  let el = element ? element : document.documentElement
  el.off('touchmove' + namespace)
}
