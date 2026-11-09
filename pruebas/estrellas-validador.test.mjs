import test from 'node:test';
import assert from 'node:assert/strict';
import I from '../src/engine/interprete.js';
import E from '../src/engine/estrellas.js';
import V from '../src/engine/validador-nivel.js';

const A = { t: 'avanzar' };
const rep = (n, ...cuerpo) => ({ t: 'repetir', n, cuerpo });
const veces = (n, nodo) => Array.from({ length: n }, () => nodo);
const clon = o => JSON.parse(JSON.stringify(o));

const NIVEL = {
  id: 'm2-01-01',
  etapa: 'primaria-2c',
  mapa: ['.....G'],
  inicio: { x: 0, y: 0, dir: 'E' },
  cartas: { disponibles: ['avanzar', 'repetir'] },
  referencia: [rep(5, A)],
  estrellas: { s2max: 4, s3: { tipo: 'usa', carta: 'repetir' } },
  pistas: ['Mira el camino.', 'Muchos pasos iguales.', 'Prueba con repetir.'],
  curriculo: {
    oficial: [{ decreto: '211/2022', area: 'Matemáticas', criterio: '4.1' }],
    extension: ['Bucle con cantidad']
  }
};

const run = (nivel, programa) => E.calcularEstrellas(nivel, programa, I.ejecutar(nivel, programa));

test('estrellas: 0 si no supera el reto', () => {
  assert.equal(run(NIVEL, veces(2, A)), 0);
});

test('estrellas: 1 si supera con demasiadas tarjetas', () => {
  assert.equal(run(NIVEL, veces(5, A)), 1);
});

test('estrellas: 3 con la solución que usa repetir', () => {
  assert.equal(run(NIVEL, [rep(5, A)]), 3);
});

test('estrellas: 2 si es eficiente pero no cumple la condición extra', () => {
  const n = clon(NIVEL);
  n.estrellas = { s2max: 5, s3: { tipo: 'usa', carta: 'repetir' } };
  assert.equal(run(n, veces(5, A)), 2);
});

test('estrellas: s3 de tipo max-tarjetas y referencia', () => {
  const n = clon(NIVEL);
  n.estrellas = { s2max: 6, s3: { tipo: 'max-tarjetas', valor: 2 } };
  assert.equal(run(n, [rep(5, A)]), 3);
  assert.equal(run(n, [rep(2, A), rep(3, A)]), 2);
  n.estrellas = { s2max: 6, s3: { tipo: 'referencia' } };
  assert.equal(run(n, [rep(5, A)]), 3);
  assert.equal(run(n, [rep(2, A), A, A, A]), 2);
});

test('estrellas: Infantil solo tiene una de celebración', () => {
  const n = { etapa: 'infantil', mapa: ['..G'], inicio: { x: 0, y: 0, dir: 'E' } };
  assert.equal(run(n, [A, A]), 1);
  assert.equal(run(n, [A]), 0);
});

test('estrellas: el tiempo y los intentos no intervienen', () => {
  const p = [rep(5, A)];
  const r = I.ejecutar(NIVEL, p);
  assert.equal(E.calcularEstrellas(NIVEL, p, r), E.calcularEstrellas(NIVEL, p, Object.assign({}, r, { intentos: 99, segundos: 999 })));
});

test('validador: acepta un nivel correcto', () => {
  const r = V.validarNivel(NIVEL);
  assert.deepEqual(r, { ok: true, errores: [] });
});

function rechaza(descripcion, mutar, fragmento) {
  test('validador: rechaza ' + descripcion, () => {
    const n = clon(NIVEL);
    mutar(n);
    const r = V.validarNivel(n);
    assert.equal(r.ok, false, 'debía ser inválido');
    assert.ok(r.errores.some(e => e.includes(fragmento)), `no aparece "${fragmento}" en ${JSON.stringify(r.errores)}`);
  });
}

rechaza('un id mal formado', n => { n.id = 'Nivel 1'; }, 'id no válido');
rechaza('una etapa desconocida', n => { n.etapa = 'eso'; }, 'etapa');
rechaza('un mapa no rectangular', n => { n.mapa = ['....G', '...']; }, 'longitud distinta');
rechaza('caracteres de mapa desconocidos', n => { n.mapa = ['..X.G']; }, 'no válido');
rechaza('un mapa sin meta', n => { n.mapa = ['......']; }, 'meta');
rechaza('un mapa con dos metas', n => { n.mapa = ['G....G']; }, 'meta');
rechaza('un inicio fuera del mapa', n => { n.inicio = { x: 9, y: 0, dir: 'E' }; }, 'fuera del mapa');
rechaza('un inicio sobre una pared', n => { n.mapa = ['#....G']; }, 'empezar');
rechaza('una orientación inválida', n => { n.inicio.dir = 'X'; }, 'inicio');
rechaza('una tarjeta desconocida', n => { n.cartas.disponibles.push('volar'); }, 'tarjeta desconocida');
rechaza('tarjetas repetidas', n => { n.cartas.disponibles.push('avanzar'); }, 'repetida');
rechaza('un nivel sin solución de referencia', n => { delete n.referencia; }, 'falta la solución');
rechaza('una referencia que no supera el nivel', n => { n.referencia = [A, A]; }, 'no supera');
rechaza('una referencia con tarjetas no disponibles', n => { n.cartas.disponibles = ['avanzar']; }, 'no disponible');
rechaza('una referencia que no logra las tres estrellas', n => { n.estrellas.s2max = 1; }, 'tres estrellas');
rechaza('Primaria sin estrellas definidas', n => { delete n.estrellas; }, 'estrellas');
rechaza('Primaria con solo 2 pistas', n => { n.pistas = ['a', 'b']; }, '3 pistas');
rechaza('pistas vacías', n => { n.pistas = ['a', '', 'c']; }, '3 pistas');
rechaza('un currículo sin las dos listas', n => { n.curriculo = { oficial: [] }; }, 'curriculo');
rechaza('un currículo vacío', n => { n.curriculo = { oficial: [], extension: [] }; }, 'al menos un aprendizaje');
rechaza('un decreto inventado', n => { n.curriculo.oficial[0].decreto = '999/2099'; }, 'decreto');
rechaza('una referencia oficial sin criterio', n => { delete n.curriculo.oficial[0].criterio; }, 'criterio');
rechaza('un límite de tarjetas superado por la referencia', n => { n.cartas.limites = { repetir: 1, avanzar: 1 }; n.referencia = [rep(2, A), rep(3, A)]; n.estrellas.s2max = 5; }, 'límite');

test('validador: Infantil no exige estrellas ni pistas', () => {
  const n = {
    id: 'inf-3-01', etapa: 'infantil', mapa: ['..G'], inicio: { x: 0, y: 0, dir: 'E' },
    cartas: { disponibles: ['avanzar'] }, referencia: [A, A],
    curriculo: { oficial: [{ decreto: '196/2022', area: 'Descubrimiento y Exploración del Entorno', criterio: '1.3' }], extension: [] }
  };
  assert.deepEqual(V.validarNivel(n), { ok: true, errores: [] });
});

test('validador: entradas que no son un nivel', () => {
  assert.equal(V.validarNivel(null).ok, false);
  assert.equal(V.validarNivel('x').ok, false);
  assert.equal(V.validarNivel({}).ok, false);
});
