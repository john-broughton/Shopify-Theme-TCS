import { Slideshow } from '@archetype-themes/scripts/modules/slideshow'

class Testimonials extends HTMLElement {
  constructor() {
    super()

    this.defaults = {
      adaptiveHeight: true,
      avoidReflow: true,
      pageDots: true,
      prevNextButtons: false
    }

    this.container = this
    this.timeout
    this.sectionId = this.container.getAttribute('data-section-id')
    this.slideshow = this.container.querySelector(`#Testimonials-${this.sectionId}`)
    this.namespace = `.testimonial-${this.sectionId}`

    if (!this.slideshow) {
      return
    }

    /**
     * @event testimonials:loaded
     * @description Fired when the testimonials section has been loaded.
     * @param {string} detail.sectionId - The section's ID.
     */
    document.dispatchEvent(
      new CustomEvent('testimonials:loaded', {
        detail: {
          sectionId: this.sectionId
        }
      })
    )

    this.addEventListener('shopify:section:deselect', this.onDeselect)
    this.addEventListener('shopify:block:select', this.onBlockSelect)
    this.addEventListener('shopify:block:deselect', this.onBlockDeselect)
  }

  connectedCallback() {
    this.init()
  }

  init() {
    // Do not wrap when only a few blocks
    if (this.slideshow.dataset.count <= 3) {
      this.defaults.wrapAround = false
    }

    this.flickity = new Slideshow(this.slideshow, this.defaults)

    // Autoscroll to next slide on load to indicate more blocks
    if (this.slideshow.dataset.count > 2) {
      this.timeout = setTimeout(
        function () {
          this.flickity.goToSlide(1)
        }.bind(this),
        1000
      )
    }
  }

  disconnectedCallback() {
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
    const slide = this.slideshow.querySelector(`.testimonials-slide--${evt.detail.blockId}`)
    const index = parseInt(slide.dataset.index)

    clearTimeout(this.timeout)

    if (this.flickity && typeof this.flickity.pause === 'function') {
      this.flickity.goToSlide(index)
      this.flickity.pause()
    }
  }

  onBlockDeselect() {
    if (this.flickity && typeof this.flickity.play === 'function') {
      this.flickity.play()
    }
  }
}

customElements.define('testimonials-component', Testimonials)
