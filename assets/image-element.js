// This is the javascript entrypoint for the image-element snippet.
// This file and all its inclusions will be processed through esbuild

import '@archetype-themes/scripts/config'
import '@archetype-themes/scripts/helpers/sections'

/*============================================================================
  ImageElement
==============================================================================*/

class ImageElement extends HTMLElement {
  constructor() {
    super()
  }

  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return

      this.removeAnimations()

      observer.unobserve(this)
    }

    // Set an IntersectionObserver to check if the image is nearly in the viewport
    new IntersectionObserver(handleIntersection.bind(this), { rootMargin: '0px 0px 400px 0px' }).observe(this)
  }

  removeAnimations() {
    // Find the closest image-wrap and remove the animation (fix for streamline image-wrap shimmer)
    const imageWrap = this.closest('.image-wrap')
    const skrimWrap = this.closest('.skrim__link')

    if (imageWrap) {
      imageWrap.classList.add('loaded')
    }

    if (skrimWrap) {
      skrimWrap.classList.add('loaded')
    }
  }
}

customElements.define('image-element', ImageElement)
