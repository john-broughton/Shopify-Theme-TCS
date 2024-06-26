class BackgroundImage extends HTMLElement {
  connectedCallback() {
    const element = this.querySelector('[data-section-type="background-image"]')

    element.classList.remove('loading', 'loading--delayed')
    element.classList.add('loaded')
  }
}

customElements.define('background-image', BackgroundImage)
