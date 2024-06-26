import '@archetype-themes/scripts/config'
import { debounce } from '@archetype-themes/scripts/helpers/utils'

class Maps extends HTMLElement {
  constructor() {
    super()
    this.config = {
      zoom: 14
    }

    this.apiStatus = null
    this.errors = {}

    this.section = this
    this.sectionID = this.section.getAttribute('data-section-id')
    this.map = this.section.querySelector('[data-map]')
    this.mapOverlay = this.section.querySelector('[data-map-overlay]')
    this.key = this.map.dataset.apiKey

    // Global function called by Google on auth errors.
    // Show an auto error message on all map instances.
    window.gm_authFailure = function () {
      if (!Shopify.designMode) return

      this.section.classList.add('map-section--load-error')
      this.map.parentNode.removeChild(map)
      window.mapError(theme.strings.authError)
    }

    window.mapError = function (error) {
      var message = document.createElement('div')
      message.classList.add('map-section__error', 'errors', 'text-center')
      message.innerHTML = error

      this.mapOverlay.parentNode.prepend(message)
      this.section.querySelectorAll('[data-map-link]').forEach((link) => {
        link.classList.add('hide')
      })
    }

    this.prepMapApi()
  }

  prepMapApi() {
    if (this.apiStatus === 'loaded') {
      this.createMap()
    } else {
      if (this.apiStatus !== 'loading') {
        this.apiStatus = 'loading'
        if (typeof window.google === 'undefined' || typeof window.google.maps === 'undefined') {
          var script = document.createElement('script')
          script.onload = () => {
            this.apiStatus = 'loaded'
            this.createMap()
          }
          script.src = 'https://maps.googleapis.com/maps/api/js?key=' + this.key
          document.head.appendChild(script)
        }
      }
    }
  }

  geolocate(map) {
    if (!map) return

    const geocoder = new google.maps.Geocoder()
    const address = map.dataset.addressSetting

    const deferred = new Promise((resolve, reject) => {
      geocoder.geocode({ address: address }, function (results, status) {
        if (status !== google.maps.GeocoderStatus.OK) {
          reject(status)
        }
        resolve(results)
      })
    })

    return deferred
  }

  createMap() {
    const mapDiv = this.map

    return this.geolocate(mapDiv)
      .then((results) => {
        const mapOptions = {
          zoom: this.config.zoom,
          backgroundColor: 'none',
          center: results[0].geometry.location,
          draggable: false,
          clickableIcons: false,
          scrollwheel: false,
          disableDoubleClickZoom: true,
          disableDefaultUI: true
        }

        const map = (this.map = new google.maps.Map(mapDiv, mapOptions))
        const center = (this.center = map.getCenter())

        google.maps.event.addDomListener(
          window,
          'resize',
          debounce(250, () => {
            google.maps.event.trigger(map, 'resize')
            map.setCenter(center)
            mapDiv.removeAttribute('style')
          })
        )

        /**
         * @event map-section:loaded
         * @description Fired when the map section has been loaded.
         * @param {string} detail.sectionId - The section's ID.
         * @param {boolean} bubbles - Whether the event bubbles up through the DOM or not.
         */
        document.dispatchEvent(
          new CustomEvent('map-section:loaded', {
            detail: {
              sectionID: this.sectionID
            },
            bubbles: true
          })
        )
      })
      .catch((status) => {
        var errorMessage

        switch (status) {
          case 'ZERO_RESULTS':
            errorMessage = this.errors.addressNoResults
            break
          case 'OVER_QUERY_LIMIT':
            errorMessage = this.errors.addressQueryLimit
            break
          case 'REQUEST_DENIED':
            errorMessage = this.errors.authError
            break
          default:
            errorMessage = this.errors.addressError
            break
        }

        // Show errors only to merchant in the editor.
        if (Shopify.designMode) {
          window.mapError(errorMessage)
        }
      })
  }
}

customElements.define('map-section', Maps)
