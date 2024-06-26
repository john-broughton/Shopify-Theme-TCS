import '@archetype-themes/scripts/config'
import YouTube from '@archetype-themes/scripts/helpers/youtube'
import VimeoPlayer from '@archetype-themes/scripts/helpers/vimeo'

class VideoSection extends HTMLElement {
  constructor() {
    super()
    this.selectors = {
      videoParent: '.video-parent-section'
    }

    this.container = this
    this.sectionId = this.container.getAttribute('data-section-id')
    this.namespace = '.video-' + this.sectionId
    this.videoObject

    document.dispatchEvent(
      new CustomEvent('video-section:loaded', {
        detail: {
          sectionId: this.sectionId
        }
      })
    )
  }

  connectedCallback() {
    this.init()
  }

  disconnectedCallback() {
    this.onUnload()
  }

  init() {
    const dataDiv = this.container.querySelector('.video-div')
    if (!dataDiv) {
      return
    }
    const type = dataDiv.dataset.type

    switch (type) {
      case 'youtube':
        let youtubeVideoId = dataDiv.dataset.videoId
        this.initYoutubeVideo(youtubeVideoId)
        break
      case 'vimeo':
        let vimeoVideoId = dataDiv.dataset.videoId
        this.initVimeoVideo(vimeoVideoId)
        break
      case 'mp4':
        this.initMp4Video()
        break
    }
  }

  initYoutubeVideo(videoId) {
    this.videoObject = new YouTube('YouTubeVideo-' + this.sectionId, {
      videoId: videoId,
      videoParent: this.selectors.videoParent
    })
  }

  initVimeoVideo(videoId) {
    this.videoObject = new VimeoPlayer('Vimeo-' + this.sectionId, videoId, {
      videoParent: this.selectors.videoParent
    })
  }

  initMp4Video() {
    const mp4Video = 'Mp4Video-' + this.sectionId
    const mp4Div = document.getElementById(mp4Video)
    const parent = mp4Div.closest(this.selectors.videoParent)

    if (mp4Div) {
      parent.classList.add('loaded')

      const playPromise = document.querySelector('#' + mp4Video).play()

      // Edge does not return a promise (video still plays)
      if (playPromise !== undefined) {
        playPromise
          .then(function () {
            // playback normal
          })
          .catch(function () {
            mp4Div.setAttribute('controls', '')
            parent.classList.add('video-interactable')
          })
      }
    }
  }

  onUnload() {
    if (this.videoObject && typeof this.videoObject.destroy === 'function') {
      this.videoObject.destroy()
    }
  }
}

customElements.define('video-section', VideoSection)
