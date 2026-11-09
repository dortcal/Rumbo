/*
 * RUMBO — Editor de programas por tarjetas.
 *   - Paleta con las tarjetas desbloqueadas del nivel.
 *   - Zona de programación: lista principal, listas anidadas (repetir / si / mientras) y recetas.
 *   - Arrastrar y soltar con Pointer Events (ratón, táctil y lápiz) + alternativa de tocar.
 *   - Infantil: huecos fijos y grandes, sin texto, tocar una tarjeta de la secuencia la quita.
 * El modelo es exactamente el del intérprete: { principal: [...], recetas: { A: [...] } }.
 * Las direcciones de lista y de nodo (“ruta”) coinciden con las de la traza del intérprete.
 */
(function (root) {
  'use strict';
  var UI = root.RumboUI = root.RumboUI || {};
  var h = function () { return UI.h.apply(null, arguments); };
  var CLAVE_HIJOS = { c: 'cuerpo', e: 'entonces', s: 'sino' };

  function crear(contenedor, nivel, op) {
    op = op || {};
    var Ar = UI.Arte, I = root.RumboInterprete;
    var infantil = nivel.etapa === 'infantil';
    var disp = nivel.cartas.disponibles.slice();
    var limites = nivel.cartas.limites || {};
    var recetasDisp = nivel.cartas.recetas || [];
    var conds = nivel.cartas.condiciones || [];
    var huecos = infantil ? (nivel.huecos || Math.max(3, (nivel.referencia || []).length + 1)) : 0;
    var prog = { principal: [], recetas: {} };
    recetasDisp.forEach(function (r) { prog.recetas[r] = []; });
    var historial = [], seleccion = null, activa = '', bloqueado = false;

    var el = h('div.editor' + (infantil ? '.infantil' : ''));
    var paleta = h('div.paleta', { 'aria-label': 'Tarjetas' });
    var area = h('div.area-prog', { 'aria-label': 'Tu programa' });
    var barra = h('div.barra-sel', { hidden: true });
    el.appendChild(area); el.appendChild(barra); el.appendChild(paleta);
    contenedor.innerHTML = ''; contenedor.appendChild(el);

    // ------------------------------------------------ modelo
    function listaPorDir(dir) {
      var tok = dir === '' ? [] : String(dir).split('.');
      var l;
      if (tok[0] === 'r') { l = prog.recetas[tok[1]]; tok = tok.slice(2); } else l = prog.principal;
      for (var i = 0; i < tok.length; i += 2) {
        var nodo = l && l[+tok[i]];
        if (!nodo) return null;
        l = nodo[CLAVE_HIJOS[tok[i + 1]]];
      }
      return l || null;
    }
    function nodoPorRuta(ruta) {
      var p = String(ruta).split('.'), idx = +p.pop(), dir = p.join('.');
      var l = listaPorDir(dir);
      return l ? { lista: l, idx: idx, nodo: l[idx], dir: dir } : null;
    }
    function recorrerTodo(fn) {
      function lista(l) { (l || []).forEach(function (n) { fn(n); lista(n.cuerpo); lista(n.entonces); lista(n.sino); }); }
      lista(prog.principal); Object.keys(prog.recetas).forEach(function (k) { lista(prog.recetas[k]); });
    }
    function contar() { var n = 0; recorrerTodo(function () { n++; }); return n; }
    function usados(tipo) { var n = 0; recorrerTodo(function (x) { if (x.t === tipo) n++; }); return n; }
    function nuevoNodo(t) {
      switch (t) {
        case 'repetir': return { t: t, n: 2, cuerpo: [] };
        case 'si': return { t: t, cond: { t: conds[0] || 'obstaculo-delante', no: false }, entonces: [], sino: [] };
        case 'mientras': return { t: t, cond: { t: conds[0] || 'obstaculo-delante', no: true }, cuerpo: [] };
        case 'receta': return { t: t, nombre: recetasDisp[0] || 'A' };
        default: return { t: t };
      }
    }
    function guardarHistorial() { historial.push(JSON.stringify(prog)); if (historial.length > 60) historial.shift(); }
    function cambio(sonido) {
      if (sonido && UI.Sonido) UI.Sonido.sfx(sonido);
      render();
      if (op.alCambiar) op.alCambiar();
    }
    function aviso(t) { if (op.aviso) op.aviso(t); }
    function puedeAnadir(tipo) {
      if (limites[tipo] != null && usados(tipo) >= limites[tipo]) { aviso('Ya has usado todas las tarjetas «' + Ar.CARTA_NOMBRE[tipo] + '».'); if (UI.Sonido) UI.Sonido.sfx('choque'); return false; }
      if (infantil && contar() >= huecos) { if (UI.Sonido) UI.Sonido.sfx('choque'); return false; }
      return true;
    }

    // ------------------------------------------------ vista
    function carta(tipo, grande) {
      return h('span.carta.c-' + tipo + (grande ? '.grande' : ''), { data: { tipo: tipo }, style: { '--c': Ar.CARTA_COLOR[tipo] } },
        UI.svgEl(Ar.iconoCarta(tipo, 48), 'ic'), infantil ? null : h('span.carta-nombre', Ar.CARTA_NOMBRE[tipo]));
    }
    function pildoraCond(nodo, ruta) {
      var c = nodo.cond;
      var no = h('button.btn-no' + (c.no ? '.on' : ''), { type: 'button', 'data-accion': 'no', 'aria-pressed': String(!!c.no), title: 'No', on: {
        click: function (e) { e.stopPropagation(); if (bloqueado) return; guardarHistorial(); c.no = !c.no; cambio('toque'); } } }, 'no');
      var pil = h('button.pil-cond', { type: 'button', 'data-accion': 'cond', title: 'Cambiar condición', on: {
        click: function (e) {
          e.stopPropagation(); if (bloqueado || conds.length < 2) return;
          guardarHistorial(); c.t = conds[(conds.indexOf(c.t) + 1) % conds.length]; cambio('toque');
        } } }, UI.svgEl(Ar.iconoCond(c.t, false, 30), 'ic'), h('span', Ar.COND_NOMBRE[c.t] || c.t));
      return h('span.cond', no, pil);
    }
    function stepper(nodo) {
      function mover(d) { return function (e) { e.stopPropagation(); if (bloqueado) return; var v = UI.clamp(nodo.n + d, 1, 30); if (v === nodo.n) return; guardarHistorial(); nodo.n = v; cambio('toque'); }; }
      return h('span.stepper', h('button', { type: 'button', 'data-accion': 'menos', 'aria-label': 'Menos', on: { click: mover(-1) } }, '−'),
        h('b.n', String(nodo.n)), h('button', { type: 'button', 'data-accion': 'mas', 'aria-label': 'Más', on: { click: mover(1) } }, '+'));
    }
    function lista(dir, nodos, opciones) {
      opciones = opciones || {};
      var l = h('div.lista' + (dir === activa ? '.activa-lista' : ''), { data: { dir: dir }, 'aria-label': opciones.etiqueta || 'Lista de tarjetas' });
      nodos.forEach(function (n, i) { l.appendChild(nodoVista(n, dir === '' ? String(i) : dir + '.' + i)); });
      if (infantil && dir === '') {
        for (var k = nodos.length; k < huecos; k++) l.appendChild(h('span.slot-vacio', { 'aria-hidden': 'true' }, String(k + 1)));
      } else if (!nodos.length) l.appendChild(h('span.lista-vacia', opciones.vacia || 'Suelta aquí'));
      return l;
    }
    function nodoVista(n, ruta) {
      var cls = 'carta-prog.c-' + n.t + (ruta === seleccion ? '.sel' : '');
      var base = { data: { ruta: ruta, tipo: n.t }, style: { '--c': Ar.CARTA_COLOR[n.t] } };
      if (n.t === 'repetir') {
        if (!n.cuerpo) n.cuerpo = [];
        return h('div.' + cls.replace(/\./g, '.') + '.ctrl', base,
          h('div.ctrl-cab', UI.svgEl(Ar.iconoCarta('repetir', 36), 'ic'), infantil ? null : h('span.carta-nombre', 'Repetir'), stepper(n)),
          lista(ruta + '.c', n.cuerpo, { etiqueta: 'Lo que se repite', vacia: 'Lo que se repite' }));
      }
      if (n.t === 'mientras') {
        if (!n.cuerpo) n.cuerpo = [];
        return h('div.' + cls + '.ctrl', base,
          h('div.ctrl-cab', UI.svgEl(Ar.iconoCarta('mientras', 36), 'ic'), h('span.carta-nombre', 'Mientras'), pildoraCond(n, ruta)),
          lista(ruta + '.c', n.cuerpo, { etiqueta: 'Mientras se cumpla', vacia: 'Lo que se repite' }));
      }
      if (n.t === 'si') {
        if (!n.entonces) n.entonces = []; if (!n.sino) n.sino = [];
        return h('div.' + cls + '.ctrl', base,
          h('div.ctrl-cab', UI.svgEl(Ar.iconoCarta('si', 36), 'ic'), h('span.carta-nombre', 'Si'), pildoraCond(n, ruta)),
          h('div.rama', h('span.rama-t', 'entonces'), lista(ruta + '.e', n.entonces, { etiqueta: 'Entonces', vacia: 'Entonces…' })),
          h('div.rama', h('span.rama-t', 'si no'), lista(ruta + '.s', n.sino, { etiqueta: 'Si no', vacia: 'Si no…' })));
      }
      if (n.t === 'receta') {
        var ins = h('div.' + cls + '.receta-uso', base, UI.svgEl(Ar.iconoCarta('receta', 40), 'ic'),
          h('button.letra', { type: 'button', 'data-accion': 'receta', title: 'Cambiar receta', on: { click: function (e) {
            e.stopPropagation(); if (bloqueado || recetasDisp.length < 2) return;
            guardarHistorial(); n.nombre = recetasDisp[(recetasDisp.indexOf(n.nombre) + 1) % recetasDisp.length]; cambio('toque'); } } }, n.nombre));
        return ins;
      }
      return h('div.' + cls + '.simple' + (infantil ? '.grande' : ''), base,
        UI.svgEl(Ar.iconoCarta(n.t, infantil ? 72 : 44), 'ic'), infantil ? null : h('span.carta-nombre', Ar.CARTA_NOMBRE[n.t]));
    }

    function render() {
      area.innerHTML = '';
      var hayAnid = false;
      recorrerTodo(function (n) { if (n.cuerpo || n.entonces) hayAnid = true; });
      var multi = hayAnid || recetasDisp.length > 0;
      if (!multi) activa = '';
      if (activa !== '' && !listaPorDir(activa)) activa = '';
      var principal = h('div.bloque-prog.principal',
        multi && !infantil ? h('div.bloque-t', recetasDisp.length ? 'Programa principal' : 'Tu programa') : null,
        lista('', prog.principal, { etiqueta: 'Programa principal', vacia: infantil ? '' : 'Arrastra o toca las tarjetas' }));
      area.appendChild(principal);
      recetasDisp.forEach(function (r) {
        area.appendChild(h('div.bloque-prog.receta', h('div.bloque-t', UI.svgEl(Ar.iconoCarta('receta', 22), 'ic'), 'Receta ' + r),
          lista('r.' + r, prog.recetas[r], { etiqueta: 'Receta ' + r, vacia: 'Guarda aquí un trozo para reutilizarlo' })));
      });
      area.classList.toggle('multi', multi);
      // paleta
      paleta.innerHTML = '';
      disp.forEach(function (t) {
        var restante = limites[t] != null ? limites[t] - usados(t) : null;
        var b = h('button.paleta-carta' + (restante === 0 ? '.agotada' : '') + (infantil ? '.grande' : ''), { type: 'button', data: { tipo: t }, 'aria-label': Ar.CARTA_NOMBRE[t],
          style: { '--c': Ar.CARTA_COLOR[t] } },
          UI.svgEl(Ar.iconoCarta(t, infantil ? 72 : 44), 'ic'), infantil ? null : h('span.carta-nombre', Ar.CARTA_NOMBRE[t]),
          restante != null ? h('span.insignia-lim', String(restante)) : null);
        paleta.appendChild(b);
      });
      // barra de selección (solo Primaria)
      var sel = seleccion != null && !infantil ? nodoPorRuta(seleccion) : null;
      if (!sel || !sel.nodo) { seleccion = null; barra.hidden = true; barra.innerHTML = ''; }
      else {
        barra.hidden = false; barra.innerHTML = '';
        [['dup', 'Duplicar', '⧉'], ['izq', 'Mover antes', '◀'], ['der', 'Mover después', '▶'], ['borrar', 'Borrar', '🗑']].forEach(function (a) {
          barra.appendChild(h('button.btn-sel.s-' + a[0], { type: 'button', 'data-sel': a[0], on: { click: function () { accionSeleccion(a[0]); } } }, h('span.ic', a[2]), h('span', a[1])));
        });
      }
      marcar();
    }

    function accionSeleccion(a) {
      if (bloqueado || seleccion == null) return;
      var s = nodoPorRuta(seleccion); if (!s || !s.nodo) return;
      if (a === 'borrar') { guardarHistorial(); s.lista.splice(s.idx, 1); seleccion = null; cambio('quitar'); return; }
      if (a === 'dup') {
        var copia = UI.clon(s.nodo), cnt = {};
        // Respetar los límites de tarjetas al duplicar
        var ok = true; (function rec(n) { cnt[n.t] = (cnt[n.t] || 0) + 1; (n.cuerpo || []).concat(n.entonces || [], n.sino || []).forEach(rec); })(copia);
        Object.keys(cnt).forEach(function (t) { if (limites[t] != null && usados(t) + cnt[t] > limites[t]) ok = false; });
        if (infantil && contar() + 1 > huecos) ok = false;
        if (!ok) { aviso('No quedan tarjetas suficientes para duplicar.'); if (UI.Sonido) UI.Sonido.sfx('choque'); return; }
        guardarHistorial(); s.lista.splice(s.idx + 1, 0, copia);
        seleccion = (s.dir === '' ? '' : s.dir + '.') + (s.idx + 1); cambio('poner'); return;
      }
      var j = a === 'izq' ? s.idx - 1 : s.idx + 1;
      if (j < 0 || j >= s.lista.length) return;
      guardarHistorial();
      var t = s.lista[s.idx]; s.lista[s.idx] = s.lista[j]; s.lista[j] = t;
      seleccion = (s.dir === '' ? '' : s.dir + '.') + j; cambio('toque');
    }

    // ------------------------------------------------ interacción: arrastrar y soltar
    var arr = null;   // estado del arrastre
    function dirDeLista(elm) { return elm.dataset.dir; }
    function listaBajo(x, y) {
      var els = document.elementsFromPoint(x, y);
      for (var i = 0; i < els.length; i++) { if (els[i].classList && els[i].classList.contains('lista') && area.contains(els[i])) return els[i]; }
      for (var k = 0; k < els.length; k++) { if (els[k] === area || els[k].classList.contains('bloque-prog')) { return area.querySelector('.bloque-prog.principal .lista'); } }
      return null;
    }
    function indiceEn(listaEl, x, y) {
      var hijos = Array.prototype.filter.call(listaEl.children, function (c) { return c.classList.contains('carta-prog'); });
      for (var i = 0; i < hijos.length; i++) {
        if (arr && arr.origenEl && hijos[i] === arr.origenEl) continue;
        var r = hijos[i].getBoundingClientRect();
        if (y < r.top || (y <= r.bottom && x < r.left + r.width / 2)) return { i: i, ref: hijos[i] };
      }
      return { i: hijos.length, ref: null };
    }
    function limpiarIndicador() {
      el.querySelectorAll('.drop-antes,.drop-fin,.sobre').forEach(function (e) { e.classList.remove('drop-antes', 'drop-fin', 'sobre'); });
    }
    function iniciarArrastre(e, desdePaleta, tipo, ruta, origenEl) {
      if (bloqueado || e.button > 0) return;
      arr = { desdePaleta: desdePaleta, tipo: tipo, ruta: ruta, origenEl: origenEl, x0: e.clientX, y0: e.clientY, activo: false, id: e.pointerId, fantasma: null };
      window.addEventListener('pointermove', mover);
      window.addEventListener('pointerup', soltar);
      window.addEventListener('pointercancel', cancelar);
    }
    function mover(e) {
      if (!arr || e.pointerId !== arr.id) return;
      if (!arr.activo) {
        if (Math.hypot(e.clientX - arr.x0, e.clientY - arr.y0) < 8) return;
        arr.activo = true;
        arr.fantasma = h('div.fantasma', { style: { '--c': Ar.CARTA_COLOR[arr.tipo] } }, carta(arr.tipo, true));
        document.body.appendChild(arr.fantasma);
        if (arr.origenEl) arr.origenEl.classList.add('arrastrando');
        el.classList.add('arrastre');
        if (UI.Sonido) UI.Sonido.sfx('toque');
      }
      e.preventDefault();
      arr.fantasma.style.transform = 'translate(' + (e.clientX - 40) + 'px,' + (e.clientY - 40) + 'px)';
      limpiarIndicador();
      var pal = document.elementsFromPoint(e.clientX, e.clientY).indexOf(paleta) >= 0;
      if (pal && !arr.desdePaleta) { paleta.classList.add('sobre'); return; }
      var l = listaBajo(e.clientX, e.clientY);
      if (l) {
        var pos = indiceEn(l, e.clientX, e.clientY);
        l.classList.add('sobre');
        if (pos.ref) pos.ref.classList.add('drop-antes'); else l.classList.add('drop-fin');
      }
    }
    function terminarArrastre() {
      window.removeEventListener('pointermove', mover); window.removeEventListener('pointerup', soltar); window.removeEventListener('pointercancel', cancelar);
      if (arr && arr.fantasma && arr.fantasma.parentNode) arr.fantasma.parentNode.removeChild(arr.fantasma);
      if (arr && arr.origenEl) arr.origenEl.classList.remove('arrastrando');
      limpiarIndicador(); el.classList.remove('arrastre');
    }
    function cancelar() { terminarArrastre(); arr = null; }
    function soltar(e) {
      if (!arr || e.pointerId !== arr.id) return;
      var a = arr; arr = null;
      var estabaActivo = a.activo;
      var destinoPal = estabaActivo && document.elementsFromPoint(e.clientX, e.clientY).indexOf(paleta) >= 0;
      var l = estabaActivo ? listaBajo(e.clientX, e.clientY) : null;
      var pos = l ? indiceEn(l, e.clientX, e.clientY) : null;
      arr = a; terminarArrastre(); arr = null;
      if (!estabaActivo) {
        // simple toque
        if (a.desdePaleta) anadirPorToque(a.tipo); else tocarCarta(a.ruta);
        return;
      }
      if (a.desdePaleta) {
        if (!l) return;
        if (!puedeAnadir(a.tipo)) return;
        guardarHistorial();
        var destino = listaPorDir(dirDeLista(l)); if (!destino) return;
        destino.splice(pos.i, 0, nuevoNodo(a.tipo));
        seleccion = null; cambio('poner');
        return;
      }
      var s = nodoPorRuta(a.ruta); if (!s || !s.nodo) return;
      if (destinoPal) { guardarHistorial(); s.lista.splice(s.idx, 1); seleccion = null; cambio('quitar'); return; }
      if (!l) return;
      var dd = dirDeLista(l);
      if (dd === a.ruta || dd.indexOf(a.ruta + '.') === 0) return;      // no meter un bloque dentro de sí mismo
      var dest = listaPorDir(dd); if (!dest) return;
      guardarHistorial();
      var nodo = s.lista.splice(s.idx, 1)[0];
      var i = pos.i;
      if (dest === s.lista && s.idx < i) i--;
      // pos.i se calculó ignorando el propio elemento, así que ya cuenta sin él
      if (dest === s.lista) i = pos.i;
      dest.splice(Math.min(i, dest.length), 0, nodo);
      seleccion = null; cambio('poner');
    }
    function anadirPorToque(tipo) {
      if (bloqueado || !puedeAnadir(tipo)) return;
      var destino = listaPorDir(activa) || prog.principal;
      guardarHistorial();
      var n = nuevoNodo(tipo); destino.push(n);
      if (!infantil && (tipo === 'repetir' || tipo === 'mientras' || tipo === 'si')) {
        var ruta = (activa === '' ? '' : activa + '.') + (destino.length - 1);
        activa = ruta + (tipo === 'si' ? '.e' : '.c');
      }
      seleccion = null; cambio('poner');
    }
    function tocarCarta(ruta) {
      if (bloqueado) return;
      if (infantil) {
        var s = nodoPorRuta(ruta); if (!s || !s.nodo) return;
        guardarHistorial(); s.lista.splice(s.idx, 1); cambio('quitar'); return;
      }
      seleccion = seleccion === ruta ? null : ruta;
      if (UI.Sonido) UI.Sonido.sfx('toque');
      render();
    }

    paleta.addEventListener('pointerdown', function (e) {
      var b = e.target.closest('.paleta-carta'); if (!b || b.classList.contains('agotada')) {
        if (b && b.classList.contains('agotada')) { aviso('Ya has usado todas las tarjetas «' + Ar.CARTA_NOMBRE[b.dataset.tipo] + '».'); if (UI.Sonido) UI.Sonido.sfx('choque'); }
        return;
      }
      iniciarArrastre(e, true, b.dataset.tipo, null, null);
    });
    area.addEventListener('pointerdown', function (e) {
      if (e.target.closest('[data-accion]')) return;
      var c = e.target.closest('.carta-prog');
      if (c) { iniciarArrastre(e, false, c.dataset.tipo, c.dataset.ruta, c); e.stopPropagation(); return; }
      var l = e.target.closest('.lista');
      if (l && !bloqueado) { var d = l.dataset.dir; if (activa !== d) { activa = d; render(); } }
    });
    // Teclado: Enter/Espacio sobre una carta de la paleta la añade.
    paleta.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.paleta-carta')) { e.preventDefault(); anadirPorToque(e.target.closest('.paleta-carta').dataset.tipo); }
    });

    // ------------------------------------------------ API
    function marcar() {
      el.querySelectorAll('.error').forEach(function (e) { e.classList.remove('error'); });
    }
    function programa() {
      var recetas = {}, hay = false;
      Object.keys(prog.recetas).forEach(function (k) { recetas[k] = UI.clon(prog.recetas[k]); hay = true; });
      return hay ? { principal: UI.clon(prog.principal), recetas: recetas } : UI.clon(prog.principal);
    }
    function cargar(p) {
      guardarHistorial();
      if (Array.isArray(p)) { prog.principal = UI.clon(p); }
      else { prog.principal = UI.clon(p.principal || []); Object.keys(prog.recetas).forEach(function (k) { prog.recetas[k] = UI.clon((p.recetas || {})[k] || []); }); }
      seleccion = null; activa = ''; render();
    }
    function limpiar() { if (!contar()) return; guardarHistorial(); prog.principal = []; Object.keys(prog.recetas).forEach(function (k) { prog.recetas[k] = []; }); seleccion = null; activa = ''; cambio('quitar'); }
    function deshacer() {
      if (bloqueado || !historial.length) return false;
      prog = JSON.parse(historial.pop()); seleccion = null; render(); if (op.alCambiar) op.alCambiar(); if (UI.Sonido) UI.Sonido.sfx('quitar'); return true;
    }
    function resaltar(ruta) {
      el.querySelectorAll('.carta-prog.activa').forEach(function (e) { e.classList.remove('activa'); });
      if (ruta == null) return;
      var c = el.querySelector('.carta-prog[data-ruta="' + ruta + '"]');
      if (c) { c.classList.add('activa'); if (c.scrollIntoView) c.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    }
    function marcarError(ruta) {
      marcar();
      if (ruta == null) return;
      var c = el.querySelector('.carta-prog[data-ruta="' + ruta + '"]'); if (c) c.classList.add('error');
    }
    function bloquear(b) { bloqueado = !!b; el.classList.toggle('bloqueado', bloqueado); }

    render();
    return {
      el: el, obtener: programa, cargar: cargar, limpiar: limpiar, deshacer: deshacer, resaltar: resaltar, marcarError: marcarError,
      bloquear: bloquear, vacio: function () { return contar() === 0; }, contar: contar, puedeDeshacer: function () { return historial.length > 0; },
      anadir: anadirPorToque, huecos: huecos
    };
  }

  UI.Editor = { crear: crear };
})(typeof self !== 'undefined' ? self : this);
