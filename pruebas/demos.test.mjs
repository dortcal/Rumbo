import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const I = require('../src/engine/interprete.js');
const { DEMOS, TEXTOS } = require('../src/datos/demos.js');
const CAT = require('../src/datos/catalogo.js');

test('cada demostración de tarjeta se resuelve con el intérprete real', () => {
  for (const [carta, d] of Object.entries(DEMOS)) {
    const r = I.ejecutar(d, d.programa);
    assert.equal(r.ok, true, `${carta}: ${r.motivo}`);
    assert.ok(TEXTOS[carta], carta + ' sin texto');
    assert.ok(I.usaTarjeta(d.programa, carta === 'avanzar' ? 'avanzar' : carta), `${carta} no aparece en su demo`);
  }
});
test('hay demo para todas las tarjetas que el juego presenta', () => {
  const vistas = new Set();
  for (const n of CAT.TODOS) for (const c of CAT.cartasNuevas(n.id)) vistas.add(c);
  for (const c of vistas) assert.ok(DEMOS[c], 'falta demo de ' + c);
});
