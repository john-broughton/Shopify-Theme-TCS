import '@archetype-themes/scripts/config'

// Observer that adds visible class to animated elements
window.theme = window.theme || {}
theme.animationObserver = function () {
  var els = document.querySelectorAll('.animation-contents')

  els.forEach((el) => {
    var observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 1 }
    )

    observer.observe(el)
  })
}
