import { config } from '@archetype-themes/scripts/config'
import Photoswipe from '@archetype-themes/scripts/modules/photoswipe'
import { Slideshow } from '@archetype-themes/scripts/modules/slideshow'
import YouTube from '@archetype-themes/scripts/helpers/youtube'
import VimeoPlayer from '@archetype-themes/scripts/helpers/vimeo'
import { EVENTS, subscribe } from '@archetype-themes/utils/pubsub'
import videoModal from '@archetype-themes/scripts/modules/video-modal'
import { init, removeSectionModels } from '@archetype-themes/scripts/modules/product-media'

class ProductImages extends HTMLElement {
  constructor() {
    super()

    this.container = this

    if (!!this.container.dataset.modal) {
      this.init()
    }
  }

  init() {
    this.videoObjects = {}

    this.classes = {
      hidden: 'hide'
    }

    this.selectors = {
      productVideo: '.product__video',
      videoParent: '.product__video-wrapper',
      slide: '.product-main-slide',
      currentSlide: '.is-selected',
      startingSlide: '.starting-slide',

      currentVariantJson: '[data-current-variant-json]',
      productOptionsJson: '[data-product-options-json]',

      media: '[data-product-media-type-model]',
      closeMedia: '.product-single__close-media',
      thumbSlider: '[data-product-thumbs]',
      thumbScroller: '.product__thumbs--scroller',
      mainSlider: '[data-product-photos]',
      imageContainer: '[data-product-images]'
    }

    this.sectionId = this.container.getAttribute('data-section-id')

    this.settings = {
      imageSetName: null,
      imageSetIndex: null,
      currentImageSet: null,
      currentSlideIndex: 0,
      mediaGalleryLayout: this.dataset.mediaGalleryLayout,
      hasVideos: this.container.querySelector(this.selectors.productVideo) ? true : false,
      hasModels: this.container.querySelector('[data-product-media-type-model]') ? true : false
    }

    this.currentVariant = JSON.parse(this.querySelector(this.selectors.currentVariantJson).textContent)
    this.productOptions = JSON.parse(this.querySelector(this.selectors.productOptionsJson).textContent)

    this.cacheElements()

    const dataSetEl = this.cache.mainSlider.querySelector('[data-set-name]')
    if (dataSetEl) {
      this.settings.imageSetName = dataSetEl.dataset.setName
      this.settings.imageSetIndex =
        'option' + (this.productOptions.findIndex((opt) => this.getImageSetName(opt) == this.settings.imageSetName) + 1)
    }

    this.initVariants()
    this.initImageZoom()
    this.initModelViewerLibraries()
    this.videoSetup()
    this.initProductSlider(this.currentVariant)
    this.customMediaListeners()
    // open youtube/vimeo/mp4 video in modal
    videoModal(this)
  }

  disconnectedCallback() {
    removeSectionModels(this.sectionId)

    if (this.flickity && typeof this.flickity.destroy === 'function') {
      this.flickity.destroy()
    }
  }

  cacheElements() {
    this.cache = {
      mainSlider: this.container.querySelector(this.selectors.mainSlider),
      thumbSlider: this.container.querySelector(this.selectors.thumbSlider),
      thumbScroller: this.container.querySelector(this.selectors.thumbScroller)
    }
  }

  initVariants() {
    subscribe(`${EVENTS.variantChange}:${this.dataset.productId}`, this.updateVariantImage.bind(this))
    // image set names variant change listeners
    if (this.settings.imageSetIndex)
      subscribe(`${EVENTS.variantChange}:${this.dataset.productId}`, this.updateImageSet.bind(this))
  }

  /*============================================================================
    Variant change methods
  ==============================================================================*/
  imageSetArguments(variant) {
    variant = variant ? variant : this.variants ? this.variants.currentVariant : null
    if (!variant) return

    const setValue = (this.settings.currentImageSet = this.getImageSetName(variant[this.settings.imageSetIndex]))
    const set = `${this.settings.imageSetName}_${setValue}`

    // Always start on index 0
    this.settings.currentSlideIndex = 0

    // Return object that adds cellSelector to mainSliderArgs
    return {
      cellSelector: '[data-group="' + set + '"]',
      imageSet: set,
      initialIndex: this.settings.currentSlideIndex
    }
  }

  updateImageSet(evt) {
    // If called directly, use current variant
    const variant = evt ? evt.detail.variant : this.variants ? this.variants.currentVariant : null
    if (!variant) {
      return
    }

    const setValue = this.getImageSetName(variant[this.settings.imageSetIndex])

    // Already on the current image group
    if (this.settings.currentImageSet === setValue) {
      return
    }

    this.initProductSlider(variant)
    /**
     * @event product-images:updateImageSet
     * @description Triggered when the image set is updated.
     */
    document.dispatchEvent(new CustomEvent('product-images:updateImageSet'))
  }

