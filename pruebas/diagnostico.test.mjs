import test from 'node:test';
import assert from 'node:assert/strict';
import I from '../src/engine/interprete.js';
import D from '../src/datos/dsl.js';
import C from '../src/datos/catalogo.js';
import E from '../src/engine/estrellas.js';
import VOCES from '../src/datos/voces-es.js';

const { A, X, R, rep, si, no, IN, OA } = D;
const nivel = id => C.POR_ID[id];

test('Interruptor automático: la solución correcta (Avanzar fuera del Si) da 3 estrellas con 4 tarjetas', () => {
  const n = nivel('m3-09');
  const prog = [rep(10, si(IN, [X]), A)];
  const r = I.ejecutar(n, prog);
  assert.equal(r.ok, true);
  assert.equal(I.contarTarjetas(prog), 4);
  assert.equal(E.calcularEstrellas(n, prog, r), 3);
  assert.equal(n.estrellas.s2max, 6);
  // con 6 tarjetas (Avanzar repetido en las dos ramas) resuelve el reto pero solo da 2 estrellas
  const larga = [rep(12, si(IN, [X, A], [A]))];
  assert.equal(E.calcularEstrellas(n, larga, I.ejecutar(n, larga)), 2);
});

test('Interruptor automático: copiar el patrón de «Recoge o avanza» se detecta como atasco', () => {
  const n = nivel('m3-09');
  const copia = [rep(10, si(IN, [X], [A]))];
  const r = I.ejecutar(n, copia);
  assert.equal(r.ok, false);
  assert.ok(r.atasco, 'hay atasco');
  assert.equal(r.atasco.rama, 'entonces');
  assert.ok(r.atasco.veces >= 3);
  assert.deepEqual(r.atasco.tarjetas, ['activar']);
  assert.equal(I.diagnosticar(n, copia, r).causa, 'atasco');
});

test('un programa correcto o que avanza no genera atasco', () => {
  const n = nivel('m3-08');
  const r = I.ejecutar(n, n.referencia);
  assert.equal(r.ok, true);
  assert.equal(r.atasco, undefined);
});

test('diagnóstico: condición invertida (con «no» y con ramas) y faltan repeticiones', () => {
  const n = nivel('m3-08');                              // Recoge o avanza: Si objeto aquí → Recoger / si no → Avanzar
  const al = [rep(30, si(OA, [A], [R]))];                // ramas al revés
  const d1 = I.diagnosticar(n, al, I.ejecutar(n, al));
  assert.equal(d1 && d1.causa, 'invertida');
  const conNo = [rep(30, si(no(OA), [R], [A]))];
  const d2 = I.diagnosticar(n, conNo, I.ejecutar(n, conNo));
  assert.equal(d2 && d2.causa, 'invertida');
  const corto = nivel('m3-p4');                          // Repite el paso: una calle recta
  const p = [rep(3, A)];
  assert.equal(I.diagnosticar(corto, p, I.ejecutar(corto, p)).causa, 'repeticiones');
  assert.equal(I.diagnosticar(n, n.referencia, I.ejecutar(n, n.referencia)), null);
});

test('«Activa y sigue» (m3-08b): sin condicional, Activar no mueve y hay que seguir avanzando', () => {
  const n = nivel('m3-08b');
  assert.equal(C.SEC_PRIMARIA.indexOf('m3-08b') + 1, C.SEC_PRIMARIA.indexOf('m3-09'));
  assert.ok(C.SEC_PRIMARIA.indexOf('m3-08') < C.SEC_PRIMARIA.indexOf('m3-08b'));
  assert.deepEqual(n.cartas.disponibles, ['avanzar', 'activar', 'repetir']);
  assert.equal(I.ejecutar(n, n.referencia).ok, true);
  const sinSeguir = [D.A, D.A, X];
  assert.equal(I.ejecutar(n, sinSeguir).ok, false);
});

test('las frases nuevas de Lumo existen, son breves y no regañan', () => {
  ['fb_atasco_activar', 'fb_atasco_recoger', 'fb_atasco', 'fb_inv_no', 'fb_inv_ramas', 'fb_mas_vueltas', 'fb_cond', 'fb_cond_no'].forEach(id => {
    assert.ok(VOCES.lineas[id], id);
    assert.ok(VOCES.lineas[id].texto.split(/\s+/).length <= 13, id);
  });
  assert.equal(nivel('m3-09').pistaSolucion, true);
  assert.equal(nivel('m3-09').pistas.length, 2);
});
