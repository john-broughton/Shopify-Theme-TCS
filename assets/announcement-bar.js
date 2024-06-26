// This is the javascript entrypoint for the announcement-bar snippet.
// This file and all its inclusions will be processed through postcss

import '@archetype-themes/scripts/config'
import { Slideshow } from '@archetype-themes/scripts/modules/slideshow'

theme.announcementBar = (function () {
  var args = {
    autoPlay: 5000,
    avoidReflow: true,
    cellAlign: theme.config.rtl ? 'right' : 'left',
    fade: true
  }
  var bar
  var flickity

  function init() {
    bar = document.getElementById('AnnouncementSlider')
    if (!bar) {
      return
    }

    unload()

    if (bar.dataset.blockCount === 1) {
      return
    }

    flickity = new Slideshow(bar, args)
  }

  // Go to slide if selected in the editor
  function onBlockSelect(id) {
    var slide = bar.querySelector('#AnnouncementSlide-' + id)
    var index = parseInt(slide.dataset.index)

    if (flickity && typeof flickity.pause === 'function') {
      flickity.goToSlide(index)
      flickity.pause()
    }
  }

  function onBlockDeselect() {
    if (flickity && typeof flickity.play === 'function') {
      flickity.play()
    }
  }

  function unload() {
    if (flickity && typeof flickity.destroy === 'function') {
      flickity.destroy()
    }
  }

  return {
    init: init,
    onBlockSelect: onBlockSelect,
    onBlockDeselect: onBlockDeselect,
    unload: unload
  }
})()
