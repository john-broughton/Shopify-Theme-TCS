import { config } from '@archetype-themes/scripts/config'
import { load } from '@archetype-themes/scripts/helpers/library-loader'

window.onYouTubeIframeAPIReady = function () {
  config.youTubeReady = true
  document.dispatchEvent(new CustomEvent('youTubeReady'))
}

const classes = {
  loading: 'loading',
  loaded: 'loaded',
  interactable: 'video-interactable'
}

const defaults = {
  width: 1280,
  height: 720,
  playerVars: {
    autohide: 0,
    autoplay: 1,
    cc_load_policy: 0,
    controls: 0,
    fs: 0,
    iv_load_policy: 3,
    modestbranding: 1,
    playsinline: 1,
    rel: 0
  }
}

/*============================================================================
  YouTube SDK method
  Parameters:
    - player div id (required)
    - arguments
      - videoId (required)
      - videoParent (selector, optional for section loading state)
      - events (object, optional)
==============================================================================*/
export default class YouTube {
  constructor(divId, options) {
    this.divId = divId
    this.iframe = null

    this.attemptedToPlay = false

    // API callback events
    defaults.events = {
      onReady: this.onVideoPlayerReady.bind(this),
      onStateChange: this.onVideoStateChange.bind(this)
    }

    this.options = Object.assign({}, defaults, options)

    if (this.options) {
      if (this.options.videoParent) {
        this.parent = document.getElementById(this.divId).closest(this.options.videoParent)
      }

      // Most YT videos will autoplay. If in product media,
      // will handle in theme.Product instead
      if (!this.options.autoplay) {
        this.options.playerVars.autoplay = this.options.autoplay
      }

      if (this.options.style === 'sound') {
        this.options.playerVars.controls = 1
        this.options.playerVars.autoplay = 0
      }
    }

    this.setAsLoading()

    if (config.youTubeReady) {
      this.init()
    } else {
      load('youtubeSdk')
      document.addEventListener('youTubeReady', this.init.bind(this))
    }
  }

  init() {
    this.videoPlayer = new YT.Player(this.divId, this.options)
  }

  onVideoPlayerReady(evt) {
    this.iframe = document.getElementById(this.divId) // iframe once YT loads
    this.iframe.setAttribute('tabindex', '-1')

    if (this.options.style !== 'sound') {
      evt.target.mute()
    }

    // pause when out of view
    var observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.play()
          } else {
            this.pause()
          }
        })
      },
      { rootMargin: '0px 0px 50px 0px' }
    )

    observer.observe(this.iframe)
  }

  onVideoStateChange(evt) {
    switch (evt.data) {
      case -1: // unstarted
        // Handle low power state on iOS by checking if
        // video is reset to unplayed after attempting to buffer
        if (this.attemptedToPlay) {
          this.setAsLoaded()
          this.enableInteraction()
        }
        break
      case 0: // ended, loop it
        this.play(evt)
        break
      case 1: // playing
        this.setAsLoaded()
        break
      case 3: // buffering
        this.attemptedToPlay = true
        break
    }
  }

  setAsLoading() {
    if (!this.parent) return
    this.parent.classList.add(classes.loading)
  }

  setAsLoaded() {
    if (!this.parent) return
    this.parent.classList.remove(classes.loading)
    this.parent.classList.add(classes.loaded)
  }

  enableInteraction() {
    if (!this.parent) return
    this.parent.classList.add(classes.interactable)
  }

  play() {
    if (this.videoPlayer && typeof this.videoPlayer.playVideo === 'function') {
      this.videoPlayer.playVideo()
    }
  }

  pause() {
    if (this.videoPlayer && typeof this.videoPlayer.pauseVideo === 'function') {
      this.videoPlayer.pauseVideo()
    }
  }

  destroy() {
    if (this.videoPlayer && typeof this.videoPlayer.destroy === 'function') {
      this.videoPlayer.destroy()
    }
  }
}
