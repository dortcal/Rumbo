import test from 'node:test';
import assert from 'node:assert/strict';
import M from '../src/audio/musica-datos.js';
import VOZ from '../src/audio/voz.js';
import CAT from '../src/datos/catalogo.js';
import ES from '../src/datos/escenas.js';
import VOCES from '../src/datos/voces-es.js';

CAT.registrarVoces();
const ZONAS = ['jardin', 'granja', 'playa', 'bosque', 'montanas', 'mar', 'volcan', 'ciudad', 'espacio', 'faro', 'mapa'];
const suma = (z) => M.PIEZAS[z].melodia.reduce((a, n) => a + n[1], 0);

test('hay una pieza para cada zona del juego y para el mapa', () => {
  assert.deepEqual(Object.keys(M.PIEZAS).sort(), ZONAS.slice().sort());
});
test('todas las melodías duran exactamente 4 compases (16 pulsos)', () => {
  ZONAS.forEach((z) => assert.equal(suma(z), 16, z));
});
test('las piezas son distintas entre sí (melodía, tempo y tonalidad)', () => {
  const firmas = new Set(ZONAS.map((z) => JSON.stringify(M.PIEZAS[z].melodia)));
  assert.equal(firmas.size, ZONAS.length);
  const tt = new Set(ZONAS.map((z) => M.PIEZAS[z].bpm + '/' + M.PIEZAS[z].tonica + '/' + M.PIEZAS[z].escala.join()));
  assert.equal(tt.size, ZONAS.length);
});
test('todas las notas caen en un registro agradable y audible (MIDI 28–100)', () => {
  ZONAS.forEach((z) => { for (let v = 0; v < 4; v++) for (let n = 0; n < 4; n++) M.eventosCompas(z, n, v).forEach((e) => {
    assert.ok(e.t >= 0 && e.t < 4 && e.dur > 0, `${z} ${n} t=${e.t}`);
    if (e.voz !== 'kick' && e.voz !== 'hat') assert.ok(e.midi >= 28 && e.midi <= 100, `${z} compás ${n}: ${e.voz} midi ${e.midi}`);
  }); });
});
test('el generador es determinista', () => {
  ZONAS.forEach((z) => assert.deepEqual(M.eventosCompas(z, 2, 5), M.eventosCompas(z, 2, 5)));
});
test('el Faro lleva el motivo «corto, corto, largo» (misma nota, 0,5 · 0,5 · 1,5 pulsos) en el último compás de cada vuelta', () => {
  const m = M.eventosCompas('faro', 3, 0).filter((e) => e.voz === 'motivo');
  assert.deepEqual(m.map((e) => e.dur), [0.5, 0.5, 1.5]);
  assert.equal(new Set(m.map((e) => e.midi)).size, 1);
  assert.deepEqual(m.map((e) => e.t), [0, 0.5, 1]);
  assert.equal(M.eventosCompas('faro', 1, 0).filter((e) => e.voz === 'motivo').length, 0);
});
test('el mapa cita el motivo cada cuatro vueltas, no siempre', () => {
  assert.equal(M.eventosCompas('mapa', 3, 3).filter((e) => e.voz === 'motivo').length, 3);
  assert.equal(M.eventosCompas('mapa', 3, 0).filter((e) => e.voz === 'motivo').length, 0);
  assert.equal(M.eventosCompas('mapa', 3, 2).filter((e) => e.voz === 'motivo').length, 0);
});
test('las demás zonas no llevan el motivo (es la firma del Faro)', () => {
  ZONAS.filter((z) => z !== 'faro' && z !== 'mapa').forEach((z) => { for (let n = 0; n < 4; n++) assert.equal(M.eventosCompas(z, n, 3).filter((e) => e.voz === 'motivo').length, 0, z); });
});
test('las escenas usan solo zonas con música', () => {
  ES.ESCENAS.forEach((e) => assert.ok(M.PIEZAS[e.zona], e.id + ' ' + e.zona));
});

// ---- voces con carácter
const QUIENES = [...new Set(Object.values(VOCES.lineas).map((l) => l.quien))];
test('todo personaje que habla tiene perfil de voz', () => {
  ES.ESCENAS.forEach((e) => ES.lineasDe(e.id).forEach((id) => { const q = VOCES.lineas[id].quien; assert.ok(VOZ.PERFILES[q], `sin perfil: ${q}`); }));
});
test('los perfiles se distinguen: Bichito más agudo y rápido que Lumo, Búho y Lagarto más graves y lentos', () => {
  const P = VOZ.PERFILES;
  assert.ok(P['Bichito'].tono > P['Lumo'].tono && P['Bichito'].vel > P['Lumo'].vel);
  assert.ok(P['Búho Bruma'].tono < P['Lumo'].tono && P['Búho Bruma'].vel < 1);
  assert.ok(P['Lagarto gigante'].tono < P['Abuela Chispa'].tono);
  assert.ok(new Set(Object.values(P).map((p) => p.tono + '/' + p.vel)).size >= Object.keys(P).length - 1);
});
test('la emoción matiza el tono y la velocidad sin salirse de límites', () => {
  const base = VOZ.perfilDeVoz('Lumo', 'normal'), alegre = VOZ.perfilDeVoz('Lumo', 'alegre'), tierno = VOZ.perfilDeVoz('Lumo', 'tierno');
  assert.ok(alegre.tono > base.tono && alegre.vel > base.vel);
  assert.ok(tierno.vel < base.vel);
  Object.keys(VOZ.PERFILES).forEach((q) => ['normal', 'alegre', 'emocionado', 'ups', 'tierno', 'sorprendido'].forEach((e) => { const p = VOZ.perfilDeVoz(q, e); assert.ok(p.tono >= .1 && p.tono <= 2 && p.vel >= .5 && p.vel <= 1.6); }));
});
test('con caracter:true la voz sintética usa el tono y ritmo del personaje; sin él, no cambia nada', () => {
  const hablado = [];
  const synth = { getVoices: () => [{ name: 'V', lang: 'es-ES', localService: true }], speak: (u) => hablado.push(u), cancel() {}, addEventListener() {} };
  class U { constructor(t) { this.text = t; } }
  const voz = VOZ.crearVoz({ synth, Utterance: U });
  const id = Object.keys(VOCES.lineas).find((k) => VOCES.lineas[k].quien === 'Bichito');
  voz.decir(id, { velocidad: 1 });
  assert.equal(hablado[0].rate, 1); assert.equal(hablado[0].pitch, 1.05);
  voz.decir(id, { velocidad: 1, caracter: true });
  assert.ok(hablado[1].pitch > 1.8 && hablado[1].rate > 1.1);
  voz.decir(id, { velocidad: 1, caracter: true, tono: 1.0 });
  assert.equal(hablado[2].pitch, 1.0);
});
