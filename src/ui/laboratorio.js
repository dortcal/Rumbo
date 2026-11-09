/*
 * RUMBO — Laboratorio de programación (modo creador).
 * Usa el MISMO motor y las mismas tarjetas que los mundos: el reto se prueba en la pantalla de juego
 * y solo se puede guardar cuando su autor lo ha resuelto (así sabemos que tiene solución).
 */
(function (root) {
  'use strict';
  var UI = root.RumboUI = root.RumboUI || {};
  var h = function () { return UI.h.apply(null, arguments); };
  var App = UI.App, R = function () { return root.RumboRetos; };
  var borrador = null;     // reto en edición (se conserva al ir a probarlo y volver)

  var HERR = {
    inicio: { n: 'Lumo', c: '.' }, meta: { n: 'Meta', c: 'G' }, pared: { n: 'Pared', c: '#' }, agua: { n: 'Agua', c: '~' }, barrera: { n: 'Barrera', c: 'b' },
    objeto: { n: 'Objeto', c: 'o' }, interruptor: { n: 'Interruptor', c: 's' }, puerta: { n: 'Puerta', c: 'd' }, borrar: { n: 'Borrar', c: '.' }
  };
  var SIGUIENTE_DIR = { E: 'S', S: 'O', O: 'N', N: 'E' };

  function ciclo() { return R().cicloDe(App.perfil().curso); }
  function nuevoBorrador() {
    var c = R().CICLOS[ciclo()], w = c.tam[0] + 1, hh = c.tam[0] + 1;
    var m = []; for (var y = 0; y < hh; y++) { m.push(new Array(w + 1).join('.')); }
    m[hh - 1] = m[hh - 1].slice(0, w - 1) + 'G';
    return { id: 'r' + Date.now().toString(36), nombre: '', autor: App.perfil().nombre, ciclo: ciclo(), zona: c.zonas[0], mapa: m, inicio: { x: 0, y: 0, dir: 'E' }, referencia: null, creado: Date.now() };
  }
  function celdas(reto) { return reto.mapa.map(function (f) { return f.split(''); }); }
  function aMapa(g) { return g.map(function (f) { return f.join(''); }); }

  // ------------------------------------------------------------- hub
  App.registrar('laboratorio', function (cont) {
    var p = App.perfil(); if (!p) { App.ir('jugadores'); return; }
    App.nubes(cont); UI.Sonido.musica('mapa');
    var D = App.estado.docente;
    cont.appendChild(App.cabecera('Laboratorio de programación', { atras: function () { App.ir(D && D.abierto ? 'docente' : 'mapa'); } }));
    var inf = root.RumboProgreso.esInfantil(p);
    var intro = h('div.formulario.lab-intro', h('div.lab-lumo', { html: UI.Arte.lumo({ expr: 'pensando', dir: 'S', disfraz: p.disfraz }) }),
      h('div', h('h2', 'Ahora te toca a ti guiar a otros'), h('p', inf ? 'Construye un camino con piezas grandes y comprueba que Lumo puede llegar.' : 'Diseña un tablero, resuélvelo tú y comparte el reto con tus compañeros.')));
    cont.appendChild(intro);
    var acc = h('div.lab-acciones',
      App.boton('Crear un reto', 'principal', function () { borrador = nuevoBorrador(); App.ir('lab-editor'); }, '<svg viewBox="0 0 32 32"><path d="M16 5v22M5 16h22" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>'),
      App.boton('Importar un reto', 'sec', function () { modalImportar(); }));
    cont.appendChild(acc);
    // mis retos
    var mios = h('section.doc-caja.lab-lista', h('h2', 'Mis retos'));
    if (!p.retos.length) mios.appendChild(h('p.nota', 'Todavía no has creado ni importado ningún reto.'));
    p.retos.forEach(function (r) { mios.appendChild(fila(r, true)); });
    cont.appendChild(mios);
    // retos de otros jugadores de este equipo (retos por parejas)
    var otros = [];
    App.datos().perfiles.forEach(function (q) { if (q !== p) (q.retos || []).forEach(function (r) { if (!r.ajeno) otros.push(r); }); });
    if (otros.length) {
      var s = h('section.doc-caja.lab-lista', h('h2', 'Retos de otros jugadores de este equipo'));
      otros.forEach(function (r) { s.appendChild(fila(r, false)); });
      cont.appendChild(s);
    }
  });

  function miniatura(r) {
    var w = r.mapa[0].length, hh = r.mapa.length, s = '';
    for (var y = 0; y < hh; y++) for (var x = 0; x < w; x++) {
      var ch = r.mapa[y].charAt(x);
      s += '<g transform="translate(' + (x * 64) + ' ' + (y * 64) + ')">' + UI.Arte.celda(ch === 'o' ? '.' : ch, r.zona, x, y, {}) + (ch === 'o' ? UI.Arte.objeto(r.zona, {}) : '') + '</g>';
    }
    return '<svg viewBox="0 0 ' + (w * 64) + ' ' + (hh * 64) + '" aria-hidden="true">' + s + '</svg>';
  }

  function fila(r, editable) {
    var n = R().retoANivel(r);
    var f = h('div.reto-fila', h('div.reto-mini', { html: miniatura(r) }),
      h('div.reto-info', h('b', r.nombre), h('span', 'de ' + r.autor + ' · ' + R().CICLOS[r.ciclo].nombre + ' · ' + r.mapa[0].length + '×' + r.mapa.length)),
      h('div.reto-acc',
        h('button.btn-txt', { type: 'button', on: { click: function () { jugarReto(r); } } }, 'Jugar'),
        editable && !r.ajeno ? h('button.btn-txt', { type: 'button', on: { click: function () { borrador = JSON.parse(JSON.stringify(r)); App.ir('lab-editor'); } } }, 'Editar') : null,
        h('button.btn-txt', { type: 'button', on: { click: function () { modalCompartir(r); } } }, 'Compartir'),
        editable ? h('button.btn-txt.peligro', { type: 'button', on: { click: function () {
          if (!confirm('¿Borrar el reto «' + r.nombre + '»?')) return;
          var p = App.perfil(); p.retos.splice(p.retos.indexOf(r), 1); App.guardar(); App.ir('laboratorio'); } } }, 'Borrar') : null));
    void n;
    return f;
  }

  function jugarReto(r) {
    var nivel = R().retoANivel(r);
    App.jugarObjeto(nivel, { alSalir: function () { App.ir('laboratorio'); }, alResolver: function () { App.toast('¡Reto resuelto!'); App.ir('laboratorio'); } });
  }

  // ------------------------------------------------------------- compartir / importar
  function modal(titulo, cuerpo) {
    var ov = h('div.modal', { role: 'dialog', 'aria-label': titulo });
    var caja = h('div.modal-caja', h('h2', titulo), cuerpo);
    ov.appendChild(caja); document.body.appendChild(ov);
    return { cerrar: function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, caja: caja };
  }
  function modalCompartir(r) {
    var cod = R().codificar(r);
    var ta = h('textarea.campo.codigo-texto', { readonly: true, rows: '5', 'aria-label': 'Código del reto' }, cod);
    var m = modal('Compartir «' + r.nombre + '»', h('div', { style: { display: 'contents' } },
      h('p', 'Copia este código y envíaselo a tu compañero, o descarga el archivo.'), ta,
      h('div.doc-fila',
        h('button.btn-txt', { type: 'button', on: { click: function () { ta.select(); var ok = false; try { ok = navigator.clipboard ? (navigator.clipboard.writeText(cod), true) : document.execCommand('copy'); } catch (e) { try { ok = document.execCommand('copy'); } catch (e2) {} } App.toast(ok ? 'Código copiado.' : 'Selecciona el texto y cópialo.'); } } }, 'Copiar código'),
        h('button.btn-txt', { type: 'button', on: { click: function () { UI.descargar('reto-' + r.nombre.replace(/[^\w]+/g, '_') + '.rumbo.json', JSON.stringify({ formato: 'rumbo-reto', version: 1, nombre: r.nombre, autor: r.autor, codigo: cod }, null, 1), 'application/json'); } } }, 'Descargar archivo'))));
    m.caja.appendChild(h('button.btn-grande.principal', { type: 'button', on: { click: m.cerrar } }, h('span', 'Cerrar')));
    setTimeout(function () { ta.focus(); ta.select(); }, 50);
  }
  function modalImportar() {
    var ta = h('textarea.campo.codigo-texto', { rows: '5', placeholder: 'Pega aquí el código del reto (empieza por RUMBO1.)', 'aria-label': 'Código del reto' });
    var msg = h('div.msg-error', { role: 'alert' });
    var fi = h('input', { type: 'file', accept: '.json,application/json,text/plain', hidden: true, on: { change: function (e) { var f = e.target.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { ta.value = String(rd.result).slice(0, 200000); }; rd.readAsText(f); } } });
    var m = modal('Importar un reto', h('div', { style: { display: 'contents' } }, ta, msg, h('button.btn-txt', { type: 'button', on: { click: function () { fi.click(); } } }, 'Elegir un archivo…'), fi));
    m.caja.appendChild(h('div.res-acciones',
      h('button.btn-grande.sec', { type: 'button', on: { click: m.cerrar } }, h('span', 'Cancelar')),
      h('button.btn-grande.principal', { type: 'button', on: { click: function () {
        var d = R().decodificar(ta.value);
        if (!d.ok) { msg.textContent = R().MENSAJES[d.motivo] || 'No se ha podido importar.'; UI.Sonido.sfx('choque'); return; }
        var p = App.perfil(); d.reto.ajeno = true; d.reto.id = 'i' + Date.now().toString(36);
        p.retos.push(d.reto); App.guardar(); m.cerrar(); UI.Sonido.sfx('desbloqueo'); App.toast('Reto importado: ' + d.reto.nombre); App.ir('laboratorio');
      } } }, h('span', 'Importar'))));
  }

  // ------------------------------------------------------------- editor del tablero
  App.registrar('lab-editor', function (cont) {
    var p = App.perfil(); if (!p) { App.ir('jugadores'); return; }
    if (!borrador) borrador = nuevoBorrador();
    var C = R().CICLOS[borrador.ciclo], reto = borrador, herr = 'pared';
    App.nubes(cont); UI.Sonido.musica(reto.zona);
    cont.appendChild(App.cabecera(root.RumboProgreso.esInfantil(p) ? 'Crea tu camino' : 'Crear un reto', { atras: function () { borrador = null; App.ir('laboratorio'); } }));
    var cuerpo = h('div.lab-cuerpo'), lienzo = h('div.lab-lienzo'), panel = h('div.lab-panel');
    cuerpo.appendChild(lienzo); cuerpo.appendChild(panel); cont.appendChild(cuerpo);

    function render() {
      var w = reto.mapa[0].length, hh = reto.mapa.length, s = '';
      for (var y = 0; y < hh; y++) for (var x = 0; x < w; x++) {
        var ch = reto.mapa[y].charAt(x);
        s += '<g transform="translate(' + (x * 64) + ' ' + (y * 64) + ')" data-celda="' + x + ',' + y + '">' + UI.Arte.celda(ch === 'o' ? '.' : ch, reto.zona, x, y, {}) + (ch === 'o' ? UI.Arte.objeto(reto.zona, {}) : '') + '</g>';
      }
      var l = UI.Arte.lumo({ dir: reto.inicio.dir, expr: 'feliz', disfraz: p.disfraz }).replace('class="lumo-svg"', 'class="lumo-svg" x="2" y="-4" width="60" height="60"');
      s += '<g transform="translate(' + (reto.inicio.x * 64) + ' ' + (reto.inicio.y * 64) + ')" pointer-events="none">' + l + '</g>';
      lienzo.innerHTML = '<svg class="tablero lab-tablero" viewBox="0 0 ' + (w * 64) + ' ' + (hh * 64) + '" role="img" aria-label="Tablero que estás creando">' + s + '</svg>';
      var svg = lienzo.firstChild;
      var down = false, ultima = '';
      function celdaDe(e) {
        var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        var q = pt.matrixTransform(svg.getScreenCTM().inverse()), x = Math.floor(q.x / 64), y = Math.floor(q.y / 64);
        return (x >= 0 && y >= 0 && x < w && y < hh) ? { x: x, y: y } : null;
      }
      function aplicar(c, inicial) {
        if (!c) return;
        var clave = c.x + ',' + c.y; if (clave === ultima && !inicial) return; ultima = clave;
        var g = celdas(reto), esInicio = c.x === reto.inicio.x && c.y === reto.inicio.y;
        if (herr === 'inicio') {
          if (esInicio && inicial) reto.inicio.dir = SIGUIENTE_DIR[reto.inicio.dir];
          else { if ('.o'.indexOf(g[c.y][c.x]) < 0) g[c.y][c.x] = '.'; reto.inicio.x = c.x; reto.inicio.y = c.y; }
        } else if (esInicio) { if (inicial) App.toast('Aquí está Lumo. Usa la herramienta «Lumo» para moverlo.'); return; }
        else if (herr === 'meta') {
          for (var y = 0; y < g.length; y++) for (var x = 0; x < g[y].length; x++) if (g[y][x] === 'G') g[y][x] = '.';
          g[c.y][c.x] = 'G';
        } else { if (g[c.y][c.x] === 'G' && herr !== 'borrar' && inicial) { /* sustituir la meta está permitido */ } g[c.y][c.x] = HERR[herr].c; }
        // nunca dejar la meta borrada
        reto.mapa = aMapa(g); reto.referencia = null;
        if (!reto.mapa.join('').includes('G')) { var g2 = celdas(reto); var ex = reto.mapa[hh - 1].length - 1; g2[hh - 1][ex] = 'G'; if (hh - 1 === reto.inicio.y && ex === reto.inicio.x) g2[0][ex] = 'G'; reto.mapa = aMapa(g2); App.toast('El reto necesita una meta: la he vuelto a poner.'); }
        UI.Sonido.sfx('poner'); render(); panelRender();
      }
      svg.addEventListener('pointerdown', function (e) { down = true; ultima = ''; svg.setPointerCapture && svg.setPointerCapture(e.pointerId); aplicar(celdaDe(e), true); });
      svg.addEventListener('pointermove', function (e) { if (down && herr !== 'inicio' && herr !== 'meta') aplicar(celdaDe(e), false); });
      ['pointerup', 'pointercancel'].forEach(function (ev) { svg.addEventListener(ev, function () { down = false; }); });
    }

    function redimensionar(dw, dh) {
      var w = reto.mapa[0].length + dw, hh = reto.mapa.length + dh;
      if (w < C.tam[0] || hh < C.tam[0] || w > C.tam[1] || hh > C.tam[1]) return;
      var g = celdas(reto), nuevo = [];
      for (var y = 0; y < hh; y++) { var fila = []; for (var x = 0; x < w; x++) fila.push(g[y] && g[y][x] ? g[y][x] : '.'); nuevo.push(fila); }
      reto.mapa = aMapa(nuevo);
      if (reto.inicio.x >= w) reto.inicio.x = w - 1; if (reto.inicio.y >= hh) reto.inicio.y = hh - 1;
      if ('.o'.indexOf(reto.mapa[reto.inicio.y].charAt(reto.inicio.x)) < 0) { var g3 = celdas(reto); g3[reto.inicio.y][reto.inicio.x] = '.'; reto.mapa = aMapa(g3); }
      if (!reto.mapa.join('').includes('G')) { var g4 = celdas(reto); var yy = hh - 1, xx = w - 1; if (reto.inicio.x === xx && reto.inicio.y === yy) { xx = 0; } g4[yy][xx] = 'G'; reto.mapa = aMapa(g4); }
      reto.referencia = null; render(); panelRender();
    }

    function panelRender() {
      panel.innerHTML = '';
      panel.appendChild(h('div.lab-herr', C.herramientas.map(function (k) {
        var icono = k === 'inicio' ? UI.Arte.lumo({ dir: reto.inicio.dir, expr: 'feliz', disfraz: p.disfraz }) :
          k === 'borrar' ? '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="22" fill="#fff" stroke="#c9bde6" stroke-width="5"/><path d="M20 44L44 20" stroke="#e8553f" stroke-width="6" stroke-linecap="round"/></svg>' :
          '<svg viewBox="0 0 64 64">' + UI.Arte.celda(k === 'objeto' ? '.' : HERR[k].c, reto.zona, 0, 0, {}) + (k === 'objeto' ? UI.Arte.objeto(reto.zona, {}) : '') + '</svg>';
        return h('button.herr' + (herr === k ? '.sel' : ''), { type: 'button', 'aria-pressed': String(herr === k), 'aria-label': HERR[k].n, on: { click: function () { herr = k; UI.Sonido.sfx('toque'); panelRender(); } } }, UI.svgEl(icono, 'herr-ic'), h('span', HERR[k].n));
      })));
      if (herr === 'inicio') panel.appendChild(h('p.nota', 'Toca a Lumo otra vez para que mire a otro lado.'));
      panel.appendChild(h('div.lab-tam', h('span.etq', 'Tamaño'),
        h('div.stepper.suelto', h('button', { type: 'button', 'aria-label': 'Menos ancho', on: { click: function () { redimensionar(-1, 0); } } }, '−'), h('b.n', reto.mapa[0].length + ' ancho'), h('button', { type: 'button', 'aria-label': 'Más ancho', on: { click: function () { redimensionar(1, 0); } } }, '+')),
        h('div.stepper.suelto', h('button', { type: 'button', 'aria-label': 'Menos alto', on: { click: function () { redimensionar(0, -1); } } }, '−'), h('b.n', reto.mapa.length + ' alto'), h('button', { type: 'button', 'aria-label': 'Más alto', on: { click: function () { redimensionar(0, 1); } } }, '+'))));
      panel.appendChild(h('div.lab-zonas', h('span.etq', 'Escenario'), C.zonas.map(function (z) {
        return h('button.chip-curso' + (reto.zona === z ? '.sel' : ''), { type: 'button', on: { click: function () { reto.zona = z; UI.Sonido.musica(z); render(); panelRender(); } } }, UI.Arte.NOMBRES_ZONA[z].replace(/^(El|La) /, ''));
      })));
      panel.appendChild(h('div.lab-botones',
        App.boton('Probar y guardar', 'principal', probar, UI.ICON.play),
        h('button.btn-txt', { type: 'button', on: { click: function () { var g = celdas(reto).map(function (f) { return f.map(function (c) { return c === 'G' ? 'G' : '.'; }); }); reto.mapa = aMapa(g); reto.referencia = null; render(); panelRender(); } } }, 'Vaciar el tablero')));
      panel.appendChild(h('p.nota', reto.referencia ? '✔ Este reto tiene una solución comprobada.' : 'Para guardar el reto tienes que resolverlo tú: así sabemos que se puede.'));
    }

    function probar() {
      var g = reto.mapa.join('');
      if (g.indexOf('G') < 0) { App.toast('Falta la meta.'); return; }
      var nivel = R().retoANivel(Object.assign({}, reto, { nombre: reto.nombre || 'Mi reto', referencia: [{ t: 'avanzar' }] }));
      nivel.referencia = [{ t: 'avanzar' }];
      nivel.objetivo = g.indexOf('o') >= 0 ? 'Recoge todo y llega a la meta.' : 'Lleva a Lumo hasta la meta.';
      nivel.titulo = 'Comprueba tu reto'; nivel.sinSolucion = true;
      delete nivel.estrellas;
      if (nivel.etapa !== 'infantil') nivel.estrellas = { s2max: 99, s3: { tipo: 'max-tarjetas', valor: 0 } };
      else nivel.huecos = 8;
      // Hasta que se resuelva, Lumo no ofrece «te lo enseña»: la referencia es un marcador.
      App.jugarObjeto(nivel, {
        alSalir: function () { App.ir('lab-editor'); },
        alResolver: function (info) { reto.referencia = info.programa; reto.creado = Date.now(); guardarReto(); }
      });
    }

    function guardarReto() {
      var inp = h('input.campo', { type: 'text', maxlength: '30', placeholder: 'Nombre del reto', value: reto.nombre || '', 'aria-label': 'Nombre del reto' });
      var msg = h('div.msg-error', { role: 'alert' });
      var m = modal('¡Tu reto tiene solución!', h('div', { style: { display: 'contents' } }, h('p', 'Ponle un nombre para guardarlo.'), inp, msg));
      m.caja.appendChild(h('div.res-acciones',
        h('button.btn-grande.sec', { type: 'button', on: { click: function () { m.cerrar(); App.ir('lab-editor'); } } }, h('span', 'Seguir editando')),
        h('button.btn-grande.principal', { type: 'button', on: { click: function () {
          reto.nombre = inp.value.trim() || 'Reto de ' + p.nombre;
          var v = R().validar(Object.assign({}, reto, { autor: p.nombre }));
          if (!v.ok) { msg.textContent = R().MENSAJES[v.motivo] || 'No se puede guardar.'; return; }
          var i = -1; p.retos.forEach(function (r, k) { if (r.id === reto.id) i = k; });
          if (i >= 0) p.retos[i] = v.reto; else p.retos.push(v.reto);
          var nuevos = root.RumboProgreso.evaluarLogros(p); App.guardar(); m.cerrar(); borrador = null;
          UI.Sonido.sfx('desbloqueo'); App.toast(nuevos.indexOf('creador') >= 0 ? '¡Reto guardado y nueva insignia: Creador de retos!' : '¡Reto guardado!'); App.ir('laboratorio');
        } } }, h('span', 'Guardar'))));
      setTimeout(function () { inp.focus(); }, 60);
    }

    render(); panelRender();
  });
})(typeof self !== 'undefined' ? self : this);
