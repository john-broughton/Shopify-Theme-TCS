import '@archetype-themes/scripts/config'

// Shopify-built select-like popovers for currency and language selection
theme.Disclosure = (function () {
  var selectors = {
    disclosureForm: '[data-disclosure-form]',
    disclosureList: '[data-disclosure-list]',
    disclosureToggle: '[data-disclosure-toggle]',
    disclosureInput: '[data-disclosure-input]',
    disclosureOptions: '[data-disclosure-option]'
  }

  var classes = {
    listVisible: 'disclosure-list--visible'
  }

  function Disclosure(disclosure) {
    this.container = disclosure
    this._cacheSelectors()
    this._setupListeners()
  }

  Disclosure.prototype = Object.assign({}, Disclosure.prototype, {
    _cacheSelectors: function () {
      this.cache = {
        disclosureForm: this.container.closest(selectors.disclosureForm),
        disclosureList: this.container.querySelector(selectors.disclosureList),
        disclosureToggle: this.container.querySelector(selectors.disclosureToggle),
        disclosureInput: this.container.querySelector(selectors.disclosureInput),
        disclosureOptions: this.container.querySelectorAll(selectors.disclosureOptions)
      }
    },

    _setupListeners: function () {
      this.eventHandlers = this._setupEventHandlers()

      this.cache.disclosureToggle.addEventListener('click', this.eventHandlers.toggleList)

      this.cache.disclosureOptions.forEach(function (disclosureOption) {
        disclosureOption.addEventListener('click', this.eventHandlers.connectOptions)
      }, this)

      this.container.addEventListener('keyup', this.eventHandlers.onDisclosureKeyUp)

      this.cache.disclosureList.addEventListener('focusout', this.eventHandlers.onDisclosureListFocusOut)

      this.cache.disclosureToggle.addEventListener('focusout', this.eventHandlers.onDisclosureToggleFocusOut)

      document.body.addEventListener('click', this.eventHandlers.onBodyClick)
    },

    _setupEventHandlers: function () {
      return {
        connectOptions: this._connectOptions.bind(this),
        toggleList: this._toggleList.bind(this),
        onBodyClick: this._onBodyClick.bind(this),
        onDisclosureKeyUp: this._onDisclosureKeyUp.bind(this),
        onDisclosureListFocusOut: this._onDisclosureListFocusOut.bind(this),
        onDisclosureToggleFocusOut: this._onDisclosureToggleFocusOut.bind(this)
      }
    },

    _connectOptions: function (event) {
      event.preventDefault()

      this._submitForm(event.currentTarget.dataset.value)
    },

    _onDisclosureToggleFocusOut: function (event) {
      var disclosureLostFocus = this.container.contains(event.relatedTarget) === false

      if (disclosureLostFocus) {
        this._hideList()
      }
    },

    _onDisclosureListFocusOut: function (event) {
      var childInFocus = event.currentTarget.contains(event.relatedTarget)

      var isVisible = this.cache.disclosureList.classList.contains(classes.listVisible)

      if (isVisible && !childInFocus) {
        this._hideList()
      }
    },

    _onDisclosureKeyUp: function (event) {
      if (event.which !== 27) return
      this._hideList()
      this.cache.disclosureToggle.focus()
    },

    _onBodyClick: function (event) {
      var isOption = this.container.contains(event.target)
      var isVisible = this.cache.disclosureList.classList.contains(classes.listVisible)

      if (isVisible && !isOption) {
        this._hideList()
      }
    },

    _submitForm: function (value) {
      this.cache.disclosureInput.value = value
      this.cache.disclosureForm.submit()
    },

    _hideList: function () {
      this.cache.disclosureList.classList.remove(classes.listVisible)
      this.cache.disclosureToggle.setAttribute('aria-expanded', false)
    },

    _toggleList: function () {
      var ariaExpanded = this.cache.disclosureToggle.getAttribute('aria-expanded') === 'true'
      this.cache.disclosureList.classList.toggle(classes.listVisible)
      this.cache.disclosureToggle.setAttribute('aria-expanded', !ariaExpanded)
    },

    destroy: function () {
      this.cache.disclosureToggle.removeEventListener('click', this.eventHandlers.toggleList)

      this.cache.disclosureOptions.forEach(function (disclosureOption) {
        disclosureOption.removeEventListener('click', this.eventHandlers.connectOptions)
      }, this)

      this.container.removeEventListener('keyup', this.eventHandlers.onDisclosureKeyUp)

      this.cache.disclosureList.removeEventListener('focusout', this.eventHandlers.onDisclosureListFocusOut)

      this.cache.disclosureToggle.removeEventListener('focusout', this.eventHandlers.onDisclosureToggleFocusOut)

      document.body.removeEventListener('click', this.eventHandlers.onBodyClick)
    }
  })

  return Disclosure
})()
