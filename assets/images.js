theme.Images = (function () {
  /**
   * Find the Shopify image attribute size
   */
  function imageSize(src) {
    if (!src) {
      return '620x' // default based on theme
    }

    var match = src.match(/.+_((?:pico|icon|thumb|small|compact|medium|large|grande)|\d{1,4}x\d{0,4}|x\d{1,4})[_\.@]/)

    if (match !== null) {
      return match[1]
    } else {
      return null
    }
  }

  /**
   * Adds a Shopify size attribute to a URL
   */
  function getSizedImageUrl(src, size) {
    if (!src) {
      return src
    }

    if (size == null) {
      return src
    }

    if (size === 'master') {
      return this.removeProtocol(src)
    }

    var match = src.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i)

    if (match != null) {
      var prefix = src.split(match[0])
      var suffix = match[0]

      return this.removeProtocol(prefix[0] + '_' + size + suffix)
    }

    return null
  }

  function removeProtocol(path) {
    return path.replace(/http(s)?:/, '')
  }

  function buildImagePath(string, widths) {
    if (string == null) return []

    if (widths) {
      const imageUrls = []

      widths.forEach((width) => {
        let url = `${string}?width=${width}`
        if (width === widths[widths.length - 1]) {
          url += ` ${width}w`
        } else {
          url += ` ${width}w,`
        }
        imageUrls.push(url)
      })
      return imageUrls
    } else {
      return [string]
    }
  }

  return {
    imageSize: imageSize,
    getSizedImageUrl: getSizedImageUrl,
    removeProtocol: removeProtocol,
    buildImagePath: buildImagePath
  }
})()
