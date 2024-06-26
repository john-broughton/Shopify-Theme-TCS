import '@archetype-themes/scripts/vendors/flickity'
import '@archetype-themes/scripts/vendors/flickity-fade'
import '@archetype-themes/scripts/config'
import { debounce } from '@archetype-themes/scripts/helpers/utils'

// Slideshow Class handles all flickity based sliders
// Child navigation is only setup to work on product images

class Slideshow {
  constructor(el, args) {
    this.el = el

    const defaults = {
      adaptiveHeight: false,
      autoPlay: false,
      avoidReflow: false, // custom by Archetype
      childNav: null, // element. Custom by Archetype instead of asNavFor
      childNavScroller: null, // element
      childVertical: false,
      dragThreshold: 7,
      fade: false,
      friction: 0.8,
      initialIndex: 0,
      pageDots: false,
      pauseAutoPlayOnHover: false,
      prevNextButtons: false,
      rightToLeft: theme.config.rtl,
      selectedAttraction: 0.14,
      setGallerySize: true,
      wrapAround: true
    }

    this.args = Object.assign({}, defaults, args)

    document.dispatchEvent(new CustomEvent('slideshow-component:loaded'))

    this.classes = {
      animateOut: 'animate-out',
      isPaused: 'is-paused',
      isActive: 'is-active'
    }

    this.selectors = {
      allSlides: '.slideshow__slide',
      currentSlide: '.is-selected',
      wrapper: '.slideshow-wrapper',
      pauseButton: '.slideshow__pause'
    }

    this.productSelectors = {
      thumb: '.product__thumb-item:not(.hide)',
      links: '.product__thumb-item:not(.hide) a',
      arrow: '.product__thumb-arrow'
    }

    // Setup listeners as part of arguments
    this.args.on = {
      ready: this.init.bind(this),
      change: this.slideChange.bind(this),
      settle: this.afterChange.bind(this)
    }

    if (this.args.childNav) {
      this.childNavEls = this.args.childNav.querySelectorAll(this.productSelectors.thumb)
      this.childNavLinks = this.args.childNav.querySelectorAll(this.productSelectors.links)
      this.arrows = this.args.childNav.querySelectorAll(this.productSelectors.arrow)
      if (this.childNavLinks.length) {
        this.initChildNav()
      }
    }

    if (this.args.avoidReflow) {
      avoidReflow(el)
    }

    this.slideshow = new Flickity(el, this.args)

    // Prevent dragging on the product slider from triggering a zoom on product images
    if (el.dataset.zoom && el.dataset.zoom === 'true') {
      this.slideshow.on('dragStart', () => {
        this.slideshow.slider.style.pointerEvents = 'none'

        // With fade enabled, we also need to adjust the pointerEvents on the selected slide
        if (this.slideshow.options.fade) {
          this.slideshow.slider.querySelector('.is-selected').style.pointerEvents = 'none'
        }
      })
      this.slideshow.on('dragEnd', () => {
        this.slideshow.slider.style.pointerEvents = 'auto'

        // With fade enabled, we also need to adjust the pointerEvents on the selected slide
        if (this.slideshow.options.fade) {
          this.slideshow.slider.querySelector('.is-selected').style.pointerEvents = 'auto'
        }
      })
    }

    if (this.args.autoPlay) {
      var wrapper = el.closest(this.selectors.wrapper)
      this.pauseBtn = wrapper.querySelector(this.selectors.pauseButton)
      if (this.pauseBtn) {
        this.pauseBtn.addEventListener('click', this._togglePause.bind(this))
      }
    }

    // Reset dimensions on resize
    window.on(
      'resize',
      debounce(
        300,
        function () {
          this.resize()
        }.bind(this)
      )
    )

    // Set flickity-viewport height to first element to
    // avoid awkward page reflows while initializing.
    // Must be added in a `style` tag because element does not exist yet.
    // Slideshow element must have an ID
    function avoidReflow(el) {
      if (!el.id) return
      var firstChild = el.firstChild
      while (firstChild != null && firstChild.nodeType == 3) {
        // skip TextNodes
        firstChild = firstChild.nextSibling
      }
      var style = document.createElement('style')
      style.innerHTML = `#${el.id} .flickity-viewport{height:${firstChild.offsetHeight}px}`
      document.head.appendChild(style)
    }
  }

