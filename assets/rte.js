import { wrap } from '@archetype-themes/scripts/helpers/utils'

theme.rteInit = function () {
  // Wrap tables so they become scrollable on small screens
  document.querySelectorAll('.rte table').forEach((table) => {
    var wrapWith = document.createElement('div')
    wrapWith.classList.add('table-wrapper')
    wrap(table, wrapWith)
  })

  // Wrap video iframe embeds so they are responsive
  document.querySelectorAll('.rte iframe[src*="youtube.com/embed"]').forEach((iframe) => {
    wrapVideo(iframe)
  })
  document.querySelectorAll('.rte iframe[src*="player.vimeo"]').forEach((iframe) => {
    wrapVideo(iframe)
  })

  function wrapVideo(iframe) {
    // Reset the src attribute on each iframe after page load
    // for Chrome's "incorrect iFrame content on 'back'" bug.
    // https://code.google.com/p/chromium/issues/detail?id=395791
    iframe.src = iframe.src
    var wrapWith = document.createElement('div')
    wrapWith.classList.add('video-wrapper')
    wrap(iframe, wrapWith)
  }

  // Remove CSS that adds animated underline under image links
  document.querySelectorAll('.rte a img').forEach((img) => {
    img.parentNode.classList.add('rte__image')
  })
}
