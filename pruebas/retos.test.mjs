import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const R = require('../src/datos/retos.js');
const I = require('../src/engine/interprete.js');
const V = require('../src/engine/validador-nivel.js');

const base = () => ({
  id: 'abc', nombre: 'Mi reto', autor: 'Ana', ciclo: 'c1', zona: 'bosque',
  mapa: ['...', '.#.', '..G'], inicio: { x: 0, y: 0, dir: 'E' },
  referencia: [{ t: 'avanzar' }, { t: 'avanzar' }, { t: 'girar-d' }, { t: 'avanzar' }, { t: 'avanzar' }]
});

test('un reto con solución válida se acepta y se limpia', () => {
  const r = R.validar(base());
  assert.equal(r.ok, true);
  assert.equal(r.reto.nombre, 'Mi reto');
});
test('un reto sin solución no se acepta', () => {
  const r = base(); r.referencia = [{ t: 'avanzar' }];
  assert.equal(R.validar(r).motivo, 'sin-solucion');
});
test('exige exactamente una meta, tablero rectangular y celdas conocidas', () => {
  let r = base(); r.mapa = ['...', '.#.', '...']; assert.equal(R.validar(r).motivo, 'meta');
  r = base(); r.mapa = ['...', '.#', '..G']; assert.equal(R.validar(r).motivo, 'mapa');
  r = base(); r.mapa = ['..X', '.#.', '..G']; assert.equal(R.validar(r).motivo, 'mapa');
  r = base(); r.mapa = ['...', '.#.', '..GG']; assert.notEqual(R.validar(r).ok, true);
});
test('Lumo no puede empezar sobre una pared ni fuera del tablero', () => {
  let r = base(); r.inicio = { x: 1, y: 1, dir: 'E' }; assert.equal(R.validar(r).motivo, 'inicio');
  r = base(); r.inicio = { x: 9, y: 0, dir: 'E' }; assert.equal(R.validar(r).motivo, 'inicio');
  r = base(); r.inicio = { x: 0, y: 0, dir: 'Q' }; assert.equal(R.validar(r).motivo, 'inicio');
});
test('la solución solo puede usar tarjetas del ciclo (Infantil no tiene repetir)', () => {
  const r = base(); r.ciclo = 'inf'; r.zona = 'jardin';
  r.referencia = [{ t: 'repetir', n: 2, cuerpo: [{ t: 'avanzar' }] }, { t: 'girar-d' }, { t: 'repetir', n: 2, cuerpo: [{ t: 'avanzar' }] }];
  assert.equal(R.validar(r).motivo, 'tarjetas');
});
test('código de compartir: ida y vuelta con tildes y emojis en el nombre', () => {
  const r = R.validar(Object.assign(base(), { nombre: 'Camión ñoño 🚀' })).reto;
  const cod = R.codificar(r);
  assert.match(cod, /^RUMBO1\.[\w-]+\.[0-9a-f]{8}$/);
  const d = R.decodificar(cod);
  assert.equal(d.ok, true);
  assert.deepEqual(d.reto.mapa, r.mapa);
  assert.equal(d.reto.nombre, 'Camión ñoño 🚀');
});
test('código alterado o incompleto se rechaza', () => {
  const cod = R.codificar(R.validar(base()).reto);
  const partes = cod.split('.');
  const roto = partes[0] + '.' + partes[1].slice(0, -3) + 'AAA.' + partes[2];
  assert.equal(R.decodificar(roto).ok, false);
  assert.equal(R.decodificar('hola').ok, false);
  assert.equal(R.decodificar('').ok, false);
  assert.equal(R.decodificar(cod.slice(0, 20)).ok, false);
});
test('un código con firma correcta pero reto imposible también se rechaza', () => {
  const r = R.validar(base()).reto; r.referencia = [{ t: 'girar-d' }];
  const cod = R.codificar(r);
  assert.equal(R.decodificar(cod).motivo, 'sin-solucion');
});
test('el nombre se sanea: sin etiquetas ni caracteres de control, con tope de longitud', () => {
  const r = R.validar(Object.assign(base(), { nombre: '<img src=x onerror=alert(1)>\u0007' + 'a'.repeat(80), autor: '<b>X</b>' }));
  assert.equal(r.ok, true);
  assert.ok(!/[<>]/.test(r.reto.nombre) && r.reto.nombre.length <= 30);
  assert.ok(!/[<>]/.test(r.reto.autor));
});
test('acepta el código dentro de un archivo JSON y con saltos de línea', () => {
  const cod = R.codificar(R.validar(base()).reto);
  assert.equal(R.decodificar(JSON.stringify({ formato: 'rumbo-reto', codigo: cod })).ok, true);
  assert.equal(R.decodificar(cod.slice(0, 30) + '\n  ' + cod.slice(30)).ok, true);
});
test('retoANivel genera un nivel jugable que supera el validador del juego (excepto currículo)', () => {
  const r = R.validar(base()).reto;
  const n = R.retoANivel(r);
  const res = I.ejecutar(n, n.referencia);
  assert.equal(res.ok, true);
  assert.ok(n.cartas.disponibles.includes('avanzar'));
  const inf = R.validar(Object.assign(base(), { ciclo: 'inf', zona: 'jardin' })).reto;
  assert.ok(R.retoANivel(inf).huecos >= 4);
});
test('reto con recetas del 2.º ciclo se valida con el intérprete', () => {
  const r = { id: 'x', nombre: 'R', autor: 'A', ciclo: 'c2', zona: 'mar', mapa: ['........G', '#########'], inicio: { x: 0, y: 0, dir: 'E' },
    referencia: { principal: [{ t: 'receta', nombre: 'A' }, { t: 'receta', nombre: 'A' }, { t: 'avanzar' }, { t: 'avanzar' }], recetas: { A: [{ t: 'repetir', n: 3, cuerpo: [{ t: 'avanzar' }] }] } } };
  assert.equal(R.validar(r).ok, true);          // 3 + 3 + 1 + 1 = 8 pasos
  r.referencia.principal.pop();                 // 7 pasos: no llega
  assert.equal(R.validar(r).motivo, 'sin-solucion');
  r.ciclo = 'c1';                               // en 1.er ciclo no existen las recetas
  assert.equal(R.validar(r).motivo, 'tarjetas');
});
