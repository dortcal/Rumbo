/*
 * RUMBO — Mundo 0: Pequeños exploradores (Educación Infantil, 3-5 años).
 * 15 retos en tres itinerarios de 5. Sin lectura: la voz y las imágenes son la instrucción.
 * Aquí NO hay bucles, condiciones ni variables: la repetición se trabaja como patrón visual.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./dsl.js'));
    module.exports = api;
  } else {
    root.RumboNivelesInfantil = factory(root.RumboDSL);
  }
})(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';
  var A = D.A, G = D.D, I = D.I, R = D.R;
  var L = D.nivel;

  function inf(def) {
    def.e = 'infantil';
    def.huecos = def.huecos || def.ref.length;
    return L(def);
  }

  return [
    // ======== 3 años: Pequeños exploradores (una o dos acciones) ========
    inf({ id: 'i3-01', it: 3, tt: 'La flor', z: 'jardin', skin: { meta: 'flor' },
      m: ['>G'], c: ['avanzar'], ref: [A],
      o: 'Ayuda a Lumo a llegar hasta la flor.', i: 'Lumo ve una flor enorme. ¡Vamos a olerla!',
      cur: ['inf14'], ext: ['Asociar una imagen con una acción', 'Causa y efecto: pulso y Lumo se mueve'] }),
    inf({ id: 'i3-02', it: 3, tt: 'La zanahoria', z: 'jardin', skin: { meta: 'zanahoria' },
      m: ['>.G'], c: ['avanzar'], ref: [A, A],
      o: 'Lleva a Lumo hasta la zanahoria.', i: 'Conejo tiene hambre. Lumo busca su zanahoria.',
      cur: ['inf14', 'inf15'], ext: ['Repetir una misma acción dos veces'] }),
    inf({ id: 'i3-03', it: 3, tt: 'Hacia arriba', z: 'jardin', skin: { meta: 'arbol' },
      m: ['G', '^'], c: ['avanzar', 'girar-d'], ref: [A], huecos: 1,
      o: 'Lleva a Lumo hasta el árbol.', i: 'El árbol está arriba. ¡Hay sombra fresquita!',
      cur: ['inf14', 'inf11'], ext: ['Elegir entre dos tarjetas'] }),
    inf({ id: 'i3-04', it: 3, tt: 'Un giro', z: 'jardin', skin: { meta: 'casa' },
      m: ['>.', 'G.'], c: ['avanzar', 'girar-d'], ref: [G, A],
      o: 'Gira y llega hasta la casa.', i: 'Conejo vive en la casita de abajo. ¡Vamos!',
      cur: ['inf14'], ext: ['Primer giro: la dirección cambia con una tarjeta'] }),
    inf({ id: 'i3-05', it: 3, tt: 'La fruta', z: 'jardin', skin: { meta: 'casa', obj: 'fruta' },
      m: ['>oG'], c: ['avanzar', 'recoger'], ref: [A, R, A],
      o: 'Recoge la fruta del camino y ve a la casa.', i: 'Una fruta rica para Conejo. Recógela y sigue.',
      cur: ['inf11', 'inf15'], ext: ['Orden: avanzar, recoger y seguir avanzando'] }),

    // ======== 4 años: Aventureros del camino (dos a cuatro tarjetas) ========
    inf({ id: 'i4-01', it: 4, tt: 'El camino torcido', z: 'granja', skin: { meta: 'casa' },
      m: ['>.', '#G'], c: ['avanzar', 'girar-d'], ref: [A, G, A],
      o: 'Sigue el camino hasta la casa.', i: 'El camino de la granja hace una curva.',
      cur: ['inf14', 'inf15'], ext: ['Secuencia de tres acciones'] }),
    inf({ id: 'i4-02', it: 4, tt: 'La zanahoria del camino', z: 'granja', skin: { meta: 'casa', obj: 'zanahoria' },
      m: ['>oG'], c: ['avanzar', 'recoger'], ref: [A, R, A],
      o: 'Recoge la zanahoria y llega a la casa.', i: 'Una zanahoria en el camino. ¡Cógela!',
      cur: ['inf11', 'inf15'], ext: ['Ordenar acciones: mover, recoger, mover'] }),
    inf({ id: 'i4-03', it: 4, tt: 'Ordena las tarjetas', z: 'granja', skin: { meta: 'casa' }, tipo: 'depurar',
      m: ['>.#', '#.#', '#G#'], c: ['avanzar', 'girar-d'], ref: [A, G, A, A], ini: [A, A, G, A],
      o: 'Las tarjetas están desordenadas. Ponlas bien.', i: 'Un bichito travieso ha movido las tarjetas.',
      cur: ['inf15'], ext: ['Detectar un error de orden y corregirlo'] }),
    inf({ id: 'i4-04', it: 4, tt: 'Cuidado con el agua', z: 'granja', skin: { meta: 'casa' },
      m: ['>.~', '#G#'], c: ['avanzar', 'girar-d'], ref: [A, G, A],
      o: 'Evita el agua y llega a la casa.', i: 'El agua está fría. Rodéala sin mojarte.',
      cur: ['inf14', 'inf15'], ext: ['Anticipar el resultado antes de ejecutar'] }),
    inf({ id: 'i4-05', it: 4, tt: 'Recoge y gira', z: 'granja', skin: { meta: 'casa', obj: 'zanahoria' },
      m: ['>o', '#G'], c: ['avanzar', 'recoger', 'girar-d'], ref: [A, R, G, A],
      o: 'Recoge la zanahoria, gira y llega.', i: 'Tras la curva hay una sorpresa.',
      cur: ['inf11', 'inf14', 'inf15'], ext: ['Secuencia de cuatro acciones con tres tarjetas distintas'] }),

    // ======== 5 años: Guardianes de los patrones (tres a siete tarjetas) ========
    inf({ id: 'i5-01', it: 5, tt: 'Planifica el camino', z: 'playa', skin: { meta: 'cofre' },
      m: ['>..', '##.', '##G'], c: ['avanzar', 'girar-d', 'girar-i'], ref: [A, A, G, A, A],
      o: 'Planea el camino hasta el cofre.', i: 'Un cofre brillante en la playa. ¡Planea el camino!',
      cur: ['inf14', 'inf15'], ext: ['Planificar antes de actuar', 'Anticipar el resultado de una secuencia'] }),
    inf({ id: 'i5-02', it: 5, tt: '¿Qué movimiento falta?', z: 'playa', skin: { meta: 'cofre' }, tipo: 'depurar',
      m: ['>..', '##.', '##G'], c: ['avanzar', 'girar-d', 'girar-i'], ref: [A, A, G, A, A], ini: [A, A, A, A],
      o: 'A la secuencia le falta una tarjeta. Colócala.', i: 'Una tarjeta se ha caído. ¿Cuál falta?',
      cur: ['inf15'], ext: ['Completar una secuencia: qué falta'] }),
    inf({ id: 'i5-03', it: 5, tt: 'Encuentra el error', z: 'playa', skin: { meta: 'cofre' }, tipo: 'depurar',
      m: ['#.G', '>.#'], c: ['avanzar', 'girar-d', 'girar-i'], ref: [A, I, A, G, A], ini: [A, G, A, G, A],
      o: 'Una tarjeta está mal. Cámbiala.', i: 'Lumo se ha despistado con un giro.',
      cur: ['inf15'], ext: ['Detectar y corregir un error en una secuencia'] }),
    inf({ id: 'i5-04', it: 5, tt: 'Repite el patrón', z: 'playa', skin: { meta: 'cofre', obj: 'concha' },
      m: ['>oooG'], c: ['avanzar', 'recoger'], ref: [A, R, A, R, A, R, A], ini: [A, R, A, R],
      o: 'Sigue el patrón: avanza, recoge, avanza, recoge…', i: 'Las conchas siguen un patrón. ¡Míralas bien!',
      cur: ['inf11', 'inf15'], ext: ['Reconocer y continuar un patrón repetitivo'] }),
    inf({ id: 'i5-05', it: 5, tt: 'El tesoro', z: 'playa', skin: { meta: 'cofre', obj: 'concha' },
      m: ['>.o', '##.', '..G'], c: ['avanzar', 'recoger', 'girar-d', 'girar-i'], ref: [A, A, R, G, A, A],
      o: 'Recoge la concha y llega al tesoro.', i: 'El tesoro está cerca. Recoge la concha.',
      cur: ['inf11', 'inf14', 'inf15'], ext: ['Planificar un recorrido con un objetivo intermedio'] })
  ];
});
