// PurgeCSS config — cleans ONLY the custom style.css against the real
// HTML + JS. Vendor CSS (bootstrap, fontawesome, owl, nice-select, magnific,
// icomoon) is intentionally left untouched. The safelist keeps classes that
// plugins or JS add at runtime and that a static scan cannot see.
module.exports = {
  css: ['assets/css/style.css'],
  content: ['index.html', 'watched.html', 'assets/js/*.js'],
  safelist: {
    standard: [
      // State classes toggled by JS / Bootstrap
      'active', 'show', 'showing', 'hide', 'fade', 'disabled', 'is-disabled',
      'collapse', 'collapsing', 'collapsed', 'fixed-top', 'sticky', 'open',
      'selected', 'current', 'no-results',
      // Theme / logo toggles
      'theme-mode-variables', 'dark-btn', 'light-btn',
      'logo-light-mode', 'logo-dark-mode',
    ],
    // Runtime-generated class trees that never appear literally in source
    greedy: [
      /^owl-/, /owl$/,          // Owl Carousel
      /^mfp-/,                  // Magnific Popup
      /nice-select/, /^list$/, /^option$/,  // jQuery Nice Select
      /^isotope/,               // Isotope
      /^modal/, /^offcanvas/, /^dropdown-menu/, /^fade-/, // Bootstrap runtime
      /^swiper-/,               // any swiper leftovers
    ],
  },
  // Keep @font-face, keyframes and CSS variables even if unreferenced by name
  fontFace: false,
  keyframes: false,
  variables: false,
};