  init() {
    this.currentSlide = this.el.querySelector(this.selectors.currentSlide)

    // Optional onInit callback
    if (this.args.callbacks && this.args.callbacks.onInit) {
      if (typeof this.args.callbacks.onInit === 'function') {
        this.args.callbacks.onInit(this.currentSlide)
      }
    }
  }

  slideChange(index) {
    if (this.currentSlide) {
      document.dispatchEvent(
        new CustomEvent('slideshow-component:slide-changed', {
          detail: {
            previousSlide: this.currentSlide.previousElementSibling,
            currentSlide: this.currentSlide,
            nextSlide: this.currentSlide.nextElementSibling
          }
        })
      )
    }

    // Outgoing fade styles
    if (this.args.fade && this.currentSlide) {
      this.currentSlide.classList.add(this.classes.animateOut)
      this.currentSlide.addEventListener(
        'transitionend',
        function () {
          this.currentSlide.classList.remove(this.classes.animateOut)
        }.bind(this)
      )
    }

    // Match index with child nav
    if (this.args.childNav) {
      this.childNavGoTo(index)
    }

    // Optional onChange callback
    if (this.args.callbacks && this.args.callbacks.onChange) {
      if (typeof this.args.callbacks.onChange === 'function') {
        this.args.callbacks.onChange(index)
      }
    }

    // Show/hide arrows depending on selected index
    if (this.arrows && this.arrows.length) {
      this.arrows[0].classList.toggle('hide', index === 0)
      this.arrows[1].classList.toggle('hide', index === this.childNavLinks.length - 1)
    }
  }

  afterChange() {
    // Remove all fade animation classes after slide is done
    if (this.args.fade) {
      this.el.querySelectorAll(this.selectors.allSlides).forEach((slide) => {
        slide.classList.remove(this.classes.animateOut)
      })
    }

    this.currentSlide = this.el.querySelector(this.selectors.currentSlide)

    // Match index with child nav (in case slider height changed first)
    if (this.args.childNav) {
      this.childNavGoTo(this.slideshow.selectedIndex)
    }
  }

  destroy() {
    if (this.args.childNav && this.childNavLinks.length) {
      this.childNavLinks.forEach((a) => {
        a.classList.remove(this.classes.isActive)
      })
    }

    this.slideshow.destroy()
  }

  reposition() {
    this.slideshow.reposition()
  }

  _togglePause() {
    if (this.pauseBtn.classList.contains(this.classes.isPaused)) {
      this.pauseBtn.classList.remove(this.classes.isPaused)
      this.slideshow.playPlayer()
    } else {
      this.pauseBtn.classList.add(this.classes.isPaused)
      this.slideshow.pausePlayer()
    }
  }

  resize() {
    this.slideshow.resize()
  }

  play() {
    this.slideshow.playPlayer()
  }

  pause() {
    this.slideshow.pausePlayer()
  }

  goToSlide(i) {
    this.slideshow.select(i)
  }

  setDraggable(enable) {
    this.slideshow.options.draggable = enable
    this.slideshow.updateDraggable()
  }

  initChildNav() {
    this.childNavLinks[this.args.initialIndex].classList.add('is-active')

    // Setup events
    this.childNavLinks.forEach((link, i) => {
      // update data-index because image-set feature may be enabled
      link.setAttribute('data-index', i)

      link.addEventListener(
        'click',
        function (evt) {
          evt.preventDefault()
          this.goToSlide(this.getChildIndex(evt.currentTarget))
        }.bind(this)
      )
      link.addEventListener(
        'focus',
        function (evt) {
          this.goToSlide(this.getChildIndex(evt.currentTarget))
        }.bind(this)
      )
      link.addEventListener(
        'keydown',
        function (evt) {
          if (evt.keyCode === 13) {
            this.goToSlide(this.getChildIndex(evt.currentTarget))
          }
        }.bind(this)
      )
    })

    // Setup optional arrows
    if (this.arrows.length) {
      this.arrows.forEach((arrow) => {
        arrow.addEventListener('click', this.arrowClick.bind(this))
      })
    }
  }

  getChildIndex(target) {
    return parseInt(target.dataset.index)
  }

