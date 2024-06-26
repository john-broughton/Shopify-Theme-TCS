import '@archetype-themes/scripts/config'
import '@archetype-themes/scripts/helpers/init-globals'

theme.Sections = function Sections() {
  this.constructors = {}
  this.instances = []

  document.addEventListener('shopify:section:load', this._onSectionLoad.bind(this))
  document.addEventListener('shopify:section:unload', this._onSectionUnload.bind(this))
  document.addEventListener('shopify:section:select', this._onSelect.bind(this))
  document.addEventListener('shopify:section:deselect', this._onDeselect.bind(this))
  document.addEventListener('shopify:block:select', this._onBlockSelect.bind(this))
  document.addEventListener('shopify:block:deselect', this._onBlockDeselect.bind(this))
}

theme.Sections.prototype = Object.assign({}, theme.Sections.prototype, {
  _createInstance: function (container, constructor, scope) {
    var id = container.getAttribute('data-section-id')
    var type = container.getAttribute('data-section-type')

    constructor = constructor || this.constructors[type]

    if (typeof constructor === 'undefined') {
      return
    }

    // If custom scope passed, check to see if instance
    // is already initialized so we don't double up
    if (scope) {
      var instanceExists = this._findInstance(id)
      if (instanceExists) {
        this._removeInstance(id)
      }
    }

    // If a section fails to init, handle the error without letting all subsequest section registers to fail
    try {
      var instance = Object.assign(new constructor(container), {
        id: id,
        type: type,
        container: container
      })
      this.instances.push(instance)
    } catch (e) {
      console.error(e)
    }
  },

  _findInstance: function (id) {
    for (var i = 0; i < this.instances.length; i++) {
      if (this.instances[i].id === id) {
        return this.instances[i]
      }
    }
  },

  _removeInstance: function (id) {
    var i = this.instances.length
    var instance

    while (i--) {
      if (this.instances[i].id === id) {
        instance = this.instances[i]
        this.instances.splice(i, 1)
        break
      }
    }

    return instance
  },

  _onSectionLoad: function (evt, subSection, subSectionId) {
    if (theme && theme.initGlobals) {
      theme.initGlobals()
    }

    var container = subSection ? subSection : evt.target
    var section = subSection ? subSection : evt.target.querySelector('[data-section-id]')

    if (!section) {
      return
    }

    this._createInstance(section)

    var instance = subSection ? subSectionId : this._findInstance(evt.detail.sectionId)

    // Check if we have subsections to load
    var haveSubSections = container.querySelectorAll('[data-subsection]')
    if (haveSubSections.length) {
      this.loadSubSections(container)
    }

    // Run JS only in case of the section being selected in the editor
    // before merchant clicks "Add"
    if (instance && typeof instance.onLoad === 'function') {
      instance.onLoad(evt)
    }

    // Force editor to trigger scroll event when loading a section
    setTimeout(function () {
      window.dispatchEvent(new Event('scroll'))
    }, 200)
  },

  _onSectionUnload: function (evt) {
    this.instances = this.instances.filter(function (instance) {
      var isEventInstance = instance.id === evt.detail.sectionId

      if (isEventInstance) {
        if (typeof instance.onUnload === 'function') {
          instance.onUnload(evt)
        }
      }

      return !isEventInstance
    })
  },

  loadSubSections: function (scope) {
    if (!scope) {
      return
    }

    var sections = scope.querySelectorAll('[data-section-id]')

    sections.forEach((el) => {
      this._onSectionLoad(null, el, el.dataset.sectionId)
    })
  },

  _onSelect: function (evt) {
    var instance = this._findInstance(evt.detail.sectionId)

    if (typeof instance !== 'undefined' && typeof instance.onSelect === 'function') {
      instance.onSelect(evt)
    }
  },

  _onDeselect: function (evt) {
    var instance = this._findInstance(evt.detail.sectionId)

    if (typeof instance !== 'undefined' && typeof instance.onDeselect === 'function') {
      instance.onDeselect(evt)
    }
  },

  _onBlockSelect: function (evt) {
    var instance = this._findInstance(evt.detail.sectionId)

    if (typeof instance !== 'undefined' && typeof instance.onBlockSelect === 'function') {
      instance.onBlockSelect(evt)
    }
  },

  _onBlockDeselect: function (evt) {
    var instance = this._findInstance(evt.detail.sectionId)

    if (typeof instance !== 'undefined' && typeof instance.onBlockDeselect === 'function') {
      instance.onBlockDeselect(evt)
    }
  },

  register: function (type, constructor, scope) {
    this.constructors[type] = constructor

    var sections = document.querySelectorAll('[data-section-type="' + type + '"]')

    if (scope) {
      sections = scope.querySelectorAll('[data-section-type="' + type + '"]')
    }

    sections.forEach(
      function (container) {
        this._createInstance(container, constructor, scope)
      }.bind(this)
    )
  },

  reinit: function (section) {
    for (var i = 0; i < this.instances.length; i++) {
      var instance = this.instances[i]
      if (instance['type'] === section) {
        if (typeof instance.forceReload === 'function') {
          instance.forceReload()
        }
      }
    }
  }
})

theme.sections = new theme.Sections()
