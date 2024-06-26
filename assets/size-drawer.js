import '@archetype-themes/scripts/config'

// Set a max-height on drawers when they're opened via CSS variable
// to account for changing mobile window heights
theme.sizeDrawer = function () {
  var header = document.getElementById('HeaderWrapper').offsetHeight
  var max = window.innerHeight - header
  document.documentElement.style.setProperty('--maxDrawerHeight', `${max}px`)
}
