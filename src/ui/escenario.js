/*
 * RUMBO — Escenario: dibuja el tablero en SVG y reproduce la TRAZA del intérprete
 * con animaciones (Lumo se mueve, gira, salta, recoge, activa mecanismos…).
 * No decide nada del juego: solo muestra lo que la traza dice.
 */
(function (root) {
  'use strict';
  var UI = root.RumboUI = root.RumboUI || {};
  var A = function () { return UI.Arte; };
  var CELDA = 64;
  var DELTA = { N: [0, -1], E: [1, 0], S: [0, 1], O: [-1, 0] };
  var OPUESTA = { N: 'S', S: 'N', E: 'O', O: 'E' };
  var ANGULO = { N: -90, E: 0, S: 90, O: 180 };

  function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function crear(contenedor, nivel, op) {
    op = op || {};
    var ancho = nivel.mapa[0].length, alto = nivel.mapa.length;
    var zona = nivel.zona || 'jardin';
    var skin = nivel.skin || {};
    var disfraz = op.disfraz | 0;
    var vel = op.velocidad || 1;
    var cancelado = false, pausado = false, reanudar = null, corriendo = false;
    var pos = { x: nivel.inicio.x, y: nivel.inicio.y, dir: nivel.inicio.dir };
    var expr = 'normal';

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + (ancho * CELDA) + ' ' + (alto * CELDA));
    svg.setAttribute('class', 'tablero zona-' + zona);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Tablero del nivel: ' + (nivel.titulo || ''));
    svg.dataset.ancho = ancho; svg.dataset.alto = alto;

    var capaSuelo = '', capaObj = '';
    var T = A().TEMAS[zona];
    for (var y = 0; y < alto; y++) {
      for (var x = 0; x < ancho; x++) {
        var c = nivel.mapa[y].charAt(x);
        var tipo = c === 'o' ? '.' : c;
        capaSuelo += '<g transform="translate(' + (x * CELDA) + ' ' + (y * CELDA) + ')" data-celda="' + x + ',' + y + '">' + A().celda(tipo, zona, x, y, skin) + '</g>';
        if (c === 'o') capaObj += '<g class="obj" data-x="' + x + '" data-y="' + y + '" style="transform:translate(' + (x * CELDA) + 'px,' + (y * CELDA) + 'px)"><g class="obj-in">' + A().objeto(zona, skin) + '</g></g>';
      }
    }
    svg.innerHTML = '<g class="suelo">' + capaSuelo + '</g><g class="objetos">' + capaObj + '</g>' +
      '<g class="lumo" style="transform:translate(' + (pos.x * CELDA) + 'px,' + (pos.y * CELDA) + 'px)"><g class="lumo-in"><g class="lumo-cara"></g></g></g><g class="efectos"></g>';
    contenedor.innerHTML = '';
    contenedor.appendChild(svg);

    var gLumo = svg.querySelector('.lumo'), gIn = svg.querySelector('.lumo-in'), gCara = svg.querySelector('.lumo-cara'), gEf = svg.querySelector('.efectos');

    function dibujarLumo() {
      var s = A().lumo({ dir: pos.dir, expr: expr, disfraz: disfraz });
      gCara.innerHTML = s.replace('class="lumo-svg"', 'class="lumo-svg" x="2" y="-4" width="60" height="60"');
    }
    function colocar(x, y, ms) {
      gLumo.style.transitionDuration = ms + 'ms';
      gLumo.style.transform = 'translate(' + (x * CELDA) + 'px,' + (y * CELDA) + 'px)';
    }
    function anim(clase, ms) {
      gIn.classList.remove('hop', 'bump', 'caer', 'giro-w', 'alegre');
      void gIn.getBoundingClientRect();
      gIn.style.setProperty('--ms', ms + 'ms');
      gIn.classList.add(clase);
    }
    function efecto(x, y, html, ms) {
      var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'fx');
      g.style.transform = 'translate(' + (x * CELDA) + 'px,' + (y * CELDA) + 'px)';
      g.innerHTML = html;
      gEf.appendChild(g);
      setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, ms || 900);
    }
    function chispas(x, y) {
      var h = '';
      for (var i = 0; i < 8; i++) {
        var a = i * Math.PI / 4;
        h += '<circle class="chispa" cx="32" cy="32" r="4" fill="#ffd93d" style="--dx:' + Math.round(Math.cos(a) * 30) + 'px;--dy:' + Math.round(Math.sin(a) * 30) + 'px"/>';
      }
      efecto(x, y, h, 800);
    }

    function reiniciar() {
      cancelado = true; pausado = false; if (reanudar) { reanudar(); reanudar = null; }
      pos = { x: nivel.inicio.x, y: nivel.inicio.y, dir: nivel.inicio.dir };
      expr = 'normal';
      gIn.classList.remove('hop', 'bump', 'caer', 'giro-w', 'alegre');
      gIn.style.opacity = '';
      colocar(pos.x, pos.y, 0);
      dibujarLumo();
      svg.querySelectorAll('.obj').forEach(function (o) { o.classList.remove('recogido'); });
      svg.querySelectorAll('.puerta').forEach(function (p) { p.innerHTML = A().puerta(false, zona); });
      svg.querySelectorAll('.interruptor').forEach(function (p) { p.innerHTML = A().interruptor(false); });
      gEf.innerHTML = '';
      svg.dataset.x = pos.x; svg.dataset.y = pos.y; svg.dataset.dir = pos.dir; svg.dataset.recogidos = 0; svg.dataset.estado = 'listo';
    }

    function dur(f) { return Math.max(60, Math.round(560 * (f || 1) / vel)); }
    async function espera(ms) {
      await esperar(ms);
      while (pausado && !cancelado) await new Promise(function (r) { reanudar = r; });
    }

    var recogidos = 0;
    async function reproducir(resultado, cb) {
      cb = cb || {};
      reiniciar();
      cancelado = false; corriendo = true; recogidos = 0;
      svg.dataset.estado = 'ejecutando';
      var S = UI.Sonido;
      await espera(120);
      for (var i = 0; i < resultado.traza.length && !cancelado; i++) {
        var p = resultado.traza[i];
        if (cb.alPaso) cb.alPaso(p, i);
        var d = dur(1);
        if (p.evento === 'control') { await espera(Math.round(d * .45)); continue; }
        expr = 'normal';
        switch (p.evento) {
          case 'mover':
            S && S.sfx('paso'); colocar(p.a.x, p.a.y, d); pos = { x: p.a.x, y: p.a.y, dir: p.a.dir };
            await espera(d + 40); break;
          case 'salto':
            S && S.sfx('salto'); anim('hop', d * 1.3); colocar(p.a.x, p.a.y, d * 1.3); pos = { x: p.a.x, y: p.a.y, dir: p.a.dir };
            await espera(d * 1.3 + 40); break;
          case 'giro':
            S && S.sfx('giro'); pos.dir = p.a.dir; dibujarLumo(); anim('giro-w', d);
            await espera(d); break;
          case 'recoger': {
            S && S.sfx('recoger');
            var o = svg.querySelector('.obj[data-x="' + p.de.x + '"][data-y="' + p.de.y + '"]');
            if (o) o.classList.add('recogido');
            recogidos++; svg.dataset.recogidos = recogidos;
            chispas(p.de.x, p.de.y); expr = 'feliz'; dibujarLumo(); anim('hop', d);
            if (cb.alRecoger) cb.alRecoger(recogidos);
            await espera(d); break;
          }
          case 'activar':
            S && S.sfx('activar');
            svg.querySelectorAll('.interruptor').forEach(function (e) { e.innerHTML = A().interruptor(true); });
            svg.querySelectorAll('.puerta').forEach(function (e) { e.innerHTML = A().puerta(true, zona); });
            svg.dataset.puertas = 'abiertas';
            chispas(p.de.x, p.de.y); anim('hop', d);
            await espera(d); break;
          case 'espera':
            expr = 'pensando'; dibujarLumo(); await espera(d); break;
          case 'sin-efecto':
            expr = 'pensando'; dibujarLumo(); S && S.sfx('animo'); anim('giro-w', d);
            await espera(d); break;
          case 'choque': {
            S && S.sfx('choque');
            var dirM = p.t === 'retroceder' ? OPUESTA[p.de.dir] : p.de.dir, dd = DELTA[dirM];
            expr = 'sorpresa'; dibujarLumo();
            colocar(p.de.x + dd[0] * .35, p.de.y + dd[1] * .35, d * .3);
            await espera(d * .3);
            colocar(p.de.x, p.de.y, d * .4); anim('bump', d * .5);
            await espera(d * .5); break;
          }
          case 'caida':
            S && S.sfx('caida'); expr = 'sorpresa'; dibujarLumo();
            colocar(p.a.x, p.a.y, d); pos = { x: p.a.x, y: p.a.y, dir: p.a.dir };
            await espera(d * .6); anim('caer', d * 1.2);
            efecto(p.a.x, p.a.y, '<circle class="onda" cx="32" cy="32" r="8" fill="none" stroke="#fff" stroke-width="4"/>', 900);
            await espera(d * 1.3); break;
        }
        svg.dataset.x = pos.x; svg.dataset.y = pos.y; svg.dataset.dir = pos.dir;
      }
      corriendo = false;
      if (cancelado) { return { cancelado: true }; }
      if (resultado.ok) {
        S && S.sfx('victoria');
        expr = 'feliz'; dibujarLumo(); anim('alegre', 900); chispas(pos.x, pos.y);
        svg.dataset.estado = 'victoria';
        await espera(900);
      } else {
        svg.dataset.estado = 'fin-' + resultado.motivo;
        if (resultado.motivo !== 'caida') { expr = 'pensando'; dibujarLumo(); }
        await espera(350);
      }
      return { cancelado: false };
    }

    reiniciar();
    return {
      el: svg, reproducir: reproducir, reiniciar: reiniciar,
      pausar: function () { pausado = true; svg.dataset.estado = 'pausa'; },
      continuar: function () { pausado = false; svg.dataset.estado = 'ejecutando'; if (reanudar) { var r = reanudar; reanudar = null; r(); } },
      cancelar: function () { cancelado = true; pausado = false; if (reanudar) { var r = reanudar; reanudar = null; r(); } },
      estaPausado: function () { return pausado; },
      estaCorriendo: function () { return corriendo; },
      velocidad: function (v) { vel = v; },
      disfraz: function (d) { disfraz = d | 0; dibujarLumo(); },
      expresion: function (e) { expr = e; dibujarLumo(); },
      posicion: function () { return { x: pos.x, y: pos.y, dir: pos.dir }; }
    };
  }

  UI.Escenario = { crear: crear, CELDA: CELDA };
})(typeof self !== 'undefined' ? self : this);
