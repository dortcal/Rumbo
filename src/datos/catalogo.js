/*
 * RUMBO — Catálogo: ordena los niveles, define los mundos y las reglas de desbloqueo.
 * Todo son datos y funciones puras; no toca el DOM.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./niveles-infantil.js'), require('./niveles-m1.js'), require('./niveles-m2.js'),
      require('./niveles-m3.js'), require('./niveles-final.js'), require('./voces-es.js'), require('./dsl.js'));
    module.exports = api;
  } else {
    root.RumboCatalogo = factory(root.RumboNivelesInfantil, root.RumboNivelesM1, root.RumboNivelesM2,
      root.RumboNivelesM3, root.RumboNivelesFinal, root.RumboVoces, root.RumboDSL);
  }
})(typeof self !== 'undefined' ? self : this, function (INF, M1, M2, M3, FIN, VOCES, DSL) {
  'use strict';

  var MUNDOS = [
    { id: 0, clave: 'm0', nombre: 'Pequeños exploradores', etapa: 'infantil', edades: '3-5 años', color: '#7ad36b', zonas: ['jardin', 'granja', 'playa'], niveles: INF,
      descripcion: 'Jardín, granja y playa. Sin leer: voz, imágenes y mucha calma.' },
    { id: 1, clave: 'm1', nombre: 'Primeros programadores', etapa: 'primaria-1c', edades: '1.º y 2.º', color: '#3fae6a', zonas: ['bosque', 'montanas'], niveles: M1,
      descripcion: 'Bosque encantado y Reino de las montañas.' },
    { id: 2, clave: 'm2', nombre: 'Maestros del código', etapa: 'primaria-2c', edades: '3.º y 4.º', color: '#2f8fd6', zonas: ['mar', 'volcan'], niveles: M2,
      descripcion: 'Mundo submarino e Isla volcánica.' },
    { id: 3, clave: 'm3', nombre: 'Expertos en algoritmos', etapa: 'primaria-3c', edades: '5.º y 6.º', color: '#8a5cd6', zonas: ['ciudad', 'espacio'], niveles: M3,
      descripcion: 'Ciudad tecnológica y Mundo espacial.' },
    { id: 4, clave: 'f', nombre: 'El Faro Mayor', etapa: 'primaria-3c', edades: 'Final', color: '#f2a93b', zonas: ['faro'], niveles: FIN.finales,
      descripcion: 'La luz de Lumo.' }
  ];

  var SECRETOS = FIN.secretos;
  var TODOS = [];
  MUNDOS.forEach(function (m) { m.niveles.forEach(function (n) { n.mundo = m.id; TODOS.push(n); }); });
  SECRETOS.forEach(function (n) { n.mundo = 'sec'; TODOS.push(n); });

  var POR_ID = {};
  TODOS.forEach(function (n) { POR_ID[n.id] = n; });

  var SEC_INFANTIL = INF.map(function (n) { return n.id; });
  var SEC_PRIMARIA = [];
  [1, 2, 3, 4].forEach(function (m) { MUNDOS[m].niveles.forEach(function (n) { SEC_PRIMARIA.push(n.id); }); });

  var ITINERARIOS = { 3: [], 4: [], 5: [] };
  INF.forEach(function (n) { ITINERARIOS[n.itinerario].push(n.id); });

  var CURSOS = [
    { id: 'inf3', nombre: '3 años', mundos: [0], itinerarios: [3] },
    { id: 'inf4', nombre: '4 años', mundos: [0], itinerarios: [3, 4] },
    { id: 'inf5', nombre: '5 años', mundos: [0], itinerarios: [3, 4, 5] },
    { id: 'p1', nombre: '1.º', mundos: [1] }, { id: 'p2', nombre: '2.º', mundos: [1] },
    { id: 'p3', nombre: '3.º', mundos: [1, 2] }, { id: 'p4', nombre: '4.º', mundos: [1, 2] },
    { id: 'p5', nombre: '5.º', mundos: [1, 2, 3] }, { id: 'p6', nombre: '6.º', mundos: [1, 2, 3] }
  ];

  // Estrellas necesarias para abrir cada secreto (las del mundo correspondiente; el 4.º, las del Faro).
  var REQUISITO_SECRETO = [
    { mundo: 1, estrellas: 50 }, { mundo: 2, estrellas: 50 }, { mundo: 3, estrellas: 50 }, { mundo: 4, estrellas: 8 }
  ];

  // Último reto de la aventura de cada curso: al superarlo, el alumnado ve el final de la historia a su nivel.
  var FINAL_CURSO = {
    inf3: ITINERARIOS[3][ITINERARIOS[3].length - 1], inf4: ITINERARIOS[4][ITINERARIOS[4].length - 1], inf5: ITINERARIOS[5][ITINERARIOS[5].length - 1],
    p1: 'm1-25', p2: 'm1-25', p3: 'm2-25', p4: 'm2-25', p5: 'f-03', p6: 'f-03'
  };
  function finalDe(cursoId) { return FINAL_CURSO[cursoId] || 'f-03'; }

  function cursoDe(id) {
    for (var i = 0; i < CURSOS.length; i++) if (CURSOS[i].id === id) return CURSOS[i];
    return null;
  }

  function mundoDe(nivel) {
    return typeof nivel === 'string' ? MUNDOS[POR_ID[nivel] ? POR_ID[nivel].mundo : -1] : MUNDOS[nivel.mundo];
  }

  // Posición del nivel dentro de su mundo (0..n-1)
  function posicion(id) {
    var n = POR_ID[id];
    if (!n || n.mundo === 'sec') return -1;
    return MUNDOS[n.mundo].niveles.indexOf(n);
  }

  function siguiente(id) {
    var n = POR_ID[id];
    if (!n) return null;
    if (n.mundo === 0) {
      var i = SEC_INFANTIL.indexOf(id);
      return i >= 0 && i < SEC_INFANTIL.length - 1 ? SEC_INFANTIL[i + 1] : null;
    }
    if (n.mundo === 'sec') return null;
    var j = SEC_PRIMARIA.indexOf(id);
    return j >= 0 && j < SEC_PRIMARIA.length - 1 ? SEC_PRIMARIA[j + 1] : null;
  }

  // Tarjetas que aparecen por primera vez en este nivel (según el orden del currículo).
  var PRIMERA_VEZ = {};
  (function () {
    var vistas = {};
    SEC_INFANTIL.concat(SEC_PRIMARIA).forEach(function (id, idx) {
      if (id === SEC_PRIMARIA[0]) vistas = {};   // Primaria empieza de nuevo: se retoman las tarjetas
      var nuevas = [];
      POR_ID[id].cartas.disponibles.forEach(function (c) { if (!vistas[c]) { vistas[c] = true; nuevas.push(c); } });
      PRIMERA_VEZ[id] = nuevas;
    });
  })();

  function cartasNuevas(id) { return PRIMERA_VEZ[id] || []; }

  // Añade al archivo único de voces la consigna de cada nivel.
  function registrarVoces() {
    TODOS.forEach(function (n) {
      if (n.objetivo) VOCES.lineas['n_' + n.id] = { quien: 'Lumo', texto: n.objetivo };
      if (n.intro) VOCES.lineas['i_' + n.id] = { quien: 'Lumo', texto: n.intro };
      (n.pistas || []).forEach(function (p, k) { VOCES.lineas['h' + (k + 1) + '_' + n.id] = { quien: 'Lumo', texto: p }; });
    });
    return VOCES;
  }

  function total(mundo) { return MUNDOS[mundo].niveles.length; }

  return {
    MUNDOS: MUNDOS, TODOS: TODOS, SECRETOS: SECRETOS, POR_ID: POR_ID,
    SEC_INFANTIL: SEC_INFANTIL, SEC_PRIMARIA: SEC_PRIMARIA, ITINERARIOS: ITINERARIOS,
    CURSOS: CURSOS, REQUISITO_SECRETO: REQUISITO_SECRETO,
    cursoDe: cursoDe, finalDe: finalDe, FINAL_CURSO: FINAL_CURSO, mundoDe: mundoDe, posicion: posicion, siguiente: siguiente,
    cartasNuevas: cartasNuevas, registrarVoces: registrarVoces, total: total, DSL: DSL
  };
});
