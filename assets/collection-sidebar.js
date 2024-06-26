import '@archetype-themes/scripts/config'
import { unlockMobileScrolling, lockMobileScrolling } from '@archetype-themes/scripts/helpers/a11y'
import { prepareTransition } from '@archetype-themes/scripts/helpers/utils'
import '@archetype-themes/scripts/helpers/delegate'

theme.CollectionSidebar = (function () {
  var selectors = {
    sidebarId: 'CollectionSidebar',
    trigger: '.collection-filter__btn',
    mobileWrapper: '#CollectionInlineFilterWrap',
    filters: '.filter-wrapper',
    filterBar: '.collection-filter'
  }

  var config = {
    isOpen: false,
    namespace: '.collection-filters'
  }

  function CollectionSidebar() {
    // Do not load when no sidebar exists
    if (!document.getElementById(selectors.sidebarId)) {
      return
    }

    document.addEventListener('filter:selected', this.close.bind(this))
    this.init()
  }

  function getScrollFilterTop() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop
    var elTop = document.querySelector(selectors.filterBar).getBoundingClientRect().top
    return elTop + scrollTop
  }

  // Set a max-height on drawers when they're opened via CSS variable
  // to account for changing mobile window heights
  function sizeDrawer() {
    var header = document.getElementById('HeaderWrapper').offsetHeight
    var filters = document.querySelector(selectors.filterBar).offsetHeight
    var max = window.innerHeight - header - filters
    document.documentElement.style.setProperty('--maxFiltersHeight', `${max}px`)
  }

  CollectionSidebar.prototype = Object.assign({}, CollectionSidebar.prototype, {
    init: function () {
      config.isOpen = false
      unlockMobileScrolling(config.namespace)

      // This function runs on page load, and when the collection section loads
      // so we need to be mindful of not duplicating event listeners
      this.container = document.getElementById(selectors.sidebarId)
      this.trigger = document.querySelector(selectors.trigger)
      this.wrapper = document.querySelector(selectors.mobileWrapper)
      this.filters = this.wrapper.querySelector(selectors.filters)

      this.trigger.off('click')
      this.trigger.on('click', this.toggle.bind(this))
    },

    /*============================================================================
      Open and close filter drawer
    ==============================================================================*/
    toggle: function () {
      if (config.isOpen) {
        this.close()
      } else {
        this.open()
      }
    },

    open: function () {
      sizeDrawer()

      // Scroll to top of filter bar when opened
      var scrollTo = getScrollFilterTop()
      window.scrollTo({ top: scrollTo, behavior: 'smooth' })

      this.trigger.classList.add('is-active')

      prepareTransition(
        this.filters,
        function () {
          this.filters.classList.add('is-active')
        }.bind(this)
      )
      config.isOpen = true

      lockMobileScrolling(config.namespace)

      window.on(
        'keyup' + config.namespace,
        function (evt) {
          if (evt.keyCode === 27) {
            this.close()
          }
        }.bind(this)
      )
    },

    close: function () {
      this.trigger.classList.remove('is-active')

      prepareTransition(
        this.filters,
        function () {
          this.filters.classList.remove('is-active')
        }.bind(this)
      )
      config.isOpen = false

      unlockMobileScrolling(config.namespace)

      window.off('keyup' + config.namespace)
    },

    onSelect: function () {
      this.open()
    },

    onDeselect: function () {
      this.close()
    }
  })

  return CollectionSidebar
})()
