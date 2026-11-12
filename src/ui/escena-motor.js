/*
 * RUMBO — Motor de escenas de la historia (fase 3).
 *
 * Reproduce una escena de src/datos/escenas.js con un escenario por capas (cielo, fondo lejano, fondo medio, suelo y primer plano),
 * personajes de cuerpo entero que entran, salen, se mueven y cambian de gesto, y partículas de luz.
 *
 * Una escena puede traer `pasos` (puesta en escena a mano). Si no los trae, el motor los deduce de sus `lineas`:
 * Lumo entra por la izquierda, el interlocutor por la derecha y cada frase lleva su emoción.
 *
 * Pasos reconocidos (todos opcionales):
 *   {fondo:'bosque'}                       cambia de zona (fundido)
 *   {entra:'Titila', lado:'der'|'izq'|'centro', modo:'salta'|'cae'|'desliza'}
 *   {sale:'Titila'}
 *   {emocion:'Lumo', expr:'sorprendido', pose:'arriba'}
 *   {accion:'Lumo', haz:'salta'|'baila'|'tiembla'|'gira'|'asiente'|'mira'}
 *   {objeto:'pieza'|'brujula'|'luz'|'flor'|'zanahoria', lado:'centro', brilla:true}
 *   {camara:'acerca'|'aleja'|'sacude'}
 *   {sonido:'victoria'}
 *   {espera:600}
 *   {dice:'*'}                            la siguiente frase de `lineas` (con su emoción); también vale {dice:'id_de_frase', emocion:'alegre'}
 * Con «reducir animaciones» activado no hay desplazamientos ni partículas: los personajes aparecen y desaparecen con un corte limpio.
 */
