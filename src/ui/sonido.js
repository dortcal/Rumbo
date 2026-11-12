/*
 * RUMBO — Sonido procedural con Web Audio (sin archivos de audio):
 * efectos de interacción y una música ambiental suave distinta por mundo.
 * Chrome solo permite sonar tras un gesto del usuario: se activa en el primer toque.
 */
(function (root) {
  'use strict';
  var UI = root.RumboUI = root.RumboUI || {};
  var ctx = null, maestro = null, musicaGain = null, sfxOn = true, musOn = true, timer = null, zonaActual = null, paso = 0;

  function iniciar() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      maestro = ctx.createGain(); maestro.gain.value = 0.8; maestro.connect(ctx.destination);
      musicaGain = ctx.createGain(); musicaGain.gain.value = 0.09; musicaGain.connect(maestro);
    } catch (e) { ctx = null; }
  }
  function nota(f, t0, dur, tipo, vol, destino, glide) {
    if (!ctx) return;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo || 'sine'; o.frequency.setValueAtTime(f, t0);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(destino || maestro); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  var F = { do4: 261.63, re4: 293.66, mi4: 329.63, sol4: 392, la4: 440, do5: 523.25, re5: 587.33, mi5: 659.25, sol5: 783.99, do6: 1046.5 };
  var MD = function () { return root.RumboMusicaDatos; };
  function campana(f, t, dur, vol, destino) { nota(f, t, dur, 'triangle', vol, destino); nota(f * 2, t, dur * 0.7, 'sine', vol * 0.35, destino); }

  var EFECTOS = {
    toque: function (t) { nota(660, t, .08, 'triangle', .15); },
    poner: function (t) { nota(520, t, .09, 'triangle', .18); nota(780, t + .05, .09, 'triangle', .12); },
    quitar: function (t) { nota(520, t, .12, 'triangle', .14, null, 260); },
    paso: function (t) { nota(300, t, .07, 'square', .06); },
    giro: function (t) { nota(440, t, .12, 'triangle', .12, null, 660); },
    salto: function (t) { nota(330, t, .22, 'sine', .2, null, 880); },
    recoger: function (t) { nota(F.mi5, t, .1, 'triangle', .2); nota(F.sol5, t + .08, .16, 'triangle', .2); },
    activar: function (t) { nota(200, t, .15, 'square', .12); nota(400, t + .1, .25, 'triangle', .16); },
    choque: function (t) { nota(160, t, .18, 'sawtooth', .13, null, 90); },
    caida: function (t) { nota(600, t, .5, 'sine', .18, null, 90); },
    pista: function (t) { nota(F.sol5, t, .1, 'sine', .15); nota(F.do6, t + .09, .2, 'sine', .15); },
    estrella: function (t) { [F.do5, F.mi5, F.sol5, F.do6].forEach(function (f, i) { nota(f, t + i * .1, .25, 'triangle', .2); }); },
    victoria: function (t) { [F.do5, F.mi5, F.sol5, F.do6, F.sol5, F.do6].forEach(function (f, i) { nota(f, t + i * .11, .3, 'triangle', .22); }); },
    desbloqueo: function (t) { [F.sol4, F.do5, F.mi5, F.sol5, F.do6].forEach(function (f, i) { nota(f, t + i * .08, .3, 'sine', .2); }); },
    animo: function (t) { nota(F.mi4, t, .18, 'sine', .16); nota(F.sol4, t + .16, .24, 'sine', .16); },
    // ---- sonidos de la historia ----
    // El guiño de la abuela: corto, corto, largo (el motivo del Faro).
    guino: function (t) { var d = 0.2, tt = t; MD().MOTIVO_FARO.forEach(function (m) { campana(F.sol5, tt, m[1] * d * 1.5, .22); tt += m[1] * d * 1.4; }); },
    // Una chispa de la familia aparece: destello ascendente.
    chispa: function (t) { [F.mi5, F.sol5, F.do6, 1318.5].forEach(function (f, i) { campana(f, t + i * .07, .35, .14); }); },
    // Pieza de la brújula: clic metálico y acorde que brilla.
    pieza: function (t) { nota(1800, t, .04, 'square', .08); [F.do5, F.mi5, F.sol5, F.do6].forEach(function (f) { campana(f, t + .08, .9, .12); }); },
    // Se enciende una ventana del Faro: barrido y acorde cálido.
    faro: function (t) { nota(220, t, .5, 'sine', .16, null, 880); [F.sol4, F.do5, F.mi5, F.sol5].forEach(function (f, i) { campana(f, t + .4 + i * .05, 1.2, .13); }); },
    // Alguien llega a la escena.
    aparece: function (t) { nota(400, t, .12, 'sine', .14, null, 800); },
    // Abuela Chispa: dos notas graves y cálidas.
    abuela: function (t) { campana(F.do4, t, .9, .16); campana(F.sol4, t + .18, 1.1, .14); },
    // Bichito se ríe: chillidos cortos y subidos de tono.
    bichito: function (t) { [900, 1300, 1000, 1500, 1200].forEach(function (f, i) { nota(f, t + i * .07, .08, 'square', .1, null, f * 1.25); }); }
  };
  function sfx(n) {
    if (!sfxOn) return; iniciar(); if (!ctx || !EFECTOS[n]) return;
    EFECTOS[n](ctx.currentTime + 0.01);
  }

  // ---------------------------------------------------------------- música: secuenciador de las piezas de musica-datos.js
  var ruido = null;
  function bufferRuido() {
    if (ruido || !ctx) return ruido;
    ruido = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    var d = ruido.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ruido;
  }
  function golpe(tipo, t, vol) {
    if (!ctx) return;
    if (tipo === 'kick') { nota(130, t, .22, 'sine', vol * 1.6, musicaGain, 40); return; }
    var src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = bufferRuido(); f.type = 'highpass'; f.frequency.value = 6000;
    g.gain.setValueAtTime(vol * 0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + .05);
    src.connect(f); f.connect(g); g.connect(musicaGain); src.start(t); src.stop(t + .06);
  }
  function suave(f, t, dur, tipo, vol, destino) {   // ataque lento, para pads
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.6, dur / 3)); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(destino); o.start(t); o.stop(t + dur + .05);
  }
  var seq = { zona: null, compas: 0, proximo: 0, timer: null };
  function planificarCompas(zona, n, vuelta, t0) {
    var M = MD(), P = M.PIEZAS[zona], pulso = M.duracionPulso(zona), vol = P.vol || 1;
    M.eventosCompas(zona, n, vuelta).forEach(function (e) {
      var t = t0 + e.t * pulso, d = e.dur * pulso, f = M.frecuencia(e.midi);
      switch (e.voz) {
        case 'lead': nota(f, t, d, P.lead, .5 * vol, musicaGain); if (P.eco) nota(f, t + pulso * .75, d, P.lead, .16 * vol, musicaGain); break;
        case 'motivo': campana(f, t, d * 1.4, .55, musicaGain); break;
        case 'bajo': nota(f, t, d, P.bajo, .55 * vol, musicaGain); break;
        case 'pad': suave(f, t, d, 'sine', .22, musicaGain); break;
        case 'ping': nota(f, t, d, 'sine', .3, musicaGain); break;
        case 'kick': case 'hat': golpe(e.voz, t, .5 * vol); break;
      }
    });
  }
  function planificar() {
    if (!ctx || !musOn || !seq.zona || !MD().PIEZAS[seq.zona]) return;
    var pulso = MD().duracionPulso(seq.zona);
    while (seq.proximo < ctx.currentTime + 0.6) {
      planificarCompas(seq.zona, seq.compas % 4, Math.floor(seq.compas / 4), seq.proximo);
      seq.proximo += 4 * pulso; seq.compas++;
    }
  }
  function musica(zona) {
    if (zona === zonaActual) return;
    detener(); zonaActual = zona;
    if (!zona || !musOn) return;
    iniciar(); if (!ctx) return;
    if (!MD().PIEZAS[zona]) zona = 'mapa';
    seq.zona = zona; seq.compas = 0; seq.proximo = ctx.currentTime + 0.08;
    planificar(); timer = seq.timer = setInterval(planificar, 150);
  }
  function detener() { if (timer) clearInterval(timer); timer = null; seq.zona = null; }
  function ajustar(o) {
    sfxOn = o.sonido !== false;
    var antes = musOn; musOn = o.musica !== false;
    if (!musOn) { detener(); }
    else if (!antes && zonaActual) { var z = zonaActual; zonaActual = null; musica(z); }
  }

  // Para comprobar el nivel real de salida (pruebas y diagnóstico): analizador conectado a la salida maestra.
  function analizador() {
    iniciar(); if (!ctx) return null;
    if (!seq.an) { seq.an = ctx.createAnalyser(); seq.an.fftSize = 2048; maestro.connect(seq.an); }
    return seq.an;
  }
  UI.Sonido = { analizador: analizador, iniciar: iniciar, sfx: sfx, musica: musica, detener: detener, ajustar: ajustar };
  // Un primer gesto desbloquea el audio del navegador.
  ['pointerdown', 'keydown'].forEach(function (e) { root.addEventListener && root.addEventListener(e, iniciar, { once: true, passive: true }); });
})(typeof self !== 'undefined' ? self : this);
