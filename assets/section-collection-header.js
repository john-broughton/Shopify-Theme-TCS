// This is the javascript entrypoint for the collection-header section.
// This file and all its inclusions will be processed through postcss

import '@archetype-themes/scripts/config'
import '@archetype-themes/scripts/modules/header-nav'
import '@archetype-themes/scripts/modules/parallax'
import '@archetype-themes/scripts/helpers/sections'

theme.CollectionHeader = (function () {
  var hasLoadedBefore = false

  function CollectionHeader(container) {
    this.namespace = '.collection-header'

    var heroImageContainer = container.querySelector('.collection-hero')
    if (heroImageContainer) {
      if (hasLoadedBefore) {
        this.checkIfNeedReload()
      }
      heroImageContainer.classList.remove('loading', 'loading--delayed')
      heroImageContainer.classList.add('loaded')
    } else if (theme.settings.overlayHeader) {
      theme.headerNav.disableOverlayHeader()
    }

    hasLoadedBefore = true
  }

  CollectionHeader.prototype = Object.assign({}, CollectionHeader.prototype, {
    // A liquid variable in the header needs a full page refresh
    // if the collection header hero image setting is enabled
    // and the header is set to sticky. Only necessary in the editor.
    checkIfNeedReload: function () {
      if (!Shopify.designMode) {
        return
      }

      if (theme.settings.overlayHeader) {
        var header = document.querySelector('.header-wrapper')
        if (!header.classList.contains('header-wrapper--overlay')) {
          location.reload()
        }
      }
    }
  })

  return CollectionHeader
})()

theme.sections.register('collection-header', theme.CollectionHeader)
