// This is the javascript entrypoint for the image-compare section.
// This file and all its inclusions will be processed through esbuild

import '@archetype-themes/scripts/config'
import { debounce } from '@archetype-themes/scripts/helpers/utils'

class ImageCompare extends HTMLElement {
  constructor() {
    super()
    this.el = this
    this.sectionId = this.dataset.sectionId
    this.button = this.querySelector('[data-button]')
    this.draggableContainer = this.querySelector('[data-draggable]')
    this.primaryImage = this.querySelector('[data-primary-image]')
    this.secondaryImage = this.querySelector('[data-secondary-image]')

    this.calculateSizes()

    this.active = false
    this.currentX = 0
    this.initialX = 0
    this.xOffset = 0

    this.buttonOffset = this.button.offsetWidth / 2

    this.el.addEventListener('touchstart', this.dragStart, false)
    this.el.addEventListener('touchend', this.dragEnd, false)
    this.el.addEventListener('touchmove', this.drag, false)

    this.el.addEventListener('mousedown', this.dragStart, false)
    this.el.addEventListener('mouseup', this.dragEnd, false)
    this.el.addEventListener('mousemove', this.drag, false)

    window.on(
      'resize',
      debounce(250, () => {
        this.calculateSizes(true)
      })
    )

    document.addEventListener('shopify:section:load', (event) => {
      if (event.detail.sectionId === this.sectionId && this.primaryImage !== null) {
        this.calculateSizes()
      }
    })
  }

  calculateSizes(hasResized = false) {
    this.active = false
    this.currentX = 0
    this.initialX = 0
    this.xOffset = 0

    this.buttonOffset = this.button.offsetWidth / 2

    this.elWidth = this.el.offsetWidth

    this.button.style.transform = `translate(-${this.buttonOffset}px, -50%)`

    if (this.primaryImage) {
      this.primaryImage.style.width = `${this.elWidth}px`
    }

    if (hasResized) this.draggableContainer.style.width = `${this.elWidth / 2}px`
  }

  dragStart(e) {
    if (e.type === 'touchstart') {
      this.initialX = e.touches[0].clientX - this.xOffset
    } else {
      this.initialX = e.clientX - this.xOffset
    }

    if (e.target === this.button) {
      this.active = true
    }
  }

  dragEnd() {
    this.initialX = this.currentX

    this.active = false
  }

  drag(event) {
    if (this.active) {
      event.preventDefault()

      if (event.type === 'touchmove') {
        this.currentX = event.touches[0].clientX - this.initialX
      } else {
        this.currentX = event.clientX - this.initialX
      }

      this.xOffset = this.currentX
      this.setTranslate(this.currentX, this.button)
    }
  }

  setTranslate(xPos, el) {
    let newXpos = xPos - this.buttonOffset
    let newVal = this.elWidth / 2 + xPos

    const boundaryPadding = 50
    const XposMin = (this.elWidth / 2 + this.buttonOffset) * -1
    const XposMax = this.elWidth / 2 - this.buttonOffset

    // Set boundaries for dragging
    if (newXpos < XposMin + boundaryPadding) {
      newXpos = XposMin + boundaryPadding
      newVal = boundaryPadding
    } else if (newXpos > XposMax - boundaryPadding) {
      newXpos = XposMax - boundaryPadding
      newVal = this.elWidth - boundaryPadding
    }

    el.style.transform = `translate(${newXpos}px, -50%)`
    this.draggableContainer.style.width = `${newVal}px`
  }
}

customElements.define('image-compare', ImageCompare)
