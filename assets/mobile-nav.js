import '@archetype-themes/scripts/config'
import '@archetype-themes/scripts/modules/header-nav'
import '@archetype-themes/scripts/helpers/size-drawer'
import { prepareTransition } from '@archetype-themes/scripts/helpers/utils'
import '@archetype-themes/scripts/helpers/delegate'

/*============================================================================
  MobileNav has two uses:
  - Dropdown from header on small screens
  - Duplicated into footer, initialized as separate entity in theme.HeaderSection
==============================================================================*/
theme.MobileNav = (function () {
  var selectors = {
    wrapper: '.slide-nav__wrapper',
    nav: '.slide-nav',
    childList: '.slide-nav__dropdown',
    allLinks: 'a.slide-nav__link',
    subNavToggleBtn: '.js-toggle-submenu',

    // Trigger to open header nav
    openBtn: '.mobile-nav-trigger'
  }

  var classes = {
    isActive: 'is-active'
  }

  var defaults = {
    isOpen: false,
    menuLevel: 1,
    inHeader: false
  }

  function MobileNav(args) {
    this.config = Object.assign({}, defaults, args)
    this.namespace = '.nav-header-' + args.id

    this.container = document.getElementById(this.config.id)
    if (!this.container) {
      return
    }

    this.wrapper = this.container.querySelector(selectors.wrapper)
    if (!this.wrapper) {
      return
    }
    this.nav = this.wrapper.querySelector(selectors.nav)
    this.openTriggers = document.querySelectorAll(selectors.openBtn)

    this.init()
  }

  MobileNav.prototype = Object.assign({}, MobileNav.prototype, {
    init: function () {
      // Open/close mobile nav
      if (this.openTriggers.length) {
        this.openTriggers.forEach((btn) => {
          btn.addEventListener(
            'click',
            function () {
              if (this.config.isOpen) {
                this.close()
              } else {
                this.open()
              }
            }.bind(this)
          )
        })
      }

      // Toggle between menu levels
      this.nav.querySelectorAll(selectors.subNavToggleBtn).forEach((btn) => {
        btn.addEventListener('click', this.toggleSubNav.bind(this))
      })

      // Close nav when a normal link is clicked
      this.nav.querySelectorAll(selectors.allLinks).forEach((link) => {
        link.addEventListener('click', this.close.bind(this))
      })

      if (this.inHeader) {
        document.addEventListener(
          'unmatchSmall',
          function () {
            this.close(null, true)
          }.bind(this)
        )

        document.addEventListener('CartDrawer:open', this.close.bind(this))

        // Dev-friendly way to open/close mobile nav
        document.addEventListener('mobileNav:open', this.open.bind(this))
        document.addEventListener('mobileNav:close', this.close.bind(this))
      }
    },

    /*============================================================================
      Open/close mobile nav drawer in header
    ==============================================================================*/
    open: function (evt) {
      if (evt) {
        evt.preventDefault()
      }

      theme.sizeDrawer()

      this.openTriggers.forEach((btn) => {
        btn.classList.add('is-active')
      })

      prepareTransition(
        this.container,
        function () {
          this.container.classList.add('is-active')
        }.bind(this)
      )

      // Esc closes cart popup
      window.on(
        'keyup' + this.namespace,
        function (evt) {
          if (evt.keyCode === 27) {
            this.close()
          }
        }.bind(this)
      )

      theme.headerNav.removeOverlayClass()

      document.documentElement.classList.add('mobile-nav-open')
      document.dispatchEvent(new CustomEvent('MobileNav:open'))

      this.config.isOpen = true

      // Clicking out of menu closes it. Timeout to prevent immediate bubbling
      setTimeout(
        function () {
          window.on(
            'click' + this.namespace,
            function (evt) {
              this.close(evt)
            }.bind(this)
          )
        }.bind(this),
        0
      )
    },

    close: function (evt, noAnimate) {
      var forceClose = false
      // Do not close if click event came from inside drawer,
      // unless it is a normal link with no children
      if (evt && evt.target.closest && evt.target.closest('.site-header__drawer')) {
        // If normal link, continue to close drawer
        if (evt.currentTarget && evt.currentTarget.classList) {
          if (evt.currentTarget.classList.contains('slide-nav__link')) {
            forceClose = true
          }
        }

        if (!forceClose) {
          return
        }
      }

      this.openTriggers.forEach((btn) => {
        btn.classList.remove('is-active')
      })

      if (noAnimate) {
        this.container.classList.remove('is-active')
      } else {
        prepareTransition(
          this.container,
          function () {
            this.container.classList.remove('is-active')
          }.bind(this)
        )
      }

      document.documentElement.classList.remove('mobile-nav-open')
      document.dispatchEvent(new CustomEvent('MobileNav:close'))

      window.off('keyup' + this.namespace)
      window.off('click' + this.namespace)

      this.config.isOpen = false
    },

    /*============================================================================
      Handle switching between nav levels
    ==============================================================================*/
    toggleSubNav: function (evt) {
      var btn = evt.currentTarget
      this.goToSubnav(btn.dataset.target)
    },

    // If a level is sent we are going up, so target list doesn't matter
    goToSubnav: function (target) {
      // Activate new list if a target is passed
      var targetMenu = this.nav.querySelector(selectors.childList + '[data-parent="' + target + '"]')
      if (targetMenu) {
        this.config.menuLevel = targetMenu.dataset.level

        // Hide all level 3 menus if going to level 2
        if (this.config.menuLevel == 2) {
          this.nav.querySelectorAll(selectors.childList + '[data-level="3"]').forEach((list) => {
            list.classList.remove(classes.isActive)
          })
        }

        targetMenu.classList.add(classes.isActive)
        this.setWrapperHeight(targetMenu.offsetHeight)
      } else {
        // Going to top level, reset
        this.config.menuLevel = 1
        this.wrapper.removeAttribute('style')
        this.nav.querySelectorAll(selectors.childList).forEach((list) => {
          list.classList.remove(classes.isActive)
        })
      }

      this.wrapper.dataset.level = this.config.menuLevel
    },

    setWrapperHeight: function (h) {
      this.wrapper.style.height = h + 'px'
    }
  })

  return MobileNav
})()
