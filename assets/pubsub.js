export function subscribe(eventName, callback) {
  let cb = (event) => callback(event)

  document.addEventListener(eventName, cb)

  return function unsubscribe() {
    document.removeEventListener(eventName, cb)
  }
}

export function publish(eventName, options) {
  document.dispatchEvent(new CustomEvent(eventName, options))
}

export const EVENTS = {
  variantChange: 'variant:change',
  ajaxProductError: 'ajaxProduct:error',
  ajaxProductAdded: 'ajaxProduct:added'
}
