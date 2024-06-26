import '@archetype-themes/scripts/config'
import { prepareTransition, debounce } from '@archetype-themes/scripts/helpers/utils'
import '@archetype-themes/scripts/helpers/delegate'

theme.headerNav = (function () {
  var selectors = {
    wrapper: '#HeaderWrapper',
    siteHeader: '#SiteHeader',
    megamenu: '.megamenu',
    navigation: '.site-navigation',
    navItems: '.site-nav__item',
    navLinks: '.site-nav__link',
    navLinksWithDropdown: '.site-nav__link--has-dropdown',
    navDropdownLinks: '.site-nav__dropdown-link--second-level',
    triggerCollapsedMenu: '.site-nav__compress-menu',
    collapsedMenu: '[data-type="nav"]',
    bottomSearch: '[data-type="search"]',
    navDetails: '.site-nav__details'
  }

  var classes = {
    hasDropdownClass: 'site-nav--has-dropdown',
    hasSubDropdownClass: 'site-nav__deep-dropdown-trigger',
    dropdownActive: 'is-focused',
    headerCompressed: 'header-wrapper--compressed',
    overlay: 'header-wrapper--overlay',
    overlayStyle: 'is-light'
  }

  var config = {
    namespace: '.siteNav',
    wrapperOverlayed: false,
    stickyEnabled: false,
    stickyActive: false,
    subarPositionInit: false,
    threshold: 0
  }

  // Elements used in resize functions, defined in init
  var wrapper
  var siteHeader
  var bottomNav
  var bottomSearch

  function init() {
    wrapper = document.querySelector(selectors.wrapper)
    siteHeader = document.querySelector(selectors.siteHeader)
    bottomNav = wrapper.querySelector(selectors.collapsedMenu)
    bottomSearch = wrapper.querySelector(selectors.bottomSearch)

    // Trigger collapsed state at top of header
    config.threshold = wrapper.getBoundingClientRect().top

    config.subarPositionInit = false
    config.stickyEnabled = siteHeader.dataset.sticky === 'true'
    if (config.stickyEnabled) {
      config.wrapperOverlayed = wrapper.classList.contains(classes.overlayStyle)
      stickyHeaderCheck()
    } else {
      disableSticky()
    }

    theme.settings.overlayHeader = siteHeader.dataset.overlay === 'true'
    // Disable overlay header if on collection template with no collection image
    if (theme.settings.overlayHeader && Shopify && Shopify.designMode) {
      if (document.body.classList.contains('template-collection') && !document.querySelector('.collection-hero')) {
        this.disableOverlayHeader()
      }
    }

    // Position menu and search bars absolutely, offsetting their height
    // with an invisible div to prevent reflows
    setAbsoluteBottom()
    window.on('resize' + config.namespace, debounce(250, setAbsoluteBottom))

    var collapsedNavTrigger = wrapper.querySelector(selectors.triggerCollapsedMenu)
    if (collapsedNavTrigger && !collapsedNavTrigger.classList.contains('nav-trigger--initialized')) {
      collapsedNavTrigger.classList.add('nav-trigger--initialized')
      collapsedNavTrigger.on('click', function (e) {
        collapsedNavTrigger.classList.toggle('is-active')
        prepareTransition(bottomNav, function () {
          bottomNav.classList.toggle('is-active')
        })
      })
    }

    menuDetailsHandler()
  }

  // Measure sub menu bar, set site header's bottom padding to it.
  // Set sub bars as absolute to avoid page jumping on collapsed state change.
  function setAbsoluteBottom() {
    if (theme.settings.overlayHeader) {
      document.querySelector('.header-section').classList.add('header-section--overlay')
    }

    var activeSubBar = theme.config.bpSmall
      ? document.querySelector('.site-header__element--sub[data-type="search"]')
      : document.querySelector('.site-header__element--sub[data-type="nav"]')

    if (activeSubBar) {
      var h = activeSubBar.offsetHeight
      // If height is 0, it was measured when hidden so ignore it.
      // Very likely it's on mobile when the address bar is being
      // hidden and triggers a resize
      if (h !== 0) {
        document.documentElement.style.setProperty('--header-padding-bottom', h + 'px')
      }

      // If not setup before, set active class on wrapper so subbars become absolute
      if (!config.subarPositionInit) {
        wrapper.classList.add('header-wrapper--init')
        config.subarPositionInit = true
      }
    }
  }

  // If the header setting to overlay the menu on the collection image
  // is enabled but the collection setting is disabled, we need to undo
  // the init of the sticky nav
  function disableOverlayHeader() {
    wrapper.classList.remove(config.overlayEnabledClass, classes.overlayStyle)
    config.wrapperOverlayed = false
    theme.settings.overlayHeader = false
  }

  function stickyHeaderCheck() {
    // Disable sticky header if any mega menu is taller than window
    theme.config.stickyHeader = doesMegaMenuFit()

    if (theme.config.stickyHeader) {
      config.forceStopSticky = false
      stickyHeader()
    } else {
      config.forceStopSticky = true
      disableSticky()
    }
  }

  function disableSticky() {
    document.querySelector('.header-section').style.position = 'relative'
  }

  function removeOverlayClass() {
    if (config.wrapperOverlayed) {
      wrapper.classList.remove(classes.overlayStyle)
    }
  }

  function doesMegaMenuFit() {
    var largestMegaNav = 0
    siteHeader.querySelectorAll(selectors.megamenu).forEach((nav) => {
      var h = nav.offsetHeight
      if (h > largestMegaNav) {
        largestMegaNav = h
      }
    })

    // 120 ~ space of visible header when megamenu open
    if (window.innerHeight < largestMegaNav + 120) {
      return false
    }

    return true
  }

  function stickyHeader() {
    if (window.scrollY > config.threshold) {
      stickyHeaderScroll()
    }

    window.on('scroll' + config.namespace, stickyHeaderScroll)
  }

  function stickyHeaderScroll() {
    if (!config.stickyEnabled) {
      return
    }

    if (config.forceStopSticky) {
      return
    }

    requestAnimationFrame(scrollHandler)
  }

  function scrollHandler() {
    if (window.scrollY > config.threshold) {
      if (config.stickyActive) {
        return
      }

      if (bottomNav) {
        prepareTransition(bottomNav)
      }
      if (bottomSearch) {
        prepareTransition(bottomSearch)
      }

      config.stickyActive = true

      wrapper.classList.add(classes.headerCompressed)

      if (config.wrapperOverlayed) {
        wrapper.classList.remove(classes.overlayStyle)
      }

      document.dispatchEvent(new CustomEvent('headerStickyChange'))
    } else {
      if (!config.stickyActive) {
        return
      }

      if (bottomNav) {
        prepareTransition(bottomNav)
      }
      if (bottomSearch) {
        prepareTransition(bottomSearch)
      }

      config.stickyActive = false

      // Update threshold in case page was loaded down the screen
      config.threshold = wrapper.getBoundingClientRect().top

      wrapper.classList.remove(classes.headerCompressed)

      if (config.wrapperOverlayed) {
        wrapper.classList.add(classes.overlayStyle)
      }

      document.dispatchEvent(new CustomEvent('headerStickyChange'))
    }
  }

  function menuDetailsHandler() {
    const navDetails = document.querySelectorAll(selectors.navDetails)

    navDetails.forEach((navDetail) => {
      const summary = navDetail.querySelector('summary')

      // if the navDetail is open, then close it when the user clicks outside of it
      document.addEventListener('click', (evt) => {
        if (navDetail.hasAttribute('open') && !navDetail.contains(evt.target)) {
          navDetail.removeAttribute('open')
          summary.setAttribute('aria-expanded', 'false')
        } else {
          if (navDetail.hasAttribute('open')) {
            summary.setAttribute('aria-expanded', 'false')
          } else {
            summary.setAttribute('aria-expanded', 'true')
          }
        }
      })
    })
  }

  return {
    init: init,
    removeOverlayClass: removeOverlayClass,
    disableOverlayHeader: disableOverlayHeader
  }
})()
