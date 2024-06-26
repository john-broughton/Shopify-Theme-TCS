import '@archetype-themes/scripts/vendors/photoswipe.min'
import '@archetype-themes/scripts/vendors/photoswipe-ui-default.min'

let selectors = {
  trigger: '.js-photoswipe__zoom',
  images: '.photoswipe__image',
  slideshowTrack: '.flickity-viewport ',
  activeImage: '.is-selected'
}

export default class Photoswipe {
  constructor(container, sectionId) {
    this.container = container
    this.sectionId = sectionId
    this.namespace = '.photoswipe-' + this.sectionId
    this.gallery
    this.images
    this.items
    this.inSlideshow = false

    if (!container || container.dataset.zoom === 'false') {
      return
    }

    this.init()
  }

  init() {
    this.container.querySelectorAll(selectors.trigger).forEach((trigger) => {
      trigger.on('click' + this.namespace, this.triggerClick.bind(this))
    })
  }

  triggerClick(evt) {
    // Streamline changes between a slideshow and
    // stacked images, so recheck if we are still
    // working with a slideshow when initializing zoom
    if (this.container.dataset && this.container.dataset.hasSlideshow === 'true') {
      this.inSlideshow = true
    } else {
      this.inSlideshow = false
    }

    this.items = this.getImageData()

    let image = this.inSlideshow ? this.container.querySelector(selectors.activeImage) : evt.currentTarget

    let index = this.inSlideshow ? this.getChildIndex(image) : image.dataset.index

    this.initGallery(this.items, index)
  }

  // Because of image set feature, need to get index based on location in parent
  getChildIndex(el) {
    let i = 0
    while ((el = el.previousSibling) != null) {
      i++
    }

    // 1-based index required
    return i + 1
  }

  getImageData() {
    this.images = this.inSlideshow
      ? this.container.querySelectorAll(selectors.slideshowTrack + selectors.images)
      : this.container.querySelectorAll(selectors.images)

    let items = []
    let options = {}

    this.images.forEach((el) => {
      let item = {
        msrc: el.currentSrc || el.src,
        src: el.getAttribute('data-photoswipe-src'),
        w: el.getAttribute('data-photoswipe-width'),
        h: el.getAttribute('data-photoswipe-height'),
        el: el,
        initialZoomLevel: 0.5
      }

      items.push(item)
    })

    return items
  }

  initGallery(items, index) {
    document.body.classList.add('photoswipe-open')
    let pswpElement = document.querySelectorAll('.pswp')[0]

    let options = {
      allowPanToNext: false,
      captionEl: false,
      closeOnScroll: false,
      counterEl: false,
      history: false,
      index: index - 1,
      pinchToClose: false,
      preloaderEl: false,
      scaleMode: 'zoom',
      shareEl: false,
      tapToToggleControls: false,
      getThumbBoundsFn: function (index) {
        let pageYScroll = window.pageYOffset || document.documentElement.scrollTop
        let thumbnail = items[index].el
        let rect = thumbnail.getBoundingClientRect()
        return { x: rect.left, y: rect.top + pageYScroll, w: rect.width }
      }
    }

    this.gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options)
    this.gallery.listen('afterChange', this.afterChange.bind(this))
    this.gallery.listen('afterInit', this.afterInit.bind(this))
    this.gallery.init()

    this.preventiOS15Scrolling()
  }

  afterChange() {
    let index = this.gallery.getCurrentIndex()
    this.container.dispatchEvent(
      new CustomEvent('photoswipe:afterChange', {
        detail: {
          index: index
        }
      })
    )
  }

  afterInit() {
    this.container.dispatchEvent(new CustomEvent('photoswipe:afterInit'))
  }

  syncHeight() {
    document.documentElement.style.setProperty('--window-inner-height', `${window.innerHeight}px`)
  }

  // Fix poached from https://gist.github.com/dimsemenov/0b8c255c0d87f2989e8ab876073534ea
  preventiOS15Scrolling() {
    let initialScrollPos

    if (!/iPhone|iPad|iPod/i.test(window.navigator.userAgent)) return

    this.syncHeight()

    // Store scroll position to restore it later
    initialScrollPos = window.scrollY

    // Add class to root element when PhotoSwipe opens
    document.documentElement.classList.add('pswp-open-in-ios')

    window.addEventListener('resize', this.syncHeight)

    this.gallery.listen('destroy', () => {
      document.documentElement.classList.remove('pswp-open-in-ios')
      window.scrollTo(0, initialScrollPos)
    })
  }
}
