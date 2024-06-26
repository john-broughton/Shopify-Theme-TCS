// This is the javascript entrypoint for the predictive-search snippet.
// This file and all its inclusions will be processed through postcss

/*============================================================================
  PredictiveSearch
==============================================================================*/

class PredictiveSearch extends HTMLElement {
  constructor() {
    super()
    this.enabled = this.getAttribute('data-enabled')
    this.context = this.getAttribute('data-context')
    this.input = this.querySelector('input[type="search"]')
    this.predictiveSearchResults = this.querySelector('#predictive-search')
    this.closeBtn = this.querySelector('.btn--close-search')
    this.screen = this.querySelector('[data-screen]')
    this.SearchModal = this.closest('#SearchModal') || null

    // Open events
    document.addEventListener('predictive-search:open', (e) => {
      if (e.detail.context !== this.context) return
      this.classList.add('is-active')

      // Wait for opening events to finish then apply focus
      setTimeout(() => {
        this.input.focus()
      }, 100)

      document.body.classList.add('predictive-overflow-hidden')
    })

    // listen for class change of 'modal--is-active on this.SearchModal
    if (this.SearchModal) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            const modalClass = mutation.target.className
            if (modalClass.indexOf('modal--is-active') > -1) {
              setTimeout(() => {
                this.input.focus()
              }, 100)
            }
          }
        })
      })

      observer.observe(this.SearchModal, {
        attributes: true
      })
    }

    if (this.enabled === 'false') return

    // On typing
    this.input.addEventListener('keydown', () => {
      this.classList.add('is-active')
    })

    this.input.addEventListener(
      'input',
      this.debounce((event) => {
        this.onChange(event)
      }, 300).bind(this)
    )

    // Close events
    document.addEventListener('predictive-search:close', () => {
      this.close()
    })
    document.addEventListener('keydown', (event) => {
      if (event.keyCode === 27) this.close()
    })
    this.closeBtn.addEventListener('click', (e) => {
      e.preventDefault()
      this.close()
    })
    this.screen.addEventListener('click', () => {
      this.close()
    })
  }

  onChange() {
    const searchTerm = this.input.value.trim()

    if (!searchTerm.length) return

    this.getSearchResults(searchTerm)
  }

  getSearchResults(searchTerm) {
    const searchObj = {
      q: searchTerm,
      'resources[limit]': 3,
      'resources[limit_scope]': 'each',
      'resources[options][unavailable_products]': 'last'
    }

    const params = this.paramUrl(searchObj)

    fetch(`${theme.routes.predictiveSearch}?${params}&section_id=search-results`)
      .then((response) => {
        if (!response.ok) {
          const error = new Error(response.status)
          this.close()
          throw error
        }

        return response.text()
      })
      .then((text) => {
        const resultsMarkup = new DOMParser()
          .parseFromString(text, 'text/html')
          .querySelector('#shopify-section-search-results').innerHTML
        this.predictiveSearchResults.innerHTML = resultsMarkup
        this.open()
      })
      .catch((error) => {
        this.close()
        throw error
      })
  }

  open() {
    this.predictiveSearchResults.style.display = 'block'
  }

  close() {
    this.predictiveSearchResults.style.display = 'none'
    this.predictiveSearchResults.innerHTML = ''
    this.classList.remove('is-active')
    document.body.classList.remove('predictive-overflow-hidden')

    /**
     * @event predictive-search:close-all
     * @description Fired when the predictive search is closed.
     */
    document.dispatchEvent(new CustomEvent('predictive-search:close-all'))
  }

  debounce(fn, wait) {
    let t
    return (...args) => {
      clearTimeout(t)
      t = setTimeout(() => fn.apply(this, args), wait)
    }
  }

  paramUrl(obj) {
    return Object.keys(obj)
      .map(function (key) {
        return key + '=' + encodeURIComponent(obj[key])
      })
      .join('&')
  }
}

customElements.define('predictive-search', PredictiveSearch)
