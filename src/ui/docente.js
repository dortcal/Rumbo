/*
 * RUMBO — Modo docente: seguimiento por jugador, currículo por nivel, desbloqueos, copias de seguridad.
 * Todo se calcula con los datos guardados en este navegador. No hay cuentas ni servidor.
 * En Infantil el seguimiento describe participación y comprensión de secuencias, no califica.
 */
(function (root) {
  'use strict';
  var UI = root.RumboUI = root.RumboUI || {};
  var h = function () { return UI.h.apply(null, arguments); };
  var App = UI.App;

  var RAZONES = {
    choque: 'Choques con obstáculos o paredes', caida: 'Caídas al vacío o al agua', 'objeto-olvidado': 'Meta alcanzada sin recoger todo',
    'objetivo-incompleto': 'Programa que se queda corto', 'limite-pasos': 'Bucles que no terminan', 'programa-vacio': 'Ejecutar sin tarjetas',
    'receta-inexistente': 'Receta llamada pero vacía', 'programa-invalido': 'Programa no válido', profundidad: 'Recetas que se llaman a sí mismas'
  };
  var ESTRATEGIAS = { repetir: 'Bucles (repetir)', si: 'Condiciones (si / si no)', mientras: 'Bucles con condición (mientras)', receta: 'Recetas (bloques reutilizables)', saltar: 'Saltos' };

  function descargar(nombre, texto, mime) {
    var b = new Blob([texto], { type: mime || 'text/plain;charset=utf-8' }), a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = nombre; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  UI.descargar = descargar;
  function csv(v) { v = String(v == null ? '' : v); return /[",;\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function fecha(t) { return t ? new Date(t).toLocaleDateString('es-ES') : '—'; }

  // ---------- puerta de entrada: mantener pulsado ----------
  App.registrar('docente', function (cont, params) {
    App.nubes(cont);
    if (!App.estado.docente || !App.estado.docente.abierto) return puerta(cont);
    panel(cont, params);
  });

  function puerta(cont) {
    cont.appendChild(App.cabecera('Zona docente', { atras: function () { App.ir('portada'); }, perfil: false }));
    var barra = h('i'), estado = h('p.nota', 'Para evitar entradas por error, mantén pulsado el botón durante dos segundos.');
    var btn = h('button.btn-grande.puerta-docente', { type: 'button', 'aria-label': 'Mantén pulsado para entrar' }, h('span', 'Mantén pulsado para entrar'), h('div.puerta-barra', barra));
    var t0 = 0, raf = 0, abierta = false;
    function tick() {
      var f = Math.min(1, (performance.now() - t0) / 2000);
      barra.style.width = (f * 100) + '%';
      if (f >= 1 && !abierta) { abierta = true; App.estado.docente = { abierto: true, todo: false, vista: false, perfilId: null, pestana: 'alumnado' }; App.ir('docente'); return; }
      raf = requestAnimationFrame(tick);
    }
    function ini(e) { if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return; if (t0) return; t0 = performance.now(); tick(); }
    function fin() { t0 = 0; cancelAnimationFrame(raf); barra.style.width = '0'; }
    btn.addEventListener('pointerdown', ini); btn.addEventListener('keydown', ini); ['pointerup', 'pointerleave', 'pointercancel', 'keyup', 'blur'].forEach(function (e) { btn.addEventListener(e, fin); });
    cont.appendChild(h('div.formulario.centro', estado, btn));
    App.alSalirDePantalla(function () { cancelAnimationFrame(raf); });
  }

  // ---------- panel ----------
  function panel(cont, params) {
    var D = App.estado.docente, datos = App.datos(), PR = root.RumboProgreso, CAT = root.RumboCatalogo;
    if (params && params.pestana) D.pestana = params.pestana;
    cont.appendChild(App.cabecera('Modo docente', { atras: function () { D.abierto = false; D.todo = false; App.ir('portada'); }, perfil: false, extra: [
      h('button.btn-txt', { type: 'button', on: { click: function () { D.abierto = false; D.todo = false; App.toast('Has salido del modo docente.'); App.ir('portada'); } } }, 'Salir')] }));
    var tabs = h('div.tabs.docente-tabs');
    [['alumnado', 'Alumnado'], ['niveles', 'Niveles y currículo'], ['matriz', 'Matriz curricular'], ['ajustes', 'Copias y opciones']].forEach(function (t) {
      tabs.appendChild(h('button.tab' + (D.pestana === t[0] ? '.sel' : ''), { type: 'button', on: { click: function () { D.pestana = t[0]; App.ir('docente'); } } }, t[1]));
    });
    cont.appendChild(tabs);
    var cuerpo = h('div.doc-cuerpo'); cont.appendChild(cuerpo);
    ({ alumnado: pAlumnado, niveles: pNiveles, matriz: pMatriz, ajustes: pAjustes })[D.pestana](cuerpo, D, datos, PR, CAT);
  }

  function perfilSel(D, datos) {
    var p = datos.perfiles.filter(function (x) { return x.id === D.perfilId; })[0];
    return p || datos.perfiles[0] || null;
  }

  function selector(D, datos) {
    var sel = h('select.campo.sel-perfil', { 'aria-label': 'Jugador' });
    datos.perfiles.forEach(function (p) { sel.appendChild(h('option', { value: p.id, selected: (perfilSel(D, datos) === p) ? true : null }, p.nombre + ' (' + root.RumboCatalogo.cursoDe(p.curso).nombre + ')')); });
    sel.addEventListener('change', function () { D.perfilId = sel.value; App.ir('docente'); });
    return sel;
  }

  // ---------- pestaña: alumnado ----------
  function pAlumnado(c, D, datos, PR, CAT) {
    if (!datos.perfiles.length) { c.appendChild(h('div.formulario', h('p', 'Todavía no hay jugadores en este equipo. Crea uno desde «Jugar» o importa una copia en «Copias y opciones».'))); return; }
    var p = perfilSel(D, datos), inf = PR.esInfantil(p), r = PR.resumen(p);
    c.appendChild(h('div.doc-fila', selector(D, datos),
      h('button.btn-txt', { type: 'button', on: { click: function () { descargar('rumbo-' + p.nombre.replace(/\W+/g, '_') + '.csv', informeCSV(p), 'text/csv;charset=utf-8'); } } }, 'Descargar informe (CSV)')));
    // resumen
    var res = h('section.doc-caja', h('h2', 'Resumen de ' + p.nombre));
    var stats = h('div.doc-stats');
    function stat(n, t) { return h('div.stat', h('b', String(n)), h('span', t)); }
    stats.appendChild(stat(Object.keys(p.niveles).filter(function (k) { return p.niveles[k].completado; }).length, 'retos superados'));
    stats.appendChild(stat(r.intentos, 'intentos'));
    stats.appendChild(stat(r.pistas, 'ayudas pedidas'));
    if (!inf) stats.appendChild(stat(r.estrellas, 'estrellas'));
    stats.appendChild(stat(r.insignias, 'insignias'));
    res.appendChild(stats);
    if (inf) res.appendChild(h('p.nota', 'En Infantil se describe la participación y la comprensión de secuencias; no se califica. Las estrellas no se usan.'));
    r.mundos.forEach(function (m) {
      if (inf !== (m.id === 0)) { if (!(m.completados > 0)) return; }
      res.appendChild(h('div.doc-mundo', h('span', m.nombre), h('div.barra', h('i', { style: { width: Math.round(m.completados / m.total * 100) + '%', background: CAT.MUNDOS[m.id].color } })), h('span', m.completados + '/' + m.total + (m.maxEstrellas ? ' · ★ ' + m.estrellas + '/' + m.maxEstrellas : ''))));
    });
    c.appendChild(res);
    // errores frecuentes y estrategias
    var er = h('section.doc-caja', h('h2', 'Errores más frecuentes'));
    var lista = Object.keys(r.errores).sort(function (a, b) { return r.errores[b] - r.errores[a]; });
    if (!lista.length) er.appendChild(h('p.nota', 'Sin fallos registrados todavía.'));
    lista.forEach(function (k) { er.appendChild(h('div.doc-barra', h('span', RAZONES[k] || k), h('div.barra', h('i', { style: { width: Math.round(r.errores[k] / r.intentos * 100 || 1) + '%', background: '#e8553f' } })), h('b', String(r.errores[k])))); });
    er.appendChild(h('p.nota', 'Son pistas de qué conceptos reforzar, no una calificación: equivocarse forma parte de programar.'));
    c.appendChild(er);
    var es = {}; Object.keys(p.niveles).forEach(function (k) { Object.keys(p.niveles[k].estrategias || {}).forEach(function (e) { es[e] = (es[e] || 0) + 1; }); });
    var est = h('section.doc-caja', h('h2', 'Estrategias que ha utilizado'));
    var ke = Object.keys(es);
    if (!ke.length) est.appendChild(h('p.nota', 'Aún no ha usado bucles, condiciones ni recetas en retos superados.'));
    ke.forEach(function (k) { est.appendChild(h('div.doc-barra', h('span', ESTRATEGIAS[k] || k), h('b', es[k] + ' retos'))); });
    c.appendChild(est);
    // tabla de niveles
    var tab = h('section.doc-caja', h('h2', 'Detalle por reto'));
    var t = h('table.doc-tabla', h('thead', h('tr', ['Reto', 'Estado', inf ? '' : 'Estrellas', 'Intentos', 'Fallos', 'Ayudas', 'Tarjetas', 'Estrategias'].map(function (x) { return h('th', x); }))));
    var tb = h('tbody');
    (inf ? CAT.SEC_INFANTIL : CAT.SEC_PRIMARIA.concat(CAT.SECRETOS.map(function (n) { return n.id; }))).forEach(function (id) {
      var d = p.niveles[id]; if (!d) return;
      var n = CAT.POR_ID[id];
      tb.appendChild(h('tr', h('td', id + ' · ' + n.titulo), h('td', d.completado ? 'Superado' : 'En curso'), h('td', inf ? '' : d.completado ? '★'.repeat(d.est) : '—'),
        h('td', String(d.intentos)), h('td', String(d.fallos)), h('td', String(d.pistas)), h('td', d.mejor ? String(d.mejor) : '—'),
        h('td', Object.keys(d.estrategias || {}).map(function (e) { return ESTRATEGIAS[e] ? ESTRATEGIAS[e].replace(/ \(.*/, '') : e; }).join(', '))));
    });
    t.appendChild(tb); tab.appendChild(h('div.tabla-caja', t)); c.appendChild(tab);
    // cod
    var cod = PR.aCodigoLargo(p);
    c.appendChild(h('section.doc-caja', h('h2', 'Códigos de partida'), h('p.nota', 'Código corto (el alumnado lo usa solo):'), h('div.codigo-grande', String(PR.aCodigo(p).tipo === 'pictos' ? 'Se muestra con dibujos en el juego' : PR.aCodigo(p).codigo)),
      h('p.nota', 'Código largo (conserva las estrellas de cada reto; para docentes):'), h('textarea.campo.codigo-texto', { readonly: true, rows: '3' }, String(cod))));
  }

  function informeCSV(p) {
    var CAT = root.RumboCatalogo, filas = [['id', 'titulo', 'estado', 'estrellas', 'intentos', 'fallos', 'ayudas', 'mejor_tarjetas', 'estrategias', 'ultimo_intento']];
    CAT.TODOS.forEach(function (n) { var d = p.niveles[n.id]; if (!d) return;
      filas.push([n.id, n.titulo, d.completado ? 'superado' : 'en curso', n.etapa === 'infantil' ? '' : d.est, d.intentos, d.fallos, d.pistas, d.mejor || '', Object.keys(d.estrategias || {}).join('+'), fecha(d.ultimo)]); });
    return '﻿' + filas.map(function (f) { return f.map(csv).join(';'); }).join('\n');
  }

  // ---------- pestaña: niveles ----------
  function pNiveles(c, D, datos, PR, CAT) {
    var p = perfilSel(D, datos);
    c.appendChild(h('div.doc-fila', datos.perfiles.length ? selector(D, datos) : null,
      h('label.chk', h('input', { type: 'checkbox', checked: D.todo ? true : null, on: { change: function (e) { D.todo = e.target.checked; App.toast(D.todo ? 'Todos los niveles abiertos en el mapa (solo esta sesión).' : 'Mapa con desbloqueo normal.'); } } }), h('span', 'Abrir todos los niveles en el mapa (esta sesión)')),
      h('button.btn-txt', { type: 'button', on: { click: function () { if (!p) return; CAT.TODOS.forEach(function (n) { p.desbloqueo.niveles[n.id] = true; }); p.desbloqueo.lab = true; App.guardar(); App.toast('Niveles y Laboratorio desbloqueados para ' + p.nombre + '.'); } } }, 'Desbloquear todo para este jugador'),
      h('button.btn-txt', { type: 'button', on: { click: function () { App.ir('laboratorio'); } } }, 'Abrir Laboratorio')));
    var grupos = [['Educación Infantil', CAT.SEC_INFANTIL], ['Mundo 1', CAT.MUNDOS[1].niveles.map(function (n) { return n.id; })], ['Mundo 2', CAT.MUNDOS[2].niveles.map(function (n) { return n.id; })],
      ['Mundo 3', CAT.MUNDOS[3].niveles.map(function (n) { return n.id; })], ['Faro y retos secretos', CAT.MUNDOS[4].niveles.map(function (n) { return n.id; }).concat(CAT.SECRETOS.map(function (n) { return n.id; }))]];
    grupos.forEach(function (g) {
      var det = h('details.doc-caja', h('summary', g[0] + ' (' + g[1].length + ')'));
      g[1].forEach(function (id) {
        var n = CAT.POR_ID[id];
        var curr = h('div.doc-curr');
        (n.curriculo.oficial || []).forEach(function (o) { curr.appendChild(h('div.curr-of', h('b', 'Decreto ' + o.decreto + ' · ' + o.area + (o.criterio ? ' · criterio ' + o.criterio : '')), h('span', ' ' + (o.texto || '')))); });
        (n.curriculo.extension || []).forEach(function (e) { curr.appendChild(h('div.curr-ext', h('b', 'Propuesta didáctica del juego: '), h('span', e))); });
        var abierto = p ? !!(p.desbloqueo.niveles[id]) : false;
        det.appendChild(h('div.doc-nivel', h('div.dn-cab', h('b', id), h('span', n.titulo), n.tipo !== 'normal' ? h('span.chip', n.tipo) : null,
          h('div.dn-acc',
            h('button.btn-txt', { type: 'button', on: { click: function () { D.vista = true; App.jugarNivel(id, { sinRegistro: true }); } } }, 'Probar'),
            p ? h('button.btn-txt', { type: 'button', on: { click: function () { p.desbloqueo.niveles[id] = true; App.guardar(); App.toast('Nivel ' + id + ' desbloqueado para ' + p.nombre + '.'); } } }, abierto ? 'Desbloqueado' : 'Desbloquear') : null)),
          h('div.dn-obj', n.objetivo), curr));
      });
      c.appendChild(det);
    });
  }

  // ---------- pestaña: matriz curricular ----------
  function pMatriz(c, D, datos, PR, CAT) {
    c.appendChild(h('section.doc-caja', h('h2', 'Matriz curricular: qué retos trabajan cada criterio'),
      h('p.nota', 'Referencias a los Decretos 196/2022 (Infantil) y 211/2022 (Primaria) de Canarias. Las referencias están redactadas a partir de los decretos y deben contrastarse con el BOC antes de usarlas en documentos oficiales. Las propuestas de programación (variables, funciones, eventos…) se señalan aparte como extensión del juego.')));
    var mapa = {}, ext = {};
    CAT.TODOS.forEach(function (n) {
      (n.curriculo.oficial || []).forEach(function (o) { var k = o.decreto + '|' + o.area + '|' + (o.criterio || ''); (mapa[k] = mapa[k] || { o: o, niveles: [] }).niveles.push(n.id); });
      (n.curriculo.extension || []).forEach(function (e) { (ext[e] = ext[e] || []).push(n.id); });
    });
    var t = h('table.doc-tabla', h('thead', h('tr', ['Decreto', 'Área / competencia', 'Criterio', 'Descripción', 'Retos'].map(function (x) { return h('th', x); }))));
    var tb = h('tbody');
    Object.keys(mapa).sort().forEach(function (k) { var m = mapa[k]; tb.appendChild(h('tr', h('td', m.o.decreto), h('td', m.o.area), h('td', m.o.criterio || ''), h('td', m.o.texto || ''), h('td', m.niveles.length + ' retos (' + m.niveles.slice(0, 4).join(', ') + (m.niveles.length > 4 ? '…' : '') + ')'))); });
    t.appendChild(tb); c.appendChild(h('section.doc-caja', h('h2', 'Contenido oficial'), h('div.tabla-caja', t)));
    var ul = h('section.doc-caja', h('h2', 'Propuestas didácticas propias del juego (no son contenido oficial)'));
    Object.keys(ext).sort().forEach(function (e) { ul.appendChild(h('div.doc-barra', h('span', e), h('b', ext[e].length + ' retos'))); });
    c.appendChild(ul);
  }

  // ---------- pestaña: copias y opciones ----------
  function pAjustes(c, D, datos, PR, CAT) {
    var G = UI.Guardado, p = perfilSel(D, datos);
    var cp = h('section.doc-caja', h('h2', 'Copia de seguridad'), h('p.nota', 'Guarda todos los jugadores en un archivo para llevarlos a otro equipo o recuperarlos.'));
    var fi = h('input', { type: 'file', accept: '.json,application/json', hidden: true, on: { change: function (e) {
      var f = e.target.files[0]; if (!f) return; var rd = new FileReader();
      rd.onload = function () { try { G.importar(String(rd.result)); App.estado.datos = G.cargar(); App.estado.perfil = null; App.aplicarAjustes(); App.toast('Copia importada: ' + App.estado.datos.perfiles.length + ' jugadores.'); App.ir('docente'); } catch (err) { App.toast('Ese archivo no es una copia válida de RUMBO.'); } };
      rd.readAsText(f); } } });
    cp.appendChild(h('div.doc-fila',
      h('button.btn-txt', { type: 'button', on: { click: function () { descargar('rumbo-copia-' + new Date().toISOString().slice(0, 10) + '.json', G.exportar(), 'application/json'); } } }, 'Descargar copia'),
      h('button.btn-txt', { type: 'button', on: { click: function () { fi.click(); } } }, 'Importar copia (sustituye lo actual)'), fi));
    c.appendChild(cp);
    var gj = h('section.doc-caja', h('h2', 'Jugadores'));
    if (!datos.perfiles.length) gj.appendChild(h('p.nota', 'Sin jugadores.'));
    datos.perfiles.forEach(function (pp) {
      var curs = h('select.campo.chico', { 'aria-label': 'Curso de ' + pp.nombre, on: { change: function (e) { pp.curso = e.target.value; App.guardar(); App.toast('Curso actualizado.'); } } });
      CAT.CURSOS.forEach(function (cu) { curs.appendChild(h('option', { value: cu.id, selected: pp.curso === cu.id ? true : null }, cu.nombre + (cu.id.indexOf('inf') === 0 ? ' (Infantil)' : ' Primaria'))); });
      gj.appendChild(h('div.doc-fila.jug', h('b', pp.nombre), curs,
        h('button.btn-txt', { type: 'button', on: { click: function () { if (!confirm('¿Reiniciar toda la partida de ' + pp.nombre + '? Se borrarán retos, estrellas e insignias.')) return; var n = PR.crearPerfil({ id: pp.id, nombre: pp.nombre, curso: pp.curso }); datos.perfiles[datos.perfiles.indexOf(pp)] = n; if (App.estado.perfil === pp) App.estado.perfil = n; App.guardar(); App.toast('Partida reiniciada.'); App.ir('docente'); } } }, 'Reiniciar partida'),
        h('button.btn-txt.peligro', { type: 'button', on: { click: function () { if (!confirm('¿Eliminar a ' + pp.nombre + ' del equipo?')) return; datos.perfiles.splice(datos.perfiles.indexOf(pp), 1); if (datos.activo === pp.id) { datos.activo = null; App.estado.perfil = null; } App.guardar(); App.ir('docente'); } } }, 'Eliminar')));
    });
    c.appendChild(gj);
    c.appendChild(h('section.doc-caja', h('h2', 'Privacidad'), h('p', 'RUMBO no envía datos a ningún servidor ni usa cuentas. El juego no pide ningún nombre: cada jugador aparece como «Jugador N» con un dibujo, y el progreso se guarda solo en este navegador. Si anotas quién es cada número, hazlo fuera del juego. Los retos del Laboratorio tampoco deben llevar nombres de personas.'),
      h('div.doc-fila', h('button.btn-txt.peligro', { type: 'button', on: { click: function () { if (!confirm('¿Borrar TODOS los datos de RUMBO de este navegador?')) return; G.reiniciarTodo(); App.estado.datos = G.cargar(); App.estado.perfil = null; D.abierto = false; App.ir('portada'); } } }, 'Borrar todos los datos de este navegador'))));
  }
})(typeof self !== 'undefined' ? self : this);
