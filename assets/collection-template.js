import '@archetype-themes/scripts/config'
import '@archetype-themes/scripts/modules/collection-sidebar'
import '@archetype-themes/scripts/helpers/ajax-renderer'
import '@archetype-themes/scripts/modules/cart-api'
import { debounce } from '@archetype-themes/scripts/helpers/utils'
import '@archetype-themes/scripts/helpers/delegate'
import { init as collapsiblesInit } from '@archetype-themes/scripts/modules/collapsibles'

/*============================================================================
  Collection JS sets up grids of products, even if not
  on the collection template.
  When on the collection template, also setup sorting, filters, grid options
==============================================================================*/

class Collection extends HTMLElement {
  constructor() {
    super()

    this.isAnimating = false

    this.selectors = {
      sortSelect: '#SortBy',
      sortBtn: '.filter-sort',

      viewChange: '.grid-view-btn',
      productGrid: '.product-grid',

      collectionGrid: '.collection-grid__wrapper',
      sidebar: '#CollectionSidebar',
      activeTagList: '.tag-list--active-tags',
      tags: '.tag-list input',
      activeTags: '.tag-list a',
      tagsForm: '.filter-form',
      filterBar: '.collection-filter',
      priceRange: '.price-range',
      trigger: '.collapsible-trigger',

      filters: '.filter-wrapper',
      sidebarWrapper: '#CollectionSidebarFilterWrap',
      inlineWrapper: '#CollectionInlineFilterWrap'
    }

    this.config = {
      mobileFiltersInPlace: false
    }

    this.classes = {
      activeTag: 'tag--active',
      removeTagParent: 'tag--remove',
      collapsibleContent: 'collapsible-content',
      isOpen: 'is-open'
    }

    this.container = this
    this.containerId = this.container.id
    this.sectionId = this.container.getAttribute('data-section-id')
    this.namespace = '.collection-' + this.sectionId
    this.isCollectionTemplate = this.container.dataset.collectionTemplate
    this.ajaxRenderer = new theme.AjaxRenderer({
      sections: [{ sectionId: this.sectionId, nodeId: 'CollectionAjaxContent' }],
      onReplace: this.onReplaceAjaxContent.bind(this)
    })

    document.dispatchEvent(
      new CustomEvent('collection-component:loaded', {
        detail: {
          sectionId: this.sectionId
        }
      })
    )

    this.init(this.container)
  }

  init() {
    this.config.mobileFiltersInPlace = false

    // If container not set, section has been reinitialized.
    // Update this.container to refreshed DOM element
    if (!this.container) {
      this.container = document.getElementById(this.containerId)
    }

    if (this.isCollectionTemplate) {
      this.cloneFiltersOnMobile()
      this.initSort()
      this.initFilters()
      this.initPriceRange()
      this.initGridOptions()

      // Has to init after the Collection JS because cloneFiltersOnMobile
      this.sidebar = new theme.CollectionSidebar()
    }
  }

  /*============================================================================
  Collection sorting
  ==============================================================================*/
  initSort() {
    this.queryParams = new URLSearchParams(window.location.search)
    this.sortSelect = document.querySelector(this.selectors.sortSelect)
    this.sortBtns = document.querySelectorAll(this.selectors.sortBtn)

    if (this.sortSelect) {
      this.defaultSort = this.getDefaultSortValue()
      this.sortSelect.on('change' + this.namespace, () => {
        this.onSortChange()
      })
    }

    if (this.sortBtns.length) {
      this.sortBtns.forEach((btn) => {
        btn.addEventListener(
          'click',
          function () {
            document.dispatchEvent(new Event('filter:selected'))
            const sortValue = btn.dataset.value
            this.onSortChange(sortValue)
          }.bind(this)
        )
      })
    }
  }

  getSortValue() {
    return this.sortSelect.value || this.defaultSort
  }

  getDefaultSortValue() {
    return this.sortSelect.getAttribute('data-default-sortby')
  }

  onSortChange(sortValue = null) {
    this.queryParams = new URLSearchParams(window.location.search)

    if (sortValue) {
      this.queryParams.set('sort_by', sortValue)
    } else {
      this.queryParams.set('sort_by', this.getSortValue())
    }

    this.queryParams.delete('page') // Delete if it exists
    window.location.search = this.queryParams.toString()
  }

