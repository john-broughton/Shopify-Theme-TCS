class Swatches {
  constructor(container) {
    this.container = container
    this.selectors = {
      colorSwatchImage: '.grid-product__color-image',
      colorSwatch: '.color-swatch--with-image'
    }

    this.colorImages = this.container.querySelectorAll(this.selectors.colorSwatchImage)
    if (this.colorImages.length) {
      this.swatches = this.container.querySelectorAll(this.selectors.colorSwatch)
      this.colorSwatchHovering()
    }
  }

  colorSwatchHovering() {
    this.swatches.forEach((swatch) => {
      swatch.addEventListener('mouseenter', () => this.setActiveColorImage(swatch))

      swatch.addEventListener(
        'touchstart',
        (evt) => {
          evt.preventDefault()
          this.setActiveColorImage(swatch)
        },
        { passive: true }
      )

      swatch.addEventListener('mouseleave', () => this.removeActiveColorImage(swatch))
    })
  }

  setActiveColorImage(swatch) {
    const id = swatch.dataset.variantId
    const image = swatch.dataset.variantImage

    // Unset all active swatch images
    this.colorImages.forEach((el) => {
      el.classList.remove('is-active')
    })

    // Unset all active swatches
    this.swatches.forEach((el) => {
      el.classList.remove('is-active')
    })

    // Set active image and swatch
    const imageEl = this.container.querySelector('.grid-product__color-image--' + id)
    imageEl.style.backgroundImage = 'url(' + image + ')'
    imageEl.classList.add('is-active')
    swatch.classList.add('is-active')

    // Update product grid item href with variant URL
    const variantUrl = swatch.dataset.url
    const gridItem = swatch.closest('.grid-item__link')
    gridItem.setAttribute('href', variantUrl)
  }

  removeActiveColorImage(swatch) {
    const id = swatch.dataset.variantId
    this.container.querySelector(`.grid-product__color-image--${id}`).classList.remove('is-active')
    swatch.classList.remove('is-active')
  }
}

export default Swatches
