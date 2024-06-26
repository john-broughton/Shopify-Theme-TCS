import '@archetype-themes/scripts/config'
import { init as collapsiblesInit } from '@archetype-themes/scripts/modules/collapsibles'
import '@archetype-themes/scripts/modules/animation-observer'
import '@archetype-themes/scripts/helpers/rte'
import '@archetype-themes/scripts/modules/tool-tip'
import '@archetype-themes/scripts/modules/tool-tip-trigger'
import Animape from '@archetype-themes/scripts/vendors/animape'

// Load generic JS. Also reinitializes when sections are
// added, edited, or removed in Shopify's editor
theme.initGlobals = function () {
  collapsiblesInit()
  theme.animationObserver()
  theme.rteInit()

  const animape = new Animape({ distance: 150 })
  animape.init()
}
