import '@archetype-themes/scripts/config'
import '@archetype-themes/scripts/helpers/delegate'

theme.headerSearch = (function () {
  var searchTimeout

  var selectors = {
    input: 'input[type="search"]',

    searchInlineContainer: '.site-header__search-container',
    searchInlineBtn: '.js-search-header',

    searchButton: '[data-predictive-search-button]',
    closeSearch: '.site-header__search-btn--cancel',

    wrapper: '#SearchResultsWrapper',
    topSearched: '#TopSearched',
    predictiveWrapper: '#PredictiveWrapper',
    resultDiv: '#PredictiveResults'
  }

  var cache = {}

  var config = {
    namespace: '.search',
    topSearched: false,
    predictiveSearch: false,
    imageSize: 'square',
    predictiveImageFill: true
  }

  function init() {
    initInlineSearch()
  }

  function close(evt) {
    // If close button is clicked, close as expected.
    // Otherwise, ignore clicks in search results, search form, or container elements
    if (evt && evt.target.closest) {
      if (evt.target.closest(selectors.closeSearch)) {
      } else {
        if (evt.target.closest('.site-header__element--sub')) {
          return
        } else if (evt.target.closest('#SearchResultsWrapper')) {
          return
        } else if (evt.target.closest('.site-header__search-container')) {
          return
        }
      }
    }

    //emit predictive search close event
    document.dispatchEvent(new CustomEvent('predictive-search:close', { bubbles: true }))

    // deselect any focused form elements
    document.activeElement.blur()

    if (cache.wrapper) {
      cache.wrapper.classList.add('hide')
    }

    if (config.topSearched) {
      cache.topSearched.classList.remove('hide')
    }

    if (config.predictiveSearch) {
      cache.predictiveWrapper.classList.add('hide')
      clearTimeout(searchTimeout)
    }

    if (cache.inlineSearchContainer) {
      cache.inlineSearchContainer.classList.remove('is-active')
    }

    window.off('click' + config.namespace)
  }

  function initInlineSearch() {
    cache.inlineSearchContainer = document.querySelector(selectors.searchInlineContainer)
    document.querySelectorAll(selectors.searchInlineBtn).forEach((btn) => {
      btn.addEventListener('click', openInlineSearch)
    })
  }

  function openInlineSearch(evt) {
    evt.preventDefault()
    evt.stopImmediatePropagation()
    var container = document.querySelector(selectors.searchInlineContainer)
    container.classList.add('is-active')

    //emit predictive search open event
    document.dispatchEvent(
      new CustomEvent('predictive-search:open', {
        detail: {
          context: 'header'
        },
        bubbles: true
      })
    )

    enableCloseListeners()
  }

  function enableCloseListeners() {
    // Clicking out of search area closes it. Timeout to prevent immediate bubbling
    setTimeout(function () {
      window.on('click' + config.namespace, function (evt) {
        close(evt)
      })
    }, 0)

    // Esc key also closes search
    window.on('keyup', function (evt) {
      if (evt.keyCode === 27) {
        close()
      }
    })

    //listen for predictive-search:close
    document.addEventListener(
      'predictive-search:close-all',
      function () {
        close()
      },
      { once: true }
    )
  }

  return {
    init: init
  }
})()
