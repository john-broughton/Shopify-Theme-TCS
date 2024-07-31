/* components v2.10.64 | Copyright © 2024 Archetype Themes Limited Partnership  | "Shopify Theme Store (https://www.shopify.com/legal/terms#9-additional-services)" License */
/**
 * Flickity fade v1.0.0
 * Fade between Flickity slides
 */

;(function (window, factory) {
  // browser global
  factory(window.Flickity, window.fizzyUIUtils)
})(window, function factory(Flickity, utils) {
  // ---- Slide ---- //

  var Slide = Flickity.Slide

  var slideUpdateTarget = Slide.prototype.updateTarget
  Slide.prototype.updateTarget = function () {
    slideUpdateTarget.apply(this, arguments)
    if (!this.parent.options.fade) {
      return
    }
    // position cells at selected target
    var slideTargetX = this.target - this.x
    var firstCellX = this.cells[0].x
    this.cells.forEach(function (cell) {
      var targetX = cell.x - firstCellX - slideTargetX
      cell.renderPosition(targetX)
    })
  }

  // ---- Flickity ---- //

  var proto = Flickity.prototype

  Flickity.createMethods.push('_createFade')

  proto._createFade = function () {
    this.fadeIndex = this.selectedIndex
    this.prevSelectedIndex = this.selectedIndex
    this.on('select', this.onSelectFade)
    this.on('dragEnd', this.onDragEndFade)
    this.on('settle', this.onSettleFade)
    this.on('activate', this.onActivateFade)
    this.on('deactivate', this.onDeactivateFade)
  }

  var updateSlides = proto.updateSlides
  proto.updateSlides = function () {
    updateSlides.apply(this, arguments)
    if (!this.options.fade) {
      return
    }
  }

  /* ---- events ---- */

  proto.onSelectFade = function () {
    // in case of resize, keep fadeIndex within current count
    this.fadeIndex = Math.min(this.prevSelectedIndex, this.slides.length - 1)
    this.prevSelectedIndex = this.selectedIndex
  }

  proto.onSettleFade = function () {
    delete this.didDragEnd
    if (!this.options.fade) {
      return
    }
    var fadedSlide = this.slides[this.fadeIndex]
  }

  proto.onDragEndFade = function () {
    // set flag
    this.didDragEnd = true
  }

  proto.onActivateFade = function () {
    if (this.options.fade) {
      this.element.classList.add('is-fade')
    }
  }

  proto.onDeactivateFade = function () {
    if (!this.options.fade) {
      return
    }
    this.element.classList.remove('is-fade')
  }

  /* ---- position & fading ---- */

  var positionSlider = proto.positionSlider
  proto.positionSlider = function () {
    if (!this.options.fade) {
      positionSlider.apply(this, arguments)
      return
    }

    this.fadeSlides()
    this.dispatchScrollEvent()
  }

  var positionSliderAtSelected = proto.positionSliderAtSelected
  proto.positionSliderAtSelected = function () {
    if (this.options.fade) {
      // position fade slider at origin
      this.setTranslateX(0)
    }
    positionSliderAtSelected.apply(this, arguments)
  }

  proto.fadeSlides = function () {
    if (this.slides.length < 2) {
      return
    }
    // get slides to fade-in & fade-out
    var indexes = this.getFadeIndexes()
    var fadeSlideA = this.slides[indexes.a]
    var fadeSlideB = this.slides[indexes.b]
    var distance = this.wrapDifference(fadeSlideA.target, fadeSlideB.target)
    var progress = this.wrapDifference(fadeSlideA.target, -this.x)
    progress = progress / distance

    // hide previous slide
    var fadeHideIndex = indexes.a
    if (this.isDragging) {
      fadeHideIndex = progress > 0.5 ? indexes.a : indexes.b
    }
    var isNewHideIndex =
      this.fadeHideIndex != undefined &&
      this.fadeHideIndex != fadeHideIndex &&
      this.fadeHideIndex != indexes.a &&
      this.fadeHideIndex != indexes.b
    this.fadeHideIndex = fadeHideIndex
  }

  proto.getFadeIndexes = function () {
    if (!this.isDragging && !this.didDragEnd) {
      return {
        a: this.fadeIndex,
        b: this.selectedIndex
      }
    }
    if (this.options.wrapAround) {
      return this.getFadeDragWrapIndexes()
    } else {
      return this.getFadeDragLimitIndexes()
    }
  }

  proto.getFadeDragWrapIndexes = function () {
    var distances = this.slides.map(function (slide, i) {
      return this.getSlideDistance(-this.x, i)
    }, this)
    var absDistances = distances.map(function (distance) {
      return Math.abs(distance)
    })
    var minDistance = Math.min.apply(Math, absDistances)
    var closestIndex = absDistances.indexOf(minDistance)
    var distance = distances[closestIndex]
    var len = this.slides.length

    var delta = distance >= 0 ? 1 : -1
    return {
      a: closestIndex,
      b: utils.modulo(closestIndex + delta, len)
    }
  }

  proto.getFadeDragLimitIndexes = function () {
    // calculate closest previous slide
    var dragIndex = 0
    for (var i = 0; i < this.slides.length - 1; i++) {
      var slide = this.slides[i]
      if (-this.x < slide.target) {
        break
      }
      dragIndex = i
    }
    return {
      a: dragIndex,
      b: dragIndex + 1
    }
  }

  proto.wrapDifference = function (a, b) {
    var diff = b - a

    if (!this.options.wrapAround) {
      return diff
    }

    var diffPlus = diff + this.slideableWidth
    var diffMinus = diff - this.slideableWidth
    if (Math.abs(diffPlus) < Math.abs(diff)) {
      diff = diffPlus
    }
    if (Math.abs(diffMinus) < Math.abs(diff)) {
      diff = diffMinus
    }
    return diff
  }

  // ---- wrapAround ---- //

  var _getWrapShiftCells = proto._getWrapShiftCells
  proto._getWrapShiftCells = function () {
    if (!this.options.fade) {
      _getWrapShiftCells.apply(this, arguments)
    }
  }

  var shiftWrapCells = proto.shiftWrapCells
  proto.shiftWrapCells = function () {
    if (!this.options.fade) {
      shiftWrapCells.apply(this, arguments)
    }
  }

  return Flickity
})
