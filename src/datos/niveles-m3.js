/*
 * RUMBO — Mundo 3: Expertos en algoritmos (3.er ciclo, 5.º y 6.º de Primaria). 25 niveles.
 * Zonas: Ciudad tecnológica (1-13) y Mundo espacial (14-25).
 * Bloques: anidados · condiciones y sensores · funciones (recetas) · optimización con límites ·
 * depuración avanzada · grandes desafíos.
 *
 * NO incluye variables, contadores ni parámetros: el motor actual no los tiene (ver README).
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./dsl.js'));
    module.exports = api;
  } else {
    root.RumboNivelesM3 = factory(root.RumboDSL);
  }
})(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';
  var A = D.A, B = D.B, G = D.D, I = D.I, S = D.S, R = D.R, X = D.X;
  var rep = D.rep, si = D.si, mientras = D.mientras, rec = D.rec, no = D.no, P = D.P;
  var OB = D.OB, AG = D.AG, OA = D.OA, IN = D.IN, MA = D.MA;

  function m3(def, n) {
    def.e = 'primaria-3c';
    def.z = n <= 13 ? 'ciudad' : 'espacio';
    def.id = 'm3-' + (n < 10 ? '0' : '') + n;
    return D.nivel(def);
  }

  var MOV = ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'repetir'];
  var ESCALERA = ['>...######', '###....###', '######....', '#########G'];
  var PLAZA = ['>....', '####.', '####.', '####.', 'G....'];
  var CURVAS = ['>.....', '#####.', '##G...'];
  var ESPIRAL = ['>.o..', '####.', '..G#o', 'o###.', '..o..'];
  var FILAS3 = ['>oo', '.oo', '.oo', 'G..'];
  var ARCA = ['avanzar', 'girar-d', 'girar-i', 'recoger', 'repetir', 'receta'];

  // Calentamiento: repaso suave para quien llega al Mundo 3 sin haber pasado por los anteriores.
  function cal(def, n) {
    def.e = 'primaria-3c';
    def.z = 'ciudad';
    def.b = 0;
    def.id = 'm3-p' + n;
    return D.nivel(def);
  }

  return [
    // ---- Bloque 0. Calentamiento (repaso de secuencias, giros, recoger y primer bucle) ----
    cal({ tt: 'Primeros pasos en la ciudad', m: ['>...G'], c: ['avanzar', 'girar-d', 'girar-i'],
      ref: [A, A, A, A], holgura: 1, h: 'seq',
      o: 'Lleva a Lumo hasta la meta.', i: 'Bit enseña a Lumo las calles de la ciudad tecnológica.',
      cur: ['m3_41', 'm3_42'], ext: ['Calentamiento: secuencia corta'] }, 1),
    cal({ tt: 'Doblar la esquina', m: ['>..', '##.', '##G'], c: ['avanzar', 'girar-d', 'girar-i'],
      ref: [A, A, G, A, A], holgura: 1, h: 'giro',
      o: 'Gira en la esquina para llegar a la meta.', i: 'Las calles tienen esquinas.',
      cur: ['m3_41', 'm3_42'], ext: ['Calentamiento: giros'] }, 2),
    cal({ tt: 'Paneles en la acera', m: ['>.o.o.G'], c: ['avanzar', 'girar-d', 'girar-i', 'recoger'],
      ref: [A, A, R, A, A, R, A, A], holgura: 2, h: 'obj',
      o: 'Recoge los dos paneles solares y llega a la meta.', i: 'Hay paneles solares por recoger.',
      cur: ['m3_41', 'm3_42'], ext: ['Calentamiento: recoger objetos'] }, 3),
    cal({ tt: 'Repite el paso', m: ['>......G'], c: ['avanzar', 'girar-d', 'girar-i', 'repetir'],
      ref: [rep(7, A)], lim: { repetir: 1 }, holgura: 1, usa: 'repetir', h: 'bucle',
      o: 'Usa Repetir en lugar de muchas tarjetas.', i: 'Una calle recta y muy larga.',
      cur: ['m3_41', 'm3_42'], ext: ['Calentamiento: un bucle sencillo'] }, 4),
    cal({ tt: 'Calle con vueltas', m: ['>...', '###.', 'G...'], c: ['avanzar', 'girar-d', 'girar-i', 'repetir'],
      ref: [rep(3, A), G, rep(2, A), G, rep(3, A)], lim: { repetir: 3 }, holgura: 1, usa: 'repetir', h: 'bucle',
      o: 'Tres tramos: usa Repetir en cada uno.', i: 'La calle hace una S.',
      cur: ['m3_41', 'm3_42'], ext: ['Calentamiento: varios bucles seguidos'] }, 5),

    // ---- Bloque 1. Bucles anidados ----
    m3({ tt: 'La escalera larga', b: 1, m: ESCALERA, c: ['avanzar', 'girar-d', 'girar-i', 'repetir'],
      ref: [rep(3, rep(3, A), G, A, I)], lim: { repetir: 2 }, holgura: 1, usa: 'repetir', h: 'bucle',
      p: ['Cada escalón es igual: tres pasos, giro, un paso, giro.', 'Ahora los tres pasos también se repiten: un bucle dentro de otro.', 'Repite tres veces: [Repetir 3 veces Avanzar], girar, avanzar, girar.'],
      o: 'Un bucle dentro de otro bucle.', i: 'Bit, el robot de la ciudad, ha construido una escalera con escalones largos.',
      cur: ['m3_41', 'm3_42', 'saber23'], ext: ['Bucles anidados: un bucle dentro de otro'] }, 1),
    m3({ tt: 'Filas de paneles', b: 1, m: ['>oo', '.oo', 'G..'], c: ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'recoger', 'repetir'],
      ref: [rep(2, rep(2, A, R), rep(2, B), G, A, I)], lim: { repetir: 3 }, holgura: 2, usa: 'repetir', h: 'bucle',
      p: ['Cada fila se recorre igual: ir recogiendo y volver.', 'Ir y recoger se repite dos veces; volver, también.', 'Mete eso dentro de otro bucle que baje una fila.'],
      o: 'Recoge cada fila y vuelve. Dos bucles dentro de uno.', i: 'Los paneles solares están en filas. Hay que recogerlos todos.',
      cur: ['m3_41', 'm3_42'], ext: ['Descomponer: una fila se repite para cada fila'] }, 2),
    m3({ tt: 'La plaza grande', b: 1, m: PLAZA, c: ['avanzar', 'girar-d', 'girar-i', 'repetir'],
      ref: [rep(3, rep(4, A), G)], lim: { repetir: 2 }, holgura: 1, usa: 'repetir', h: 'bucle',
      o: 'Tres lados iguales. Cada lado, cuatro pasos.', i: 'La plaza central es un cuadrado enorme.',
      cur: ['m3_41', 'm3_42'], ext: ['Bucle anidado: lados y pasos'] }, 3),
    m3({ tt: 'La cuenta falla', b: 1, m: PLAZA, c: ['avanzar', 'girar-d', 'girar-i', 'repetir'],
      ref: [rep(3, rep(4, A), G)], ini: [rep(3, rep(3, A), G)], lim: { repetir: 2 }, holgura: 1, h: 'depurar',
      p: ['Ejecuta y fíjate dónde se queda Lumo.', 'Los lados miden cuatro pasos, no tres.', 'Cambia el número del bucle interior.'],
      o: 'El bucle de dentro cuenta mal. Corrígelo.', i: 'Bit se ha equivocado al contar.',
      cur: ['m3_41', 'm3_42'], ext: ['Depurar un bucle anidado'] }, 4),
    m3({ tt: 'La fábrica larga', b: 1, m: FILAS3, c: ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'recoger', 'repetir'], tipo: 'optimizar',
      ref: [rep(3, rep(2, A, R), rep(2, B), G, A, I)],
      ini: [rep(2, A, R), rep(2, B), G, A, I, rep(2, A, R), rep(2, B), G, A, I, rep(2, A, R), rep(2, B), G, A],
      lim: { repetir: 3 }, holgura: 2, usa: 'repetir', h: 'optim',
      o: 'Funciona, pero se repite tres veces lo mismo. Acórtalo.', i: 'Bit: «Si lo repites, ponlo en un bucle».',
      cur: ['m3_41', 'm3_42'], ext: ['Optimizar: detectar una secuencia que se repite y automatizarla'] }, 5),

    // ---- Bloque 2. Condiciones y sensores ----
    m3({ tt: 'Hasta el muro', b: 2, m: ['>.......G'], c: ['avanzar', 'mientras'], con: ['obstaculo-delante'],
      ref: [mientras(no(OB), [A])], lim: { mientras: 1 }, holgura: 1, h: 'cond',
      o: 'Avanza mientras no haya un muro delante.', i: 'Bit: «Observa, decide, actúa».',
      p: ['No hace falta contar los pasos.', 'Mientras no haya un muro delante, Lumo avanza.', 'Elige Mientras, pon la condición «no hay obstáculo» y dentro Avanzar.'],
      cur: ['m3_41', 'm3_42'], ext: ['Bucle «mientras» con un sensor: se repite hasta que algo ocurre'] }, 6),
    m3({ tt: 'Camino con curvas', b: 2, m: CURVAS, c: ['avanzar', 'girar-d', 'mientras', 'si'], con: ['obstaculo-delante', 'meta-aqui'],
      ref: [mientras(no(MA), si(OB, [G], [A]))], lim: { mientras: 1, si: 1 }, holgura: 1, usa: 'si', h: 'cond',
      p: ['Todas las curvas son a la derecha y siempre acaban en un muro.', 'Si hay un muro delante, gira; si no, avanza.', 'Mientras no estés en la meta: Si obstáculo, girar; si no, avanzar.'],
      o: 'Si hay muro, gira; si no, avanza. Hasta llegar a la meta.', i: 'La ciudad tiene un laberinto de calles.',
      cur: ['m3_41', 'm3_42'], ext: ['Condicional si / si no dentro de un bucle'] }, 7),
    m3({ tt: 'Recoge o avanza', b: 2, m: ['>.o..oo.o.G'], c: ['avanzar', 'recoger', 'repetir', 'si'], con: ['objeto-aqui'],
      ref: [rep(30, si(OA, [R], [A]))], lim: { repetir: 1, si: 1 }, holgura: 1, usa: 'si', h: 'cond',
      p: ['Hay luces en sitios distintos y no hace falta contarlos.', 'Si hay una luz aquí, recógela; si no, avanza.', 'Dentro de un bucle largo: Si objeto aquí, recoger; si no, avanzar.'],
      o: 'Si hay una luz, recógela. Si no, avanza.', i: 'Hay baterías esparcidas por la calle.',
      cur: ['m3_41', 'm3_42'], ext: ['Un algoritmo que funciona sin saber dónde están los objetos'] }, 8),
    m3({ tt: 'Interruptor automático', b: 2, m: ['>..s..d..G'], c: ['avanzar', 'activar', 'repetir', 'si'], con: ['interruptor-aqui'],
      ref: [rep(12, si(IN, [X, A], [A]))], lim: { repetir: 1, si: 1 }, holgura: 1, usa: 'si', h: 'cond',
      o: 'Activa el interruptor si estás encima. Si no, avanza.', i: 'La puerta del taller se abre con un interruptor.',
      cur: ['m3_41', 'm3_42'], ext: ['Sensor de interruptor'] }, 9),
    m3({ tt: 'Lava o muro', b: 2, m: ['>.~..', '####.', 'G.~..'], c: ['avanzar', 'girar-d', 'saltar', 'repetir', 'si'], con: ['agua-delante', 'obstaculo-delante'],
      ref: [rep(20, si(AG, [S], [si(OB, [G], [A])]))], lim: { repetir: 1, si: 2 }, holgura: 1, usa: 'si', h: 'cond',
      p: ['Hay dos cosas que mirar: agua y muro.', 'Primero pregunta por el agua; si no hay, pregunta por el muro.', 'Si agua: saltar; si no: (si muro: girar; si no: avanzar).'],
      o: 'Si hay vacío, salta; si hay muro, gira; si no, avanza.', i: 'Unos huecos de energía cortan las calles.',
      cur: ['m3_41', 'm3_42'], ext: ['Condicionales combinados (una condición dentro de otra)'] }, 10),

    // ---- Bloque 3. Funciones (recetas) ----
    m3({ tt: 'Receta de fila', b: 3, m: ['>ooo', '.ooo', '.ooo', 'G...'], c: ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'recoger', 'repetir', 'receta'], rec: ['A'],
      ref: P([rep(3, rec('A'), rep(3, B), G, A, I)], { A: [rep(3, A, R)] }), lim: { repetir: 3 }, holgura: 3, usa: 'receta', h: 'receta',
      o: 'Guarda «recoger una fila» en la Receta A.', i: 'Bit: «Una función se escribe una vez».',
      cur: ['m3_41', 'm3_42'], ext: ['Función (receta) que contiene un bucle'] }, 11),
    m3({ tt: 'La serpiente', b: 3, m: ['>ooo', 'ooo.', 'G...'], c: ARCA, rec: ['A'],
      ref: P([rec('A'), G, A, G, rec('A'), I, A], { A: [rep(3, A, R)] }), lim: { repetir: 1 }, holgura: 2, usa: 'receta', h: 'receta',
      o: 'Dos filas iguales, una en cada sentido.', i: 'Los cables forman una serpiente.',
      cur: ['m3_41', 'm3_42'], ext: ['Reutilizar una receta en dos sitios distintos'] }, 12),
    m3({ tt: 'La gran serpiente', b: 3, m: ['>ooo', 'ooo.', '.ooo', 'Goo.'], c: ARCA, rec: ['A'],
      ref: P([rep(2, rec('A'), G, A, G, rec('A'), I, A, I)], { A: [rep(3, A, R)] }), lim: { repetir: 2 }, holgura: 2, usa: 'receta', h: 'receta',
      o: 'Cuatro filas: receta y bucle trabajando juntos.', i: 'La serpiente de cables se ha enrollado.',
      cur: ['m3_41', 'm3_42'], ext: ['Receta dentro de un bucle anidado'] }, 13),

    // ---- Bloque 4. Optimización con límites (mundo espacial) ----
    m3({ tt: 'Pocas tarjetas', b: 4, m: ['>.....', '#####.', '#####.', '#####.', '#####.', 'G.....'], c: ['avanzar', 'girar-d', 'repetir'],
      ref: [rep(3, rep(5, A), G)], lim: { avanzar: 1, 'girar-d': 1, repetir: 2 }, holgura: 0, usa: 'repetir', h: 'optim',
      o: 'Solo puedes usar una tarjeta Avanzar. ¡Piensa!', i: 'La nave tiene poca memoria: solo caben unas pocas tarjetas.',
      cur: ['m3_41', 'm3_42'], ext: ['Retos con límite de instrucciones'] }, 14),
    m3({ tt: 'La torre escalonada', b: 4, m: ['>..######', '##...####', '####...##', '######...', '########G'], c: ['avanzar', 'girar-d', 'girar-i', 'repetir'],
      ref: [rep(4, rep(2, A), G, A, I)], lim: { avanzar: 2, 'girar-d': 1, 'girar-i': 1, repetir: 2 }, holgura: 0, h: 'optim',
      o: 'Cuatro escalones. Memoria limitada.', i: 'La torre de la estación espacial tiene escalones de dos pasos.',
      cur: ['m3_41', 'm3_42'], ext: ['Optimizar bajo restricciones'] }, 15),
    m3({ tt: 'Espiral de sensores', b: 4, m: ESPIRAL, c: ['avanzar', 'girar-d', 'recoger', 'mientras', 'si'], con: ['obstaculo-delante', 'meta-aqui'],
      ref: [mientras(no(MA), [si(OB, [G], [A]), R])], lim: { mientras: 1, si: 1 }, holgura: 1, h: 'cond',
      p: ['Es una espiral hacia el centro y siempre se gira a la derecha.', 'Un único bucle puede decidir y recoger en cada paso.', 'Mientras no estés en la meta: Si obstáculo, girar; si no, avanzar. Después, Recoger.'],
      o: 'Una espiral con cuatro luces y un solo bucle.', i: 'Los anillos de la estación giran en espiral.',
      cur: ['m3_41', 'm3_42'], ext: ['Sensores y objetivos en un solo algoritmo'] }, 16),

    // ---- Bloque 5. Depuración avanzada ----
    m3({ tt: 'El sensor equivocado', b: 5, m: CURVAS, c: ['avanzar', 'girar-d', 'mientras', 'si'], con: ['obstaculo-delante', 'agua-delante', 'meta-aqui'],
      ref: [mientras(no(MA), si(OB, [G], [A]))], ini: [mientras(no(MA), si(AG, [G], [A]))], lim: { mientras: 1, si: 1 }, holgura: 1, h: 'depurar',
      p: ['Ejecuta: Lumo choca contra el muro.', 'La condición pregunta por el agua, pero aquí no hay agua.', 'Cambia la condición «agua delante» por «obstáculo delante».'],
      o: 'El programa pregunta por lo que no debe. Cambia la condición.', i: 'Bit tiene el sensor mal conectado.',
      cur: ['m3_41', 'm3_42'], ext: ['Depurar una condición incorrecta'] }, 17),
    m3({ tt: 'La receta que olvida', b: 5, m: ['>ooo', 'ooo.', 'G...'], c: ARCA, rec: ['A'],
      ref: P([rec('A'), G, A, G, rec('A'), I, A], { A: [rep(3, A, R)] }),
      ini: P([rec('A'), G, A, G, rec('A'), I, A], { A: [rep(3, R, A)] }), lim: { repetir: 1 }, holgura: 2, h: 'depurar',
      p: ['Lumo llega a la meta, pero se deja luces.', 'Dentro de la receta, Recoger y Avanzar están en el orden equivocado.', 'Primero avanza hasta la luz; después recoge.'],
      o: 'Lumo llega, pero se olvida luces. Revisa la receta.', i: 'Un fallo escondido en una receta afecta a todo.',
      cur: ['m3_41', 'm3_42'], ext: ['Depurar una función: el orden dentro del bucle'] }, 18),
    m3({ tt: 'Ramas cambiadas', b: 5, m: CURVAS, c: ['avanzar', 'girar-d', 'mientras', 'si'], con: ['obstaculo-delante', 'meta-aqui'],
      ref: [mientras(no(MA), si(OB, [G], [A]))], ini: [mientras(no(MA), si(OB, [A], [G]))], lim: { mientras: 1, si: 1 }, holgura: 1, h: 'depurar',
      p: ['Ejecuta: Lumo gira donde debería avanzar.', 'Las dos ramas del «si» están al revés.', 'Si hay muro: girar. Si no: avanzar.'],
      o: 'Lo que hace «si» y «si no» está al revés.', i: 'Bit ha cruzado dos cables.',
      cur: ['m3_41', 'm3_42'], ext: ['Depurar: ramas de un condicional intercambiadas'] }, 19),
    m3({ tt: 'Falta el «si no»', b: 5, m: CURVAS, c: ['avanzar', 'girar-d', 'mientras', 'si'], con: ['obstaculo-delante', 'meta-aqui'],
      ref: [mientras(no(MA), si(OB, [G], [A]))], ini: [mientras(no(MA), si(OB, [G]))], lim: { mientras: 1, si: 1 }, holgura: 1, h: 'depurar',
      p: ['Lumo se queda parado dando vueltas.', 'Cuando no hay muro, el programa no hace nada.', 'Rellena la parte «si no» con Avanzar.'],
      o: 'Cuando no hay muro, Lumo no hace nada. ¿Qué falta?', i: 'Bit se ha quedado esperando.',
      cur: ['m3_41', 'm3_42'], ext: ['Depurar un bucle que no avanza: falta una rama'] }, 20),
    m3({ tt: 'Anidados desordenados', b: 5, m: ESCALERA, c: ['avanzar', 'girar-d', 'girar-i', 'repetir'],
      ref: [rep(3, rep(3, A), G, A, I)], ini: [rep(3, rep(3, A), A, G, I)], lim: { repetir: 2 }, holgura: 1, h: 'depurar',
      p: ['Lumo choca en el primer escalón.', 'Después de los tres pasos hay que girar antes de dar el paso corto.', 'Cambia de sitio Avanzar y Girar derecha.'],
      o: 'El orden dentro del bucle grande no es el correcto.', i: 'La escalera tiene un escalón torcido.',
      cur: ['m3_41', 'm3_42'], ext: ['Depurar el orden dentro de un bucle anidado'] }, 21),

    // ---- Bloque 6. Grandes desafíos ----
    m3({ tt: 'Ciudad de cristal', b: 6, m: ['>.~.o', '####.', 'G.~.o'],
      c: ['avanzar', 'girar-d', 'saltar', 'recoger', 'repetir', 'si'], con: ['agua-delante', 'obstaculo-delante'],
      ref: [rep(25, si(AG, [S], [si(OB, [G], [A])]), R)], lim: { repetir: 1, si: 2 }, holgura: 2, usa: 'si', h: 'cond',
      o: 'Observa, decide y recoge, todo en un bucle.', i: 'La ciudad de cristal brilla con baterías en las esquinas.',
      cur: ['m3_41', 'm3_42'], ext: ['Un algoritmo general para un entorno con huecos, muros y objetos'] }, 22),
    m3({ tt: 'El interruptor tras el vacío', b: 6, m: ['>.~..s.d..G'], c: ['avanzar', 'saltar', 'activar', 'repetir', 'si'], con: ['agua-delante', 'interruptor-aqui'],
      ref: [rep(30, si(AG, [S], [si(IN, [X, A], [A])]))], lim: { repetir: 1, si: 2 }, holgura: 2, usa: 'si', h: 'cond',
      o: 'Un vacío, un interruptor y una puerta. Una sola solución general.', i: 'Para activar el reactor hay que cruzar el vacío.',
      cur: ['m3_41', 'm3_42'], ext: ['Combinar sensores distintos'] }, 23),
    m3({ tt: 'Espiral con puerta', b: 6, m: ['>.s..', '####d', '..G#o', 'o###.', '..o..'], c: ['avanzar', 'girar-d', 'recoger', 'activar', 'repetir', 'si'], con: ['obstaculo-delante', 'interruptor-aqui'],
      ref: [rep(30, si(OB, [G], [A]), R, si(IN, [X]))], lim: { repetir: 1, si: 2 }, holgura: 2, usa: 'si', h: 'cond',
      p: ['Es la espiral de antes, pero ahora hay un interruptor y una puerta.', 'Un bucle puede avanzar, recoger y activar «si hay interruptor aquí».', 'Dentro del bucle: Si obstáculo girar / si no avanzar; Recoger; Si interruptor aquí: Activar.'],
      o: 'La espiral tiene ahora un interruptor y una puerta.', i: 'Los anillos del reactor están sellados.',
      cur: ['m3_41', 'm3_42'], ext: ['Algoritmo general con varios sensores'] }, 24),
    m3({ tt: 'El Faro de Bit', b: 6, m: ['>.~.s..', '######d', 'Go.~o..'], c: ['avanzar', 'girar-d', 'saltar', 'recoger', 'activar', 'repetir', 'si'], con: ['agua-delante', 'obstaculo-delante', 'interruptor-aqui'],
      ref: [rep(40, si(AG, [S], [si(OB, [G], [A])]), R, si(IN, [X]))], lim: { repetir: 1, si: 3 }, holgura: 2, usa: 'si', h: 'cond',
      p: ['Hay vacío, muros, luces, un interruptor y una puerta.', 'Un único bucle que mire el entorno puede con todo.', 'Dentro del bucle: Si vacío, saltar; si no, (si muro, girar; si no, avanzar). Recoger. Si interruptor, activar.'],
      o: 'El último reto del mundo: un algoritmo que lo hace todo.', i: 'Bit: «El faro me enseñó a pensar. Ahora te toca a ti».',
      cur: ['m3_41', 'm3_42', 'saber23'], ext: ['Gran desafío del 3.er ciclo: generalizar un algoritmo para varios obstáculos'] }, 25)
  ];
});