(function (root) {
  'use strict';
  var UI = root.RumboUI = root.RumboUI || {};
  var Ar = function () { return UI.Arte; };

  // ---------------------------------------------------------------- fondos por capas
  function azar(seed) { var s = seed || 7; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
  function colinas(color, y, amp, seed, ancho) {
    var r = azar(seed), d = 'M0 600V' + y, x = 0; ancho = ancho || 1200;
    while (x < ancho) { var w = 120 + r() * 160; d += 'Q' + (x + w / 2) + ' ' + (y - amp * (.4 + r())) + ' ' + (x + w) + ' ' + (y + (r() - .5) * amp * .4); x += w; }
    return '<path d="' + d + 'V600z" fill="' + color + '"/>';
  }
  function arboles(color, n, y, seed, alto) {
    var r = azar(seed), s = '';
    for (var i = 0; i < n; i++) {
      var x = (i + r() * .8) * 1300 / n - 40, h = (alto || 150) * (.7 + r() * .6), w = h * .55;
      s += '<g transform="translate(' + x.toFixed(0) + ' ' + y + ')"><rect x="-6" y="-' + (h * .3).toFixed(0) + '" width="12" height="' + (h * .35).toFixed(0) + '" fill="' + color + '" opacity=".9"/>' +
        '<path d="M0 -' + h.toFixed(0) + 'L' + (w * .7).toFixed(0) + ' -' + (h * .3).toFixed(0) + 'H-' + (w * .7).toFixed(0) + 'z" fill="' + color + '"/><path d="M0 -' + (h * .75).toFixed(0) + 'L' + w.toFixed(0) + ' -' + (h * .12).toFixed(0) + 'H-' + w.toFixed(0) + 'z" fill="' + color + '"/></g>';
    }
    return s;
  }
  function picos(color, nieve, y, seed) {
    var r = azar(seed), s = '', x = -60;
    while (x < 1260) {
      var w = 200 + r() * 160, h = 150 + r() * 170;
      s += '<path d="M' + x + ' ' + y + 'L' + (x + w / 2) + ' ' + (y - h).toFixed(0) + 'L' + (x + w) + ' ' + y + 'z" fill="' + color + '"/>';
      if (nieve) s += '<path d="M' + (x + w / 2 - w * .17).toFixed(0) + ' ' + (y - h * .66).toFixed(0) + 'L' + (x + w / 2) + ' ' + (y - h).toFixed(0) + 'L' + (x + w / 2 + w * .17).toFixed(0) + ' ' + (y - h * .66).toFixed(0) + 'l-14 12-12-10-14 10z" fill="#fff" opacity=".92"/>';
      x += w * .62;
    }
    return s;
  }
  function ciudad(color, ventana, y, seed) {
    var r = azar(seed), s = '', x = -10;
    while (x < 1220) {
      var w = 50 + r() * 70, h = 120 + r() * 220;
      s += '<rect x="' + x.toFixed(0) + '" y="' + (y - h).toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '" fill="' + color + '"/>';
      for (var vy = y - h + 14; vy < y - 14; vy += 26) for (var vx = x + 8; vx < x + w - 14; vx += 20) if (r() > .45) s += '<rect x="' + vx.toFixed(0) + '" y="' + vy.toFixed(0) + '" width="9" height="12" rx="2" fill="' + ventana + '" opacity="' + (.5 + r() * .5).toFixed(2) + '"/>';
      x += w + 6 + r() * 14;
    }
    return s;
  }
  function estrellas(n, seed, color) {
    var r = azar(seed), s = '';
    for (var i = 0; i < n; i++) s += '<circle class="titila" cx="' + (r() * 1200).toFixed(0) + '" cy="' + (r() * 420).toFixed(0) + '" r="' + (1 + r() * 2.4).toFixed(1) + '" fill="' + (color || '#fff') + '" opacity="' + (.5 + r() * .5).toFixed(2) + '" style="animation-delay:' + (r() * 3).toFixed(1) + 's"/>';
    return s;
  }
  function burbujas(n, seed) {
    var r = azar(seed), s = '';
    for (var i = 0; i < n; i++) s += '<circle class="burbuja" cx="' + (r() * 1200).toFixed(0) + '" cy="' + (200 + r() * 380).toFixed(0) + '" r="' + (4 + r() * 10).toFixed(0) + '" fill="none" stroke="#fff" stroke-width="2.5" opacity=".5" style="animation-delay:' + (r() * 5).toFixed(1) + 's"/>';
    return s;
  }
  function flores(colores, n, y, seed) {
    var r = azar(seed), s = '';
    for (var i = 0; i < n; i++) { var x = r() * 1200, c = colores[i % colores.length]; s += '<g transform="translate(' + x.toFixed(0) + ' ' + (y + r() * 60).toFixed(0) + ')"><path d="M0 0v-26" stroke="#3f8f3a" stroke-width="4"/><circle cy="-30" r="9" fill="' + c + '"/><circle cy="-30" r="3.5" fill="#ffd93d"/></g>'; }
    return s;
  }
  function rocas(color, n, y, seed) {
    var r = azar(seed), s = '';
    for (var i = 0; i < n; i++) { var x = r() * 1200, w = 40 + r() * 70; s += '<path d="M' + x.toFixed(0) + ' ' + y + 'q' + (w * .1).toFixed(0) + ' -' + (w * .7).toFixed(0) + ' ' + (w * .5).toFixed(0) + ' -' + (w * .72).toFixed(0) + 'q' + (w * .45).toFixed(0) + ' ' + (w * .1).toFixed(0) + ' ' + (w * .55).toFixed(0) + ' ' + (w * .72).toFixed(0) + 'z" fill="' + color + '"/>'; }
    return s;
  }
  function faroGrande(x, y, escala, lucesEncendidas) {
    var v = '';
    for (var i = 0; i < 6; i++) v += '<rect x="' + (-13 + (i % 2) * 14) + '" y="' + (-250 + Math.floor(i / 2) * 60 + 20) + '" width="12" height="18" rx="5" fill="' + (i < lucesEncendidas ? '#ffe27a' : '#46506f') + '"/>';
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + escala + ')"><path d="M-46 0l12-260h68l12 260z" fill="#f4f1ea"/><path d="M-40 -60h80l-3 30h-74zM-34 -150h68l-3 26h-62zM-28 -240h56l-2 22h-52z" fill="#e8553f"/>' + v +
      '<rect x="-36" y="-310" width="72" height="50" rx="8" fill="#2b3558"/><rect x="-26" y="-302" width="52" height="34" rx="6" fill="' + (lucesEncendidas > 0 ? '#ffe27a' : '#46506f') + '"/><path d="M-44 -310l44-40 44 40z" fill="#e8553f"/></g>';
  }
  var FONDOS = {
    jardin: function () { return { lejos: colinas('#a6dd8a', 360, 60, 3) + '<circle cx="980" cy="120" r="46" fill="#fff4a8"/>', medio: colinas('#8fd172', 430, 40, 5) + arboles('#6cbd5a', 7, 440, 11, 120), cerca: flores(['#ff7fb0', '#ffd93d', '#ffffff', '#c79bff'], 26, 520, 9) }; },
    granja: function () { return { lejos: colinas('#e8d28a', 360, 50, 4) + '<circle cx="1000" cy="110" r="44" fill="#fff0a0"/>', medio: colinas('#d6c070', 440, 36, 8) + '<g transform="translate(220 430)"><rect x="-50" y="-70" width="100" height="70" fill="#d0553f"/><path d="M-62 -70l62-46 62 46z" fill="#8d3a2c"/><rect x="-14" y="-40" width="28" height="40" fill="#f5e6c0"/></g>', cerca: flores(['#ffd93d', '#ffffff'], 18, 530, 12) }; },
    playa: function () { return { lejos: '<rect y="300" width="1200" height="120" fill="#4ec3e8"/><path d="M0 330q150-20 300 0t300 0 300 0 300 0V420H0z" fill="#7ad7f2"/>', medio: colinas('#f3e1a4', 450, 30, 6), cerca: rocas('#c9b27a', 6, 560, 4) }; },
    bosque: function () { return { lejos: arboles('#134034', 11, 400, 3, 210) + '<circle cx="220" cy="90" r="40" fill="#d8f3c8" opacity=".85"/>', medio: arboles('#1e5c43', 8, 470, 7, 180), cerca: arboles('#0e3228', 5, 600, 13, 260) + flores(['#ffe27a'], 14, 540, 21) }; },
    montanas: function () { return { lejos: picos('#7e8ccb', true, 430, 3), medio: picos('#a99fd0', true, 500, 9) + colinas('#d7d2e8', 520, 30, 5), cerca: rocas('#8b84ab', 7, 600, 8) }; },
    mar: function () { return { lejos: '<path d="M0 120q150-30 300 0t300 0 300 0 300 0V600H0z" fill="#1f86b5" opacity=".6"/>' + burbujas(14, 5), medio: '<path d="M0 400q100-30 200 0t200 0 200 0 200 0 200 0 200 0V600H0z" fill="#e9d095"/>' + '<g fill="#ff7a7a"><path d="M150 430q-20-60 10-90 6 40 24 50 4-30 20-44 4 50-16 84z"/></g><g fill="#ffb347"><path d="M880 440q-14-70 18-96 4 36 20 44 8-26 24-34 0 56-20 86z"/></g>', cerca: burbujas(10, 12) + rocas('#c9b27a', 5, 590, 6) }; },
    volcan: function () { return { lejos: '<path d="M300 440L520 150h160L900 440z" fill="#3a1f26"/><path d="M520 150h160l-14 30q-66 22-132 0z" fill="#ff6a2e"/><path d="M590 180q-8 90-30 180M610 180q4 100 20 200" stroke="#ff8a3c" stroke-width="10" fill="none" stroke-linecap="round"/>' + estrellas(26, 7, '#ffcf9a'), medio: picos('#4a2a2f', false, 520, 4), cerca: rocas('#2b171c', 8, 600, 3) }; },
    ciudad: function () { return { lejos: ciudad('#2a3a74', '#9fe8ff', 440, 5) + estrellas(20, 9), medio: ciudad('#1a2550', '#ffe27a', 520, 8), cerca: '<rect y="560" width="1200" height="40" fill="#10183a"/><path d="M0 570h1200" stroke="#7be0ff" stroke-width="3" stroke-dasharray="30 18"/>' }; },
    espacio: function () { return { lejos: estrellas(70, 3) + '<circle cx="940" cy="140" r="70" fill="#b58cff"/><ellipse cx="940" cy="140" rx="116" ry="20" fill="none" stroke="#ffd166" stroke-width="7" transform="rotate(-14 940 140)"/><circle cx="260" cy="110" r="28" fill="#5ec8ff"/>', medio: colinas('#4b4784', 500, 40, 5), cerca: rocas('#3a3768', 6, 600, 2) + estrellas(10, 8, '#ffd166') }; },
    faro: function () { return { lejos: estrellas(40, 4, '#ffe9b0') + '<circle cx="1000" cy="110" r="50" fill="#fff0c8" opacity=".9"/>', medio: colinas('#2e3a68', 450, 34, 6) + faroGrande(640, 470, 1.15, 6), cerca: colinas('#1d2548', 560, 24, 3) }; }
  };
  function capasDeFondo(zona) { return (FONDOS[zona] || FONDOS.jardin)(); }
  var SUELOS = { mar: ['#e9d095', '#d9bd7d'], faro: ['#3b4778', '#2a3560'], ciudad: ['#2b3768', '#1e2850'], espacio: ['#4b4784', '#3a3768'] };
  var CIELO_NOCHE = { bosque: 1, montanas: 0, mar: 1, volcan: 1, ciudad: 1, espacio: 1, faro: 1 };

  // ---------------------------------------------------------------- objetos de escena
  var OBJ = {
    pieza: '<circle cx="50" cy="50" r="30" fill="none" stroke="#ffd166" stroke-width="8" stroke-dasharray="46 20" stroke-linecap="round"/><circle cx="50" cy="50" r="8" fill="#ffd166"/>',
    brujula: '<circle cx="50" cy="50" r="34" fill="#fff" stroke="#c9741a" stroke-width="6"/><circle cx="50" cy="50" r="27" fill="#fff6c9"/><path d="M50 26l9 24-9 24-9-24z" fill="#e8553f"/><path d="M50 74l-9-24h18z" fill="#7a8aa8"/><circle cx="50" cy="50" r="4" fill="#2b2140"/>',
    luz: '<circle cx="50" cy="50" r="40" fill="url(#gLumoGlow)"/><path d="M50 14q16 18 11 32-3 7-11 7t-11-7Q34 32 50 14z" fill="#ffd93d"/><ellipse cx="50" cy="64" rx="18" ry="16" fill="#ffb22e"/>',
    flor: '<path d="M50 90V54" stroke="#3f8f3a" stroke-width="6"/><g fill="#ff7fb0"><circle cx="50" cy="30" r="14"/><circle cx="32" cy="42" r="14"/><circle cx="68" cy="42" r="14"/><circle cx="38" cy="58" r="12"/><circle cx="62" cy="58" r="12"/></g><circle cx="50" cy="44" r="11" fill="#ffd93d"/>',
    zanahoria: '<path d="M50 86L36 38q14-12 28 0z" fill="#ff8a2e"/><path d="M50 40q-18-18-10-30 10 8 10 30zM50 40q18-18 10-30-10 8-10 30z" fill="#3aa55a"/>',
    estrella: '<path d="M50 8l12 28 30 3-23 20 7 30-26-16-26 16 7-30-23-20 30-3z" fill="#ffd166" stroke="#e8a82e" stroke-width="3" stroke-linejoin="round"/>'
  };

  // ---------------------------------------------------------------- pasos automáticos
  function ladoDe(quien, i) { return quien === 'Lumo' ? 'izq' : 'der'; }
  function deducirPasos(def, lineas) {
    var pasos = [{ fondo: def.zona }, { entra: 'Lumo', lado: 'izq', modo: 'salta' }], dentro = { Lumo: true };
    lineas.forEach(function (l) {
      var q = l.quien;
      if (!dentro[q]) { pasos.push({ entra: q, lado: 'der', modo: 'desliza' }); dentro[q] = true; }
      pasos.push({ dice: l.id, emocion: l.emocion });
    });
    return pasos;
  }

  // ---------------------------------------------------------------- reproducción
  /*
   * opciones: { def, lineas:[{id,quien,texto,emocion}], infantil, reducir, voz:{decir(id,op)->{modo}, parar()}, sonido:{sfx(n), musica(z)},
   *             vocesOn:bool, h(fn de creación de nodos), fin() }
   */
  function reproducir(op) {
    var h = op.h, def = op.def, reducir = !!op.reducir, inf = !!op.infantil, S = op.sonido || {};
    var pasos = def.pasos && def.pasos.length ? def.pasos : deducirPasos(def, op.lineas);
    var porId = {}; op.lineas.forEach(function (l) { porId[l.id] = l; });

    var ov = h('div.escena.motor' + (reducir ? '.sin-mov' : ''), { role: 'dialog', 'aria-label': 'Escena de la historia' });
    var cielo = h('div.esc-cielo'), lejos = h('div.esc-capa.lejos'), medio = h('div.esc-capa.medio'), cerca = h('div.esc-capa.cerca'), particulas = h('div.esc-particulas');
    var suelo = h('div.esc-suelo'), escenario = h('div.esc-escenario'), objetos = h('div.esc-objetos'), burbuja = h('div.escena-burbuja'), nombre = h('div.escena-nombre'), txt = h('div.escena-texto');
    var vel = h('div.esc-velo');
    burbuja.appendChild(nombre); burbuja.appendChild(txt);
    var sig = h('button.btn-grande.principal.b-sig-esc', { type: 'button', 'aria-label': 'Siguiente', on: { click: pulsar } }, UI.svgEl(UI.ICON.sig, 'ic'));
    var saltar = h('button.btn-txt.b-saltar', { type: 'button', on: { click: cerrar } }, 'Saltar escena');
    [cielo, lejos, medio, suelo, escenario, cerca, objetos, particulas, vel, burbuja, sig, saltar].forEach(function (n) { ov.appendChild(n); });
    burbuja.classList.add('oculta');
    document.body.appendChild(ov);

    var sigLinea = 0, cerrado = false, actores = {}, esperando = null, zonaActual = null, saltarEspera = false;

    function aplicarZona(z) {
      var T = Ar().TEMAS[z] || Ar().TEMAS.jardin, c = capasDeFondo(z);
      zonaActual = z;
      ov.className = ov.className.replace(/\bzona-\S+/g, '').trim() + ' zona-' + z;
      cielo.style.background = 'linear-gradient(' + T.cielo[0] + ',' + T.cielo[1] + ')';
      var svg = function (x) { return '<svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' + x + '</svg>'; };
      var G = SUELOS[z] || [T.c1, T.c2]; suelo.style.background = 'linear-gradient(' + G[0] + ',' + G[1] + ')'; suelo.style.filter = CIELO_NOCHE[z] && !SUELOS[z] ? 'brightness(.5) saturate(.9)' : 'none';
      lejos.innerHTML = svg(c.lejos); medio.innerHTML = svg(c.medio); cerca.innerHTML = svg(c.cerca);
      if (!reducir) {
        var p = '', r = azar(z.length * 31 + 5), col = CIELO_NOCHE[z] ? '#ffe9a0' : '#fffbe0';
        for (var i = 0; i < 16; i++) p += '<i style="left:' + (r() * 100).toFixed(0) + '%;top:' + (30 + r() * 60).toFixed(0) + '%;animation-delay:' + (r() * 6).toFixed(1) + 's;animation-duration:' + (5 + r() * 5).toFixed(1) + 's;background:' + col + '"></i>';
        particulas.innerHTML = p;
      } else particulas.innerHTML = '';
      if (S.musica) S.musica(z);
    }

    function dibujar(a, expr, pose) {
      a.expr = expr || a.expr; if (pose !== undefined) a.pose = pose;
      a.cuerpo.innerHTML = a.nombre === 'Lumo' ? Ar().lumo({ expr: a.expr, pose: a.pose, dir: a.dir || 'S', disfraz: op.disfraz || 0 }) :
        Ar().personaje(a.nombre, { expr: a.expr });
    }
    function entra(nombre_, lado, modo) {
      if (actores[nombre_]) return;
      var a = { nombre: nombre_, lado: lado, expr: 'normal', pose: '', dir: lado === 'der' ? 'O' : 'S' };
      a.dir = nombre_ === 'Lumo' ? 'S' : 'S';
      a.el = h('div.act.pos-' + lado + (reducir ? '' : '.entra-' + (modo || 'desliza')));
      a.cuerpo = h('div.act-cuerpo'); a.el.appendChild(a.cuerpo);
      escenario.appendChild(a.el); actores[nombre_] = a; dibujar(a, nombre_ === 'Lumo' ? 'alegre' : 'normal');
      if (!reducir && modo === 'salta') S.sfx && S.sfx('salto');
    }
    function sale(nombre_) {
      var a = actores[nombre_]; if (!a) return; delete actores[nombre_];
      if (reducir) { if (a.el.parentNode) a.el.parentNode.removeChild(a.el); return; }
      a.el.classList.add('sale'); setTimeout(function () { if (a.el.parentNode) a.el.parentNode.removeChild(a.el); }, 600);
    }
    function haz(nombre_, que) {
      var a = actores[nombre_]; if (!a || reducir) return;
      a.cuerpo.className = 'act-cuerpo'; void a.cuerpo.offsetWidth; a.cuerpo.classList.add('a-' + que);
    }
    function exprDeEmocion(nombre_, emo) {
      if (nombre_ === 'Lumo') return Ar().exprDe(emo);
      var e = Ar().exprDe(emo); return ['normal', 'alegre', 'sorprendido', 'tierno'].indexOf(e) >= 0 ? e : (e === 'emocionado' || e === 'orgulloso' ? 'alegre' : e === 'ups' ? 'sorprendido' : 'normal');
    }
    function esperar(ms) {
      return new Promise(function (ok) {
        var t = setTimeout(done, reducir ? Math.min(ms, 150) : ms); saltarEspera = false;
        function done() { clearTimeout(t); esperando = null; ok(); }
        esperando = done;
      });
    }
    function pulsar() { if (esperando) { var f = esperando; esperando = null; f(); } else if (aDecir) { var g = aDecir; aDecir = null; g(); } }
    var aDecir = null;
    function esperarPulsacion() { return new Promise(function (ok) { aDecir = ok; }); }

    function hablar(l, emo) {
      if (!actores[l.quien]) entra(l.quien, l.quien === 'Lumo' ? 'izq' : 'der', 'desliza');
      var a = actores[l.quien];
      Object.keys(actores).forEach(function (k) { actores[k].el.classList.toggle('habla', k === l.quien); });
      Object.keys(actores).forEach(function (k) { var o = actores[k]; if (k !== l.quien && (o.expr === 'concentrado' || o.expr === 'ups')) dibujar(o, 'normal'); });
      if (a) { dibujar(a, exprDeEmocion(l.quien, emo || l.emocion)); if (!reducir) haz(l.quien, 'habla'); }
      burbuja.classList.remove('oculta'); nombre.textContent = l.quien;
      var r = op.vocesOn !== false && op.voz ? op.voz.decir(l.id, { velocidad: inf ? .85 : .95 }) : null;
      var sinVoz = !r || r.modo === 'subtitulo';
      txt.textContent = (!inf || sinVoz) ? l.texto : '';
      burbuja.classList.toggle('sin-texto', inf && !sinVoz);
      S.sfx && S.sfx('toque');
    }

    async function ejecutar(p) {
      if (p.dice) { var l = p.dice === '*' ? op.lineas[sigLinea++] : porId[p.dice]; if (!l) return; hablar(l, p.emocion || l.emocion); await esperarPulsacion(); return; }
      if (p.fondo) { if (p.fondo !== zonaActual) { if (!reducir) { vel.classList.add('on'); await esperar(260); } aplicarZona(p.fondo); vel.classList.remove('on'); } return; }
      if (p.entra) { entra(p.entra, p.lado || 'der', p.modo); if (!reducir) await esperar(520); return; }
      if (p.sale) { sale(p.sale); if (!reducir) await esperar(400); return; }
      if (p.emocion) { var a = actores[p.emocion]; if (a) dibujar(a, exprDeEmocion(p.emocion, p.expr), p.pose || ''); return; }
      if (p.accion) { haz(p.accion, p.haz || 'salta'); await esperar(700); return; }
      if (p.objeto) {
        var o = h('div.esc-obj.pos-' + (p.lado || 'centro') + (p.brilla ? '.brilla' : ''), { html: '<svg viewBox="0 0 100 100" aria-hidden="true">' + (OBJ[p.objeto] || OBJ.estrella) + '</svg>' });
        objetos.innerHTML = ''; objetos.appendChild(o); S.sfx && S.sfx('animo'); await esperar(700); return;
      }
      if (p.camara) { ov.classList.remove('cam-acerca', 'cam-aleja', 'cam-sacude'); void ov.offsetWidth; ov.classList.add('cam-' + p.camara); await esperar(600); return; }
      if (p.sonido) { S.sfx && S.sfx(p.sonido); return; }
      if (p.espera) { await esperar(p.espera); return; }
    }
    function cerrar() {
      if (cerrado) return; cerrado = true; if (op.voz) op.voz.parar();
      if (ov.parentNode) ov.parentNode.removeChild(ov); op.fin();
    }
    (async function correr() {
      try {
        for (var i = 0; i < pasos.length && !cerrado; i++) await ejecutar(pasos[i]);
      } catch (e) { if (root.console) console.error('Escena', def.id, e); }
      cerrar();
    })();
    return { cerrar: cerrar, el: ov };
  }

  UI.Escenas = { reproducir: reproducir, deducirPasos: deducirPasos, capasDeFondo: capasDeFondo, OBJETOS: OBJ };
})(typeof self !== 'undefined' ? self : this);