  childNavGoTo(index) {
    this.childNavLinks.forEach((a) => {
      a.blur()
      a.classList.remove(this.classes.isActive)
    })

    var el = this.childNavLinks[index]
    el.classList.add(this.classes.isActive)

    if (!this.args.childNavScroller) {
      return
    }

    if (this.args.childVertical) {
      var elTop = el.offsetTop
      this.args.childNavScroller.scrollTop = elTop - 100
    } else {
      var elLeft = el.offsetLeft
      this.args.childNavScroller.scrollLeft = elLeft - 100
    }
  }

  arrowClick(evt) {
    if (evt.currentTarget.classList.contains('product__thumb-arrow--prev')) {
      this.slideshow.previous()
    } else {
      this.slideshow.next()
    }
  }
}

class SlideshowSection extends HTMLElement {
  constructor() {
    super()

    this.container = this.querySelector('[data-section-type="slideshow-section"]')
    var sectionId = this.container.getAttribute('data-section-id')
    this.slideshow = this.container.querySelector('#Slideshow-' + sectionId)
    this.namespace = '.' + sectionId

    this.initialIndex = 0

    // Listen to theme editor events
    document.addEventListener('shopify:section:unload', (evt) => evt.detail.sectionId === sectionId && this.onUnload())
    document.addEventListener(
      'shopify:section:deselect',
      (evt) => evt.detail.sectionId === sectionId && this.onDeselect()
    )
    document.addEventListener(
      'shopify:section:reorder',
      (evt) => evt.detail.sectionId === sectionId && this.forceReload()
    )
    document.addEventListener(
      'shopify:section:select',
      (evt) => evt.detail.sectionId === sectionId && this.forceReload()
    )
    this.addEventListener('shopify:block:select', this.onBlockSelect)
    this.addEventListener('shopify:block:deselect', this.onBlockDeselect)

    document.dispatchEvent(
      new CustomEvent('slideshow-section:loaded', {
        detail: {
          sectionId
        }
      })
    )

    if (!this.slideshow) {
      return
    }

    // Get shopify-created div that section markup lives in,
    // then get index of it inside its parent
    var sectionEl = this.container.parentElement
    var sectionIndex = [].indexOf.call(sectionEl.parentElement.children, sectionEl)
  }

  connectedCallback() {
    this.init()
  }

  init() {
    var slides = this.slideshow.querySelectorAll('.slideshow__slide')

    this.slideshow.classList.remove('loading', 'loading--delayed')
    this.slideshow.classList.add('loaded')

    if (slides.length > 1) {
      var sliderArgs = {
        prevNextButtons: this.slideshow.hasAttribute('data-arrows'),
        pageDots: this.slideshow.hasAttribute('data-dots'),
        fade: true,
        setGallerySize: false,
        initialIndex: this.initialIndex,
        autoPlay: this.slideshow.dataset.autoplay === 'true' ? parseInt(this.slideshow.dataset.speed) : false
      }

      this.flickity = new Slideshow(this.slideshow, sliderArgs)
    } else {
      // Add loaded class to first slide
      slides[0].classList.add('is-selected')
    }
  }

  forceReload() {
    this.onUnload()
    this.init()
  }

  onUnload() {
    if (this.flickity && typeof this.flickity.destroy === 'function') {
      this.flickity.destroy()
    }
  }

  onDeselect() {
    if (this.flickity && typeof this.flickity.play === 'function') {
      this.flickity.play()
    }
  }

  onBlockSelect(evt) {
    this.forceReload()
    var slide = this.slideshow.querySelector('.slideshow__slide--' + evt.detail.blockId)
    var index = parseInt(slide.dataset.index)

    if (this.flickity && typeof this.flickity.pause === 'function') {
      this.flickity.goToSlide(index)
      this.flickity.pause()
    } else {
      // If section reloads, slideshow might not have been setup yet, wait a second and try again
      this.initialIndex = index
      setTimeout(
        function () {
          if (this.flickity && typeof this.flickity.pause === 'function') {
            this.flickity.pause()
          }
        }.bind(this),
        1000
      )
    }
  }

  onBlockDeselect() {
    if (this.flickity && typeof this.flickity.play === 'function') {
      if (this.flickity.args.autoPlay) {
        this.flickity.play()
      }
    }
  }

  disconnectedCallback() {
    this.onUnload()
  }
}

customElements.define('slideshow-section', SlideshowSection)

export { Slideshow }
export { SlideshowSection }
