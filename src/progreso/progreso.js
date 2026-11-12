/*
 * RUMBO — Progreso del jugador (puro, sin DOM, sin almacenamiento).
 *
 * Un perfil es un objeto JSON sencillo. Este módulo lo crea, lo actualiza, decide qué
 * está desbloqueado y calcula insignias, disfraces, resúmenes y códigos de partida.
 * El almacenamiento (localStorage) vive en guardado.js.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('../datos/catalogo.js'), require('../datos/logros.js'), require('./codigo-partida.js'));
    module.exports = api;
  } else {
    root.RumboProgreso = factory(root.RumboCatalogo, root.RumboLogros, root.RumboCodigo);
  }
})(typeof self !== 'undefined' ? self : this, function (CAT, LOG, COD) {
  'use strict';

  function ahora() { return Date.now(); }

  function crearPerfil(datos) {
    datos = datos || {};
    var curso = CAT.cursoDe(datos.curso) ? datos.curso : 'p1';
    return {
      id: datos.id || ('p' + ahora().toString(36) + Math.floor(Math.random() * 1e4).toString(36)),
      nombre: String(datos.nombre || 'Jugador').slice(0, 20),
      curso: curso,
      disfraz: 0,
      creado: ahora(),
      niveles: {},
      vistos: { cartas: {}, escenas: {} },
      logros: {},
      desbloqueo: { niveles: {}, mundos: {} },
      retos: []
    };
  }

  function esInfantil(perfil) { return perfil.curso.indexOf('inf') === 0; }

  function datosNivel(perfil, id) {
    return perfil.niveles[id] || null;
  }
  function hecho(perfil, id) { var d = perfil.niveles[id]; return !!(d && d.completado); }
  function estrellasNivel(perfil, id) { var d = perfil.niveles[id]; return d && d.completado ? d.est : 0; }

  function completadosMundo(perfil, m) {
    var n = 0;
    CAT.MUNDOS[m].niveles.forEach(function (x) { if (hecho(perfil, x.id)) n++; });
    return n;
  }
  function mundoCompleto(perfil, m) { return completadosMundo(perfil, m) === CAT.MUNDOS[m].niveles.length; }
  function estrellasMundo(perfil, m) {
    var s = 0;
    CAT.MUNDOS[m].niveles.forEach(function (x) { s += estrellasNivel(perfil, x.id); });
    return s;
  }
  function estrellasTotales(perfil) {
    var s = 0;
    [1, 2, 3, 4].forEach(function (m) { s += estrellasMundo(perfil, m); });
    CAT.SECRETOS.forEach(function (x) { s += estrellasNivel(perfil, x.id); });
    return s;
  }
  function itinerarioCompleto(perfil, k) {
    return CAT.ITINERARIOS[k].every(function (id) { return hecho(perfil, id); });
  }

  // ---------- desbloqueos ----------

  function mundoAbierto(perfil, m, opciones) {
    if (opciones && opciones.todo) return true;
    if (perfil.desbloqueo.mundos[m]) return true;
    if (m === 0) return true;
    var curso = CAT.cursoDe(perfil.curso);
    if (curso.mundos.indexOf(m) >= 0) return true;
    if (m === 4) return mundoCompleto(perfil, 3);
    return mundoCompleto(perfil, m - 1) || completadosMundo(perfil, m) > 0;
  }

  function itinerarioAbierto(perfil, k, opciones) {
    if (opciones && opciones.todo) return true;
    var curso = CAT.cursoDe(perfil.curso);
    if (k === 3) return true;
    if (curso.itinerarios && curso.itinerarios.indexOf(k) >= 0) return true;
    return itinerarioCompleto(perfil, k - 1) || CAT.ITINERARIOS[k].some(function (id) { return hecho(perfil, id); });
  }

  function secretoAbierto(perfil, n) {
    var req = CAT.REQUISITO_SECRETO[n - 1];
    return estrellasMundo(perfil, req.mundo) >= req.estrellas;
  }

  function estaDesbloqueado(perfil, id, opciones) {
    var nivel = CAT.POR_ID[id];
    if (!nivel) return false;
    if (opciones && opciones.todo) return true;
    if (perfil.desbloqueo.niveles[id]) return true;
    if (nivel.mundo === 'sec') return secretoAbierto(perfil, nivel.secreto);
    if (!mundoAbierto(perfil, nivel.mundo, opciones)) return false;
    if (nivel.mundo === 0) {
      if (!itinerarioAbierto(perfil, nivel.itinerario, opciones)) return false;
      var lista = CAT.ITINERARIOS[nivel.itinerario];
      var i = lista.indexOf(id);
      return i === 0 || hecho(perfil, lista[i - 1]);
    }
    var pos = CAT.posicion(id), previo = pos > 0 ? CAT.MUNDOS[nivel.mundo].niveles[pos - 1] : null;
    if (!previo) return true;
    // El calentamiento (bloque 0) es un repaso: no bloquea el primer reto «de verdad» del mundo.
    if (previo.bloque === 0 && nivel.bloque !== 0) return true;
    return hecho(perfil, previo.id);
  }

  // ---------- aventura de bienvenida (Primaria) ----------
  // perfil.bienvenida: undefined = aún sin decidir · 'aceptada' · 'omitida'. El progreso son los propios niveles de Infantil.
  function bienvenida(perfil) {
    var ids = CAT.BIENVENIDA, hechos = ids.filter(function (id) { return hecho(perfil, id); });
    var sig = null;
    for (var i = 0; i < ids.length; i++) if (!hecho(perfil, ids[i])) { sig = ids[i]; break; }
    return { ids: ids, hechos: hechos.length, total: ids.length, completa: hechos.length === ids.length, siguiente: sig, estado: perfil.bienvenida || null };
  }
  // ¿Hay que recomendarla? Solo a jugadores de Primaria nuevos (sin ningún reto superado) que aún no han decidido.
  function debeRecomendarBienvenida(perfil) {
    if (esInfantil(perfil) || perfil.bienvenida) return false;
    return !Object.keys(perfil.niveles).some(function (id) { return perfil.niveles[id] && perfil.niveles[id].completado; });
  }

  // Primer nivel pendiente y abierto (para el botón «Continuar»)
  function siguientePendiente(perfil) {
    if (!esInfantil(perfil) && perfil.bienvenida === 'aceptada') { var b = bienvenida(perfil); if (b.siguiente) return b.siguiente; }
    var lista = esInfantil(perfil) ? CAT.SEC_INFANTIL : CAT.SEC_PRIMARIA;
    var curso = CAT.cursoDe(perfil.curso);
    var candidatos = lista.filter(function (id) {
      var n = CAT.POR_ID[id];
      if (esInfantil(perfil)) return true;
      return curso.mundos.indexOf(n.mundo) >= 0 || n.mundo === 4 || completadosMundo(perfil, n.mundo) > 0;
    });
    for (var i = 0; i < candidatos.length; i++) {
      if (!hecho(perfil, candidatos[i]) && estaDesbloqueado(perfil, candidatos[i])) return candidatos[i];
    }
    for (var j = 0; j < lista.length; j++) {
      if (!hecho(perfil, lista[j]) && estaDesbloqueado(perfil, lista[j])) return lista[j];
    }
    return null;
  }

  // ---------- registro de intentos ----------

  function asegurarNivel(perfil, id) {
    if (!perfil.niveles[id]) {
      perfil.niveles[id] = { completado: false, est: 0, intentos: 0, fallos: 0, pistas: 0, mejor: 0, razones: {}, estrategias: {}, ultimo: 0, tras: 0 };
    }
    return perfil.niveles[id];
  }

  function estrategiasDe(programa, I) {
    var e = {};
    I.recorrer(programa, function (n) {
      if (n.t === 'repetir') e.repetir = true;
      if (n.t === 'si') e.si = true;
      if (n.t === 'mientras') e.mientras = true;
      if (n.t === 'receta') e.receta = true;
      if (n.t === 'saltar') e.saltar = true;
    });
    return e;
  }

  /*
   * info = { ok, motivo, estrellas, tarjetas, programa, pistas }
   * Devuelve { primeraVez, mejoro, estrellasAntes }
   */
  function registrar(perfil, id, info, I) {
    var d = asegurarNivel(perfil, id);
    var antes = d.completado ? d.est : 0;
    var primera = !d.completado && info.ok;
    d.intentos++;
    d.ultimo = ahora();
    if (info.pistas) d.pistas = Math.max(d.pistas, info.pistas);
    if (!info.ok) {
      d.fallos++;
      if (info.motivo) d.razones[info.motivo] = (d.razones[info.motivo] || 0) + 1;
    } else {
      if (!d.completado) d.tras = d.intentos;
      d.completado = true;
      d.est = Math.max(d.est, info.estrellas || 1);
      if (!d.mejor || info.tarjetas < d.mejor) d.mejor = info.tarjetas;
      if (I && info.programa) {
        var e = estrategiasDe(info.programa, I);
        Object.keys(e).forEach(function (k) { d.estrategias[k] = true; });
      }
    }
    return { primeraVez: primera, mejoro: info.ok && d.est > antes, estrellasAntes: antes };
  }

  // Anota que se pidió una pista (sin contar como intento), para que el docente la vea al momento.
  function anotarPistas(perfil, id, n) {
    var d = asegurarNivel(perfil, id);
    d.pistas = Math.max(d.pistas, n);
  }

  function marcarCartaVista(perfil, c) { perfil.vistos.cartas[c] = true; }
  function marcarEscenaVista(perfil, e) { perfil.vistos.escenas[e] = true; }

  // ---------- logros y disfraces ----------

  function ayudante(perfil) {
    return {
      completados: function () {
        var n = 0;
        Object.keys(perfil.niveles).forEach(function (k) { if (perfil.niveles[k].completado) n++; });
        return n;
      },
      completadosMundo: function (m) { return completadosMundo(perfil, m); },
      mundoCompleto: function (m) { return mundoCompleto(perfil, m); },
      todos: function (ids) { return ids.every(function (id) { return hecho(perfil, id); }); },
      estrellas: function () { return estrellasTotales(perfil); },
      tresEstrellas: function () {
        var n = 0;
        Object.keys(perfil.niveles).forEach(function (k) {
          var d = perfil.niveles[k];
          var niv = CAT.POR_ID[k];
          if (d.completado && d.est >= 3 && niv && niv.etapa !== 'infantil') n++;
        });
        return n;
      },
      perseverancia: function () {
        return Object.keys(perfil.niveles).some(function (k) { var d = perfil.niveles[k]; return d.completado && d.tras >= 4; });
      },
      finalHecho: function () { return hecho(perfil, CAT.finalDe(perfil.curso)); },
      itinerario: function (k) { return itinerarioCompleto(perfil, k); },
      retosCreados: function () { return (perfil.retos || []).length; }
    };
  }

  function evaluarLogros(perfil) {
    var P = ayudante(perfil);
    var nuevos = [];
    LOG.INSIGNIAS.forEach(function (ins) {
      if (!perfil.logros[ins.id] && ins.ok(P)) {
        perfil.logros[ins.id] = ahora();
        nuevos.push(ins.id);
      }
    });
    return nuevos;
  }

  function disfracesDesbloqueados(perfil) {
    var P = ayudante(perfil);
    return LOG.DISFRACES.filter(function (d) { return d.ok(P); }).map(function (d) { return d.id; });
  }

  // ---------- resumen para el docente ----------

  function resumen(perfil) {
    var mundos = CAT.MUNDOS.map(function (m) {
      var max = m.etapa === 'infantil' ? 0 : m.niveles.length * 3;
      return { id: m.id, nombre: m.nombre, completados: completadosMundo(perfil, m.id), total: m.niveles.length,
        estrellas: m.id === 0 ? 0 : estrellasMundo(perfil, m.id), maxEstrellas: max };
    });
    var errores = {}, intentos = 0, fallos = 0, pistas = 0;
    Object.keys(perfil.niveles).forEach(function (k) {
      var d = perfil.niveles[k];
      intentos += d.intentos; fallos += d.fallos; pistas += d.pistas;
      Object.keys(d.razones).forEach(function (r) { errores[r] = (errores[r] || 0) + d.razones[r]; });
    });
    return { mundos: mundos, errores: errores, intentos: intentos, fallos: fallos, pistas: pistas,
      estrellas: estrellasTotales(perfil), insignias: Object.keys(perfil.logros).length };
  }

  // ---------- códigos de partida ----------

  var ORDEN_LARGO = CAT.SEC_INFANTIL.concat(CAT.SEC_PRIMARIA).concat(CAT.SECRETOS.map(function (n) { return n.id; }));

  function aCodigo(perfil) {
    if (esInfantil(perfil)) {
      var n = 0;
      CAT.SEC_INFANTIL.forEach(function (id) { if (hecho(perfil, id)) n++; });
      return { tipo: 'pictos', codigo: COD.codificarPictos({ nivelInfantil: Math.min(n, 15), disfraz: Math.min(perfil.disfraz || 0, 15) }) };
    }
    var comp = 0;
    CAT.SEC_PRIMARIA.forEach(function (id) { if (hecho(perfil, id)) comp++; });
    var est = [1, 2, 3, 4].map(function (m) { return estrellasMundo(perfil, m); });
    est[3] = Math.min(est[3], 31);
    return { tipo: 'corto', codigo: COD.codificarCorto({
      nivel: comp, estrellasMundo: est,
      secretos: CAT.SECRETOS.map(function (s) { return hecho(perfil, s.id); }),
      disfraz: perfil.disfraz || 0 }) };
  }

  function aCodigoLargo(perfil) {
    return COD.codificarLargo({
      estrellas: ORDEN_LARGO.map(function (id) { return estrellasNivel(perfil, id) || (hecho(perfil, id) ? 1 : 0); }),
      secretos: CAT.SECRETOS.map(function (s) { return hecho(perfil, s.id); }),
      disfraz: perfil.disfraz || 0 });
  }

  function marcar(perfil, id, est) {
    var d = asegurarNivel(perfil, id);
    d.completado = true;
    d.est = Math.max(d.est, est);
    if (!d.intentos) d.intentos = 1;
  }

  // Reparte las estrellas de un mundo entre los niveles completados (≥1 cada uno, ≤3).
  function repartir(perfil, mundo, completados, total) {
    var ids = CAT.MUNDOS[mundo].niveles.slice(0, completados).map(function (n) { return n.id; });
    var k = ids.length;
    var t = Math.max(k, Math.min(3 * k, total));
    var extra = t - k;
    ids.forEach(function (id) {
      var s = 1 + Math.min(2, extra);
      extra -= s - 1;
      marcar(perfil, id, s);
    });
  }

  /*
   * Aplica un código sobre un perfil nuevo. Devuelve { ok, perfil, tipo } o { ok:false, motivo }.
   * El código corto guarda totales por mundo: se restauran los desbloqueos y el total de estrellas,
   * no las estrellas exactas de cada nivel (para eso está el código largo del docente).
   */
  function desdeCodigo(texto, nombre) {
    var perfil, r;
    var t = Array.isArray(texto) ? '' : COD.normalizar(texto);
    if (t.length === 11) {
      r = COD.decodificarCorto(texto);
      if (!r.ok) return { ok: false, motivo: r.motivo };
      var e = r.estado;
      perfil = crearPerfil({ nombre: nombre, curso: e.nivel > 50 ? 'p5' : e.nivel > 25 ? 'p3' : 'p1' });
      var resto = Math.min(e.nivel, CAT.SEC_PRIMARIA.length);
      [1, 2, 3, 4].forEach(function (m) {
        var tam = CAT.MUNDOS[m].niveles.length;
        var comp = Math.min(tam, resto);
        resto -= comp;
        if (comp > 0) repartir(perfil, m, comp, e.estrellasMundo[m - 1]);
      });
      CAT.SECRETOS.forEach(function (s, i) { if (e.secretos[i]) marcar(perfil, s.id, 1); });
      perfil.disfraz = e.disfraz;
      return { ok: true, perfil: perfil, tipo: 'corto' };
    }
    r = COD.decodificarPictos(texto);   // el código pictográfico es una lista de 6 números 0..11
    if (r.ok) {
      perfil = crearPerfil({ nombre: nombre, curso: 'inf5' });
      for (var i = 0; i < Math.min(r.estado.nivelInfantil, CAT.SEC_INFANTIL.length); i++) marcar(perfil, CAT.SEC_INFANTIL[i], 1);
      perfil.disfraz = r.estado.disfraz;
      return { ok: true, perfil: perfil, tipo: 'pictos' };
    }
    r = COD.decodificarLargo(texto);
    if (!r.ok) return { ok: false, motivo: r.motivo };
    perfil = crearPerfil({ nombre: nombre, curso: 'p3' });
    r.estado.estrellas.forEach(function (s, i) { if (s > 0 && ORDEN_LARGO[i]) marcar(perfil, ORDEN_LARGO[i], s); });
    perfil.disfraz = r.estado.disfraz;
    var inf = CAT.SEC_INFANTIL.some(function (id) { return hecho(perfil, id); });
    var pri = CAT.SEC_PRIMARIA.some(function (id) { return hecho(perfil, id); });
    if (inf && !pri) perfil.curso = 'inf5';
    else if (pri) perfil.curso = mundoCompleto(perfil, 2) ? 'p5' : mundoCompleto(perfil, 1) ? 'p3' : 'p1';
    return { ok: true, perfil: perfil, tipo: 'largo' };
  }

  return {
    crearPerfil: crearPerfil, esInfantil: esInfantil, datosNivel: datosNivel, hecho: hecho,
    estrellasNivel: estrellasNivel, completadosMundo: completadosMundo, mundoCompleto: mundoCompleto,
    estrellasMundo: estrellasMundo, estrellasTotales: estrellasTotales, itinerarioCompleto: itinerarioCompleto,
    mundoAbierto: mundoAbierto, itinerarioAbierto: itinerarioAbierto, secretoAbierto: secretoAbierto,
    finalHecho: function (perfil) { return hecho(perfil, CAT.finalDe(perfil.curso)); }, estaDesbloqueado: estaDesbloqueado, siguientePendiente: siguientePendiente, bienvenida: bienvenida, debeRecomendarBienvenida: debeRecomendarBienvenida,
    registrar: registrar, anotarPistas: anotarPistas, marcarCartaVista: marcarCartaVista, marcarEscenaVista: marcarEscenaVista,
    evaluarLogros: evaluarLogros, disfracesDesbloqueados: disfracesDesbloqueados, resumen: resumen,
    aCodigo: aCodigo, aCodigoLargo: aCodigoLargo, desdeCodigo: desdeCodigo, ORDEN_LARGO: ORDEN_LARGO
  };
});
