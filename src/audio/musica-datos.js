/*
 * RUMBO — Piezas de música por zona (datos + generador puro de eventos, probado en Node).
 *
 * Cada zona tiene su propia pieza de 4 compases (16 pulsos) que se repite: tonalidad, escala, tempo, timbres, melodía y
 * acompañamiento propios. El motivo del Faro —«corto, corto, largo», el guiño de la abuela— aparece en la pieza del Faro,
 * en la del mapa (cada cuatro vueltas) y como sonido suelto (efecto «guino»).
 *
 * Una melodía es una lista de [grado, pulsos]: grado = posición en la escala (0 = tónica; 7 en pentatónica = octava),
 * null = silencio. Los acordes son grados de la escala, uno por compás.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api; else root.RumboMusicaDatos = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PENTA = [0, 2, 4, 7, 9], MENOR = [0, 3, 5, 7, 10], DORICA = [0, 2, 3, 7, 9], FRIGIA = [0, 1, 5, 7, 8], LIDIA = [0, 2, 4, 6, 7, 9, 11];

  // Motivo del guiño: tres notas iguales, dos cortas y una larga (en pulsos).
  var MOTIVO_FARO = [[7, 0.5], [7, 0.5], [7, 1.5]];

  var PIEZAS = {
    jardin: { bpm: 96, tonica: 60, escala: PENTA, lead: 'triangle', bajo: 'sine', acordes: [0, 2, 3, 2], bajoPatron: 'pulso', perc: null,
      melodia: [[0, 1], [2, 1], [4, 1], [2, 1], [3, 1], [2, 0.5], [1, 0.5], [0, 2], [4, 1], [5, 1], [6, 1], [5, 1], [4, 1], [2, 1], [0, 2]] },
    granja: { bpm: 108, tonica: 55, escala: PENTA, lead: 'square', bajo: 'triangle', acordes: [0, 0, 3, 4], bajoPatron: 'oompa', perc: 'suave', vol: 0.5,
      melodia: [[2, 0.5], [2, 0.5], [4, 1], [2, 1], [0, 1], [1, 0.5], [2, 0.5], [3, 1], [1, 1], [null, 1], [4, 0.5], [4, 0.5], [5, 1], [4, 1], [2, 1], [3, 1], [0, 1], [null, 2]] },
    playa: { bpm: 84, tonica: 62, escala: PENTA, lead: 'sine', bajo: 'sine', acordes: [0, 3, 2, 3], bajoPatron: 'larga', perc: null, eco: true,
      melodia: [[4, 1.5], [3, 0.5], [2, 1], [3, 1], [4, 2], [null, 1], [5, 1], [4, 1.5], [2, 0.5], [3, 2], [2, 1], [1, 1], [4, 2]] },
    bosque: { bpm: 72, tonica: 50, escala: DORICA, lead: 'sine', bajo: 'sine', acordes: [0, 2, 0, 3], bajoPatron: 'larga', perc: null, pings: true,
      melodia: [[4, 2], [null, 1], [3, 1], [2, 2], [null, 2], [4, 1], [5, 1], [3, 2], [2, 1], [1, 1], [0, 2]] },
    montanas: { bpm: 66, tonica: 45, escala: MENOR, lead: 'triangle', bajo: 'sine', acordes: [0, 4, 3, 4], bajoPatron: 'larga', perc: null, quintas: true,
      melodia: [[7, 2], [8, 2], [7, 1], [5, 1], [4, 2], [3, 2], [5, 2], [4, 1], [3, 1], [2, 2]] },
    mar: { bpm: 70, tonica: 52, escala: LIDIA, lead: 'sine', bajo: 'sine', acordes: [0, 3, 4, 3], bajoPatron: 'larga', perc: null, vib: true, eco: true,
      melodia: [[7, 2], [8, 1], [9, 1], [8, 2], [7, 1], [6, 1], [4, 2], [null, 2], [9, 2], [8, 1], [7, 1]] },
    volcan: { bpm: 104, tonica: 40, escala: FRIGIA, lead: 'sawtooth', bajo: 'sawtooth', acordes: [0, 0, 1, 0], bajoPatron: 'sincopa', perc: 'fuerte', vol: 0.6,
      melodia: [[7, 0.5], [null, 0.5], [7, 0.5], [8, 0.5], [9, 1], [7, 1], [null, 1], [10, 0.5], [9, 0.5], [7, 1], [null, 1], [8, 0.5], [7, 0.5], [5, 1], [7, 2], [null, 1], [7, 2], [null, 1]] },
    ciudad: { bpm: 112, tonica: 48, escala: MENOR, lead: 'square', bajo: 'square', acordes: [0, 3, 2, 4], bajoPatron: 'pulso', perc: 'fuerte', arpegio: true, vol: 0.38,
      melodia: [[7, 0.5], [9, 0.5], [8, 0.5], [7, 0.5], [5, 1], [null, 1], [7, 0.5], [9, 0.5], [10, 0.5], [9, 0.5], [8, 2], [null, 2], [7, 0.5], [9, 0.5], [8, 1], [5, 2], [null, 2]] },
    espacio: { bpm: 60, tonica: 53, escala: PENTA, lead: 'sine', bajo: 'sine', acordes: [0, 2, 4, 2], bajoPatron: 'larga', perc: null, pings: true, quintas: true,
      melodia: [[9, 3], [null, 1], [8, 2], [null, 2], [7, 3], [null, 1], [5, 2], [null, 2]] },
    faro: { bpm: 68, tonica: 55, escala: PENTA, lead: 'triangle', bajo: 'sine', acordes: [0, 2, 3, 0], bajoPatron: 'larga', perc: null, motivo: 'cada', eco: true,
      melodia: [[null, 4], [4, 2], [3, 1], [2, 1], [3, 2], [2, 1], [1, 1], [0, 4]] },
    mapa: { bpm: 92, tonica: 60, escala: PENTA, lead: 'triangle', bajo: 'sine', acordes: [0, 3, 4, 0], bajoPatron: 'pulso', perc: null, motivo: 'cuarta',
      melodia: [[4, 1], [4, 0.5], [5, 0.5], [6, 1], [4, 1], [2, 2], [3, 1], [2, 1], [4, 2], [3, 1], [2, 1], [0, 2], [null, 2]] }
  };

  function midi(zona, grado) {
    var P = PIEZAS[zona], e = P.escala, n = e.length, o = Math.floor(grado / n), i = ((grado % n) + n) % n;
    return P.tonica + e[i] + 12 * o;
  }
  function frecuencia(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function duracionPulso(zona) { return 60 / PIEZAS[zona].bpm; }

  /*
   * Eventos del compás `n` (0-3 dentro de la pieza) de la vuelta `vuelta`. Tiempos en pulsos desde el inicio del compás.
   * Voces: lead, bajo, pad, ping, kick, hat, motivo.
   */
  function eventosCompas(zona, n, vuelta) {
    var P = PIEZAS[zona]; if (!P) return [];
    n = ((n % 4) + 4) % 4; vuelta = vuelta | 0;
    var ev = [], t = 0, ini = n * 4, fin = ini + 4;
    // melodía: se recorre acumulando pulsos para saber qué notas caen en este compás
    P.melodia.forEach(function (nota) {
      var a = t, b = t + nota[1]; t = b;
      if (nota[0] == null) return;
      if (a >= ini && a < fin) ev.push({ voz: 'lead', t: a - ini, dur: Math.min(nota[1], fin - a) * 1.05, midi: midi(zona, nota[0]) });
    });
    // motivo del Faro: en la pieza del Faro, cada vuelta en el compás 3; en el mapa, cada cuarta vuelta
    var conMotivo = P.motivo === 'cada' ? n === 3 : P.motivo === 'cuarta' ? (n === 3 && vuelta % 4 === 3) : false;
    if (conMotivo) {
      ev = ev.filter(function (e) { return e.voz !== 'lead' || e.t < 0; });
      var tt = 0; MOTIVO_FARO.forEach(function (m) { ev.push({ voz: 'motivo', t: tt, dur: m[1], midi: midi(zona, m[0]) }); tt += m[1]; });
    }
    var raiz = P.acordes[n];
    // bajo
    var bm = midi(zona, raiz) - 12;
    if (P.bajoPatron === 'larga') ev.push({ voz: 'bajo', t: 0, dur: 4, midi: bm });
    else if (P.bajoPatron === 'pulso') [0, 2].forEach(function (b) { ev.push({ voz: 'bajo', t: b, dur: 1.6, midi: bm }); });
    else if (P.bajoPatron === 'oompa') [0, 1, 2, 3].forEach(function (b) { ev.push({ voz: 'bajo', t: b, dur: 0.8, midi: b % 2 ? bm + 7 : bm }); });
    else if (P.bajoPatron === 'sincopa') [0, 1.5, 2, 3.5].forEach(function (b) { ev.push({ voz: 'bajo', t: b, dur: 0.6, midi: bm }); });
    // pad: tríada suave (raíz, tercera, quinta de la escala)
    ev.push({ voz: 'pad', t: 0, dur: 4, midi: midi(zona, raiz) + (P.quintas ? 7 : 0) }, { voz: 'pad', t: 0, dur: 4, midi: midi(zona, raiz + 2) }, { voz: 'pad', t: 0, dur: 4, midi: midi(zona, raiz + 4) });
    // arpegio rápido (ciudad)
    if (P.arpegio) for (var k = 0; k < 8; k++) ev.push({ voz: 'ping', t: k * 0.5, dur: 0.4, midi: midi(zona, raiz + [0, 2, 4, 2][k % 4] + 7) });
    // destellos sueltos (bosque, espacio): cuatro notas altas deterministas
    if (P.pings) [0.75, 1.5, 2.5, 3.25].forEach(function (b, i) { ev.push({ voz: 'ping', t: b, dur: 0.5, midi: midi(zona, 12 + ((n + i + vuelta) * 3) % 8) }); });
    // percusión
    if (P.perc) {
      [0, 2].forEach(function (b) { ev.push({ voz: 'kick', t: b, dur: 0.2, midi: 0 }); });
      if (P.perc === 'fuerte') for (var h = 0; h < 8; h++) ev.push({ voz: 'hat', t: h * 0.5 + 0.25, dur: 0.05, midi: 0 });
      else ev.push({ voz: 'hat', t: 1, dur: 0.05, midi: 0 }, { voz: 'hat', t: 3, dur: 0.05, midi: 0 });
    }
    return ev;
  }

  return { PIEZAS: PIEZAS, MOTIVO_FARO: MOTIVO_FARO, midi: midi, frecuencia: frecuencia, duracionPulso: duracionPulso, eventosCompas: eventosCompas };
});