  /*============================================================================
    Grid view options
  ==============================================================================*/
  initGridOptions() {
    var grid = this.container.querySelector(this.selectors.productGrid)
    var viewBtns = this.container.querySelectorAll(this.selectors.viewChange)
    this.container.querySelectorAll(this.selectors.viewChange).forEach((btn) => {
      btn.addEventListener('click', function () {
        viewBtns.forEach((el) => {
          el.classList.remove('is-active')
        })
        btn.classList.add('is-active')
        var newView = btn.dataset.view
        grid.dataset.view = newView

        // Set as cart attribute so we can access in liquid
        theme.cart.updateAttribute('product_view', newView)

        // Trigger resize to update layzloaded images
        window.dispatchEvent(new Event('resize'))
      })
    })
  }

  /*====================
    Collection filters
  ====================*/
  initFilters() {
    var filterBar = document.querySelectorAll(this.selectors.filterBar)

    if (!filterBar.length) {
      return
    }

    document.addEventListener('matchSmall', this.cloneFiltersOnMobile.bind(this))
    this.bindBackButton()

    // Set mobile top value for filters if sticky header enabled
    if (theme.config.stickyHeader) {
      this.setFilterStickyPosition()

      document.addEventListener('headerStickyChange', debounce(500, this.setFilterStickyPosition).bind(this))
      window.on('resize', debounce(500, this.setFilterStickyPosition).bind(this))
    }

    document.querySelectorAll(this.selectors.activeTags).forEach((tag) => {
      tag.addEventListener('click', this.onTagClick.bind(this))
    })

    document.querySelectorAll(this.selectors.tagsForm).forEach((form) => {
      form.addEventListener('input', this.onFormSubmit.bind(this))
    })
  }

  initPriceRange() {
    document.addEventListener('price-range:change', this.onPriceRangeChange.bind(this), { once: true })
  }

  onPriceRangeChange() {
    this.renderFromFormData(event.detail)
  }

  cloneFiltersOnMobile() {
    if (this.config.mobileFiltersInPlace) {
      return
    }

    var sidebarWrapper = document.querySelector(this.selectors.sidebarWrapper)
    if (!sidebarWrapper) {
      return
    }
    var filters = sidebarWrapper.querySelector(this.selectors.filters).cloneNode(true)

    var inlineWrapper = document.querySelector(this.selectors.inlineWrapper)

    inlineWrapper.innerHTML = ''
    inlineWrapper.append(theme.filtersPrime ?? filters)
    theme.filtersPrime = null

    // Update collapsible JS
    collapsiblesInit(inlineWrapper)

    this.config.mobileFiltersInPlace = true
  }

  renderActiveTag(parent, el) {
    const textEl = parent.querySelector('.tag__text')

    if (parent.classList.contains(this.classes.activeTag)) {
      parent.classList.remove(this.classes.activeTag)
    } else {
      parent.classList.add(this.classes.activeTag)

      // If adding a tag, show new tag right away.
      // Otherwise, remove it before ajax finishes
      if (el.closest('li').classList.contains(this.classes.removeTagParent)) {
        parent.remove()
      } else {
        // Append new tag in both drawer and sidebar
        document.querySelectorAll(this.selectors.activeTagList).forEach((list) => {
          const newTag = document.createElement('li')
          const newTagLink = document.createElement('a')
          newTag.classList.add('tag', 'tag--remove')
          newTagLink.classList.add('btn', 'btn--small')
          newTagLink.innerText = textEl.innerText
          newTag.appendChild(newTagLink)

          list.appendChild(newTag)
        })
      }
    }
  }

  onTagClick(evt) {
    const el = evt.currentTarget

    document.dispatchEvent(new Event('filter:selected'))

    // Do not ajax-load collection links
    if (el.classList.contains('no-ajax')) {
      return
    }

    evt.preventDefault()
    if (this.isAnimating) {
      return
    }

    this.isAnimating = true

    const parent = el.parentNode
    const newUrl = new URL(el.href)

    this.renderActiveTag(parent, el)
    this.updateScroll(true)
    this.startLoading()
    this.renderCollectionPage(newUrl.searchParams)
  }

