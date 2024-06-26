export const config = {
  bpSmall: false,
  youTubeReady: false,
  vimeoReady: false,
  vimeoLoading: false,
  mediaQuerySmall: 'screen and (max-width: ' + 769 + 'px)',
  isTouch:
    'ontouchstart' in window ||
    (window.DocumentTouch && window.document instanceof DocumentTouch) ||
    window.navigator.maxTouchPoints ||
    window.navigator.msMaxTouchPoints
      ? true
      : false
}

// Trigger events when going between breakpoints
config.bpSmall = matchMedia(config.mediaQuerySmall).matches
matchMedia(config.mediaQuerySmall).addListener(function (mql) {
  if (mql.matches) {
    config.bpSmall = true
    document.dispatchEvent(new CustomEvent('matchSmall'))
  } else {
    config.bpSmall = false
    document.dispatchEvent(new CustomEvent('unmatchSmall'))
  }
})

// TODO: remove the code below; export config variables from this module only like the ones above
/**
 * Default config
 * Defines global theme configuration
 * This can be overriden at the theme level
 */

import '@archetype-themes/scripts/helpers/init-globals'
window.theme = window.theme || {}
window.Shopify = window.Shopify || {}

theme.config = {
  bpSmall: false,
  hasSessionStorage: true,
  hasLocalStorage: true,
  mediaQuerySmall: 'screen and (max-width: ' + 769 + 'px)',
  youTubeReady: false,
  vimeoReady: false,
  vimeoLoading: false,
  isTouch:
    'ontouchstart' in window ||
    (window.DocumentTouch && window.document instanceof DocumentTouch) ||
    window.navigator.maxTouchPoints ||
    window.navigator.msMaxTouchPoints
      ? true
      : false,
  stickyHeader: false,
  rtl: document.documentElement.getAttribute('dir') == 'rtl' ? true : false
}

if (theme.config.isTouch) {
  document.documentElement.className += ' supports-touch'
}

// Filters clone for mobile
theme.filtersPrime = null

theme.isStorageSupported = function (type) {
  // Return false if we are in an iframe without access to sessionStorage
  if (window.self !== window.top) {
    return false
  }

  var testKey = 'test'
  var storage
  if (type === 'session') {
    storage = window.sessionStorage
  }
  if (type === 'local') {
    storage = window.localStorage
  }

  try {
    storage.setItem(testKey, '1')
    storage.removeItem(testKey)
    return true
  } catch (error) {
    return false
  }
}

;(function () {
  'use strict'

  /*============================================================================
    Things that don't require DOM to be ready
  ==============================================================================*/
  theme.config.hasSessionStorage = theme.isStorageSupported('session')
  theme.config.hasLocalStorage = theme.isStorageSupported('local')

  // Trigger events when going between breakpoints
  theme.config.bpSmall = matchMedia(theme.config.mediaQuerySmall).matches
  matchMedia(theme.config.mediaQuerySmall).addListener(function (mql) {
    if (mql.matches) {
      theme.config.bpSmall = true
      document.dispatchEvent(new CustomEvent('matchSmall'))
    } else {
      theme.config.bpSmall = false
      document.dispatchEvent(new CustomEvent('unmatchSmall'))
    }
  })

  /*============================================================================
    Things that require DOM to be ready
  ==============================================================================*/
  function DOMready(callback) {
    if (document.readyState != 'loading') callback()
    else document.addEventListener('DOMContentLoaded', callback)
  }

  DOMready(function () {
    theme.initGlobals()

    document.dispatchEvent(new CustomEvent('page:loaded'))
  })
})()