  // Show/hide thumbnails based on current image set
  updateImageSetThumbs(set) {
    this.cache.thumbSlider.querySelectorAll('.product__thumb-item').forEach((thumb) => {
      thumb.classList.toggle(this.classes.hidden, thumb.dataset.group !== set)
    })
  }

  getImageSetName(string) {
    return string
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-$/, '')
      .replace(/^-/, '')
  }

  /*============================================================================
    Product images
  ==============================================================================*/
  initImageZoom() {
    const container = this.container
    if (!container) {
      return
    }
    this.photoswipe = new Photoswipe(this, this.sectionId)
    container.addEventListener(
      'photoswipe:afterChange',
      function (evt) {
        if (this.flickity) {
          this.flickity.goToSlide(evt.detail.index)
        }
      }.bind(this)
    )
    // Execute JS modules after the tooltip is opened
    document.addEventListener('tooltip:open', (e) => {
      if (!e.detail.context === 'QuickShop') return
      const scripts = document.querySelectorAll('tool-tip product-component script[type="module"]')
      for (let i = 0; i < scripts.length; i++) {
        let script = document.createElement('script')
        script.type = 'module'
        script.textContent = scripts[i].textContent
        scripts[i].parentNode.replaceChild(script, scripts[i])
      }
    })
  }

  getThumbIndex(target) {
    return target.dataset.index
  }

  updateVariantImage(evt) {
    const variant = evt?.detail?.variant

    if (!variant || !variant.featured_media) return
    if (!config.bpSmall && this.settings.mediaGalleryLayout === 'stacked') {
      const slide = this.cache.mainSlider.querySelector(
        `.product-main-slide[data-media-id="${variant.featured_media.id}"]`
      )

      const imageIndex = this.getThumbIndex(slide)

      this.scrollToStackedMedia(imageIndex)

      this.handleStackedMediaChange(imageIndex)
    } else {
      const newImage = this.container.querySelector('.product__thumb[data-id="' + variant.featured_media.id + '"]')
      const imageIndex = this.getThumbIndex(newImage)

      // If there is no index, slider is not initalized
      if (typeof imageIndex === 'undefined') {
        return
      }

      // Go to that variant image's slide
      if (this.flickity) {
        this.flickity.goToSlide(imageIndex)
      }
    }
  }

  stackedMediaInit() {
    const mediaGalleryElements = this.container.querySelectorAll('.product-slideshow .product-main-slide')

    this.mediaObservers = []

    for (let index = 0; index < mediaGalleryElements.length; index++) {
      const slideElement = mediaGalleryElements[index]
      const mediaObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              this.settings.currentSlideIndex = index
              this.handleStackedMediaChange(this.settings.currentSlideIndex)
            }
          })
        },
        {
          root: null, // Use the viewport as the root
          rootMargin: '400px 0px 0px 0px', // Adjust the top offset to delay the intersection
          threshold: [0, 0.5, 1]
        }
      )

      mediaObserver.observe(slideElement)

      // Store mediaObserver instance in array
      this.mediaObservers.push(mediaObserver)
    }
  }

  handleStackedMediaChange(index) {
    const mediaTarget = this.container.querySelectorAll('.product-slideshow .product-main-slide')[index]

    if (!mediaTarget) return

    if (this.settings.hasVideos) {
      this.stopVideos()

      const video = mediaTarget.querySelector(this.selectors.productVideo)
      if (video) {
        const videoType = this._getVideoType(video)
        const videoId = this._getVideoDivId(video)
        if (videoType === 'youtube') {
          if (this.videoObjects[videoId].videoPlayer && this.videoObjects[videoId].options.style !== 'sound') {
            setTimeout(() => {
              this.videoObjects[videoId].videoPlayer.playVideo()
            }, 1000)
            return
          }
        } else if (videoType === 'mp4') {
          this.playMp4Video(videoId)
        }
      }
    }

    if (this.settings.hasModels) {
      const allMedia = this.container.querySelector(this.selectors.media)
      if (allMedia.length) {
        allMedia.forEach((el) => {
          /**
           * @event mediaHidden
           * @description Event fired when media is hidden.
           * @param {boolean} bubbles - Whether the event bubbles up through the DOM or not.
           * @param {boolean} cancelable - Whether the event is cancelable or not.
           */
          el.dispatchEvent(
            new CustomEvent('mediaHidden', {
              bubbles: true,
              cancelable: true
            })
          )
        })
      }

      const currentMedia = mediaTarget.querySelector(this.selectors.media)
      if (currentMedia) {
        currentMedia.dispatchEvent(
          /**
           * @event mediaVisible
           * @description Event fired when media is visible.
           * @param {object} detail - The detail object.
           * @param {boolean} detail.autoplayMedia - Whether the media should autoplay or not.
           * @param {boolean} bubbles - Whether the event bubbles up through the DOM or not.
           * @param {boolean} cancelable - Whether the event is cancelable or not.
           */
          new CustomEvent('mediaVisible', {
            bubbles: true,
            cancelable: true,
            detail: {
              autoplayMedia: false
            }
          })
        )
        mediaTarget.querySelector('.shopify-model-viewer-ui__button').setAttribute('tabindex', 0)
        mediaTarget.querySelector('.product-single__close-media').setAttribute('tabindex', 0)
      }
    }
  }

  scrollToStackedMedia(index) {
    const mediaTarget = this.container.querySelectorAll('.product-slideshow .product-main-slide')[index]

    if (!mediaTarget) return

    const position = mediaTarget.offsetTop

    window.scroll({
      top: position,
      behavior: 'smooth'
    })
  }

  initProductSlider(variant) {
    // Stop if only a single image, but add active class to first slide
    if (this.cache.mainSlider.querySelectorAll(this.selectors.slide).length <= 1) {
      const slide = this.cache.mainSlider.querySelector(this.selectors.slide)
      if (slide) {
        slide.classList.add('is-selected')
      }
      return
    }

    // Destroy slider in preparation of new initialization
    if (this.flickity && typeof this.flickity.destroy === 'function') {
      this.flickity.destroy()
    }

    // If variant argument exists, slideshow is reinitializing because of the
    // image set feature enabled and switching to a new group.
    // currentSlideIndex
    if (variant) {
      const activeSlide = this.cache.mainSlider.querySelector(this.selectors.startingSlide)
      this.settings.currentSlideIndex = this._slideIndex(activeSlide)
    }

    let mainSliderArgs = {
      dragThreshold: 25,
      adaptiveHeight: true,
      avoidReflow: true,
      initialIndex: this.settings.currentSlideIndex,
      childNav: this.cache.thumbSlider,
      childNavScroller: this.cache.thumbScroller,
      childVertical: this.cache.thumbSlider?.dataset.position === 'beside',
      pageDots: true, // mobile only with CSS
      wrapAround: true,
      callbacks: {
        onInit: this.onSliderInit.bind(this),
        onChange: this.onSlideChange.bind(this)
      }
    }

    // Override default settings if image set feature enabled
    if (this.settings.imageSetName) {
      const imageSetArgs = this.imageSetArguments(variant)
      mainSliderArgs = Object.assign({}, mainSliderArgs, imageSetArgs)
      this.updateImageSetThumbs(mainSliderArgs.imageSet)
    }

    if (!config.bpSmall && this.settings.mediaGalleryLayout === 'stacked') {
      const imageContainer = this.container.querySelector(this.selectors.imageContainer) || this
      imageContainer.setAttribute('data-has-slideshow', 'false')

      this.stackedMediaInit()
      return
    }

    this.flickity = new Slideshow(this.cache.mainSlider, mainSliderArgs)

    // Ensure we resize the slider to avoid reflow issues
    setTimeout(() => {
      this.flickity.resize()
    }, 100)
  }

  onSliderInit(slide) {
    // If slider is initialized with image set feature active,
    // initialize any videos/media when they are first slide
    if (this.settings.imageSetName) {
      this.prepMediaOnSlide(slide)
    }
  }

  onSlideChange(index) {
    if (!this.flickity) return

    const prevSlide = this.cache.mainSlider.querySelector(
      '.product-main-slide[data-index="' + this.settings.currentSlideIndex + '"]'
    )

    // If imageSetName exists, use a more specific selector
    const nextSlide = this.settings.imageSetName
      ? this.cache.mainSlider.querySelectorAll('.flickity-slider .product-main-slide')[index]
      : this.cache.mainSlider.querySelector('.product-main-slide[data-index="' + index + '"]')

    prevSlide.setAttribute('tabindex', '-1')
    nextSlide.setAttribute('tabindex', 0)

    // Pause any existing slide video/media
    this.stopMediaOnSlide(prevSlide)

    // Prep next slide video/media
    this.prepMediaOnSlide(nextSlide)

    // Update current slider index
    this.settings.currentSlideIndex = index
  }

  stopMediaOnSlide(slide) {
    // Stop existing video
    const video = slide.querySelector(this.selectors.productVideo)
    if (video) {
      const videoType = this._getVideoType(video)
      const videoId = this._getVideoDivId(video)
      if (videoType === 'youtube') {
        if (this.videoObjects[videoId].videoPlayer) {
          this.videoObjects[videoId].videoPlayer.stopVideo()
          return
        }
      } else if (videoType === 'mp4') {
        this.stopMp4Video(videoId)
        return
      }
    }

    // Stop existing media
    const currentMedia = slide.querySelector(this.selectors.media)
    if (currentMedia) {
      currentMedia.dispatchEvent(
        new CustomEvent('mediaHidden', {
          bubbles: true,
          cancelable: true
        })
      )
    }
  }

  prepMediaOnSlide(slide) {
    const video = slide.querySelector(this.selectors.productVideo)
    if (video) {
      this.flickity.reposition()
      const videoType = this._getVideoType(video)
      const videoId = this._getVideoDivId(video)
      if (videoType === 'youtube') {
        if (this.videoObjects[videoId].videoPlayer && this.videoObjects[videoId].options.style !== 'sound') {
          this.videoObjects[videoId].videoPlayer.playVideo()
          return
        }
      } else if (videoType === 'mp4') {
        this.playMp4Video(videoId)
      }
    }

    const nextMedia = slide.querySelector(this.selectors.media)
    if (nextMedia) {
      nextMedia.dispatchEvent(
        new CustomEvent('mediaVisible', {
          bubbles: true,
          cancelable: true,
          detail: {
            autoplayMedia: true
          }
        })
      )
      slide.querySelector('.shopify-model-viewer-ui__button').setAttribute('tabindex', 0)
      slide.querySelector('.product-single__close-media').setAttribute('tabindex', 0)
    }
  }

  _slideIndex(el) {
    return el.getAttribute('data-index')
  }

  /*============================================================================
    Product videos
  ==============================================================================*/
  videoSetup() {
    const productVideos = this.cache.mainSlider.querySelectorAll(this.selectors.productVideo)

    if (!productVideos.length) {
      return false
    }

    productVideos.forEach((vid) => {
      const type = vid.dataset.videoType
      if (type === 'youtube') {
        this.initYoutubeVideo(vid)
      } else if (type === 'vimeo') {
        this.initVimeoVideo(vid)
      } else if (type === 'mp4') {
        this.initMp4Video(vid)
      }
    })
  }

  initYoutubeVideo(div) {
    this.videoObjects[div.id] = new YouTube(div.id, {
      videoId: div.dataset.videoId,
      videoParent: this.selectors.videoParent,
      autoplay: false, // will handle this in callback
      style: div.dataset.videoStyle,
      loop: div.dataset.videoLoop,
      events: {
        onReady: this.youtubePlayerReady.bind(this),
        onStateChange: this.youtubePlayerStateChange.bind(this)
      }
    })
  }

  initVimeoVideo(div) {
    this.videoObjects[div.id] = new VimeoPlayer(div.id, div.dataset.videoId, {
      videoParent: this.selectors.videoParent,
      autoplay: false,
      style: div.dataset.videoStyle,
      loop: div.dataset.videoLoop
    })
  }

  // Comes from YouTube SDK
  // Get iframe ID with evt.target.getIframe().id
  // Then access product video players with this.videoObjects[id]
  youtubePlayerReady(evt) {
    const iframeId = evt.target.getIframe().id

    if (!this.videoObjects[iframeId]) {
      // No youtube player data
      return
    }

    const obj = this.videoObjects[iframeId]
    const player = obj.videoPlayer

    if (obj.options.style !== 'sound') {
      player.mute()
    }

    obj.parent.classList.remove('loading')
    obj.parent.classList.add('loaded')
    obj.parent.classList.add('video-interactable') // Previously, video was only interactable after slide change

    // If we have an element, it is in the visible/first slide,
    // and is muted, play it
    if (this._isFirstSlide(iframeId) && obj.options.style !== 'sound') {
      player.playVideo()
    }
  }

  _isFirstSlide(id) {
    return this.cache.mainSlider.querySelector(this.selectors.startingSlide + ' ' + '#' + id)
  }

  youtubePlayerStateChange(evt) {
    const iframeId = evt.target.getIframe().id
    const obj = this.videoObjects[iframeId]

    switch (evt.data) {
      case -1: // unstarted
        // Handle low power state on iOS by checking if
        // video is reset to unplayed after attempting to buffer
        if (obj.attemptedToPlay) {
          obj.parent.classList.add('video-interactable')
        }
        break
      case 0: // ended
        if (obj && obj.options.loop === 'true') {
          obj.videoPlayer.playVideo()
        }
        break
      case 3: // buffering
        obj.attemptedToPlay = true
        break
    }
  }

  initMp4Video(div) {
    this.videoObjects[div.id] = {
      id: div.id,
      type: 'mp4'
    }

    if (this._isFirstSlide(div.id)) {
      this.playMp4Video(div.id)
    }
  }

  stopVideos() {
    for (const [id, vid] of Object.entries(this.videoObjects)) {
      if (vid.videoPlayer) {
        if (typeof vid.videoPlayer.stopVideo === 'function') {
          vid.videoPlayer.stopVideo() // YouTube player
        }
      } else if (vid.type === 'mp4') {
        this.stopMp4Video(vid.id) // MP4 player
      }
    }
  }

  _getVideoType(video) {
    return video.getAttribute('data-video-type')
  }

  _getVideoDivId(video) {
    return video.id
  }

  playMp4Video(id) {
    const player = this.container.querySelector('#' + id)
    const playPromise = player.play()

    player.setAttribute('controls', '')
    player.focus()

    // When existing focus on the element, go back to thumbnail
    player.addEventListener('focusout', this.returnFocusToThumbnail.bind(this))

    if (playPromise !== undefined) {
      playPromise
        .then(function () {
          // Playing as expected
        })
        .catch(function (error) {
          // Likely low power mode on iOS, show controls
          player.setAttribute('controls', '')
          player.closest(this.selectors.videoParent).setAttribute('data-video-style', 'unmuted')
        })
    }
  }

  stopMp4Video(id) {
    const player = this.container.querySelector('#' + id)
    if (!player) return
    player.removeEventListener('focusout', this.returnFocusToThumbnail.bind(this))
    if (typeof player.pause === 'function') {
      player.removeAttribute('controls')
      player.pause()
    }
  }

  returnFocusToThumbnail(evt) {
    // Only return focus to active thumbnail if relatedTarget
    // is a thumbnail, otherwise user may have clicked elsewhere on the page
    if (evt.relatedTarget && evt.relatedTarget.classList.contains('product__thumb')) {
      const thumb = this.container.querySelector(
        '.product__thumb-item[data-index="' + this.settings.currentSlideIndex + '"] a'
      )
      if (thumb) {
        thumb.focus()
      }
    }
  }

  /*============================================================================
    Product media (3D)
  ==============================================================================*/
  initModelViewerLibraries() {
    const modelViewerElements = this.container.querySelectorAll(this.selectors.media)
    if (modelViewerElements.length < 1) return

    init(modelViewerElements, this.sectionId)
  }

  customMediaListeners() {
    document.querySelectorAll(this.selectors.closeMedia).forEach((el) => {
      el.addEventListener(
        'click',
        function () {
          let slide

          if (this.settings.mediaGalleryLayout === 'stacked') {
            slide = this.cache.mainSlider.querySelector(
              `.product-main-slide[data-index="${this.settings.currentSlideIndex}"]`
            )
          } else {
            slide = this.cache.mainSlider.querySelector(this.selectors.currentSlide)
          }

          const media = slide.querySelector(this.selectors.media)
          if (media) {
            media.dispatchEvent(
              new CustomEvent('mediaHidden', {
                bubbles: true,
                cancelable: true
              })
            )
          }
        }.bind(this)
      )
    })

    const modelViewers = this.container.querySelectorAll('model-viewer')
    if (modelViewers.length) {
      modelViewers.forEach((el) => {
        el.addEventListener(
          'shopify_model_viewer_ui_toggle_play',
          function (evt) {
            this.mediaLoaded(evt)
          }.bind(this)
        )

        el.addEventListener(
          'shopify_model_viewer_ui_toggle_pause',
          function (evt) {
            this.mediaUnloaded(evt)
          }.bind(this)
        )
      })
    }
  }

  mediaLoaded(evt) {
    this.container.querySelectorAll(this.selectors.closeMedia).forEach((el) => {
      el.classList.remove(this.classes.hidden)
    })

    if (this.flickity) {
      this.flickity.setDraggable(false)
    }
  }

  mediaUnloaded(evt) {
    this.container.querySelectorAll(this.selectors.closeMedia).forEach((el) => {
      el.classList.add(this.classes.hidden)
    })

    if (this.flickity) {
      this.flickity.setDraggable(true)
    }
  }
}

customElements.define('product-images', ProductImages)
