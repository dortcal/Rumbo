import test from 'node:test';
import assert from 'node:assert/strict';
import Voz from '../src/audio/voz.js';
import VOCES from '../src/datos/voces-es.js';

const v = (name, lang, localService = true, extra = {}) => ({ name, lang, localService, default: false, ...extra });

const LISTA = [
  v('Microsoft Zira', 'en-US'),
  v('Google US English', 'en-US', false),
  v('eSpeak Spanish', 'es'),
  v('Microsoft Sabina', 'es-MX'),
  v('Google español', 'es-ES', false),
  v('Microsoft Helena', 'es-ES'),
  v('Microsoft Elvira Online (Natural)', 'es-ES', false)
];

test('elige la voz natural de España cuando hay conexión', () => {
  assert.equal(Voz.elegirVoz(LISTA, { enLinea: true }).name, 'Microsoft Elvira Online (Natural)');
});

test('sin conexión descarta las voces de red y elige la mejor local', () => {
  assert.equal(Voz.elegirVoz(LISTA, { enLinea: false }).name, 'Microsoft Helena');
});

test('prefiere español de España a otras variantes', () => {
  const l = [v('A', 'es-MX'), v('B', 'es-ES'), v('C', 'es-AR')];
  assert.equal(Voz.elegirVoz(l).name, 'B');
});

test('acepta variantes con guion bajo y mayúsculas', () => {
  const l = [v('X', 'ES_es')];
  assert.equal(Voz.elegirVoz(l).name, 'X');
});

test('si solo hay voces robóticas aún las usa, pero con menos prioridad', () => {
  assert.equal(Voz.elegirVoz([v('eSpeak Spanish', 'es')]).name, 'eSpeak Spanish');
  assert.equal(Voz.elegirVoz([v('eSpeak Spanish', 'es'), v('Voz normal', 'es-AR')]).name, 'Voz normal');
});

test('sin voces en español devuelve null', () => {
  assert.equal(Voz.elegirVoz([v('Zira', 'en-US')]), null);
  assert.equal(Voz.elegirVoz([]), null);
  assert.equal(Voz.elegirVoz(undefined), null);
});

test('no confunde idiomas que empiezan por "es" (estonio)', () => {
  assert.equal(Voz.elegirVoz([v('Estonian', 'et-EE'), v('Est', 'est')]), null);
});

test('una voz elegida a mano gana si es utilizable', () => {
  assert.equal(Voz.elegirVoz(LISTA, { preferida: 'Microsoft Sabina' }).name, 'Microsoft Sabina');
  assert.equal(Voz.elegirVoz(LISTA, { preferida: 'No existe' }).name, 'Microsoft Elvira Online (Natural)');
});

test('el desempate es estable', () => {
  const l = [v('B', 'es-ES'), v('A', 'es-ES')];
  assert.equal(Voz.elegirVoz(l).name, 'A');
  assert.equal(Voz.elegirVoz(l.slice().reverse()).name, 'A');
});

// ---- crearVoz con un sintetizador falso ----

function sinteFalso(voces) {
  const s = { hablado: [], cancelaciones: 0, escuchas: {} };
  s.getVoices = () => voces;
  s.speak = u => s.hablado.push(u);
  s.cancel = () => { s.cancelaciones++; };
  s.addEventListener = (ev, fn) => { s.escuchas[ev] = fn; };
  return s;
}
class UtteranceFalsa { constructor(texto) { this.text = texto; } }

test('decir usa la mejor voz y la configura', () => {
  const synth = sinteFalso(LISTA);
  const voz = Voz.crearVoz({ synth, Utterance: UtteranceFalsa });
  const r = voz.decir('c0_01_a');
  assert.equal(r.modo, 'voz');
  assert.equal(r.voz, 'Microsoft Elvira Online (Natural)');
  assert.equal(synth.hablado.length, 1);
  assert.equal(synth.hablado[0].text, '¡Uy! ¿Dónde estoy?');
  assert.equal(synth.hablado[0].lang, 'es-ES');
  assert.equal(synth.hablado[0].rate, 0.9);
});

test('decir corta la frase anterior antes de hablar', () => {
  const synth = sinteFalso(LISTA);
  const voz = Voz.crearVoz({ synth, Utterance: UtteranceFalsa });
  voz.decir('ok_1');
  voz.decir('ok_2');
  assert.equal(synth.cancelaciones, 2);
  assert.equal(synth.hablado.length, 2);
});

test('si no hay voz en español devuelve el subtítulo', () => {
  const synth = sinteFalso([v('Zira', 'en-US')]);
  const voz = Voz.crearVoz({ synth, Utterance: UtteranceFalsa });
  assert.deepEqual(voz.decir('fb_casi'), { modo: 'subtitulo', texto: '¡Casi lo consigues!', voz: null });
  assert.equal(synth.hablado.length, 0);
});

