import '@archetype-themes/scripts/config'

window.onpageshow = function (evt) {
  // Removes unload class when returning to page via history
  if (evt.persisted) {
    document.body.classList.remove('unloading')
    document.querySelectorAll('.cart__checkout').forEach((el) => {
      el.classList.remove('btn--loading')
    })
  }
}

// Used in Motion, Fetch, Gem and Expanse to fade between pages.
// initialize in theme.js with theme.pageTransitions();
theme.pageTransitions = function () {
  if (document.body.dataset.transitions === 'true') {
    // Hack test to fix Safari page cache issue.
    // window.onpageshow doesn't always run when navigating
    // back to the page, so the unloading class remains, leaving
    // a white page. Setting a timeout to remove that class when leaving
    // the page actually finishes running when they come back.
    if (!!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/)) {
      document.querySelectorAll('a').forEach((a) => {
        window.setTimeout(function () {
          document.body.classList.remove('unloading')
        }, 1200)
      })
    }

    // Disable the page transition feature on some links
    // by adding class `js-no-transition`
    document
      .querySelectorAll(
        'a.hero__slide-link, a[href^="mailto:"], a[href^="#"], a[target="_blank"], a[href*="youtube.com/watch"], a[href*="youtu.be/"], a[href*="player.vimeo.com/video/"], a[href*="vimeo.com/"], a[download]'
      )
      .forEach((el) => {
        el.classList.add('js-no-transition')
      })

    // Add class `unloading` to body for page transition on all
    // anchor tags, unless they have `js-no-transition` class
    document.querySelectorAll('a:not(.js-no-transition)').forEach((el) => {
      el.addEventListener('click', function (evt) {
        if (evt.metaKey) return true
        evt.preventDefault()
        document.body.classList.add('unloading')
        var src = el.getAttribute('href')
        window.setTimeout(function () {
          location.href = src
        }, 50)
      })
    })

    // Close the mobile nav drawer after clicking on a nav link
    document.querySelectorAll('a.mobile-nav__link').forEach((el) => {
      el.addEventListener('click', function () {
        theme.NavDrawer.close()
      })
    })
  }
}
