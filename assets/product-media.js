import { load } from '@archetype-themes/scripts/helpers/library-loader'

let modelJsonSections = {}
let models = {}
let xrButtons = {}

let selectors = {
  mediaGroup: '[data-product-single-media-group]',
  xrButton: '[data-shopify-xr]'
}

export function init(modelViewerContainers, sectionId) {
  modelJsonSections[sectionId] = {
    loaded: false
  }

  modelViewerContainers.forEach(function (container, index) {
    let mediaId = container.dataset.mediaId
    let modelViewerElement = container.querySelector('model-viewer')
    let modelId = modelViewerElement.dataset.modelId

    if (index === 0) {
      let mediaGroup = container.closest(selectors.mediaGroup)
      let xrButton = mediaGroup.querySelector(selectors.xrButton)
      xrButtons[sectionId] = {
        element: xrButton,
        defaultId: modelId
      }
    }

    models[mediaId] = {
      modelId: modelId,
      sectionId: sectionId,
      container: container,
      element: modelViewerElement
    }
  })

  window.Shopify.loadFeatures([
    {
      name: 'shopify-xr',
      version: '1.0',
      onLoad: setupShopifyXr
    },
    {
      name: 'model-viewer-ui',
      version: '1.0',
      onLoad: setupModelViewerUi
    }
  ])

  load('modelViewerUiStyles')
}

function setupShopifyXr(errors) {
  if (errors) return

  if (!window.ShopifyXR) {
    document.addEventListener('shopify_xr_initialized', function () {
      setupShopifyXr()
    })
    return
  }

  for (let sectionId in modelJsonSections) {
    if (modelJsonSections.hasOwnProperty(sectionId)) {
      let modelSection = modelJsonSections[sectionId]

      if (modelSection.loaded) continue

      let modelJson = document.querySelector('#ModelJson-' + sectionId)

      if (!modelJson) return

      window.ShopifyXR.addModels(JSON.parse(modelJson.innerHTML))
      modelSection.loaded = true
    }
  }
  window.ShopifyXR.setupXRElements()
}

function setupModelViewerUi(errors) {
  if (errors) return

  for (let key in models) {
    if (models.hasOwnProperty(key)) {
      let model = models[key]
      if (!model.modelViewerUi && Shopify) {
        model.modelViewerUi = new Shopify.ModelViewerUI(model.element)
      }
      setupModelViewerListeners(model)
    }
  }
}

function setupModelViewerListeners(model) {
  let xrButton = xrButtons[model.sectionId]

  model.container.addEventListener('mediaVisible', function (event) {
    xrButton.element.setAttribute('data-shopify-model3d-id', model.modelId)
    if (theme.config.isTouch) return
    if (event.detail && !event.detail.autoplayMedia) return
    model.modelViewerUi.play()
  })

  model.container.addEventListener('mediaHidden', function () {
    xrButton.element.setAttribute('data-shopify-model3d-id', xrButton.defaultId)
    model.modelViewerUi.pause()
  })

  model.container.addEventListener('xrLaunch', function () {
    model.modelViewerUi.pause()
  })
}

export function removeSectionModels(sectionId) {
  for (let key in models) {
    if (models.hasOwnProperty(key)) {
      let model = models[key]
      if (model.sectionId === sectionId) {
        delete models[key]
      }
    }
  }
  delete modelJsonSections[sectionId]
}
