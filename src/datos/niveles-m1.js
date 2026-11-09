/*
 * RUMBO — Mundo 1: Primeros programadores (1.er ciclo, 1.º y 2.º de Primaria). 25 niveles.
 * Zonas: Bosque encantado (1-13) y Reino de las montañas (14-25).
 * Cada tarjeta nueva aparece por primera vez en el nivel donde se enseña.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./dsl.js'));
    module.exports = api;
  } else {
    root.RumboNivelesM1 = factory(root.RumboDSL);
  }
})(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';
  var A = D.A, B = D.B, G = D.D, I = D.I, S = D.S, R = D.R, X = D.X, rep = D.rep;

  function m1(def, n) {
    def.e = 'primaria-1c';
    def.z = n <= 13 ? 'bosque' : 'montanas';
    def.id = 'm1-' + (n < 10 ? '0' : '') + n;
    return D.nivel(def);
  }

  var ALL = ['avanzar', 'girar-d', 'girar-i'];
  var ORI = ['avanzar', 'girar-d', 'girar-i', 'recoger'];

  return [
    // ---- Bloque 1. Primeros movimientos ----
    m1({ tt: 'El primer paso', b: 1, m: ['>..G'], c: ['avanzar'], ref: [A, A, A],
      o: 'Lleva a Lumo hasta la meta.', i: 'Lumo despierta en el bosque. Su brújula brilla poquito.',
      cur: ['m1_41', 'saber23'], ext: ['Una tarjeta = una acción'] }, 1),
    m1({ tt: 'Hacia abajo', b: 1, m: ['v', '.', '.', '.', 'G'], c: ['avanzar'], ref: [A, A, A, A],
      o: 'Lumo mira hacia abajo. Llévalo a la meta.', i: 'Las luciérnagas se han ido por el camino.',
      cur: ['m1_41', 'saber23'], ext: ['La dirección de Lumo importa'] }, 2),
    m1({ tt: 'Marcha atrás', b: 1, m: ['G..>.'], c: ['avanzar', 'retroceder'], ref: [B, B, B],
      o: 'La meta está detrás. Usa una tarjeta nueva.', i: 'Lumo se ha pasado de camino.',
      p: ['La meta está a la espalda de Lumo.', 'Retroceder mueve a Lumo hacia atrás sin girar.', 'Necesitas tres tarjetas de Retroceder.'],
      cur: ['m1_41', 'saber23'], ext: ['Retroceder: una nueva instrucción'] }, 3),

    // ---- Bloque 2. Giros y secuencias ----
    m1({ tt: 'La primera curva', b: 2, m: ['>..', '##.', '##G'], c: ['avanzar', 'girar-d'], ref: [A, A, G, A, A], h: 'giro',
      o: 'Gira a la derecha cuando llegues a la esquina.', i: 'El camino del bosque da una curva.',
      cur: ['m1_41', 'saber23'], ext: ['Giro a la derecha', 'Secuencia de cinco instrucciones'] }, 4),
    m1({ tt: 'Curva hacia arriba', b: 2, m: ['##G', '##.', '>..'], c: ALL, ref: [A, A, I, A, A], h: 'giro',
      o: 'Ahora el camino sube. Gira a la izquierda.', i: 'Otra curva, pero hacia el otro lado.',
      cur: ['m1_41', 'saber23'], ext: ['Giro a la izquierda'] }, 5),
    m1({ tt: 'El camino en S', b: 2, m: ['>..', '##.', 'G..'], c: ALL, ref: [A, A, G, A, A, G, A, A], h: 'giro',
      o: 'Sigue el camino en forma de S.', i: 'El sendero zigzaguea entre los árboles.',
      cur: ['m1_41', 'm1_42', 'saber23'], ext: ['Secuencias más largas: ocho instrucciones'] }, 6),

    // ---- Bloque 3. Orientación ----
    m1({ tt: 'Lumo mira hacia abajo', b: 3, m: ['v..G'], c: ALL, ref: [I, A, A, A], h: 'giro',
      o: 'Lumo mira hacia abajo, pero la meta está a su izquierda… ¡de la pantalla!', i: 'Lumo tiene que pensar desde su propio sitio.',
      p: ['Imagina que eres Lumo y mira hacia donde mira él.', 'La meta queda a su izquierda: ¿qué giro necesitas?', 'Gira primero, luego avanza tres veces.'],
      cur: ['m1_41', 'saber23'], ext: ['Orientación: izquierda y derecha desde el punto de vista de Lumo'] }, 7),
    m1({ tt: 'Dar la vuelta', b: 3, m: ['^', '.', '.', 'G'], c: ALL, ref: [I, I, A, A, A], h: 'giro',
      o: 'La meta está detrás. Hazle dar la vuelta.', i: 'Lumo se ha dado la vuelta sin querer.',
      p: ['La meta está justo detrás de Lumo.', 'Para dar la vuelta hacen falta dos giros.', 'Gira dos veces y avanza tres.'],
      cur: ['m1_41', 'saber23'], ext: ['Dos giros seguidos = media vuelta'] }, 8),

    // ---- Bloque 4. Recogida de objetos ----
    m1({ tt: 'La primera luciérnaga', b: 4, m: ['>.o.G'], c: ORI, ref: [A, A, R, A, A], h: 'obj',
      o: 'Recoge la luciérnaga antes de llegar a la meta.', i: 'Una luciérnaga está atrapada.',
      cur: ['m1_41', 'saber23'], ext: ['Recoger: una nueva instrucción'] }, 9),
    m1({ tt: 'Dos seguidas', b: 4, m: ['>oo.G'], c: ORI, ref: [A, R, A, R, A, A], h: 'obj',
      o: 'Hay dos luciérnagas seguidas. Recoge las dos.', i: 'Siguen una detrás de otra.',
      cur: ['m1_41', 'm1_42'], ext: ['Reconocer una pareja de acciones que se repite'] }, 10),
    m1({ tt: 'Recoger y girar', b: 4, m: ['..G', '>o.'], c: ORI, ref: [A, R, A, I, A], h: 'obj',
      o: 'Recoge la luciérnaga y sube hasta la meta.', i: 'La meta está arriba, pero la luz está en el camino.',
      cur: ['m1_41', 'saber23'], ext: ['Combinar recogida y giro'] }, 11),

    // ---- Bloque 5. Obstáculos ----
    m1({ tt: 'Un muro en medio', b: 5, m: ['>#G', '...'], c: ALL, ref: [G, A, I, A, A, I, A], h: 'obs',
      o: 'Hay un muro. Rodéalo por abajo.', i: 'Un muro de piedra bloquea el camino.',
      cur: ['m1_41', 'm1_42'], ext: ['Planificar un rodeo antes de ejecutar'] }, 12),
    m1({ tt: 'Cuidado con el agua', b: 5, m: ['>.~G', '....'], c: ALL, ref: [A, G, A, I, A, A, I, A], h: 'obs',
      o: 'No pises el agua. Busca otro camino.', i: 'Un arroyo cruza el bosque.',
      cur: ['m1_41', 'm1_42'], ext: ['Anticipar el resultado: el agua detiene a Lumo'] }, 13),
    m1({ tt: '¡A saltar!', b: 5, m: ['>.~G'], c: ['avanzar', 'saltar'], ref: [A, S], h: 'saltar',
      o: 'Salta el arroyo con una tarjeta nueva.', i: 'En las montañas, saltar será muy útil.',
      cur: ['m1_41', 'saber23'], ext: ['Saltar: una instrucción que hace en un paso lo que antes costaba ocho'] }, 14),

    // ---- Bloque 6. Patrones y repetición ----
    m1({ tt: 'Escalera repetida', b: 6, m: ['>.##', '#..#', '##..', '###G'], c: ['avanzar', 'girar-d', 'girar-i', 'repetir'],
      ref: [rep(3, A, G, A, I)], lim: { repetir: 1 }, holgura: 1, usa: 'repetir', h: 'bucle',
      o: 'La escalera repite un patrón. Usa Repetir.', i: 'La escalera de piedra repite siempre lo mismo.',
      cur: ['m1_41', 'm1_42', 'saber23'], ext: ['Primera repetición visual: repetir un patrón varias veces'] }, 15),
    m1({ tt: 'Luciérnagas en fila', b: 6, m: ['>ooooG'], c: ['avanzar', 'recoger', 'repetir'],
      ref: [rep(4, A, R), A], lim: { repetir: 1 }, holgura: 1, h: 'bucle',
      o: 'Cuatro luciérnagas. ¿Qué se repite?', i: 'Cuatro luces en fila, igual que cuatro notas.',
      cur: ['m1_41', 'm1_42'], ext: ['Bucle con dos acciones'] }, 16),
    m1({ tt: 'Piedras del río', b: 6, m: ['>~.~.~.G'], c: ['avanzar', 'saltar', 'repetir'],
      ref: [rep(3, S), A], lim: { repetir: 1 }, holgura: 1, h: 'bucle',
      o: 'Cruza el río saltando de piedra en piedra.', i: 'Hay piedras para cruzar el río, una sí y otra no.',
      cur: ['m1_41', 'm1_42'], ext: ['Repetir una sola acción'] }, 17),

    // ---- Bloque 7. Depuración ----
    m1({ tt: 'Tarjetas cambiadas', b: 7, m: ['>..', '##.', '##G'], c: ALL, ref: [A, A, G, A, A], ini: [A, G, A, A, A], h: 'depurar',
      o: 'Bichito ha desordenado el programa. Arréglalo.', i: '¡Ji, ji! Bichito ha cambiado las tarjetas de sitio.',
      cur: ['m1_41', 'm1_42', 'm1_cm'], ext: ['Depurar: instrucciones desordenadas'] }, 18),
    m1({ tt: 'Giro equivocado', b: 7, m: ['####G', '####.', '>....'], c: ALL, ref: [A, A, A, A, I, A, A], ini: [A, A, A, A, G, A, A], h: 'depurar',
      o: 'Hay una tarjeta que no es la correcta. Cámbiala.', i: 'Bichito ha cambiado un giro.',
      cur: ['m1_41', 'm1_42', 'm1_cm'], ext: ['Depurar: una instrucción incorrecta'] }, 19),
    m1({ tt: 'Falta una tarjeta', b: 7, m: ['>..', '##.', 'G..'], c: ALL, ref: [A, A, G, A, A, G, A, A], ini: [A, A, G, A, A, G, A], h: 'depurar',
      o: 'Al programa le falta algo para llegar. Complétalo.', i: 'Bichito se ha comido una tarjeta.',
      cur: ['m1_41', 'm1_42', 'm1_cm'], ext: ['Depurar: una instrucción que falta'] }, 20),

    // ---- Bloque 8. Mecanismos ----
    m1({ tt: 'La puerta de piedra', b: 8, m: ['>.s.dG'], c: ['avanzar', 'activar'], ref: [A, A, X, A, A, A], h: 'mecanismo',
      o: 'Pisa el interruptor y actívalo para abrir la puerta.', i: 'Una puerta cierra el paso al faro.',
      cur: ['m1_41', 'saber23'], ext: ['Activar un mecanismo: causa y efecto'] }, 21),
    m1({ tt: 'El interruptor escondido', b: 8, m: ['#s##', '>.dG'], c: ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'activar'],
      ref: [A, I, A, X, B, G, A, A], holgura: 2, h: 'mecanismo',
      o: 'El interruptor está en un hueco. Actívalo y vuelve.', i: 'El interruptor se esconde en un hueco.',
      cur: ['m1_41', 'm1_42'], ext: ['Planificar el orden: ir, activar, volver'] }, 22),

    // ---- Bloque 10. Grandes desafíos ----
    m1({ tt: 'El gran salto', b: 10, m: ['>o.~o.~G'], c: ['avanzar', 'recoger', 'saltar', 'repetir'],
      ref: [A, rep(2, R, A, S)], lim: { repetir: 1 }, holgura: 1, usa: 'repetir', h: 'optim',
      o: 'Recoge las dos luces saltando. ¡Busca el patrón!', i: 'En las montañas, las luces están sobre abismos.',
      cur: ['m1_41', 'm1_42'], ext: ['Encontrar un patrón dentro de una secuencia más larga'] }, 23),
    m1({ tt: 'Bucle mal contado', b: 10, m: ['>ooooG'], c: ['avanzar', 'recoger', 'repetir'],
      ref: [rep(4, A, R), A], ini: [rep(3, A, R), A], lim: { repetir: 1 }, holgura: 1, h: 'depurar',
      p: ['El bucle repite poco: ejecútalo y mira dónde se queda Lumo.', 'Hay cuatro luces. ¿Cuántas veces se repite el bucle?', 'Cambia el número de Repetir a 4.'],
      o: 'El bucle no repite las veces justas. Corrígelo.', i: 'La brújula de Lumo cuenta mal.',
      cur: ['m1_41', 'm1_42', 'm1_cm'], ext: ['Depurar un bucle: cambiar el número de repeticiones'] }, 24),
    m1({ tt: 'La escalera de luz', b: 10, m: ['>o###', '#.o##', '##.o#', '###.G'], c: ['avanzar', 'recoger', 'girar-d', 'girar-i', 'repetir'],
      ref: [rep(3, A, R, G, A, I), A], lim: { repetir: 1 }, holgura: 2, usa: 'repetir', h: 'optim',
      o: 'Tres luces en escalera. ¡Encuentra el patrón!', i: 'La última escalera lleva a la cumbre.',
      cur: ['m1_41', 'm1_42', 'm1_cm'], ext: ['Gran desafío: patrón de cinco tarjetas repetido tres veces'] }, 25)
  ];
});
