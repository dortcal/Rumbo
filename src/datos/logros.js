/*
 * RUMBO — Insignias (por habilidad, no por velocidad) y disfraces desbloqueables.
 * Cada condición recibe un ayudante P (ver progreso.js) y devuelve true/false.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; } else { root.RumboLogros = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function rango(prefijo, a, b) {
    var r = [];
    for (var i = a; i <= b; i++) r.push(prefijo + (i < 10 ? '0' : '') + i);
    return r;
  }

  var INSIGNIAS = [
    { id: 'primer-paso', nombre: 'Primer paso', icono: 'huella', desc: 'Supera tu primer reto.', ok: function (P) { return P.completados() >= 1; } },
    { id: 'giros', nombre: 'Maestro de giros', icono: 'giro', desc: 'Domina los giros a izquierda y derecha.', ok: function (P) { return P.todos(rango('m1-', 4, 8)); } },
    { id: 'recolector', nombre: 'Recolector', icono: 'luz', desc: 'Recoge todos los objetos del camino.', ok: function (P) { return P.todos(rango('m1-', 9, 11)); } },
    { id: 'saltarin', nombre: 'Saltarín', icono: 'salto', desc: 'Salta obstáculos con la tarjeta de saltar.', ok: function (P) { return P.todos(['m1-14']); } },
    { id: 'repetidor', nombre: 'Rey de los patrones', icono: 'bucle', desc: 'Usa Repetir para encontrar patrones.', ok: function (P) { return P.todos(rango('m1-', 15, 17)); } },
    { id: 'detective', nombre: 'Detective de errores', icono: 'lupa', desc: 'Repara tres programas con fallos.', ok: function (P) { return P.todos(rango('m1-', 18, 20)); } },
    { id: 'dueno-bucles', nombre: 'Dueño de los bucles', icono: 'bucle', desc: 'Resuelve todos los retos de bucles del segundo ciclo.', ok: function (P) { return P.todos(rango('m2-', 1, 8)); } },
    { id: 'cocinero', nombre: 'Cocinero de recetas', icono: 'receta', desc: 'Crea y reutiliza recetas.', ok: function (P) { return P.todos(rango('m2-', 11, 13)); } },
    { id: 'depurador', nombre: 'Gran depurador', icono: 'lupa', desc: 'Repara los programas del segundo ciclo.', ok: function (P) { return P.todos(rango('m2-', 17, 21)); } },
    { id: 'decisor', nombre: 'Toma decisiones', icono: 'si', desc: 'Programa decisiones con «si».', ok: function (P) { return P.todos(['m2-22', 'm2-23']); } },
    { id: 'anidador', nombre: 'Bucles dentro de bucles', icono: 'bucle', desc: 'Domina los bucles anidados.', ok: function (P) { return P.todos(rango('m3-', 1, 3)); } },
    { id: 'sensores', nombre: 'Experto en sensores', icono: 'si', desc: 'Programa con condiciones y sensores.', ok: function (P) { return P.todos(rango('m3-', 6, 10)); } },
    { id: 'funciones', nombre: 'Maestro de funciones', icono: 'receta', desc: 'Domina las recetas en el tercer ciclo.', ok: function (P) { return P.todos(rango('m3-', 11, 13)); } },
    { id: 'optimizador', nombre: 'Optimizador', icono: 'estrella', desc: 'Consigue tres estrellas en diez retos.', ok: function (P) { return P.tresEstrellas() >= 10; } },
    { id: 'perseverante', nombre: 'No me rindo', icono: 'corazon', desc: 'Supera un reto después de intentarlo muchas veces.', ok: function (P) { return P.perseverancia(); } },
    { id: 'estrellas-30', nombre: '30 estrellas', icono: 'estrella', desc: 'Reúne 30 estrellas.', ok: function (P) { return P.estrellas() >= 30; } },
    { id: 'estrellas-100', nombre: '100 estrellas', icono: 'estrella', desc: 'Reúne 100 estrellas.', ok: function (P) { return P.estrellas() >= 100; } },
    { id: 'estrellas-200', nombre: '200 estrellas', icono: 'estrella', desc: 'Reúne 200 estrellas.', ok: function (P) { return P.estrellas() >= 200; } },
    { id: 'infantil-3', nombre: 'Pequeño explorador', icono: 'flor', desc: 'Completa el camino de los 3 años.', ok: function (P) { return P.itinerario(3); }, infantil: true },
    { id: 'infantil-4', nombre: 'Aventurero del camino', icono: 'zanahoria', desc: 'Completa el camino de los 4 años.', ok: function (P) { return P.itinerario(4); }, infantil: true },
    { id: 'infantil-5', nombre: 'Guardián de los patrones', icono: 'concha', desc: 'Completa el camino de los 5 años.', ok: function (P) { return P.itinerario(5); }, infantil: true },
    { id: 'mundo-1', nombre: 'Primer programador', icono: 'brujula', desc: 'Termina el Mundo 1.', ok: function (P) { return P.mundoCompleto(1); } },
    { id: 'mundo-2', nombre: 'Maestro del código', icono: 'brujula', desc: 'Termina el Mundo 2.', ok: function (P) { return P.mundoCompleto(2); } },
    { id: 'mundo-3', nombre: 'Experto en algoritmos', icono: 'brujula', desc: 'Termina el Mundo 3.', ok: function (P) { return P.mundoCompleto(3); } },
    { id: 'faro', nombre: 'La luz de Lumo', icono: 'faro', desc: 'Enciende el Faro Mayor.', ok: function (P) { return P.todos(['f-03']); } },
    { id: 'secretos', nombre: 'Explorador de secretos', icono: 'llave', desc: 'Resuelve los cuatro retos secretos.', ok: function (P) { return P.todos(['sec-1', 'sec-2', 'sec-3', 'sec-4']); } },
    { id: 'creador', nombre: 'Creador de retos', icono: 'lab', desc: 'Crea y comprueba tu primer reto en el Laboratorio.', ok: function (P) { return P.retosCreados() >= 1; } }
  ];

  var DISFRACES = [
    { id: 0, nombre: 'Lumo clásico', desc: 'Siempre disponible.', ok: function () { return true; } },
    { id: 1, nombre: 'Gorra de explorador', desc: 'Supera 3 retos.', ok: function (P) { return P.completados() >= 3; } },
    { id: 2, nombre: 'Gafas de inventora', desc: 'Reúne 15 estrellas o completa el camino de los 3 años.', ok: function (P) { return P.estrellas() >= 15 || P.itinerario(3); } },
    { id: 3, nombre: 'Capa de aventurero', desc: 'Termina el Mundo 1 o todos los retos de Infantil.', ok: function (P) { return P.mundoCompleto(1) || P.itinerario(5); } },
    { id: 4, nombre: 'Casco de buceo', desc: 'Supera 10 retos del Mundo 2.', ok: function (P) { return P.completadosMundo(2) >= 10; } },
    { id: 5, nombre: 'Gafas de soldador', desc: 'Termina el Mundo 2.', ok: function (P) { return P.mundoCompleto(2); } },
    { id: 6, nombre: 'Antena de Bit', desc: 'Supera 10 retos del Mundo 3.', ok: function (P) { return P.completadosMundo(3) >= 10; } },
    { id: 7, nombre: 'Corona del Faro', desc: 'Enciende el Faro Mayor.', ok: function (P) { return P.todos(['f-03']); } }
  ];

  return { INSIGNIAS: INSIGNIAS, DISFRACES: DISFRACES };
});
