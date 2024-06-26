import '@archetype-themes/scripts/config'

// Init section function when it's visible, then disable observer
theme.initWhenVisible = function (options) {
  var threshold = options.threshold ? options.threshold : 0

  var observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (typeof options.callback === 'function') {
            options.callback()
            observer.unobserve(entry.target)
          }
        }
      })
    },
    { rootMargin: '0px 0px ' + threshold + 'px 0px' }
  )

  observer.observe(options.element)
}
