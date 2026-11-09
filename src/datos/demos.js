/*
 * RUMBO — Mini-demostraciones de cada tarjeta nueva. Son niveles reales ejecutados con el
 * mismo intérprete, no vídeos: lo que se ve es lo que hace la tarjeta de verdad.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) { api = factory(require('./dsl.js')); module.exports = api; } else { root.RumboDemos = factory(root.RumboDSL); }
})(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';
  var A = D.A, G = D.D, Gi = D.I;
  function dm(zona, mapa, x, y, dir, prog, extra) {
    return Object.assign({ zona: zona, mapa: mapa, inicio: { x: x, y: y, dir: dir }, programa: prog, titulo: 'Demostración' }, extra || {});
  }
  var DEMOS = {
    'avanzar': dm('jardin', ['...G'], 0, 0, 'E', [A, A, A]),
    'retroceder': dm('jardin', ['G...'], 3, 0, 'E', [D.B, D.B, D.B]),
    'girar-d': dm('jardin', ['..', '#G'], 0, 0, 'E', [A, G, A]),
    'girar-i': dm('jardin', ['#G', '..'], 0, 1, 'E', [A, Gi, A]),
    'saltar': dm('jardin', ['.~G'], 0, 0, 'E', [D.S]),
    'recoger': dm('jardin', ['.oG'], 0, 0, 'E', [A, D.R, A]),
    'activar': dm('jardin', ['.sdG'], 0, 0, 'E', [A, D.X, A, A]),
    'esperar': dm('jardin', ['..G'], 0, 0, 'E', [A, D.E, A]),
    'repetir': dm('jardin', ['.....G'], 0, 0, 'E', [D.rep(5, A)]),
    'si': dm('jardin', ['.o.G'], 0, 0, 'E', [D.rep(4, D.si(D.OA, [D.R], []), A)]),
    'mientras': dm('jardin', ['....G'], 0, 0, 'E', [D.mientras(D.no(D.MA), [A])]),
    'receta': dm('jardin', ['......G'], 0, 0, 'E', D.P([D.rec('A'), D.rec('A')], { A: [A, A, A] }))
  };
  // Explicaciones por pasos para las tarjetas de control: primero el problema, después la herramienta.
  var R = D.R;
  var PASOS = {
    'repetir': [
      { texto: 'Fíjate: para llegar tengo que dar el mismo paso una y otra vez. ¡Qué pesado!', demo: dm('jardin', ['......G'], 0, 0, 'E', [A, A, A, A, A, A]) },
      { texto: 'Con Repetir lo escribo una sola vez. El número dice cuántas veces; lo que pones dentro de la caja es lo que se repite.', demo: dm('jardin', ['......G'], 0, 0, 'E', [D.rep(6, A)]) },
      { texto: 'Truco: busca qué grupo de tarjetas se repite y cuántas veces. Aquí se repite «avanzar, recoger, avanzar» tres veces.', demo: dm('jardin', ['.o.o.o.G'], 0, 0, 'E', [D.rep(3, A, R, A), A]) }
    ],
    'si': [
      { texto: 'A veces el camino cambia: en unas casillas hay una luz y en otras no. Con Si, Lumo mira y recoge solo si hay luz.', demo: dm('jardin', ['.o.G'], 0, 0, 'E', [D.rep(4, D.si(D.OA, [R], []), A)]) },
      { texto: 'Si tiene dos partes: lo que hace si se cumple y lo que hace si no. Aquí: si hay agua delante, salta; si no, avanza.', demo: dm('jardin', ['..~..G'], 0, 0, 'E', [D.rep(4, D.si(D.AG, [D.S], [A]))]) }
    ],
    'mientras': [
      { texto: 'Repetir necesita un número. Pero ¿y si no sé cuántos pasos hay? Entonces uso Mientras.', demo: dm('jardin', ['....G'], 0, 0, 'E', [D.mientras(D.no(D.MA), [A])]) },
      { texto: 'Mientras mira la condición antes de cada vuelta. Aquí: mientras no haya un muro delante, avanzar. Cuando hay muro, para.', demo: dm('jardin', ['....G#'], 0, 0, 'E', [D.mientras(D.no(D.OB), [A])]) }
    ],
    'receta': [
      { texto: 'Mira: escribo el mismo grupo de tarjetas dos veces. Si el grupo fuera más largo, sería un lío.', demo: dm('jardin', ['......G'], 0, 0, 'E', [A, A, A, A, A, A]) },
      { texto: 'Una receta guarda un grupo de tarjetas con una letra. Cada vez que uso la letra, Lumo hace todo el grupo.', demo: dm('jardin', ['......G'], 0, 0, 'E', D.P([D.rec('A'), D.rec('A')], { A: [A, A, A] })) }
    ]
  };
  var TEXTOS = {
    'avanzar': 'Avanzar: Lumo da un paso hacia donde mira.',
    'retroceder': 'Retroceder: Lumo da un paso hacia atrás sin girarse.',
    'girar-d': 'Girar a la derecha: Lumo gira sin moverse de sitio.',
    'girar-i': 'Girar a la izquierda: Lumo gira sin moverse de sitio.',
    'saltar': 'Saltar: Lumo pasa por encima de lo que tiene delante.',
    'recoger': 'Recoger: Lumo coge lo que hay en su casilla.',
    'activar': 'Activar: Lumo pulsa el interruptor y las puertas se abren.',
    'esperar': 'Esperar: Lumo se queda quieto un momento.',
    'repetir': 'Repetir: hace lo de dentro tantas veces como indiques.',
    'si': 'Si: Lumo mira y elige. Si se cumple, hace una cosa; si no, otra.',
    'mientras': 'Mientras: Lumo repite hasta que la condición deje de cumplirse.',
    'receta': 'Receta: guarda unas tarjetas con un nombre y úsalas cuando quieras.'
  };
  // Frases cortas para Infantil (voz), sin tecnicismos.
  var VOZ_INFANTIL = {
    'avanzar': 'Esta tarjeta me hace andar. ¡Mira!',
    'girar-d': 'Esta tarjeta me hace girar. ¡Mira!',
    'girar-i': 'Esta tarjeta me hace girar. ¡Mira!',
    'saltar': 'Esta tarjeta me hace saltar. ¡Mira!',
    'recoger': 'Esta tarjeta me deja coger cosas. ¡Mira!',
    'esperar': 'Esta tarjeta me hace esperar. ¡Mira!'
  };
  return { DEMOS: DEMOS, PASOS: PASOS, TEXTOS: TEXTOS, VOZ_INFANTIL: VOZ_INFANTIL };
});
