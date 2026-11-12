/*
 * RUMBO — El Faro (campaña final, 3 retos) y los 4 niveles secretos.
 * Los secretos se desbloquean con estrellas (ver catalogo.js) y nunca bloquean la historia.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./dsl.js'));
    module.exports = api;
  } else {
    root.RumboNivelesFinal = factory(root.RumboDSL);
  }
})(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';
  var A = D.A, B = D.B, G = D.D, I = D.I, S = D.S, R = D.R, X = D.X;
  var rep = D.rep, si = D.si, mientras = D.mientras, rec = D.rec, no = D.no, P = D.P;
  var OB = D.OB, AG = D.AG, IN = D.IN, MA = D.MA;

  var CORE = ['avanzar', 'girar-d', 'saltar', 'recoger', 'mientras', 'si'];
  var CUERPO = function (extra) { return [si(AG, [S], [si(OB, [G], [A])]), R].concat(extra || []); };
  var ARCA = ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'recoger', 'activar', 'repetir', 'receta'];

  function f(def, n) {
    def.e = 'primaria-3c';
    def.z = 'faro';
    def.id = 'f-0' + n;
    def.b = 11;
    return D.nivel(def);
  }
  function sec(def, n, etapa, zona) {
    def.e = etapa;
    def.z = zona;
    def.id = 'sec-' + n;
    def.b = 12;
    def.secreto = n;
    return D.nivel(def);
  }

  var finales = [
    f({ tt: 'La linterna rota', c: CORE, con: ['agua-delante', 'obstaculo-delante', 'meta-aqui'],
      m: ['>..~.o.', '######.', '...G##o', 'o#####.', '...~...'],
      ref: [mientras(no(MA), CUERPO())], lim: { mientras: 1, si: 2 }, holgura: 1, h: 'cond',
      p: ['Es una espiral con vacíos y luces.', 'Un solo bucle: si vacío saltar; si no, si muro girar; si no avanzar. Y recoger.', 'Mientras no estés en la meta, repite esa decisión y recoge siempre.'],
      o: 'Sube al Faro: una espiral con vacíos y luces.', i: 'Lumo y sus amigos llegan al Faro Mayor. Hay que subir por dentro.',
      cur: ['m3_41', 'm3_42', 'saber23'], ext: ['Final: un algoritmo general para recorrer cualquier espiral'] }, 1),
    f({ tt: 'El mecanismo del Faro', c: ARCA, rec: ['A'],
      m: ['>oos', 'oood', '.ooo', 'Goo.'],
      ref: P([rep(2, rec('A'), G, A, G, rec('A'), I, A, I)], { A: [rep(3, A, R), X] }), lim: { repetir: 2, receta: 3 }, holgura: 2, usa: 'receta', h: 'receta',
      o: 'Cuatro filas, un interruptor y una puerta. Receta y bucles.', i: 'Las lentes del Faro giran con un gran mecanismo. ¡Hay que ponerlo en marcha!',
      cur: ['m3_41', 'm3_42'], ext: ['Final: recetas con varias acciones y bucles anidados'] }, 2),
    f({ tt: 'La luz de Lumo', c: ['avanzar', 'girar-d', 'saltar', 'recoger', 'activar', 'mientras', 'si'], con: ['agua-delante', 'obstaculo-delante', 'interruptor-aqui', 'meta-aqui'],
      m: ['>s.~.o.', '######d', '...G##o', 'o#####.', '...~...'],
      ref: [mientras(no(MA), CUERPO([si(IN, [X])]))], lim: { mientras: 1, si: 3 }, holgura: 2, h: 'cond',
      p: ['Es la espiral del primer piso, pero con interruptor y puerta.', 'Añade al bucle: si hay un interruptor aquí, activar.', 'Mientras no estés en la meta: decidir, recoger y, si interruptor, activar.'],
      o: 'El último reto: enciende la luz del Faro.', i: 'Lumo está a punto de encender la luz. Todos sus amigos esperan.',
      cur: ['m3_41', 'm3_42', 'saber23'], ext: ['Final: un algoritmo que resume todo lo aprendido'] }, 3)
  ];

  var secretos = [
    sec({ tt: 'El claro secreto', c: ['avanzar', 'recoger', 'repetir'],
      m: ['>o.o.o.o.G'], ref: [rep(4, A, R, A), A], lim: { repetir: 1 }, holgura: 1, usa: 'repetir', h: 'bucle',
      o: 'Un patrón de tres tarjetas se repite cuatro veces.', i: 'Las luciérnagas guardan un claro secreto. Sus luces forman un dibujo.',
      cur: ['m1_41', 'm1_42'], ext: ['Secreto: patrón de tres acciones'] }, 1, 'primaria-1c', 'bosque'),
    sec({ tt: 'La caverna secreta', c: ['avanzar', 'recoger', 'saltar', 'repetir'],
      m: ['>o.~o.~o.~G'], ref: [A, R, A, rep(2, S, R, A), S], lim: { repetir: 1 }, holgura: 2, usa: 'repetir', h: 'bucle',
      o: 'Salta, recoge y avanza. ¿Qué parte se repite?', i: 'Tinta esconde una caverna bajo el mar. Solo los más curiosos la encuentran.',
      cur: ['m2_41', 'm2_42'], ext: ['Secreto: buscar el patrón dentro de una secuencia irregular'] }, 2, 'primaria-2c', 'mar'),
    sec({ tt: 'Memoria mínima', c: ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'recoger', 'repetir'],
      m: ['>oo', '.oo', '.oo', 'G..'], ref: [rep(3, rep(2, A, R), rep(2, B), G, A, I)],
      lim: { avanzar: 2, retroceder: 1, recoger: 1, 'girar-d': 1, 'girar-i': 1, repetir: 3 }, holgura: 0, h: 'optim',
      o: 'La misma fábrica, con muy poca memoria.', i: 'Una galaxia secreta con muy poca memoria. Bit la recomienda para pensar mucho.',
      cur: ['m3_41', 'm3_42'], ext: ['Secreto: optimizar con límites estrictos'] }, 3, 'primaria-3c', 'espacio'),
    sec({ tt: 'El mecanismo oculto', c: ARCA, rec: ['A'],
      m: ['>oos', 'oood', '.ooo', 'Goo.'],
      ref: P([rep(2, rec('A'), G, A, G, rec('A'), I, A, I)], { A: [rep(3, A, R), X] }), lim: { repetir: 2, receta: 3, activar: 1 }, holgura: 0, usa: 'receta', h: 'receta',
      o: 'Un mecanismo escondido. ¡Solo un Activar!', i: 'Detrás del Faro hay una sala olvidada. Un mecanismo guarda un guiño de luz.',
      cur: ['m3_41', 'm3_42'], ext: ['Secreto: una sola instrucción Activar'] }, 4, 'primaria-3c', 'faro')
  ];

  return { finales: finales, secretos: secretos };
});
