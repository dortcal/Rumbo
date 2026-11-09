/*
 * RUMBO — Retos creados en el Laboratorio: formato, validación, código para compartir.
 * Módulo puro (sin DOM): se prueba en Node. Usa el MISMO intérprete que los niveles del juego.
 *
 * Un reto es { id, nombre, autor, ciclo, zona, mapa, inicio, referencia, creado }.
 *   - mapa: lista de cadenas con . # ~ b G o s d   (una sola meta; la salida de Lumo va en `inicio`)
 *   - referencia: el programa con el que su autor comprobó que el reto se puede resolver.
 *   - ciclo: 'inf' | 'c1' | 'c2' | 'c3' (decide las tarjetas disponibles, igual que en los mundos).
 * Un reto sin solución comprobada NO se puede guardar ni importar.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) { api = factory(require('../engine/interprete.js')); module.exports = api; } else { root.RumboRetos = factory(root.RumboInterprete); }
})(typeof self !== 'undefined' ? self : this, function (I) {
  'use strict';

  var CONDS = ['obstaculo-delante', 'agua-delante', 'objeto-aqui', 'interruptor-aqui', 'meta-aqui'];
  var CICLOS = {
    inf: { nombre: 'Infantil', etapa: 'infantil', cartas: ['avanzar', 'girar-d', 'girar-i', 'saltar', 'recoger'], herramientas: ['inicio', 'meta', 'pared', 'agua', 'objeto', 'borrar'], tam: [3, 5], zonas: ['jardin', 'granja', 'playa'] },
    c1: { nombre: 'Primer ciclo', etapa: 'primaria-1c', cartas: ['avanzar', 'retroceder', 'girar-i', 'girar-d', 'saltar', 'recoger', 'activar', 'esperar', 'repetir'], herramientas: ['inicio', 'meta', 'pared', 'agua', 'barrera', 'objeto', 'interruptor', 'puerta', 'borrar'], tam: [3, 7], zonas: ['bosque', 'montanas'] },
    c2: { nombre: 'Segundo ciclo', etapa: 'primaria-2c', cartas: ['avanzar', 'retroceder', 'girar-i', 'girar-d', 'saltar', 'recoger', 'activar', 'esperar', 'repetir', 'si', 'receta'], herramientas: ['inicio', 'meta', 'pared', 'agua', 'barrera', 'objeto', 'interruptor', 'puerta', 'borrar'], tam: [3, 8], zonas: ['mar', 'volcan'], recetas: ['A'], condiciones: CONDS },
    c3: { nombre: 'Tercer ciclo', etapa: 'primaria-3c', cartas: ['avanzar', 'retroceder', 'girar-i', 'girar-d', 'saltar', 'recoger', 'activar', 'esperar', 'repetir', 'si', 'mientras', 'receta'], herramientas: ['inicio', 'meta', 'pared', 'agua', 'barrera', 'objeto', 'interruptor', 'puerta', 'borrar'], tam: [3, 9], zonas: ['ciudad', 'espacio', 'faro'], recetas: ['A', 'B'], condiciones: CONDS }
  };
  var ZONAS = ['jardin', 'granja', 'playa', 'bosque', 'montanas', 'mar', 'volcan', 'ciudad', 'espacio', 'faro'];
  var CELDAS = '.#~bGosd';
  var DIRS = ['N', 'E', 'S', 'O'];

  function cicloDe(curso) {
    if (!curso) return 'c1';
    if (String(curso).indexOf('inf') === 0) return 'inf';
    return { p1: 'c1', p2: 'c1', p3: 'c2', p4: 'c2', p5: 'c3', p6: 'c3' }[curso] || 'c1';
  }

  function limpiarTexto(t, max) {
    return String(t == null ? '' : t).replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function nodos(prog) { return I.contarTarjetas(prog); }
  function cartasUsadas(prog) {
    var u = {}; I.recorrer(prog, function (n) { u[n.t] = true; }); return Object.keys(u);
  }

  function retoANivel(reto) {
    var c = CICLOS[reto.ciclo];
    var n = nodos(reto.referencia);
    var nivel = {
      id: 'lab-' + reto.id, etapa: c.etapa, titulo: reto.nombre, zona: reto.zona, tipo: 'normal',
      objetivo: reto.mapa.join('').indexOf('o') >= 0 ? 'Recoge todo y llega a la meta.' : 'Lleva a Lumo hasta la meta.',
      mapa: reto.mapa, inicio: reto.inicio,
      cartas: { disponibles: c.cartas.slice() },
      referencia: reto.referencia
    };
    if (c.recetas) nivel.cartas.recetas = c.recetas.slice();
    if (c.condiciones) nivel.cartas.condiciones = c.condiciones.slice();
    if (c.etapa === 'infantil') nivel.huecos = Math.min(8, Math.max(4, n + 2));
    else nivel.estrellas = { s2max: n + 2, s3: { tipo: 'referencia' } };
    return nivel;
  }

  // Devuelve { ok:true, reto } o { ok:false, motivo }
  function validar(r) {
    if (!r || typeof r !== 'object') return { ok: false, motivo: 'formato' };
    var ciclo = r.ciclo; if (!CICLOS[ciclo]) return { ok: false, motivo: 'ciclo' };
    var C = CICLOS[ciclo];
    if (ZONAS.indexOf(r.zona) < 0) return { ok: false, motivo: 'zona' };
    if (!Array.isArray(r.mapa) || r.mapa.length < 2 || r.mapa.length > 12) return { ok: false, motivo: 'mapa' };
    var w = r.mapa[0] && r.mapa[0].length, metas = 0;
    for (var y = 0; y < r.mapa.length; y++) {
      if (typeof r.mapa[y] !== 'string' || r.mapa[y].length !== w || w < 2 || w > 12) return { ok: false, motivo: 'mapa' };
      for (var x = 0; x < w; x++) { var ch = r.mapa[y].charAt(x); if (CELDAS.indexOf(ch) < 0) return { ok: false, motivo: 'mapa' }; if (ch === 'G') metas++; }
    }
    if (metas !== 1) return { ok: false, motivo: 'meta' };
    var ini = r.inicio;
    if (!ini || typeof ini.x !== 'number' || typeof ini.y !== 'number' || DIRS.indexOf(ini.dir) < 0 || ini.x < 0 || ini.y < 0 || ini.x >= w || ini.y >= r.mapa.length) return { ok: false, motivo: 'inicio' };
    var ci = r.mapa[ini.y].charAt(ini.x);
    if (ci !== '.' && ci !== 'o') return { ok: false, motivo: 'inicio' };
    var prog = r.referencia;
    var okForma = Array.isArray(prog) || (prog && Array.isArray(prog.principal));
    if (!okForma) return { ok: false, motivo: 'solucion' };
    var total;
    try { total = nodos(prog); } catch (e) { return { ok: false, motivo: 'solucion' }; }
    if (!(total >= 1 && total <= 300)) return { ok: false, motivo: 'solucion' };
    var usadas = cartasUsadas(prog);
    for (var i = 0; i < usadas.length; i++) if (C.cartas.indexOf(usadas[i]) < 0) return { ok: false, motivo: 'tarjetas' };
    var res;
    try { res = I.ejecutar({ mapa: r.mapa, inicio: ini }, prog); } catch (e2) { return { ok: false, motivo: 'solucion' }; }
    if (!res.ok) return { ok: false, motivo: 'sin-solucion' };
    var limpio = {
      id: limpiarTexto(r.id, 24).replace(/[^\w-]/g, '') || ('r' + Date.now().toString(36)),
      nombre: limpiarTexto(r.nombre, 30) || 'Reto sin nombre', autor: limpiarTexto(r.autor, 20) || 'Anónimo',
      ciclo: ciclo, zona: r.zona, mapa: r.mapa.slice(), inicio: { x: ini.x, y: ini.y, dir: ini.dir },
      referencia: JSON.parse(JSON.stringify(prog)), creado: typeof r.creado === 'number' ? r.creado : Date.now()
    };
    return { ok: true, reto: limpio };
  }

  var MENSAJES = {
    formato: 'El código no tiene el formato de un reto.', ciclo: 'El nivel del reto no es válido.', zona: 'El escenario del reto no es válido.',
    mapa: 'El tablero del reto no es válido.', meta: 'El reto debe tener una sola meta.', inicio: 'La posición inicial de Lumo no es válida.',
    solucion: 'La solución guardada en el reto no es válida.', tarjetas: 'La solución usa tarjetas que ese nivel no tiene.',
    'sin-solucion': 'Este reto no se puede resolver: la solución no llega a la meta.', copia: 'El código está incompleto o cambiado. Cópialo de nuevo.'
  };

  // ---------- código para compartir ----------
  var PREFIJO = 'RUMBO1';
  function crc(s) { var a = 0x811c, b = 0x9dc5; for (var i = 0; i < s.length; i++) { a = (a * 31 + s.charCodeAt(i)) & 0xffff; b = (b * 17 + a + s.charCodeAt(i)) & 0xffff; } return ((a << 16 | b) >>> 0).toString(16).padStart(8, '0'); }
  function aB64(txt) {
    var bytes = new TextEncoder().encode(txt), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function deB64(b64) {
    var s = String(b64).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
    var bin = atob(s), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function codificar(reto) {
    var min = { n: reto.nombre, a: reto.autor, c: reto.ciclo, z: reto.zona, m: reto.mapa, i: [reto.inicio.x, reto.inicio.y, reto.inicio.dir], r: reto.referencia };
    var cuerpo = aB64(JSON.stringify(min));
    return PREFIJO + '.' + cuerpo + '.' + crc(cuerpo);
  }
  function decodificar(texto) {
    var t = String(texto == null ? '' : texto).trim();
    if (t.charAt(0) === '{') { try { var o = JSON.parse(t); if (o && typeof o.codigo === 'string') t = o.codigo.trim(); } catch (e) { return { ok: false, motivo: 'formato' }; } }
    t = t.replace(/\s+/g, '');
    var partes = t.split('.');
    if (partes.length !== 3 || partes[0] !== PREFIJO) return { ok: false, motivo: 'formato' };
    if (crc(partes[1]) !== partes[2]) return { ok: false, motivo: 'copia' };
    var min;
    try { min = JSON.parse(deB64(partes[1])); } catch (e) { return { ok: false, motivo: 'copia' }; }
    if (!min || !Array.isArray(min.i)) return { ok: false, motivo: 'formato' };
    return validar({ nombre: min.n, autor: min.a, ciclo: min.c, zona: min.z, mapa: min.m, inicio: { x: min.i[0], y: min.i[1], dir: min.i[2] }, referencia: min.r });
  }

  return { CICLOS: CICLOS, ZONAS: ZONAS, cicloDe: cicloDe, retoANivel: retoANivel, validar: validar, codificar: codificar, decodificar: decodificar, MENSAJES: MENSAJES, limpiarTexto: limpiarTexto };
});
