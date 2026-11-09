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
      musicaGain = ctx.createGain(); musicaGain.gain.value = 0.10; musicaGain.connect(maestro);
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
    animo: function (t) { nota(F.mi4, t, .18, 'sine', .16); nota(F.sol4, t + .16, .24, 'sine', .16); }
  };
  function sfx(n) {
    if (!sfxOn) return; iniciar(); if (!ctx || !EFECTOS[n]) return;
    EFECTOS[n](ctx.currentTime + 0.01);
  }

  // Escalas y compases propios de cada zona (acordes lentos y un arpegio suave).
  var MUSICA = {
    jardin: { bpm: 84, esc: [0, 2, 4, 7, 9], base: 60, onda: 'triangle' },
    granja: { bpm: 90, esc: [0, 2, 4, 7, 9], base: 62, onda: 'triangle' },
    playa: { bpm: 80, esc: [0, 2, 4, 7, 9], base: 64, onda: 'sine' },
    bosque: { bpm: 72, esc: [0, 3, 5, 7, 10], base: 57, onda: 'sine' },
    montanas: { bpm: 66, esc: [0, 2, 5, 7, 9], base: 55, onda: 'triangle' },
    mar: { bpm: 70, esc: [0, 2, 4, 7, 11], base: 59, onda: 'sine' },
    volcan: { bpm: 96, esc: [0, 3, 5, 6, 7], base: 52, onda: 'sawtooth' },
    ciudad: { bpm: 100, esc: [0, 2, 4, 7, 9], base: 60, onda: 'square' },
    espacio: { bpm: 64, esc: [0, 2, 7, 9, 14], base: 58, onda: 'sine' },
    faro: { bpm: 68, esc: [0, 4, 7, 9, 12], base: 60, onda: 'triangle' },
    mapa: { bpm: 78, esc: [0, 2, 4, 7, 9], base: 60, onda: 'triangle' }
  };
  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  function tic() {
    var m = MUSICA[zonaActual]; if (!m || !ctx || !musOn) return;
    var t = ctx.currentTime + 0.05, dur = 60 / m.bpm;
    var g = (paso * 7 + (paso >> 2)) % m.esc.length;
    var n1 = m.base + m.esc[g] + (paso % 8 === 0 ? -12 : 0);
    nota(midi(n1), t, dur * 1.6, m.onda, m.onda === 'square' || m.onda === 'sawtooth' ? .35 : .9, musicaGain);
    if (paso % 2 === 1) nota(midi(m.base + 12 + m.esc[(g + 2) % m.esc.length]), t + dur / 2, dur, 'sine', .5, musicaGain);
    paso++;
  }
  function musica(zona) {
    if (zona === zonaActual) return;
    detener(); zonaActual = zona;
    if (!zona || !musOn) return;
    iniciar(); if (!ctx) return;
    var m = MUSICA[zona] || MUSICA.mapa;
    tic(); timer = setInterval(tic, 60000 / m.bpm);
  }
  function detener() { if (timer) clearInterval(timer); timer = null; }
  function ajustar(o) {
    sfxOn = o.sonido !== false;
    var antes = musOn; musOn = o.musica !== false;
    if (!musOn) { detener(); }
    else if (!antes && zonaActual) { var z = zonaActual; zonaActual = null; musica(z); }
  }

  UI.Sonido = { iniciar: iniciar, sfx: sfx, musica: musica, detener: detener, ajustar: ajustar };
  // Un primer gesto desbloquea el audio del navegador.
  ['pointerdown', 'keydown'].forEach(function (e) { root.addEventListener && root.addEventListener(e, iniciar, { once: true, passive: true }); });
})(typeof self !== 'undefined' ? self : this);