  onFormSubmit(evt) {
    const el = evt.target

    document.dispatchEvent(new Event('filter:selected'))

    // Do not ajax-load collection links
    if (el.classList.contains('no-ajax')) {
      return
    }

    evt.preventDefault()
    if (this.isAnimating) {
      return
    }

    this.isAnimating = true

    const parent = el.closest('li')
    const formEl = el.closest('form')
    const formData = new FormData(formEl)

    this.renderActiveTag(parent, el)
    this.updateScroll(true)
    this.startLoading()
    this.renderFromFormData(formData)
  }

  onReplaceAjaxContent(newDom, section) {
    const openCollapsibleIds = this.fetchOpenCollasibleFilters()

    openCollapsibleIds.forEach((selector) => {
      newDom.querySelectorAll(`[data-collapsible-id=${selector}]`).forEach(this.openCollapsible.bind(this))
    })

    var newContentEl = newDom.getElementById(section.nodeId)
    if (!newContentEl) {
      return
    }

    document.getElementById(section.nodeId).innerHTML = newContentEl.innerHTML

    // Update references to new product count in collection
    var page = document.getElementById(section.nodeId)
    var countEl = page.querySelector('.collection-filter__item--count')
    if (countEl) {
      var count = countEl.innerText
      document.querySelectorAll('[data-collection-count]').forEach((el) => {
        el.innerText = count
      })
    }
  }

  renderFromFormData(formData) {
    const searchParams = new URLSearchParams(formData)
    this.renderCollectionPage(searchParams)
  }

  renderCollectionPage(searchParams, updateURLHash = true) {
    this.ajaxRenderer.renderPage(window.location.pathname, searchParams, updateURLHash).then(() => {
      this.init(this.container)
      this.updateScroll(false)

      // Re-hook up collapsible box triggers
      collapsiblesInit()

      document.dispatchEvent(new CustomEvent('collection:reloaded'))

      this.isAnimating = false
    })
  }

  updateScroll(animate) {
    var scrollTo = document.getElementById('CollectionAjaxContent').offsetTop

    // Scroll below the sticky header
    if (theme.config.stickyHeader) {
      scrollTo = scrollTo - document.querySelector('#SiteHeader').offsetHeight
    }

    if (!theme.config.bpSmall) {
      scrollTo -= 10
    }

    if (animate) {
      window.scrollTo({ top: scrollTo, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: scrollTo })
    }
  }

  bindBackButton() {
    // Ajax page on back button
    window.off('popstate' + this.namespace)
    window.on(
      'popstate' + this.namespace,
      function (state) {
        if (state) {
          const newUrl = new URL(window.location.href)
          this.renderCollectionPage(newUrl.searchParams, false)
        }
      }.bind(this)
    )
  }

  fetchOpenCollasibleFilters() {
    const openDesktopCollapsible = Array.from(
      document.querySelectorAll(`${this.selectors.sidebar} ${this.selectors.trigger}.${this.classes.isOpen}`)
    )

    const openMobileCollapsible = Array.from(
      document.querySelectorAll(`${this.selectors.inlineWrapper} ${this.selectors.trigger}.${this.classes.isOpen}`)
    )

    return [...openDesktopCollapsible, ...openMobileCollapsible].map((trigger) => trigger.dataset.collapsibleId)
  }

  openCollapsible(el) {
    if (el.classList.contains(this.classes.collapsibleContent)) {
      el.style.height = 'auto'
    }

    el.classList.add(this.classes.isOpen)
  }

  /*============================================================================
    Misc collection page helpers
  ==============================================================================*/
  setFilterStickyPosition() {
    var headerHeight = document.querySelector('.site-header').offsetHeight - 1
    document.querySelector(this.selectors.filterBar).style.top = headerHeight + 'px'

    // Also update top position of sticky sidebar
    var stickySidebar = document.querySelector('.grid__item--sidebar')
    if (stickySidebar) {
      stickySidebar.style.top = headerHeight + 30 + 'px'
    }
  }

  startLoading() {
    document.querySelector(this.selectors.collectionGrid).classList.add('unload')
  }

  forceReload() {
    this.init(this.container)
  }
}

customElements.define('collection-template', Collection)

// need to check components using data-section-type collection-template
