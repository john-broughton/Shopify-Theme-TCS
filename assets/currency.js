import '@archetype-themes/scripts/config'
import { defaultTo } from '@archetype-themes/scripts/helpers/utils'

/**
 * Currency Helpers
 * -----------------------------------------------------------------------------
 * A collection of useful functions that help with currency formatting
 *
 * Current contents
 * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
 *   - When theme.settings.superScriptPrice is enabled, format cents in <sup> tag
 * - getBaseUnit - Splits unit price apart to get value + unit
 *
 */

theme.Currency = (function () {
  var moneyFormat = '${{amount}}'
  var superScript = theme && theme.settings && theme.settings.superScriptPrice

  function formatMoney(cents, format) {
    if (!format) {
      format = theme.settings.moneyFormat
    }

    if (typeof cents === 'string') {
      cents = cents.replace('.', '')
    }
    var value = ''
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/
    var formatString = format || moneyFormat

    function formatWithDelimiters(number, precision, thousands, decimal) {
      precision = defaultTo(precision, 2)
      thousands = defaultTo(thousands, ',')
      decimal = defaultTo(decimal, '.')

      if (isNaN(number) || number == null) {
        return 0
      }

      number = (number / 100.0).toFixed(precision)

      var parts = number.split('.')
      var dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands)
      var centsAmount = parts[1] ? decimal + parts[1] : ''

      return dollarsAmount + centsAmount
    }

    switch (formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2)

        if (superScript && value && value.includes('.')) {
          value = value.replace('.', '<sup>') + '</sup>'
        }

        break
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0)
        break
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',')

        if (superScript && value && value.includes(',')) {
          value = value.replace(',', '<sup>') + '</sup>'
        }

        break
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',')
        break
      case 'amount_no_decimals_with_space_separator':
        value = formatWithDelimiters(cents, 0, ' ')
        break
    }

    return formatString.replace(placeholderRegex, value)
  }

  function getBaseUnit(variant) {
    if (!variant) {
      return
    }

    if (!variant.unit_price_measurement || !variant.unit_price_measurement.reference_value) {
      return
    }

    return variant.unit_price_measurement.reference_value === 1
      ? variant.unit_price_measurement.reference_unit
      : variant.unit_price_measurement.reference_value + variant.unit_price_measurement.reference_unit
  }

  return {
    formatMoney: formatMoney,
    getBaseUnit: getBaseUnit
  }
})()
