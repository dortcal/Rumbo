/*
 * RUMBO — Mundo 2: Maestros del código (2.º ciclo, 3.º y 4.º de Primaria). 25 niveles.
 * Zonas: Mundo submarino (1-13) e Isla volcánica (14-25).
 * Aquí aparecen: bucles con cantidades distintas, descomposición, recetas (extensión del juego)
 * y las primeras condiciones (anticipación del tercer ciclo).
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./dsl.js'));
    module.exports = api;
  } else {
    root.RumboNivelesM2 = factory(root.RumboDSL);
  }
})(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';
  var A = D.A, B = D.B, G = D.D, I = D.I, S = D.S, R = D.R, X = D.X, rep = D.rep, si = D.si, rec = D.rec;
  var OB = D.OB, AG = D.AG, P = D.P;

  function m2(def, n) {
    def.e = 'primaria-2c';
    def.z = n <= 13 ? 'mar' : 'volcan';
    def.id = 'm2-' + (n < 10 ? '0' : '') + n;
    return D.nivel(def);
  }

  var MOV = ['avanzar', 'girar-d', 'girar-i', 'repetir'];
  var BASE = ['avanzar', 'girar-d', 'girar-i', 'recoger', 'repetir'];
  var NICHOS = ['>.......G', '##o#o#o##'];
  var NICHOS_ARR = ['####o####', '>.......G', '##o###o##'];
  var NICHO_REC = [D.D, A, R, B, I];

  return [
    // ---- Bloque 1. Bucles para recorridos largos ----
    m2({ tt: 'El camino largo', b: 1, m: ['>.........G'], c: ['avanzar', 'repetir'],
      ref: [rep(10, A)], lim: { repetir: 1 }, holgura: 1, h: 'bucle',
      o: 'Diez pasos son muchos. ¿Hay una forma más corta?', i: 'Tinta ha construido un túnel submarino larguísimo.',
      cur: ['m2_41', 'm2_42', 'saber23'], ext: ['Repetir con una cantidad grande'] }, 1),
    m2({ tt: 'Dos tramos', b: 1, m: ['>.....', '#####.', '#####.', '#####G'], c: MOV,
      ref: [rep(5, A), G, rep(3, A)], lim: { repetir: 2 }, holgura: 1, h: 'bucle',
      o: 'Cada tramo es una repetición distinta.', i: 'El túnel tiene un codo.',
      cur: ['m2_41', 'm2_42'], ext: ['Dos bucles con cantidades diferentes'] }, 2),
    m2({ tt: 'Escalera grande', b: 1, m: ['>.####', '#..###', '##..##', '###..#', '####..', '#####G'], c: MOV,
      ref: [rep(5, A, G, A, I)], lim: { repetir: 1 }, holgura: 1, usa: 'repetir', h: 'bucle',
      o: 'Una escalera enorme. ¡Hay un patrón que se repite!', i: 'Las escaleras de coral nunca se acaban.',
      cur: ['m2_41', 'm2_42'], ext: ['Reconocer un patrón de cuatro tarjetas'] }, 3),

    // ---- Bloque 2. Bucles y patrones ----
    m2({ tt: 'Anillo de coral', b: 2, m: ['>...', '###.', '###.', 'G...'], c: MOV,
      ref: [rep(3, A, A, A, G)], lim: { repetir: 1 }, holgura: 1, usa: 'repetir', h: 'bucle',
      o: 'Tres lados iguales. Repite el patrón.', i: 'Un anillo de coral rodea la isla.',
      cur: ['m2_41', 'm2_42'], ext: ['Patrón con avance y giro repetido tres veces'] }, 4),
    m2({ tt: 'Tres tramos', b: 2, m: ['>...##', '###.##', '###.##', '###.##', '###.##', '###..G'], c: MOV,
      ref: [rep(3, A), G, rep(5, A), I, rep(2, A)], lim: { repetir: 3 }, holgura: 1, h: 'bucle',
      o: 'Cada tramo tiene su número de pasos.', i: 'Tinta dibuja el recorrido en la arena.',
      cur: ['m2_41', 'm2_42'], ext: ['Tres bucles con tres cantidades distintas'] }, 5),
    m2({ tt: 'Luces con huecos', b: 2, m: ['>.o.o.oG'], c: BASE,
      ref: [rep(3, A, A, R), A], lim: { repetir: 1 }, holgura: 1, h: 'bucle',
      o: 'Las luces están cada dos casillas.', i: 'Las medusas brillan de dos en dos.',
      cur: ['m2_41', 'm2_42'], ext: ['Patrón de tres acciones'] }, 6),
    m2({ tt: 'Recoge y cruza', b: 2, m: ['>ooo~.~.G'], c: ['avanzar', 'recoger', 'saltar', 'repetir'],
      ref: [rep(3, A, R), rep(2, S), A], lim: { repetir: 2 }, holgura: 1, h: 'bucle',
      o: 'Dos trozos distintos: recoger y saltar.', i: 'Perlas primero, corrientes después.',
      cur: ['m2_41', 'm2_42'], ext: ['Descomponer en dos partes y repetir cada una'] }, 7),
    m2({ tt: 'Dunas de arena', b: 2, m: ['>..####', '##...##', '####...', '######G'], c: MOV,
      ref: [rep(3, A, A, G, A, I)], lim: { repetir: 1 }, holgura: 1, usa: 'repetir', h: 'bucle',
      o: 'Un zigzag que se repite. Cuenta los zigzags.', i: 'Las dunas submarinas suben y bajan.',
      cur: ['m2_41', 'm2_42'], ext: ['Patrón de cinco tarjetas'] }, 8),

    // ---- Bloque 3. Descomponer problemas ----
    m2({ tt: 'Tres salas', b: 3, m: ['>.os.d.oG'], c: ['avanzar', 'recoger', 'activar', 'repetir'],
      ref: [A, A, R, A, X, rep(4, A), R, A], lim: { repetir: 1 }, holgura: 2, h: 'mecanismo',
      p: ['Divide el problema: primera luz, interruptor, segunda luz.', 'Resuelve cada parte por separado y luego júntalas.', 'Después de activar, hay un tramo largo: usa Repetir.'],
      o: 'Resuelve cada parte por separado y júntalas.', i: 'Una puerta separa dos salas del barco hundido.',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Descomposición: dividir un problema en partes más sencillas'] }, 9),
    m2({ tt: 'Los nichos', b: 3, m: NICHOS, c: ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'recoger', 'repetir'],
      ref: [rep(3, A, A, G, A, R, B, I), A, A], lim: { repetir: 1 }, holgura: 2, h: 'bucle',
      o: 'Tres nichos con perlas. Cada visita es igual.', i: 'Cada nicho esconde una perla.',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Descomposición: una visita al nicho se repite tres veces'] }, 10),

    // ---- Bloque 4. Recetas (bloques reutilizables) ----
    m2({ tt: 'La receta del nicho', b: 4, m: NICHOS, c: ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'recoger', 'receta'], rec: ['A'],
      ref: P([A, A, rec('A'), A, A, rec('A'), A, A, rec('A'), A, A], { A: NICHO_REC }), holgura: 3, usa: 'receta', h: 'receta',
      o: 'Guarda la visita al nicho en la Receta A.', i: 'Tinta: «Una receta se hace una vez y se usa muchas».',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Receta: un bloque reutilizable (función) con nombre'] }, 11),
    m2({ tt: 'Dos recetas', b: 4, m: NICHOS_ARR, c: ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'recoger', 'receta'], rec: ['A', 'B'],
      ref: P([A, A, rec('A'), A, A, rec('B'), A, A, rec('A'), A, A], { A: [G, A, R, B, I], B: [I, A, R, B, G] }), holgura: 4, usa: 'receta', h: 'receta',
      p: ['Hay nichos arriba y nichos abajo.', 'Una receta sirve para los de abajo y otra para los de arriba.', 'La Receta A gira a la derecha; la B, a la izquierda.'],
      o: 'Nichos arriba y abajo: usa dos recetas.', i: 'Algunos nichos están por encima del camino.',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Dos recetas distintas'] }, 12),
    m2({ tt: 'Cinco nichos', b: 4, m: ['>...........G', '##o#o#o#o#o##'],
      c: ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'recoger', 'repetir', 'receta'], rec: ['A'],
      ref: P([rep(5, A, A, rec('A')), A, A], { A: NICHO_REC }), lim: { repetir: 1 }, holgura: 2, usa: 'receta', h: 'receta',
      o: 'Cinco nichos. Receta dentro de un bucle.', i: 'La grieta es larga y tiene muchos nichos.',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Receta dentro de un bucle'] }, 13),

    // ---- Bloque 5. Mecanismos (isla volcánica) ----
    m2({ tt: 'La puerta de lava', b: 5, m: ['>.s.d.....G'], c: ['avanzar', 'activar', 'repetir'],
      ref: [A, A, X, A, A, rep(6, A)], lim: { repetir: 1 }, holgura: 1, h: 'mecanismo',
      o: 'Abre la puerta y cruza el largo pasillo.', i: 'El lagarto gigante guarda una puerta de roca.',
      cur: ['m2_41', 'm2_42'], ext: ['Mecanismo y bucle en el mismo programa'] }, 14),
    m2({ tt: 'Puerta y barrera', b: 5, m: ['>.s.d.b.G'], c: ['avanzar', 'activar', 'saltar', 'repetir'],
      ref: [A, A, X, rep(3, A), S, A], lim: { repetir: 1 }, holgura: 1, h: 'mecanismo',
      o: 'Una puerta que se abre y una barrera que se salta.', i: 'Dos obstáculos de lava, dos soluciones distintas.',
      cur: ['m2_41', 'm2_42'], ext: ['Elegir la acción adecuada para cada obstáculo'] }, 15),
    m2({ tt: 'Cruzar la lava', b: 5, m: ['>o.s.d.~.G'], c: ['avanzar', 'recoger', 'activar', 'saltar', 'repetir'],
      ref: [A, R, A, A, X, rep(3, A), S, A], lim: { repetir: 1 }, holgura: 2, h: 'mecanismo',
      o: 'Luz, interruptor, puerta y lava. Un paso cada vez.', i: 'El camino del volcán tiene de todo.',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Planificar varios objetivos en orden'] }, 16),

    // ---- Bloque 6. Depuración y optimización ----
    m2({ tt: 'Un tramo corto', b: 6, m: ['>...##', '###.##', '###.##', '###.##', '###.##', '###..G'], c: MOV,
      ref: [rep(3, A), G, rep(5, A), I, rep(2, A)], ini: [rep(3, A), G, rep(4, A), I, rep(2, A)], lim: { repetir: 3 }, holgura: 1, h: 'depurar',
      p: ['Ejecuta el programa y mira dónde se detiene Lumo.', 'Uno de los bucles repite menos veces de las necesarias.', 'Cuenta las casillas del segundo tramo: son cinco.'],
      o: 'Un bucle repite menos veces de las necesarias.', i: 'Bichito ha cambiado un número.',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Depurar: corregir el número de repeticiones'] }, 17),
    m2({ tt: 'Luces en mal orden', b: 6, m: ['>.o.o.oG'], c: BASE,
      ref: [rep(3, A, A, R), A], ini: [rep(3, A, R, A), A], lim: { repetir: 1 }, holgura: 1, h: 'depurar',
      p: ['Mira por dónde pasa Lumo: ¿recoge las luces?', 'Dentro del bucle, Recoger se ejecuta en el sitio equivocado.', 'Avanza dos veces y después recoge.'],
      o: 'Lumo pasa de largo sin recoger. Arregla el bucle.', i: 'Las medusas se esconden si se las busca tarde.',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Depurar: orden de las tarjetas dentro de un bucle'] }, 18),
    m2({ tt: 'Falta recoger', b: 6, m: ['>ooo~.~.G'], c: ['avanzar', 'recoger', 'saltar', 'repetir'],
      ref: [rep(3, A, R), rep(2, S), A], ini: [rep(3, A), rep(2, S), A], lim: { repetir: 2 }, holgura: 1, h: 'depurar',
      p: ['Lumo llega a la meta, pero ¿se deja algo?', 'Faltan perlas por recoger: el primer bucle solo avanza.', 'Añade Recoger dentro del primer bucle.'],
      o: 'Lumo llega, pero deja las perlas. ¿Qué falta?', i: 'Una perla sin recoger es una pista perdida.',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Depurar: una instrucción que falta dentro de un bucle'] }, 19),
    m2({ tt: 'Receta rota', b: 6, m: NICHOS, c: ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'recoger', 'receta'], rec: ['A'],
      ref: P([A, A, rec('A'), A, A, rec('A'), A, A, rec('A'), A, A], { A: NICHO_REC }),
      ini: P([A, A, rec('A'), A, A, rec('A'), A, A, rec('A'), A, A], { A: [G, A, R, I, B] }), holgura: 3, usa: 'receta', h: 'depurar',
      p: ['La receta se usa tres veces, así que su error se repite tres veces.', 'Mira la Receta A: Lumo sale del nicho en la dirección equivocada.', 'Después de retroceder se gira a la izquierda; no al revés.'],
      o: 'La receta tiene un fallo. Arréglala una vez.', i: 'Un fallo en una receta se repite cada vez que se usa.',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Depurar una receta: corregir en un solo sitio'] }, 20),
    m2({ tt: 'Demasiadas tarjetas', b: 6, m: ['>...', '###.', '###.', 'G...'], c: MOV, tipo: 'optimizar',
      ref: [rep(3, A, A, A, G)], ini: [A, A, A, G, A, A, A, G, A, A, A], lim: { repetir: 1 }, holgura: 1, usa: 'repetir', h: 'optim',
      o: 'Funciona, pero tiene demasiadas tarjetas. Acórtalo.', i: 'Tinta: «Un programa corto es un programa elegante».',
      cur: ['m2_41', 'm2_42'], ext: ['Optimizar: reducir tarjetas sin cambiar el resultado'] }, 21),

    // ---- Bloque 7. Condiciones (anticipación) ----
    m2({ tt: 'Gira si hay muro', b: 7, m: ['>....', '####.', 'G....'], c: ['avanzar', 'girar-d', 'repetir', 'si'], con: ['obstaculo-delante'],
      ref: [rep(20, si(OB, [G], [A]))], lim: { repetir: 1, si: 1 }, holgura: 1, usa: 'si', h: 'cond',
      o: 'Si hay un muro delante, gira. Si no, avanza.', i: 'El lagarto gigante: «Aquí las paredes mandan».',
      cur: ['m2_41', 'm2_42'], ext: ['Primera condición: si ocurre algo, haz una cosa; si no, otra'] }, 22),
    m2({ tt: 'Salta si hay lava', b: 7, m: ['>.~.~.~.G'], c: ['avanzar', 'saltar', 'repetir', 'si'], con: ['agua-delante'],
      ref: [rep(8, si(AG, [S], [A]))], lim: { repetir: 1, si: 1 }, holgura: 1, usa: 'si', h: 'cond',
      o: 'Si hay lava delante, salta. Si no, avanza.', i: 'Los ríos de lava aparecen cada dos casillas.',
      cur: ['m2_41', 'm2_42'], ext: ['Condición para decidir entre dos acciones'] }, 23),

    // ---- Bloque 10. Grandes desafíos ----
    m2({ tt: 'Los túneles del volcán', b: 10, m: ['>.o..', '####.', '..G#o', 'o###.', '..o..'], c: ['avanzar', 'girar-d', 'recoger', 'repetir', 'si'], con: ['obstaculo-delante'],
      ref: [rep(30, si(OB, [G], [A]), R)], lim: { repetir: 1, si: 1 }, holgura: 2, usa: 'si', h: 'cond',
      p: ['El camino es una espiral y todos los giros son a la derecha.', 'Usa una condición: si hay muro, gira; si no, avanza. Y recoge siempre.', 'Mete la condición y Recoger dentro de un bucle largo.'],
      o: 'Una espiral con cuatro luces. Un programa que decide.', i: 'Los túneles forman una espiral hacia el corazón del volcán.',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Condición y bucle juntos: un algoritmo que decide por sí mismo'] }, 24),
    m2({ tt: 'El corazón del volcán', b: 10, m: ['>o.~o.~s.d.G'], c: ['avanzar', 'saltar', 'recoger', 'activar', 'repetir', 'si'], con: ['agua-delante'],
      ref: [rep(15, si(AG, [S], [A]), R, X)], lim: { repetir: 1, si: 1 }, holgura: 2, usa: 'si', h: 'cond',
      p: ['Hay lava, luces, un interruptor y una puerta.', 'Un único bucle puede encargarse de todo: salta si hay lava, y recoge y activa siempre.', 'Dentro del bucle: Si lava, saltar; si no, avanzar. Después Recoger y Activar.'],
      o: 'Un solo bucle que lo haga todo.', i: 'El corazón del volcán late. ¡Último reto del mundo!',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Gran desafío: descomponer, generalizar y automatizar'] }, 25)
  ];
});
