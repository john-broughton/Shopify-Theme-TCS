import { prepareTransition } from '@archetype-themes/scripts/helpers/utils'
import '@archetype-themes/scripts/helpers/delegate'

// Either collapsible containers all acting individually,
// or tabs that can only have one open at a time
let selectors = {
  trigger: '.collapsible-trigger',
  module: '.collapsible-content',
  moduleInner: '.collapsible-content__inner',
  tabs: '.collapsible-trigger--tab'
}

let classes = {
  hide: 'hide',
  open: 'is-open',
  autoHeight: 'collapsible--auto-height',
  tabs: 'collapsible-trigger--tab'
}

let namespace = '.collapsible'

let isTransitioning = false

export function init(scope) {
  let el = scope ? scope : document
  el.querySelectorAll(selectors.trigger).forEach((trigger) => {
    let state = trigger.classList.contains(classes.open)
    trigger.setAttribute('aria-expanded', state)

    trigger.off('click' + namespace)
    trigger.on('click' + namespace, toggle)
  })
}

function toggle(evt) {
  if (isTransitioning) {
    return
  }

  isTransitioning = true

  let el = evt.currentTarget
  let isOpen = el.classList.contains(classes.open)
  let isTab = el.classList.contains(classes.tabs)
  let moduleId = el.getAttribute('aria-controls')
  let container = document.getElementById(moduleId)

  if (!moduleId) {
    moduleId = el.dataset.controls
  }

  // No ID, bail
  if (!moduleId) {
    return
  }

  // If container=null, there isn't a matching ID.
  // Check if data-id is set instead. Could be multiple.
  // Select based on being in the same parent div.
  if (!container) {
    let multipleMatches = document.querySelectorAll('[data-id="' + moduleId + '"]')
    if (multipleMatches.length > 0) {
      container = el.parentNode.querySelector('[data-id="' + moduleId + '"]')
    }
  }

  if (!container) {
    isTransitioning = false
    return
  }

  let height = container.querySelector(selectors.moduleInner).offsetHeight
  let isAutoHeight = container.classList.contains(classes.autoHeight)
  let parentCollapsibleEl = container.parentNode.closest(selectors.module)
  let childHeight = height

  if (isTab) {
    if (isOpen) {
      isTransitioning = false
      return
    }

    let newModule
    document.querySelectorAll(selectors.tabs + '[data-id="' + el.dataset.id + '"]').forEach((el) => {
      el.classList.remove(classes.open)
      newModule = document.querySelector('#' + el.getAttribute('aria-controls'))
      setTransitionHeight(newModule, 0, true)
    })
  }

  // If isAutoHeight, set the height to 0 just after setting the actual height
  // so the closing animation works nicely
  if (isOpen && isAutoHeight) {
    setTimeout(function () {
      height = 0
      setTransitionHeight(container, height, isOpen, isAutoHeight)
    }, 0)
  }

  if (isOpen && !isAutoHeight) {
    height = 0
  }

  el.setAttribute('aria-expanded', !isOpen)
  if (isOpen) {
    el.classList.remove(classes.open)
  } else {
    el.classList.add(classes.open)
  }

  setTransitionHeight(container, height, isOpen, isAutoHeight)

  // If we are in a nested collapsible element like the mobile nav,
  // also set the parent element's height
  if (parentCollapsibleEl) {
    let parentHeight = parentCollapsibleEl.style.height

    if (isOpen && parentHeight === 'auto') {
      childHeight = 0 // Set childHeight to 0 if parent is initially opened
    }

    let totalHeight = isOpen
      ? parentCollapsibleEl.offsetHeight - childHeight
      : height + parentCollapsibleEl.offsetHeight

    setTransitionHeight(parentCollapsibleEl, totalHeight, false, false)
  }
}

function setTransitionHeight(container, height, isOpen, isAutoHeight) {
  container.classList.remove(classes.hide)
  prepareTransition(container, function () {
    container.style.height = height + 'px'
    if (isOpen) {
      container.classList.remove(classes.open)
    } else {
      container.classList.add(classes.open)
    }
  })

  if (!isOpen && isAutoHeight) {
    let o = container
    window.setTimeout(function () {
      o.css('height', 'auto')
      isTransitioning = false
    }, 500)
  } else {
    isTransitioning = false
  }
}
