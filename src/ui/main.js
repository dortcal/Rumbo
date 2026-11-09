/* RUMBO — punto de entrada. */
(function (root) {
  'use strict';
  function arrancar() {
    var UI = root.RumboUI;
    try { UI.App.iniciar(document.getElementById('app')); }
    catch (e) {
      console.error(e);
      document.getElementById('app').innerHTML = '<div style="padding:24px;font:700 18px sans-serif">No se ha podido iniciar RUMBO. Usa una versión actualizada de Google Chrome.<br><small>' + String(e && e.message || e) + '</small></div>';
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
  // Service worker (PWA): solo con HTTPS o localhost.
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})(typeof self !== 'undefined' ? self : this);