test('sin API de voz en el navegador también devuelve el subtítulo', () => {
  const voz = Voz.crearVoz({});
  assert.equal(voz.decir('fb_casi').modo, 'subtitulo');
});

test('un identificador inexistente devuelve null y no habla', () => {
  const synth = sinteFalso(LISTA);
  const voz = Voz.crearVoz({ synth, Utterance: UtteranceFalsa });
  assert.equal(voz.decir('no-existe'), null);
  assert.equal(synth.hablado.length, 0);
});

test('un audio grabado tiene prioridad sobre la síntesis', () => {
  const synth = sinteFalso(LISTA);
  const reproducidos = [];
  class AudioFalso { constructor(url) { this.url = url; } play() { reproducidos.push(this.url); } pause() {} }
  const voz = Voz.crearVoz({ synth, Utterance: UtteranceFalsa, Audio: AudioFalso, audios: { ok_1: 'audio/ok_1.mp3' } });
  assert.equal(voz.decir('ok_1').modo, 'audio');
  assert.deepEqual(reproducidos, ['audio/ok_1.mp3']);
  assert.equal(synth.hablado.length, 0);
  assert.equal(voz.decir('ok_2').modo, 'voz');
});

test('las voces que llegan tarde (voiceschanged) se aprovechan', () => {
  let voces = [];
  const synth = sinteFalso([]);
  synth.getVoices = () => voces;
  const voz = Voz.crearVoz({ synth, Utterance: UtteranceFalsa });
  assert.equal(voz.decir('ok_1').modo, 'subtitulo');
  voces = LISTA;
  synth.escuchas.voiceschanged();
  assert.equal(voz.vozElegida().name, 'Microsoft Elvira Online (Natural)');
  assert.equal(voz.decir('ok_1').modo, 'voz');
});

test('cambiar a una voz manual y volver a la automática', () => {
  const synth = sinteFalso(LISTA);
  const voz = Voz.crearVoz({ synth, Utterance: UtteranceFalsa });
  assert.equal(voz.elegirManual('Microsoft Sabina').name, 'Microsoft Sabina');
  assert.equal(voz.elegirManual(null).name, 'Microsoft Elvira Online (Natural)');
  assert.deepEqual(voz.listaDeVoces().map(x => x.name).sort(), ['Google español', 'Microsoft Elvira Online (Natural)', 'Microsoft Helena', 'Microsoft Sabina', 'eSpeak Spanish']);
});

test('cambia a una voz local si se pierde la conexión', () => {
  const synth = sinteFalso(LISTA);
  let enLinea = true;
  const voz = Voz.crearVoz({ synth, Utterance: UtteranceFalsa, enLinea: () => enLinea });
  assert.equal(voz.vozElegida().name, 'Microsoft Elvira Online (Natural)');
  enLinea = false;
  assert.equal(voz.refrescar().name, 'Microsoft Helena');
});

test('los opciones de velocidad y tono se respetan', () => {
  const synth = sinteFalso(LISTA);
  const voz = Voz.crearVoz({ synth, Utterance: UtteranceFalsa });
  voz.decir('ok_1', { velocidad: 0.75, tono: 1.2, volumen: 0.5 });
  const u = synth.hablado[0];
  assert.equal(u.rate, 0.75);
  assert.equal(u.pitch, 1.2);
  assert.equal(u.volume, 0.5);
});

// ---- datos: todas las frases en un archivo ----

test('todas las frases tienen texto corto y quién habla', () => {
  const ids = Object.keys(VOCES.lineas);
  assert.ok(ids.length >= 40, 'hay ' + ids.length + ' frases');
  for (const id of ids) {
    const l = VOCES.lineas[id];
    assert.ok(typeof l.texto === 'string' && l.texto.length > 0, id);
    assert.ok(typeof l.quien === 'string' && l.quien.length > 0, id);
    assert.ok(l.texto.split(/\s+/).length <= 13, `${id} es demasiado larga para voz: ${l.texto}`);
  }
});

test('las frases del guion de cada escena existen', () => {
  for (const id of ['c0_01_a', 'c0_04_b', 'c1_02_a', 'c2_02_a', 'c3_03_a', 'cf_03_a', 'cf_03_c', 'cf_05_a', 'fb_casi', 'fb_orden', 'fb_giro', 'fb_repetir']) {
    assert.ok(VOCES.lineas[id], id);
  }
});

test('las frases de error no regañan', () => {
  const prohibidas = /(mal|error|fallaste|incorrecto|equivocad[oa]s? tú)/i;
  for (const id of Object.keys(VOCES.lineas).filter(i => i.startsWith('fb_'))) {
    assert.ok(!prohibidas.test(VOCES.lineas[id].texto), id + ': ' + VOCES.lineas[id].texto);
  }
});
