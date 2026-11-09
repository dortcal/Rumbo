/*
 * RUMBO — Cálculo de estrellas (puro).
 *
 * Reglas (acumulativas):
 *   Infantil .......... 1 estrella de celebración si supera el reto. Nada más.
 *   Primaria  ★ ....... superar el reto.
 *             ★★ ...... además, usar como máximo nivel.estrellas.s2max tarjetas.
 *             ★★★ ..... además, cumplir nivel.estrellas.s3:
 *                         { tipo: 'max-tarjetas', valor: N }  → como máximo N tarjetas
 *                         { tipo: 'usa', carta: 'repetir' }    → usar esa tarjeta
 *                         { tipo: 'referencia' }               → no pasar de las tarjetas de la solución de referencia
 *
 * El tiempo y el número de intentos NO intervienen. Se premia el razonamiento.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./interprete.js'));
    module.exports = api;
  } else {
    root.RumboEstrellas = factory(root.RumboInterprete);
  }
})(typeof self !== 'undefined' ? self : this, function (I) {
  'use strict';

  function cumpleTercera(nivel, programa, n) {
    var s3 = nivel.estrellas && nivel.estrellas.s3;
    if (!s3) return false;
    switch (s3.tipo) {
      case 'max-tarjetas': return typeof s3.valor === 'number' && n <= s3.valor;
      case 'usa': return I.usaTarjeta(programa, s3.carta);
      case 'referencia': return !!nivel.referencia && n <= I.contarTarjetas(nivel.referencia);
      default: return false;
    }
  }

  function calcularEstrellas(nivel, programa, resultado) {
    if (!resultado || !resultado.ok) return 0;
    if (nivel.etapa === 'infantil') return 1;
    var n = I.contarTarjetas(programa);
    var e = nivel.estrellas || {};
    if (typeof e.s2max === 'number' && n <= e.s2max) {
      return cumpleTercera(nivel, programa, n) ? 3 : 2;
    }
    return 1;
  }

  return { calcularEstrellas: calcularEstrellas };
});
