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

test('cada paso de la explicación de las tarjetas de control se ejecuta bien y usa la tarjeta explicada', async () => {
  const { PASOS } = require('../src/datos/demos.js');
  for (const [carta, pasos] of Object.entries(PASOS)) {
    assert.ok(pasos.length >= 2, carta + ': explicar en al menos dos pasos');
    pasos.forEach((p, i) => {
      assert.ok(p.texto && p.texto.length > 20, `${carta} paso ${i}: texto`);
      const r = I.ejecutar(p.demo, p.demo.programa);
      assert.equal(r.ok, true, `${carta} paso ${i}: ${r.motivo}`);
    });
    assert.ok(pasos.slice(1).some(p => I.usaTarjeta(p.demo.programa, carta)), carta + ' se muestra en uso');
  }
});
